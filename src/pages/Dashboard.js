import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useTable, useSortBy, usePagination } from '@tanstack/react-table';
import { auth, db } from '../firebase';
import { callGetAuthUrl, callFetchJobEmails } from '../api';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Table columns configuration
  const columns = React.useMemo(
    () => [
      {
        Header: 'Company',
        accessor: 'company',
      },
      {
        Header: 'Position',
        accessor: 'position',
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => (
          <span className={`status ${value.toLowerCase()}`}>
            {value}
          </span>
        ),
      },
      {
        Header: 'Date',
        accessor: 'date',
        Cell: ({ value }) => new Date(value.seconds * 1000).toLocaleDateString(),
      },
      {
        Header: 'Source',
        accessor: 'source',
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    state: { pageIndex },
  } = useTable(
    {
      columns,
      data: applications,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useSortBy,
    usePagination
  );

  useEffect(() => {
    if (user) {
      // Listen to applications collection
      const q = query(
        collection(db, 'users', user.uid, 'applications'),
        orderBy('created_at', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const apps = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (doc.id !== '_init') { // Skip the init document
            apps.push({ id: doc.id, ...data });
          }
        });
        setApplications(apps);
      });

      // Check if Gmail is connected
      checkGmailConnection();

      return () => unsubscribe();
    }
  }, [user]);

  const checkGmailConnection = async () => {
    // This could be enhanced to check for valid tokens
    setIsConnected(applications.length > 0);
  };

  const handleConnectGmail = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await callGetAuthUrl();
      window.location.href = response.authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      setError('Failed to connect to Gmail. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanEmails = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await callFetchJobEmails();
      console.log('Scan complete:', response);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error scanning emails:', error);
      setError(error.message || 'Failed to scan emails. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Job Application Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {user.displayName}</span>
            <button onClick={handleSignOut} className="sign-out-btn">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="actions-section">
          <div className="gmail-status">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              <div className="status-dot"></div>
              <span>{isConnected ? 'Gmail Connected' : 'Gmail Not Connected'}</span>
            </div>
          </div>

          <div className="action-buttons">
            {!isConnected && (
              <button 
                onClick={handleConnectGmail}
                disabled={loading}
                className="connect-btn"
              >
                {loading ? 'Connecting...' : 'Connect Gmail'}
              </button>
            )}
            
            <button 
              onClick={handleScanEmails}
              disabled={loading || !isConnected}
              className="scan-btn"
            >
              {loading ? 'Scanning...' : 'Scan for Job Emails'}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="applications-section">
          <div className="section-header">
            <h2>Your Applications ({applications.length})</h2>
          </div>

          {applications.length === 0 ? (
            <div className="empty-state">
              <h3>No applications found</h3>
              <p>Connect your Gmail account and scan for job-related emails to get started.</p>
            </div>
          ) : (
            <div className="table-container">
              <table {...getTableProps()} className="applications-table">
                <thead>
                  {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map(column => (
                        <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                          {column.render('Header')}
                          <span>
                            {column.isSorted
                              ? column.isSortedDesc
                                ? ' 🔽'
                                : ' 🔼'
                              : ''}
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                  {page.map((row, i) => {
                    prepareRow(row);
                    return (
                      <tr {...row.getRowProps()}>
                        {row.cells.map(cell => {
                          return (
                            <td {...cell.getCellProps()}>
                              {cell.render('Cell')}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="pagination">
                <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                  {'<<'}
                </button>
                <button onClick={() => previousPage()} disabled={!canPreviousPage}>
                  {'<'}
                </button>
                <span>
                  Page{' '}
                  <strong>
                    {pageIndex + 1} of {pageOptions.length}
                  </strong>{' '}
                </span>
                <button onClick={() => nextPage()} disabled={!canNextPage}>
                  {'>'}
                </button>
                <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                  {'>>'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 