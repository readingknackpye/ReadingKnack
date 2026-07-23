import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [auth, setAuth] = useState({ isAuth: false, role: '' });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setAuth({ isAuth: true, role: user.role || '' });
      } catch (e) {
        setAuth({ isAuth: false, role: '' });
      }
    }
  }, []);

  return (
    <div style={{       
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background:
        'linear-gradient(135deg, #ffffff 30%, #f3f0ff 60%, #dbe6ff 100%)',
      padding: '2rem'
    }}
      >
      <div style={{
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
        padding: '2rem',
        // Soft translucent white to blend with the gradient
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
        >
        <img src="/logo.png" alt="ReadingKnack Logo" style={{ width: 180, marginBottom: 24 }} />
        <h1>
          <span style={{
            background: 'linear-gradient(90deg, var(--rk-pink), var(--rk-purple), var(--rk-blue))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
            display: 'inline-block'
          }}>
            ReadingKnack
          </span>.com
        </h1>
        <p>A Personalized Learning Platform for Reading Comprehension Mastery</p>

        {/* Dynamic Action Buttons based on Role */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {!auth.isAuth ? (
            <>
              <Link to="/login" className="btn">Log In</Link>
              <Link to="/signup" className="btn" style={{ background: 'var(--rk-blue)', color: '#fff' }}>Get Started</Link>
            </>
          ) : auth.role === 'teacher' ? (
            <>
              <Link to="/upload" className="btn">Upload File</Link>
              <Link to="/documents" className="btn">Library</Link>
            </>
          ) : auth.role === 'parent' ? (
            <>
              <Link to="/parent-dashboard" className="btn">Parent Dashboard</Link>
              <Link to="/documents" className="btn">Library</Link>
            </>
          ) : (
            /* Student View */
            <>
              <Link to="/student-dashboard" className="btn">
                Go to Dashboard
              </Link>
              <Link to="/documents" className="btn">
                Browse Library
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;