import React, { useState } from 'react';
import './Signup.css';
const Signup = () => {
  const [username, setUsername] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  {/*JS state variables that store user information*/}
  const handleSignupForm = (e) => {
    e.preventDefault();
    console.log('Form submitted:', {username, email, password}); {/* Check if the form submission works as intended*/}
    {/* Can also connect the backend at this point, just to store user data*/}
  };
  return (
  <div className="signupContainer">
    <h2 className="signupTitle">Sign Up</h2>
    <div className="signupBox">
    <form onSubmit ={handleSignupForm}>
      {/*The type checks to make sure user input is as expected; example: the type is password, it will automatically censor the password*/}
      <input
        type = "text"
        placeholder='Enter a username'
        value={username}
        onChange={(e)=> setUsername(e.target.value)}
        className = "signupInput"
        />
        {/* 'e' is the event object, .target refers to user input and .value refers to the target's value; user input text*/}
      <input
        type = "email"
        placeholder='Enter your email'
        value={email}
        onChange ={(e) => setEmail(e.target.value)}
        className = "signupInput"
        />
      <input
        type = "password"
        placeholder='Enter a Password'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className = "signupInput"
      />
        <button
          className = "signUpButton"
          type = "submit">
          Sign Up
        </button>
      </form>   
    </div>
  </div>
  );
};

export default Signup; 