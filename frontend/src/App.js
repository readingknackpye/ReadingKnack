import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Documents from './pages/Documents';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <nav style={{
        background: '#fff',
        borderBottom: '2px solid var(--rk-blue)',
        padding: '0.5rem 0',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '2rem',
        maxWidth: 1200,
        margin: '0 auto 2rem auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
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
          <Link to="/results" className="btn">Results</Link>
          <Link to="/profile" className="btn">Profile</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/results" element={<Results />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}

export default App;
