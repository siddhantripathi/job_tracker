# 🎯 JobTrack - Automatic Job Application Tracker

A modern web application that automatically tracks your job applications by scanning your Gmail for job-related emails, using AI to analyze application status, and generating beautiful PDF reports.

## ✨ Features

- **🔐 Firebase Authentication** - Secure Google Sign-in and email/password authentication
- **📧 Gmail Integration** - Automatic scanning of job-related emails with OAuth2
- **🤖 AI-Powered Analysis** - Smart categorization and status detection using Gemini AI
- **📊 Real-time Dashboard** - Live updates and comprehensive application tracking
- **📄 PDF Reports** - Professional, color-coded reports with detailed analytics
- **⚡ Modern Tech Stack** - React, Firebase, Cloud Functions, and responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud Project with Gmail API enabled
- Firebase project with Authentication and Firestore enabled

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/siddhantripathi/job_tracker.git
   cd job_tracker
   npm install
   cd frontend && npm install
   cd ../functions && npm install
   ```

2. **Configure environment variables:**
   
   Create `.env` in the root directory with your credentials:
  

3. **Firebase setup:**
   ```bash
   firebase login
   firebase use your-firebase-project-id
   npm run deploy
   ```

4. **Start development:**
   ```bash
   npm start
   ```

## 🏗️ Architecture

### Monorepo Structure
```
Job_tracker/
├── functions/          # Firebase Cloud Functions (Node.js)
│   ├── src/
│   │   └── index.js   # Main functions logic
│   ├── main.py        # Python functions
│   └── package.json   # Functions dependencies
├── frontend/          # React application
│   ├── src/
│   │   ├── pages/    # Login & Dashboard
│   │   ├── firebase.js
│   │   └── api.js
│   └── package.json
├── public/           # Static hosting files
├── .github/         # CI/CD workflows
├── firebase.json    # Firebase configuration
├── .env             # Environment variables (not committed)
└── package.json     # Root workspace config
```

### Tech Stack

**Frontend:**
- React 18 with modern hooks and context
- React Router for navigation
- Firebase Auth SDK for authentication
- Responsive CSS with modern design patterns

**Backend:**
- Firebase Cloud Functions (Node.js)
- Gmail API integration with OAuth2
- Gemini AI for intelligent status analysis
- PDF generation with PDFKit
- Firestore for data persistence

**Infrastructure:**
- Firebase Hosting for static assets
- Firebase Functions for serverless backend
- Firebase Storage for PDF file hosting
- Firestore for real-time database

## 📋 Usage

### Getting Started
1. **Sign in** with Google or create an account
2. **Connect Gmail** by authorizing OAuth access
3. **Set time range** for email scanning (1-90 days)
4. **Scan emails** to automatically detect job applications
5. **Generate PDF reports** with color-coded status tracking

### Features Overview

**Gmail Integration:**
- Automatic detection of job-related emails
- Smart parsing of company names and positions
- Time-limited scanning for efficient processing
- Secure OAuth2 token management

**AI Analysis:**
- Gemini AI analyzes email content for status detection
- Intelligent categorization (Applied, Interview, Offer, etc.)
- Descriptive status summaries for each application
- Confidence indicators for AI-generated insights

**PDF Reports:**
- Professional formatting with color coding
- Summary statistics and detailed application lists
- Downloadable files with unique naming
- Mobile-optimized responsive design

## 🔧 Configuration

### Firebase Configuration
The `firebase.json` is configured for your project:
```json
{
  "hosting": {
    "public": "frontend/build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  },
  "functions": {
    "source": "functions",
    "runtime": "python39"
  }
}
```

### Environment Variables
All configuration is stored in a single `.env` file in the root directory:

**Required variables:**
- `GOOGLE_CLIENT_ID` - OAuth2 client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - OAuth2 client secret from Google Cloud Console
- `GEMINI_API_KEY` - Google Gemini AI API key from AI Studio
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `REDIRECT_URI` - OAuth callback URL for your deployed functions
- `REACT_APP_FIREBASE_*` - Firebase configuration values from your Firebase project settings

**⚠️ Important:** The `.env` file contains sensitive credentials and should never be committed to version control.

## 🧪 Development Workflows

### Local Development
```bash
# Start Firebase emulators
npm run emulators

# Start React development server
npm run start:frontend

# Deploy functions only
npm run deploy:functions
```

### Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

### Deployment
```bash
# Deploy everything
npm run deploy

# Deploy to specific environment
npm run deploy:staging
npm run deploy:production
```

## 📈 CI/CD Pipeline

### Continuous Integration
- **Code Quality:** ESLint, Prettier, security scanning
- **Testing:** Unit tests, integration tests with Firebase emulators
- **Performance:** Lighthouse audits and bundle analysis
- **Security:** Dependency vulnerability scanning

### Continuous Deployment
- **Multi-environment:** Staging and production deployments
- **Preview Deployments:** Automatic PR previews
- **Rollback Support:** Quick reversion capabilities
- **Health Checks:** Post-deployment verification

### Pipeline Stages
1. **Quality Gate:** Code analysis and testing
2. **Build:** Asset compilation and optimization
3. **Deploy:** Environment-specific deployments
4. **Verify:** Health checks and performance monitoring
5. **Notify:** Team communication via Slack

## 🔒 Security

- OAuth2 secure token management
- Firebase Security Rules for data access
- Environment variable protection
- HTTPS-only communication
- Input validation and sanitization
- No hardcoded credentials in source code

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Use ESLint and Prettier for code formatting
- Write tests for new functionality
- Never commit sensitive credentials
- Use environment variables for all configuration

## 📚 Learning Resources

This project demonstrates modern web development practices:

- **Firebase Ecosystem:** Auth, Functions, Firestore, Hosting
- **React Best Practices:** Hooks, context, routing
- **API Integration:** OAuth2, REST APIs, error handling
- **CI/CD:** GitHub Actions, multi-environment deployments
- **AI Integration:** Large language models, prompt engineering

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Firebase](https://firebase.google.com/) for the comprehensive platform
- [Google Gemini AI](https://gemini.google.com/) for intelligent analysis
- [React](https://reactjs.org/) for the frontend framework
- [Gmail API](https://developers.google.com/gmail/api) for email integration

---

Made with ❤️ for learning modern web development workflows
