import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignupForm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Basic validation
    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('Submitting signup form:', { 
        username: formData.username, 
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name
      });

      const response = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.password2,
        first_name: formData.first_name,
        last_name: formData.last_name
      });

      console.log('Signup response:', response);

      if (response.data.success) {
        setSuccess('Account created successfully! Redirecting to login...');
        // Clear form
        setFormData({
          username: '',
          email: '',
          password: '',
          password2: '',
          first_name: '',
          last_name: ''
        });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      
      if (err.response?.data?.errors) {
        // Handle validation errors from backend
        const errorMessages = Object.entries(err.response.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        setError(errorMessages);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signupContainer">
      <h2 className="signupTitle">Sign Up</h2>
      <div className="signupBox">
        {error && (
          <div className="error-message" style={{ 
            color: 'red', 
            backgroundColor: '#ffe6e6', 
            padding: '10px', 
            borderRadius: '5px', 
            marginBottom: '15px',
            fontSize: '14px',
            whiteSpace: 'pre-line'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message" style={{ 
            color: 'green', 
            backgroundColor: '#e6ffe6', 
            padding: '10px', 
            borderRadius: '5px', 
            marginBottom: '15px',
            fontSize: '14px'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSignupForm}>
          <input
            type="text"
            name="username"
            placeholder='Enter a username'
            value={formData.username}
            onChange={handleChange}
            className="signupInput"
            required
          />
          
          <input
            type="email"
            name="email"
            placeholder='Enter your email'
            value={formData.email}
            onChange={handleChange}
            className="signupInput"
            required
          />
          
          <input
            type="text"
            name="first_name"
            placeholder='Enter your first name'
            value={formData.first_name}
            onChange={handleChange}
            className="signupInput"
            required
          />
          
          <input
            type="text"
            name="last_name"
            placeholder='Enter your last name'
            value={formData.last_name}
            onChange={handleChange}
            className="signupInput"
            required
          />
          
          <input
            type="password"
            name="password"
            placeholder='Enter a password'
            value={formData.password}
            onChange={handleChange}
            className="signupInput"
            required
          />
          
          <input
            type="password"
            name="password2"
            placeholder='Confirm your password'
            value={formData.password2}
            onChange={handleChange}
            className="signupInput"
            required
          />
          
          <button
            className="signUpButton"
            type="submit"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>Already have an account? <a href="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Log in</a></p>
        </div>
      </div>
    </div>
  );
};

export default Signup; 