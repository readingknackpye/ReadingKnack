import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { documentsAPI, gradeLevelsAPI, skillCategoriesAPI } from '../api';
import DocumentModal from '../components/DocumentModal';
import './DocumentList.css';

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [documentsRes, gradeLevelsRes, skillCategoriesRes] = await Promise.all([
        documentsAPI.getAll(),
        gradeLevelsAPI.getAll(),
        skillCategoriesAPI.getAll()
      ]);
      
      setDocuments(documentsRes.data);
      setGradeLevels(gradeLevelsRes.data);
      setSkillCategories(skillCategoriesRes.data);
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.parsed_text?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = !selectedGrade || doc.grade_level?.id === parseInt(selectedGrade);
    const matchesSkill = !selectedSkill || doc.skill_category?.id === parseInt(selectedSkill);
    
    return matchesSearch && matchesGrade && matchesSkill;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleReadClick = (doc) => {
    setSelectedDocument(doc);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDocument(null);
  };

  if (loading) {
    return (
      <div className="document-list-container">
        <div className="card">
          <div className="loading-message">Loading documents...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="document-list-container">
        <div className="card">
          <div className="error-message">{error}</div>
          <button onClick={fetchData} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="document-list-container">
      {/* Header Card */}
      <div className="card header-card">
        <div className="header-content">
          <h1 className="page-title">Reading Passages</h1>
          <p className="page-subtitle">Browse and explore all uploaded reading passages</p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card filters-card">
        <h2 className="card-title">Search & Filter</h2>
        <div className="filters-grid">
          {/* Search */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Search passages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          {/* Grade Level Filter */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="filter-select"
          >
            <option value="">All Grade Levels</option>
            {gradeLevels.map(grade => (
              <option key={grade.id} value={grade.id}>{grade.name}</option>
            ))}
          </select>

          {/* Skill Category Filter */}
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="filter-select"
          >
            <option value="">All Skills</option>
            {skillCategories.map(skill => (
              <option key={skill.id} value={skill.id}>{skill.name}</option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedGrade('');
              setSelectedSkill('');
            }}
            className="btn btn-secondary clear-filters-btn"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-count">
        <p className="count-text">
          Showing {filteredDocuments.length} of {documents.length} passages
        </p>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="card empty-state-card">
          <div className="empty-state-content">
            <h3 className="empty-state-title">No passages found</h3>
            <p className="empty-state-text">
              {documents.length === 0 
                ? "No passages have been uploaded yet." 
                : "No passages match your current filters."
              }
            </p>
            {documents.length === 0 && (
              <Link to="/upload" className="btn btn-primary">
                Upload Your First Passage
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="documents-grid">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="card document-card">
              <div className="document-header">
                <h3 className="document-title">
                  {doc.title}
                </h3>
                
                <div className="document-meta">
                  <div className="meta-item">
                    <span className="meta-icon">📅</span>
                    {formatDate(doc.uploaded_at)}
                  </div>
                </div>
              </div>

              <div className="document-content">
                <p className="document-preview">
                  {doc.parsed_text?.substring(0, 150)}...
                </p>
              </div>

              <div className="document-tags">
                {doc.grade_level && (
                  <span className="tag grade-tag">
                    {doc.grade_level.name}
                  </span>
                )}
                {doc.skill_category && (
                  <span className="tag skill-tag">
                    {doc.skill_category.name}
                  </span>
                )}
              </div>

              <div className="document-actions">
                <button
                  onClick={() => handleReadClick(doc)}
                  className="btn btn-secondary action-btn"
                >
                  <span className="btn-icon">📖</span>
                  Read
                </button>
                <Link
                  to={`/quiz/${doc.id}`}
                  className="btn btn-primary action-btn"
                >
                  <span className="btn-icon">🎓</span>
                  Quiz
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Modal */}
      <DocumentModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        documentId={selectedDocument?.id}
        documentTitle={selectedDocument?.title}
      />
    </div>
  );
};

export default DocumentList; 