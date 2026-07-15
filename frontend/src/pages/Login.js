// src/Login.jsx
import React, { useEffect, useState } from 'react';
import { authAPI } from '../api';            // <-- from your api.js
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
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
      
      if (!loginResponse.data?.success || !user) {
        throw new Error(loginResponse.data?.error || 'Login failed.');
      }

      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
      }));
      localStorage.setItem('authToken', 'authenticated');
      
      window.dispatchEvent(new Event('authChange'));
      console.log('Login successful!');
      
      // Redirect to home page
      navigate('/');
      
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
      </div>
    </div>
  );
};

export default Login;
