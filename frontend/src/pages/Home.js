import React from 'react';

const Home = () => (
  <div
    style={{
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
      padding: '2rem',
    }}
  >
    <div
      style={{
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
        padding: '2rem',
        // Soft translucent white to blend with the gradient
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      {/* your content here, unchanged */}
      <img
        src="/logo.png"
        alt="ReadingKnack Logo"
        style={{ width: 180, marginBottom: 24 }}
      />

      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          color: 'var(--rk-dark)',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            background:
              'linear-gradient(90deg, var(--rk-pink), var(--rk-purple), var(--rk-blue))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
          }}
        >
          ReadingKnack
        </span>
        <span style={{ color: 'var(--rk-dark)' }}>.com</span>
      </h1>

      <p
        style={{
          color: 'var(--rk-dark)',
          fontWeight: 500,
          fontSize: '1.1rem',
          marginBottom: 32,
        }}
      >
        A Personalized Learning Platform for Reading Comprehension Mastery (Grades
        3–8 + SAT)
      </p>

      <a href="/upload" className="btn" style={{ marginRight: 16 }}>
        Upload Document
      </a>
      <a
        href="/documents"
        className="btn"
        style={{ background: 'var(--rk-blue)', color: '#fff' }}
      >
        Browse Passages
      </a>
    </div>
  </div>
);

export default Home;