import React from 'react';

const Home = () => (
  <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '2rem' }}>
    <img src="/logo.png" alt="ReadingKnack Logo" style={{ width: 180, marginBottom: 24 }} />
    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--rk-dark)', marginBottom: 8 }}>
      <span style={{ background: 'linear-gradient(90deg, var(--rk-pink), var(--rk-purple), var(--rk-blue))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
        ReadingKnack
      </span>
      <span style={{ color: 'var(--rk-dark)' }}>.com</span>
    </h1>
    <p style={{ color: 'var(--rk-dark)', fontWeight: 500, fontSize: '1.1rem', marginBottom: 32 }}>
      A Personalized Learning Platform for Reading Comprehension Mastery (Grades 3–8 + SAT)
    </p>
    <a href="/upload" className="btn" style={{ marginRight: 16 }}>Upload Document</a>
    <a href="/documents" className="btn" style={{ background: 'var(--rk-blue)', color: '#fff' }}>Browse Passages</a>
  </div>
);

export default Home; 