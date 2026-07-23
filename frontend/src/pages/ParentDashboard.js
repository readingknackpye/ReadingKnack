import React, { useState, useEffect } from 'react';
import { authAPI } from '../api';

const ParentDashboard = () => {
  const [childrenData, setChildrenData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Link form states
  const [studentUsername, setStudentUsername] = useState('');
  const [relationship, setRelationship] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getParentDashboard();
      setChildrenData(response.data.children || []);
    } catch (err) {
      console.error('Failed to load parent dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleLinkChild = async (e) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');

    try {
      const response = await authAPI.linkChild({
        student_username: studentUsername,
        relationship: relationship
      });

      if (response.data.success) {
        setLinkSuccess(response.data.message);
        setStudentUsername('');
        setRelationship('');
        // Reload dashboard to show the newly linked child
        loadDashboard();
      }
    } catch (err) {
      setLinkError(err.response?.data?.error || 'Failed to link account. Please check the username.');
    }
  };

  if (loading) {
    return <div style={{ padding: '100px', textAlign: 'center' }}>Loading dashboard...</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '100px auto', padding: '0 20px' }}>
      <h1 style={{ color: 'var(--rk-dark)', marginBottom: '10px' }}>Parent Dashboard</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Monitor your child's reading comprehension progress.</p>

      {/* Link a Child Form */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Link a Student Account</h2>
        
        {linkError && <div style={{ color: 'red', background: '#ffe6e6', padding: '10px', borderRadius: '6px', marginBottom: '16px' }}>{linkError}</div>}
        {linkSuccess && <div style={{ color: 'green', background: '#e6ffe6', padding: '10px', borderRadius: '6px', marginBottom: '16px' }}>{linkSuccess}</div>}

        <form onSubmit={handleLinkChild} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '0.9rem' }}>Student Username</label>
            <input 
              type="text" 
              value={studentUsername} 
              onChange={(e) => setStudentUsername(e.target.value)} 
              placeholder="e.g., alex_reads_99"
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', fontSize: '0.9rem' }}>Relationship</label>
            <input 
              type="text" 
              value={relationship} 
              onChange={(e) => setRelationship(e.target.value)} 
              placeholder="e.g., Mother, Father, Guardian"
              required
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
          </div>
          <button type="submit" className="btn" style={{ alignSelf: 'flex-end', height: '42px', padding: '0 24px' }}>
            Link Account
          </button>
        </form>
      </div>

      {/* Display Linked Children */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Linked Students</h2>
      
      {childrenData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '12px', color: '#64748b' }}>
          You haven't linked any student accounts yet. Use the form above to connect to your child's profile.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px' }}>
          {childrenData.map(child => (
            <div key={child.id} style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: 'var(--rk-blue)' }}>{child.first_name || child.username}</h3>
                <span style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b' }}>
                  {child.relationship}
                </span>
              </div>
              
              <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: '#334155' }}>Recent Quizzes</h4>
              {child.recent_activity.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>No quizzes completed yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {child.recent_activity.map((quiz, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8f9fa', padding: '12px 16px', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>{quiz.test_name}</span>
                      <div style={{ display: 'flex', gap: '16px', color: '#64748b' }}>
                        <span>{quiz.date}</span>
                        <span style={{ fontWeight: 'bold', color: quiz.percentage >= 70 ? 'green' : 'var(--rk-dark)' }}>
                          {quiz.score}/{quiz.total} ({quiz.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;