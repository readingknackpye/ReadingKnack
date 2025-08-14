import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authAPI } from '../api';

const Navbar = () => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  // Check if user is authenticated on component mount
  useEffect(() => {
    // Check if user is logged in (you can store this in localStorage or sessionStorage)
    const checkAuthStatus = () => {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        setIsAuthenticated(true);
        try {
          const userData = JSON.parse(user);
          setUsername(userData.username || 'User');
        } catch (e) {
          setUsername('User');
        }
      } else {
        setIsAuthenticated(false);
        setUsername('');
      }
    };

    checkAuthStatus();
    
    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkAuthStatus);
    
    // Listen for custom authentication events
    const handleAuthChange = () => {
      checkAuthStatus();
    };
    
    window.addEventListener('authChange', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Call Supabase logout API
      await authAPI.logout();
      console.log('Logged out from Supabase successfully');
    } catch (error) {
      console.error('Error logging out from Supabase:', error);
      // Continue with frontend logout even if backend fails
    } finally {
      // Always clean up frontend state
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUsername('');
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('authChange'));
      
      // Redirect to home page
      window.location.href = '/';
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: '#fff',
      borderBottom: '2px solid var(--rk-blue)',
      padding: '0.5rem 0',
      marginBottom: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '2rem',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '2rem',
        marginLeft: '2rem',
        flex: 1,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', marginRight: 24 }}>
          <img src="/logo.png" alt="ReadingKnack Logo" style={{ height: 40, marginRight: 12 }} />
          <span style={{
            fontFamily: 'Montserrat, Arial, sans-serif',
            fontWeight: 900,
            fontSize: '1.5rem',
            background: 'linear-gradient(90deg, var(--rk-pink), var(--rk-purple), var(--rk-blue))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            color: 'transparent',
            display: 'inline-block',
            letterSpacing: '-1px',
          }}>
            ReadingKnack
          </span>
          <span style={{ color: 'var(--rk-dark)', fontWeight: 700, fontSize: '1.5rem', marginLeft: 2 }}>.com</span>
        </Link>
        <Link to="/upload" className="btn" style={{ marginRight: 8 }}>Upload</Link>
        <Link to="/documents" className="btn" style={{ marginRight: 8 }}>Documents</Link>
        <Link to="/quiz" className="btn" style={{ marginRight: 8 }}>Quiz</Link>
        <Link to="/profile" className="btn">Profile</Link>
      </div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem',
        marginRight: '2rem',
      }}>
        {isAuthenticated ? (
          // User is logged in - show user info and logout
          <>
            <span style={{
              color: 'var(--rk-dark)',
              fontWeight: 500,
              fontSize: '0.9rem',
            }}>
              Welcome, {username}!
            </span>
            <button 
              onClick={handleLogout}
              className="btn" 
              style={{
                background: '#fff',
                color: '#dc3545',
                border: '2px solid #dc3545',
                boxShadow: 'none',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          // User is not logged in - show login/signup buttons
          <>
            <Link to="/login" className="btn" style={{
              background: '#fff',
              color: 'var(--rk-purple)',
              border: '2px solid var(--rk-purple)',
              boxShadow: 'none',
            }}>Log In</Link>
            <Link to="/signup" className="btn" style={{
              background: 'linear-gradient(90deg, var(--rk-purple), var(--rk-blue), var(--rk-pink))',
              color: '#fff',
              border: 'none',
            }}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 