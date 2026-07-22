import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div style={{ textAlign: 'center', padding: '100px 20px', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '4rem', color: '#9b51e0', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ fontSize: '2rem', color: '#333', marginBottom: '2rem' }}>Page Not Found</h2>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
        Oops! The page you are looking for doesn't exist or has been moved.
      </p>
      <Link 
        to="/" 
        className="btn btn-primary"
        style={{ padding: '12px 24px', fontSize: '1.1rem', background: '#9b51e0', color: 'white', textDecoration: 'none', borderRadius: '8px' }}
      >
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;