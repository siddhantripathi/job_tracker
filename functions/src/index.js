const {onRequest, onCall} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const {google} = require("googleapis");
const PDFDocument = require("pdfkit");
const {GoogleGenerativeAI} = require("@google/generative-ai");
const moment = require("moment");
const path = require("path");

// Load environment variables from root directory
require("dotenv").config({path: path.join(__dirname, "../../.env")});

// Configuration from environment variables
const config = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI: process.env.REDIRECT_URI,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "placeholder",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID
};

// CORS configuration for local development and production
const corsOptions = {
  origin: [
    "http://localhost:3000", 
    "https://job-tracker-bd6dc.web.app",
    "https://job-tracker-bd6dc.firebaseapp.com"
  ],
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// Initialize Firebase Admin
try {
  // For Cloud Functions, credentials are automatically provided
  admin.initializeApp({
    projectId: config.FIREBASE_PROJECT_ID
  });
  console.log("✅ Firebase Admin initialized with default credentials");
} catch (error) {
  console.error("❌ Firebase Admin initialization failed:", error);
}

const db = admin.firestore();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

// Google OAuth2 client configuration
const oauth2Client = new google.auth.OAuth2(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.REDIRECT_URI
);

// HTTPS callable function to get Google OAuth URL
exports.getAuthUrl = onCall({cors: true}, async (request) => {
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: request.auth.uid, // Pass user ID in state
    prompt: "consent", // Force consent screen to get refresh token
  });

  return {authUrl};
});

// HTTPS endpoint for OAuth callback
exports.oauthCallback = onRequest({cors: true}, async (req, res) => {
  console.log('🔥 OAuth callback called!', {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers
  });

  // Handle CORS preflight
  res.set('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    console.log('👋 Handling CORS preflight');
    res.status(204).send('');
    return;
  }

  try {
    const {code, state} = req.query;
    const userId = state;

    console.log('📝 OAuth callback params:', { code: code ? 'present' : 'missing', state, userId });

    if (!code || !userId) {
      console.log('❌ Missing required parameters');
      return res.status(400).send("Missing code or user ID");
    }

    console.log('🔄 Exchanging code for tokens...');
    // Exchange code for tokens
    const {tokens} = await oauth2Client.getToken(code);
    console.log('✅ Got tokens:', { 
      hasRefreshToken: !!tokens.refresh_token,
      hasAccessToken: !!tokens.access_token,
      expiryDate: tokens.expiry_date 
    });
    
    // Store tokens in Firestore
    console.log('💾 Saving tokens to Firestore for user:', userId);
    const tokenData = {
      access_token: tokens.access_token,
      expires_at: tokens.expiry_date,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // Add refresh token if available
    if (tokens.refresh_token) {
      tokenData.refresh_token = tokens.refresh_token;
      console.log('✅ Refresh token available - full access granted');
    } else {
      console.log('⚠️ No refresh token received - limited access (may need re-authentication)');
    }
    
    await db.collection("users").doc(userId).collection("tokens").doc("gmail").set(tokenData);
    console.log('✅ Tokens saved successfully');

    console.log('🔄 Redirecting to localhost...');
    res.redirect("http://localhost:3000/dashboard?auth=success");
  } catch (error) {
    console.error("❌ OAuth callback error:", error);
    res.status(500).send("Authentication failed");
  }
});

// HTTPS callable function to fetch job emails with time limit
exports.fetchJobEmails = onCall({cors: true}, async (request) => {
  try {
    const userId = request.auth.uid;
    const {daysBack = 7} = request.data || {};
    
    // Get user's stored tokens
    const tokenDoc = await db.collection("users").doc(userId).collection("tokens").doc("gmail").get();
    
    if (!tokenDoc.exists) {
      throw new Error("No Gmail tokens found. Please authenticate first.");
    }

    const tokenData = tokenDoc.data();
    
    // Set up OAuth2 client with user's tokens
    oauth2Client.setCredentials({
      refresh_token: tokenData.refresh_token,
      access_token: tokenData.access_token,
    });

    const gmail = google.gmail({version: "v1", auth: oauth2Client});

    // Calculate date range
    const dateLimit = moment().subtract(daysBack, 'days').format('YYYY/MM/DD');
    
    // Search for job-related emails with date filter
    const jobKeywords = [
      "job application", "application received", "interview", "position",
      "thank you for applying", "application status", 
      "application submitted", "offer letter",
      "technical interview", "phone screen"
    ];

    const query = `(${jobKeywords.map(keyword => `"${keyword}"`).join(" OR ")}) after:${dateLimit}`;
    
    const response = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 100,
    });

    const messages = response.data.messages || [];
    const applications = [];

    // Fetch details for each message
    for (const message of messages) {
      try {
        const msgDetail = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
        });

        const headers = msgDetail.data.payload.headers;
        const subject = headers.find(h => h.name === "Subject")?.value || "";
        const from = headers.find(h => h.name === "From")?.value || "";
        const date = headers.find(h => h.name === "Date")?.value || "";

        // Extract body text for Gemini analysis
        const bodyText = extractEmailBody(msgDetail.data.payload);

        // Extract company and position from subject/sender
        const company = extractCompany(from, subject);
        const position = extractPosition(subject, bodyText);
        
        // Generate status using Gemini AI
        const status = await generateJobStatus(subject, bodyText, from);

        const applicationData = {
          messageId: message.id,
          subject,
          from,
          date: new Date(date),
          company,
          position,
          status,
          source: "Gmail",
          emailBody: bodyText.substring(0, 500), // Store first 500 chars for context
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Store in Firestore
        await db.collection("users").doc(userId).collection("applications").doc(message.id).set(applicationData, {merge: true});
        
        applications.push(applicationData);
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
      }
    }

    return {
      success: true,
      count: applications.length,
      daysBack,
      applications: applications.slice(0, 10), // Return first 10 for response
    };

  } catch (error) {
    console.error("Error fetching job emails:", error);
    throw new Error(`Failed to fetch job emails: ${error.message}`);
  }
});

// HTTPS callable function to generate PDF report
exports.generatePDFReport = onCall({cors: true}, async (request) => {
  try {
    const userId = request.auth.uid;
    
    // Get user's applications
    const applicationsSnapshot = await db.collection("users").doc(userId).collection("applications")
      .orderBy("date", "desc")
      .get();
    
    const applications = [];
    applicationsSnapshot.forEach(doc => {
      if (doc.id !== "_init") {
        applications.push({id: doc.id, ...doc.data()});
      }
    });

    if (applications.length === 0) {
      throw new Error("No applications found to generate report");
    }

    // Generate PDF
    const pdfBuffer = await createPDFReport(applications);
    
    // Convert PDF to base64 for direct download
    const pdfBase64 = pdfBuffer.toString('base64');
    const fileName = `job-report-${Date.now()}.pdf`;
    
    // Create data URL for direct download
    const downloadURL = `data:application/pdf;base64,${pdfBase64}`;

    return {
      success: true,
      downloadURL,
      fileName,
      applicationsCount: applications.length,
      pdfData: pdfBase64, // Include base64 data for frontend handling
    };

  } catch (error) {
    console.error("Error generating PDF report:", error);
    throw new Error(`Failed to generate PDF report: ${error.message}`);
  }
});

// Firestore trigger for new user creation
exports.onCreateUser = onDocumentCreated("users/{userId}", async (event) => {
  const userId = event.params.userId;
  const userData = event.data.data();

  console.log(`New user created: ${userId}`, userData);
  
  // Initialize user's collections and preferences
  await db.collection("users").doc(userId).set({
    emailScanDays: 7, // Default to 7 days
    preferences: {
      pdfColorScheme: "default",
      emailNotifications: true,
    },
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  }, {merge: true});

  return null;
});

// Helper function to generate job status using Gemini AI
async function generateJobStatus(subject, emailBody, from) {
  try {
    const model = genAI.getGenerativeModel({model: "gemini-pro"});
    
    const prompt = `
    Analyze this job-related email and determine the current application status. 
    
    Subject: ${subject}
    From: ${from}
    Body: ${emailBody.substring(0, 1000)}
    
    Based on the content, classify the status as one of these categories and provide a brief description:
    - "Applied" - Initial application submitted
    - "Under Review" - Application being reviewed
    - "Interview Scheduled" - Interview has been scheduled
    - "Technical Interview" - Technical assessment or coding interview
    - "Final Round" - Final interview stage
    - "Offer Received" - Job offer received
    - "Rejected" - Application rejected
    - "Withdrawn" - Application withdrawn
    - "Follow-up Required" - Waiting for candidate response
    
    Respond in this exact format:
    Status: [STATUS]
    Description: [Brief 1-2 sentence description of the current situation]
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Parse the response
    const statusMatch = response.match(/Status:\s*(.+)/);
    const descMatch = response.match(/Description:\s*(.+)/);
    
    return {
      category: statusMatch ? statusMatch[1].trim() : "Applied",
      description: descMatch ? descMatch[1].trim() : "Application status to be determined",
      aiGenerated: true,
    };
    
  } catch (error) {
    console.error("Error generating status with Gemini:", error);
    return {
      category: "Applied",
      description: "Status analysis unavailable",
      aiGenerated: false,
    };
  }
}

// Helper function to extract email body text
function extractEmailBody(payload) {
  let bodyText = "";
  
  if (payload.body && payload.body.data) {
    bodyText = Buffer.from(payload.body.data, 'base64').toString('utf-8');
  } else if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body && part.body.data) {
        bodyText += Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    }
  }
  
  // Clean up the text
  return bodyText.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// Helper function to create PDF report
async function createPDFReport(applications) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({margin: 50});
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Header
      doc.fontSize(24).fillColor('#2563eb').text('Job Application Report', {align: 'center'});
      doc.moveDown();
      doc.fontSize(12).fillColor('#666').text(`Generated on: ${moment().format('MMMM DD, YYYY')}`, {align: 'center'});
      doc.fontSize(12).text(`Total Applications: ${applications.length}`, {align: 'center'});
      doc.moveDown(2);
      
      // Summary statistics
      const statusCounts = {};
      applications.forEach(app => {
        const status = app.status?.category || app.status || "Unknown";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      doc.fontSize(16).fillColor('#1f2937').text('Summary', {underline: true});
      doc.moveDown(0.5);
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        const color = getStatusColor(status);
        doc.fontSize(10).fillColor(color).text(`${status}: ${count}`, {continued: true});
        doc.fillColor('#374151').text(` applications`);
      });
      
      doc.moveDown(2);
      
      // Applications list
      doc.fontSize(16).fillColor('#1f2937').text('Applications Detail', {underline: true});
      doc.moveDown(1);
      
      applications.forEach((app, index) => {
        if (doc.y > 700) { // Start new page if needed
          doc.addPage();
        }
        
        const status = app.status?.category || app.status || "Unknown";
        const statusColor = getStatusColor(status);
        const date = moment(app.date.toDate ? app.date.toDate() : app.date).format('MMM DD, YYYY');
        
        // Company name
        doc.fontSize(14).fillColor('#1f2937').text(`${index + 1}. ${app.company}`, {continued: true});
        doc.fontSize(10).fillColor('#6b7280').text(` (${app.position})`);
        
        // Status with color
        doc.fontSize(10).fillColor(statusColor).text(`Status: ${status}`, {indent: 20});
        
        // Description if available
        if (app.status?.description) {
          doc.fontSize(9).fillColor('#374151').text(`${app.status.description}`, {indent: 20});
        }
        
        // Last contact
        doc.fontSize(9).fillColor('#6b7280').text(`Last Contact: ${date}`, {indent: 20});
        
        // Email subject
        doc.fontSize(8).fillColor('#9ca3af').text(`Subject: ${app.subject}`, {indent: 20});
        
        doc.moveDown(1);
      });
      
      // Footer
      doc.fontSize(8).fillColor('#9ca3af')
        .text('Generated by JobTrack - Automatic Job Application Tracker', 50, doc.page.height - 50, {align: 'center'});
      
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
}

// Helper function to get status colors
function getStatusColor(status) {
  const colorMap = {
    "Applied": "#3b82f6",
    "Under Review": "#f59e0b",
    "Interview Scheduled": "#8b5cf6",
    "Technical Interview": "#ec4899",
    "Final Round": "#f97316",
    "Offer Received": "#10b981",
    "Rejected": "#ef4444",
    "Withdrawn": "#6b7280",
    "Follow-up Required": "#06b6d4",
  };
  
  return colorMap[status] || "#6b7280";
}

// Helper function to extract company name
function extractCompany(from, subject) {
  // Remove email addresses and common patterns
  let company = from.replace(/<.*?>/g, "").trim();
  company = company.replace(/noreply|no-reply|donotreply/gi, "");
  
  // Extract domain if it looks like a company
  const emailMatch = from.match(/<(.+@(.+?\..+?))>/);
  if (emailMatch) {
    const domain = emailMatch[2];
    if (!domain.includes("gmail") && !domain.includes("yahoo") && !domain.includes("outlook")) {
      company = domain.split(".")[0];
    }
  }

  // Clean up common suffixes
  company = company.replace(/\s+(inc|corp|ltd|llc|careers|jobs|talent|hr|recruiting)\.?$/gi, "");
  
  return company || "Unknown Company";
}

// Helper function to extract position from subject and body
function extractPosition(subject, bodyText) {
  const combinedText = `${subject} ${bodyText}`;
  
  // Common position patterns
  const patterns = [
    /position[:\s]+(.+?)(?:\s|$)/i,
    /role[:\s]+(.+?)(?:\s|$)/i,
    /for\s+(.+?)\s+(?:position|role|job)/i,
    /(.+?)\s+(?:position|role|job)/i,
    /(software engineer|developer|analyst|manager|coordinator|specialist|associate)/i,
  ];

  for (const pattern of patterns) {
    const match = combinedText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return "Unknown Position";
} 