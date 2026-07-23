import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('user');

  // if not logged in, redirect to login page
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }
  // if a specific role is required to do something, verify it
  if(allowedRole){
    try {
        const user = JSON.parse(userStr);
        if(user.role !== allowedRole){
            // if a student tries to go to a teacher dashboard, redirect to student dashboard instead
            return <Navigate to="/student-dashboard" replace />;
        }
    } catch (e) {
        return <Navigate to="/login" replace />;
    }
  }
  // if they pass the checks, render the page
  return children;
};

export default ProtectedRoute;