import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import UploadDocument from './pages/UploadDocument';
import DocumentsList from './pages/DocumentList';
import Quiz from './pages/Quiz';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Results from './pages/Results';
import Navbar from './components/Navbar';
import TeacherDashboard from './pages/TeacherDashboard';
import ReviewDocument from './pages/ReviewDocument';
import StudentDashboard from './pages/StudentDashboard';
import NotFound from './components/NotFound'; 
import ProtectedRoute from './components/ProtectedRoute'; 
import ParentDashboard from './pages/ParentDashboard';

function App() {
  return (
    <Router>
      <Navbar/>
      <Routes>
        {/* Anyone can access these */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<NotFound />} />

        {/*Any authenticated user (Student or Teacher) */}
        <Route path="/documents" element={
          <ProtectedRoute>
            <DocumentsList />
          </ProtectedRoute>
        } />
        <Route path="/quiz/:documentId" element={
          <ProtectedRoute>
            <Quiz />
          </ProtectedRoute>
        } />
        <Route path="/results" element={
          <ProtectedRoute>
            <Results />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/student-dashboard" element={
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        } />

        {/* Locked down to the 'teacher' role */}
        <Route path="/upload" element={
          <ProtectedRoute allowedRole="teacher">
            <UploadDocument />
          </ProtectedRoute>
        } />
        <Route path="/teacher/dashboard" element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        <Route path="/review/:documentId" element={
          <ProtectedRoute allowedRole="teacher">
            <ReviewDocument />
          </ProtectedRoute>
        } />
        <Route path="/parent-dashboard" element={
          <ProtectedRoute allowedRole="parent">
            <ParentDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;