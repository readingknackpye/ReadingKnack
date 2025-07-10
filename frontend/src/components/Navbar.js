import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-content">
          {/* Logo */}
          <Link to="/" className="nav-logo">
            <span className="nav-icon">📚</span>
            <span className="nav-title">Reading Knack</span>
          </Link>

          {/* Navigation Links */}
          <div className="nav-links">
            <Link
              to="/"
              className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}
            >
              <span className="nav-icon">🏠</span>
              <span>Home</span>
            </Link>
            
            <Link
              to="/documents"
              className={`nav-link ${isActive('/documents') ? 'nav-link-active' : ''}`}
            >
              <span className="nav-icon">📖</span>
              <span>Passages</span>
            </Link>
            
            <Link
              to="/upload"
              className={`nav-link ${isActive('/upload') ? 'nav-link-active' : ''}`}
            >
              <span className="nav-icon">📄</span>
              <span>Upload</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="nav-mobile">
            <button className="nav-mobile-btn">
              <span>☰</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 