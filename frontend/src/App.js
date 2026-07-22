import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Upload from './pages/UploadDocument';
import DocumentsList from './pages/DocumentList';
import Quiz from './pages/Quiz';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Results from './pages/Results';
import Navbar from './components/Navbar';
import UploadDocument from './pages/UploadDocument';
import ReviewDocument from './pages/ReviewDocument';
import StudentDashboard from './pages/StudentDashboard';
import NotFound from './components/NotFound'; 

function App() {
  return (
    <Router>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<UploadDocument />} />
        <Route path="/documents" element={<DocumentsList />} />
        <Route path="/quiz/:documentId" element={<Quiz />} />
        <Route path="/results" element={<Results />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/review/:documentId" element={<ReviewDocument />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;