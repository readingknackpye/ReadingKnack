import React, { useState } from 'react';
import './Login.css';
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const handleLoginForm = (e) => {
    e.preventDefault();
    console.log('Form submitted:', {username, password});
    {/*Check if the form submission works as intended*/}
  };
  return (
  <div className = "logInContainer">
    <h2 className = "logInTitle">Log In</h2>
    <div className = "logInBox">
    <form onSubmit = {handleLoginForm}> 
    <input
      type = "text"
      placeholder = "Enter your username"
      value = {username}
      onChange={(e) => setUsername(e.target.value)}
      className = "logInInput"
      />
    <input
      type = "password"
      placeholder = "Enter your password"
      value ={password}
      onChange={(e) => setPassword(e.target.value)}
      className = "logInInput"
      />
        <button
          className = 'logInButton'
          type = "submit">
          Log In
        </button>
      </form>
    </div>
  </div>
  );
};

export default Login; 