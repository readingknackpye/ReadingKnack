import React, { useEffect, useState } from 'react';
import { authAPI } from '../api';           
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Get CSRF cookie once so POSTs include X-CSRFToken automatically
  useEffect(() => {
    authAPI.csrf().catch(() => {});         // or GET /api/auth/login/ if that sets CSRF
  }, []);

  const handleLoginForm = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const loginResponse = await authAPI.login({ username, password });
      const user = loginResponse.data?.user;
      
      // Get user profile after successful login
      const userResponse = await authAPI.me();
      const profile = userResponse.data?.user || {};

      // Store authentication data in localStorage
      localStorage.setItem('authToken', 'authenticated'); // You can store actual token if you have one
      localStorage.setItem('user', JSON.stringify({
        username: profile.username || username,
        id: profile.id,
        email: profile.email,
        role: profile.role || 'student',
      }));

      // Dispatch custom event to notify navbar about authentication change
      window.dispatchEvent(new Event('storage'));

      // Show success message (optional)
      console.log('Login successful!');

      // Teachers land on their dashboard, students go home
      navigate(profile.role === 'teacher' ? '/teacher/dashboard' : '/');
      
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || 'Login failed. Check your username/password.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logInContainer">
      <h2 className="logInTitle">Log In</h2>
      <div className="logInBox">
        <form onSubmit={handleLoginForm}>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="logInInput"
            required
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="logInInput"
            required
          />
          <button className="logInButton" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>
          {error && <p className="errorText">{error}</p>}
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Don't have an account? <a href="/signup" style={{ color: '#007bff', textDecoration: 'none' }}>Sign up</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
