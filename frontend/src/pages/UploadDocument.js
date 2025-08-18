import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI, gradeLevelsAPI, skillCategoriesAPI } from '../api';

const UploadDocument = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    file: null,
    grade_level: '',
    skill_category: ''
  });
  const [gradeLevels, setGradeLevels] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const [gradeLevelsRes, skillCategoriesRes] = await Promise.all([
        gradeLevelsAPI.getAll(),
        skillCategoriesAPI.getAll()
      ]);
      setGradeLevels(gradeLevelsRes.data);
      setSkillCategories(skillCategoriesRes.data);
    } catch (err) {
      console.error('Error fetching options:', err);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setError('Please select a .docx file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setFormData(prev => ({ ...prev, file }));
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!formData.file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');
    setQuestions([]);
    setSuccess('');

    try {
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('file', formData.file);
      if (formData.grade_level) {
        uploadData.append('grade_level', formData.grade_level);
      }
      if (formData.skill_category) {
        uploadData.append('skill_category', formData.skill_category);
      }

      // Step 1: Upload the document
      const response = await documentsAPI.upload(uploadData);
      const docId = response.data.id;
      setSuccess('Document uploaded successfully! Redirecting to quiz...');

      // Redirect to quiz page after a short delay
      setTimeout(() => {
        navigate(`/quiz/${docId}`);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
    setError('');
  };

  return (
    <div className="upload-container">
      {/* Header */}
      <div className="upload-header">
        <p className="upload-subtitle"> </p>
      </div>

      {/* Upload Form */}
      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Title Input */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">Passage Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter a descriptive title for your passage"
              className="form-input"
              required
            />
          </div>

          {/* File Upload */}
          <div className="form-group">
            <label className="form-label">Document File *</label>
            <div
              className={`file-drop-zone ${dragActive ? 'file-drop-zone-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {formData.file ? (
                <div className="file-selected">
                  <div className="file-info">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{formData.file.name}</span>
                  </div>
                  <div className="file-size">
                    {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="btn btn-secondary file-remove-btn"
                  >
                    ✕ Remove File
                  </button>
                </div>
              ) : (
                <div className="file-drop-content">
                  <span className="file-drop-icon">📁</span>
                  <div>
                    <p className="file-drop-text">
                      Drop your .docx file here, or{' '}
                      <label className="file-browse-link">
                        browse
                        <input
                          type="file"
                          accept=".docx"
                          onChange={(e) => handleFileSelect(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="file-drop-hint">Only .docx files up to 10MB are supported</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grade Level */}
          <div className="form-group">
            <label htmlFor="grade_level" className="form-label">Grade Level</label>
            <select
              id="grade_level"
              name="grade_level"
              value={formData.grade_level}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="">Select a grade level (optional)</option>
              {gradeLevels.map(level => (
                <option key={level.id} value={level.id}>{level.name}</option>
              ))}
            </select>
          </div>

          {/* Skill Category */}
          <div className="form-group">
            <label htmlFor="skill_category" className="form-label">Skill Category</label>
            <select
              id="skill_category"
              name="skill_category"
              value={formData.skill_category}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="">Select a skill category (optional)</option>
              {skillCategories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          {/* Error and Success Messages */}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Submit Button */}
          <div className="form-group">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary submit-btn"
            >
              {loading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Questions */}
      {questions.length > 0 && (
        <div className="generated-questions">
          <h2>Generated Reading Comprehension Questions</h2>
          {questions.map((q, i) => (
            <div key={i} className="question-block">
              <strong>Q{i + 1}:</strong> {q.question}
              <br />
              <em>Answer:</em> {q.answer}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadDocument;
