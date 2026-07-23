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
    last_name: '',
    role: 'student',
    grade: '',
    class_size: '',
    relationship: ''
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
      // Build payload dynamically based on the role
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.password2,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role
      };

      if (formData.role === 'student') payload.grade = formData.grade;
      if (formData.role === 'teacher') payload.class_size = formData.class_size;
      if (formData.role === 'parent') payload.relationship = formData.relationship;

      const response = await authAPI.register(payload);

      if (response.data.success) {
        if (formData.role === 'teacher') {
          setSuccess('Account created! Please check your email to verify. Your account is pending admin approval.');
        } else {
          setSuccess('Account created successfully! Please check your email to verify your account.');
        }
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.data.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors) {
        const errorMessages = Object.entries(errData.errors)
          .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
          .join('\n');
        setError(errorMessages);
      } else {
        setError(errData?.error || err.message || 'An unexpected error occurred.');
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
          <div className="error-message" style={{ color: 'red', backgroundColor: '#ffe6e6', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px', whiteSpace: 'pre-line' }}>
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message" style={{ color: 'green', backgroundColor: '#e6ffe6', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSignupForm}>
          {/* Role Selection */}
          <div style={{ display: 'flex', gap: '15px', margin: '0 0 15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['student', 'teacher', 'parent'].map(r => (
              <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textTransform: 'capitalize' }}>
                <input
                  type="radio"
                  name="role"
                  value={r}
                  checked={formData.role === r}
                  onChange={handleChange}
                />
                {r}
              </label>
            ))}
          </div>

          <input type="text" name="username" placeholder='Enter a username' value={formData.username} onChange={handleChange} className="signupInput" required />
          <input type="email" name="email" placeholder='Enter your email' value={formData.email} onChange={handleChange} className="signupInput" required />
          <input type="text" name="first_name" placeholder='Enter your first name' value={formData.first_name} onChange={handleChange} className="signupInput" required />
          <input type="text" name="last_name" placeholder='Enter your last name' value={formData.last_name} onChange={handleChange} className="signupInput" required />
          
          {/* Dynamic Fields Based on Role */}
          {formData.role === 'student' && (
            <select name="grade" value={formData.grade} onChange={handleChange} className="signupInput" required>
              <option value="">Select your grade</option>
              <option value="3">Grade 3</option>
              <option value="4">Grade 4</option>
              <option value="5">Grade 5</option>
              <option value="6">Grade 6</option>
              <option value="7">Grade 7</option>
              <option value="8">Grade 8</option>
              <option value="9">Grade 9</option>
              <option value="11">SAT</option>
            </select>
          )}

          {formData.role === 'teacher' && (
            <select name="class_size" value={formData.class_size} onChange={handleChange} className="signupInput" required>
              <option value="">Select your class size</option>
              <option value="20">20 students</option>
              <option value="40">40 students</option>
              <option value="60">60 students</option>
              <option value="80">80 students</option>
              <option value="100">100 students</option>
            </select>
          )}

          {formData.role === 'parent' && (
            <input type="text" name="relationship" placeholder='Relationship (e.g., Mother, Father, Guardian)' value={formData.relationship} onChange={handleChange} className="signupInput" required />
          )}

          <input type="password" name="password" placeholder='Enter a password' value={formData.password} onChange={handleChange} className="signupInput" required />
          <input type="password" name="password2" placeholder='Confirm your password' value={formData.password2} onChange={handleChange} className="signupInput" required />

          <button className="signUpButton" type="submit" disabled={loading} style={{ opacity: loading ? 0.7 : 1, marginTop: '10px' }}>
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