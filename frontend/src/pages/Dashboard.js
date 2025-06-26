import React, { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { callGetAuthUrl, callFetchJobEmails, callGeneratePDFReport } from '../api';
import './Dashboard.css';

const Dashboard = ({ user, onSignOut }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [scanDays, setScanDays] = useState(7);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    interviews: 0,
    offers: 0,
    rejected: 0
  });

  // Check if Gmail tokens exist
  const checkGmailConnection = useCallback(async () => {
    if (!user) return;
    try {
      console.log('🔍 Checking Gmail connection for user:', user.uid);
      const tokenDoc = await getDoc(doc(db, 'users', user.uid, 'tokens', 'gmail'));
      console.log('📄 Token document exists:', tokenDoc.exists());
      if (tokenDoc.exists()) {
        console.log('🔑 Token data:', tokenDoc.data());
      }
      const isConnected = tokenDoc.exists() && (tokenDoc.data()?.refresh_token || tokenDoc.data()?.access_token);
      console.log('🔗 Gmail connected:', isConnected);
      setGmailConnected(isConnected);
    } catch (error) {
      console.error('❌ Error checking Gmail connection:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Check for OAuth success in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      alert('Gmail successfully connected! You can now scan your emails.');
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    checkGmailConnection();

    // Listen to applications in real-time
    const unsubscribe = onSnapshot(
      collection(db, 'users', user.uid, 'applications'),
      (snapshot) => {
        const apps = [];
        snapshot.forEach((doc) => {
          if (doc.id !== '_init') {
            const data = doc.data();
            apps.push({
              id: doc.id,
              ...data,
              date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
            });
          }
        });
        
        // Sort by date (most recent first)
        apps.sort((a, b) => new Date(b.date) - new Date(a.date));
        setApplications(apps);
        
        // Update stats
        updateStats(apps);
        
        // Get last scan time
        if (apps.length > 0) {
          const mostRecent = apps[0];
          setLastScan(mostRecent.created_at?.toDate ? mostRecent.created_at.toDate() : new Date(mostRecent.created_at));
        }
      },
      (error) => {
        console.error('Error listening to applications:', error);
      }
    );

    return () => unsubscribe();
  }, [user, checkGmailConnection]);

  const updateStats = (apps) => {
    const stats = {
      total: apps.length,
      pending: 0,
      interviews: 0,
      offers: 0,
      rejected: 0
    };

    apps.forEach(app => {
      const status = app.status?.category || app.status || 'Applied';
      if (status.toLowerCase().includes('interview')) {
        stats.interviews++;
      } else if (status.toLowerCase().includes('offer')) {
        stats.offers++;
      } else if (status.toLowerCase().includes('reject')) {
        stats.rejected++;
      } else {
        stats.pending++;
      }
    });

    setStats(stats);
  };

  const handleConnectGmail = async () => {
    try {
      setLoading(true);
      console.log('🔗 Starting Gmail connection...');
      const response = await callGetAuthUrl();
      console.log('📧 OAuth URL response:', response);
      console.log('🌐 Redirecting to:', response.authUrl);
      
      // Log the OAuth URL for debugging
      console.log('🔍 OAUTH URL DETAILS:');
      const url = new URL(response.authUrl);
      console.log('- Host:', url.host);
      console.log('- Search params:', url.searchParams.toString());
      console.log('- Redirect URI:', url.searchParams.get('redirect_uri'));
      
      // Delay redirect so we can see the logs
      setTimeout(() => {
        window.location.href = response.authUrl;
      }, 2000); // 2 second delay
      
    } catch (error) {
      console.error('❌ Error connecting to Gmail:', error);
      alert('Failed to connect to Gmail. Please try again.');
      setLoading(false);
    }
  };

  const handleScanEmails = async () => {
    try {
      setLoading(true);
      const response = await callFetchJobEmails(scanDays);
      
      if (response.success) {
        alert(`Successfully scanned emails! Found ${response.count} applications from the last ${response.daysBack} days.`);
        setLastScan(new Date());
      }
    } catch (error) {
      console.error('Error scanning emails:', error);
      alert(`Failed to scan emails: ${error.message}`);
    }
    setLoading(false);
  };

  const handleGeneratePDF = async () => {
    try {
      setPdfLoading(true);
      const response = await callGeneratePDFReport();
      
      if (response.success) {
        // Create blob from base64 data
        const byteCharacters = atob(response.pdfData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = response.fileName || 'job-application-report.pdf';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        window.URL.revokeObjectURL(url);
        
        alert(`PDF report generated successfully! Found ${response.applicationsCount} applications.`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(`Failed to generate PDF: ${error.message}`);
    }
    setPdfLoading(false);
  };

  const handleUpdateScanDays = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        emailScanDays: scanDays
      });
      alert('Scan period updated successfully!');
    } catch (error) {
      console.error('Error updating scan days:', error);
    }
  };

  const getStatusColor = (status) => {
    const category = status?.category || status || 'Applied';
    const colorMap = {
      'Applied': '#3b82f6',
      'Under Review': '#f59e0b',
      'Interview Scheduled': '#8b5cf6',
      'Technical Interview': '#ec4899',
      'Final Round': '#f97316',
      'Offer Received': '#10b981',
      'Rejected': '#ef4444',
      'Withdrawn': '#6b7280',
      'Follow-up Required': '#06b6d4',
    };
    
    // Handle partial matches
    const lowerCategory = category.toLowerCase();
    for (const [key, color] of Object.entries(colorMap)) {
      if (lowerCategory.includes(key.toLowerCase())) {
        return color;
      }
    }
    
    return colorMap[category] || '#6b7280';
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🎯 JobTrack Dashboard</h1>
            <p>Welcome back, {user.displayName || user.email}!</p>
          </div>
          <div className="header-right">
            <button 
              onClick={handleGeneratePDF}
              className="pdf-button"
              disabled={pdfLoading || applications.length === 0}
            >
              {pdfLoading ? 'Generating...' : '📄 Generate PDF Report'}
            </button>
            <button onClick={onSignOut} className="sign-out-button">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Applications</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{stats.interviews}</div>
            <div className="stat-label">Interviews</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.offers}</div>
            <div className="stat-label">Offers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-value">{stats.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>
      </div>

      {/* Gmail Integration Section */}
      <div className="gmail-section">
        <div className="section-header">
          <h2>📧 Gmail Integration</h2>
          <div className="gmail-status">
            <span className={`status-indicator ${gmailConnected ? 'connected' : 'disconnected'}`}>
              {gmailConnected ? '🟢 Connected' : '🔴 Not Connected'}
            </span>
          </div>
        </div>

        <div className="gmail-controls">
          <div className="scan-controls">
            <div className="scan-days-input">
              <label htmlFor="scanDays">Scan last:</label>
              <select 
                id="scanDays"
                value={scanDays} 
                onChange={(e) => setScanDays(parseInt(e.target.value))}
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
              <button onClick={handleUpdateScanDays} className="update-button">
                Update
              </button>
            </div>
            
            <button 
              onClick={checkGmailConnection} 
              className="refresh-button"
              style={{marginLeft: '10px', padding: '8px 12px', fontSize: '12px'}}
            >
              🔄 Refresh Status
            </button>
            
            {lastScan && (
              <div className="last-scan" style={{marginTop: '10px', fontSize: '12px', color: '#666'}}>
                Last scan: {formatDate(lastScan)}
              </div>
            )}
          </div>

          <div className="action-buttons">
            {!gmailConnected && (
              <button 
                onClick={handleConnectGmail}
                className="connect-button"
                disabled={loading}
              >
                {loading ? 'Connecting...' : '🔗 Connect Gmail'}
              </button>
            )}
            
            <button 
              onClick={handleScanEmails}
              className="scan-button"
              disabled={loading || !gmailConnected}
            >
              {loading ? 'Scanning...' : '🔍 Scan for Job Emails'}
            </button>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="applications-section">
        <div className="section-header">
          <h2>📋 Job Applications</h2>
          <div className="applications-count">
            {applications.length} applications found
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No Applications Yet</h3>
            <p>Connect your Gmail account and scan for job-related emails to get started!</p>
          </div>
        ) : (
          <div className="applications-table">
            <div className="table-header">
              <div className="th">Company</div>
              <div className="th">Position</div>
              <div className="th">Status</div>
              <div className="th">Last Contact</div>
              <div className="th">Source</div>
            </div>
            
            <div className="table-body">
              {applications.map((app) => (
                <div key={app.id} className="table-row">
                  <div className="td company-cell">
                    <div className="company-name">{app.company}</div>
                  </div>
                  
                  <div className="td position-cell">
                    <div className="position-name">{app.position}</div>
                  </div>
                  
                  <div className="td status-cell">
                    <div 
                      className="status-badge"
                      style={{ 
                        backgroundColor: getStatusColor(app.status),
                        color: 'white'
                      }}
                    >
                      {app.status?.category || app.status || 'Applied'}
                    </div>
                    {app.status?.description && (
                      <div className="status-description">
                        {app.status.description}
                      </div>
                    )}
                    {app.status?.aiGenerated && (
                      <div className="ai-badge">🤖 AI Generated</div>
                    )}
                  </div>
                  
                  <div className="td date-cell">
                    {formatDate(app.date)}
                  </div>
                  
                  <div className="td source-cell">
                    <span className="source-badge">
                      {app.source === 'Gmail' ? '📧' : '📝'} {app.source}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 