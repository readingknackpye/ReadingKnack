import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, documentsAPI, gradeLevelsAPI, skillCategoriesAPI } from '../api';
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [documentsRes, gradeLevelsRes, skillCategoriesRes, userRes] = await Promise.all([
        documentsAPI.getAll(),
        gradeLevelsAPI.getAll(),
        skillCategoriesAPI.getAll(),
        authAPI.me()
      ]);
      
      setDocuments(documentsRes.data);
      setGradeLevels(gradeLevelsRes.data);
      setSkillCategories(skillCategoriesRes.data);
      setCurrentUser(userRes.data.user);
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

const filteredDocuments = documents.filter((doc) => {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const matchesSearch =
    !normalizedSearchTerm ||
    doc.title?.toLowerCase().includes(normalizedSearchTerm) ||
    doc.parsed_text?.toLowerCase().includes(normalizedSearchTerm);

  const documentGradeId =
    typeof doc.grade_level === "object"
      ? doc.grade_level?.id
      : doc.grade_level;

  const documentSkillId =
    typeof doc.skill_category === "object"
      ? doc.skill_category?.id
      : doc.skill_category;

  const matchesGrade =
    !selectedGrade ||
    Number(documentGradeId) === Number(selectedGrade);

  const matchesSkill =
    !selectedSkill ||
    Number(documentSkillId) === Number(selectedSkill);

  return matchesSearch && matchesGrade && matchesSkill;
});

const getGradeName = (gradeLevel) => {
  if (!gradeLevel) {
    return null;
  }

  if (typeof gradeLevel === "object") {
    return gradeLevel.name;
  }

  const grade = gradeLevels.find(
    (item) => Number(item.id) === Number(gradeLevel)
  );

  return grade?.name || null;
};

const getSkillName = (skillCategory) => {
  if (!skillCategory) {
    return null;
  }

  if (typeof skillCategory === "object") {
    return skillCategory.name;
  }

  const skill = skillCategories.find(
    (item) => Number(item.id) === Number(skillCategory)
  );

  return skill?.name || null;
};

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  // calculate the reading time based on 150 words per minute
  const calculateReadingTime = (text) => {
    if(!text) return 1;
    const wordCount = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 150));
  }

  const handleReadClick = (doc) => {
    setSelectedDocument(doc);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDocument(null);
  };

  const handleDeleteClick = (doc) => {
    setDocumentToDelete(doc);
    setDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setDocumentToDelete(null);
  };

  const confirmDelete = async () => {
    if(!documentToDelete) return;

    setIsDeleting(true);
    try{
      await documentsAPI.delete(documentToDelete.id);

      setDocuments(prev => prev.filter(d => d.id !== documentToDelete.id));

      setDeleteModalOpen(false);
      setDocumentToDelete(null);
    } catch (err) {
      console.error('Failed to delete the document: ', err);
      alert('Failed to delete the document. Please try again.');
    } finally {
      setIsDeleting(false);
    }
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
            {documents.length === 0 && currentUser?.role === 'teacher' && (
              <Link to="/upload" className="btn btn-primary">
                Upload Your First Passage
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="documents-grid">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="card document-card" style={{position: 'relative'}}>
              {currentUser?.role === 'teacher' && (
              <button
                onClick={() => handleDeleteClick(doc)}
                style={{
                  position: 'absolute', top: '12px', right: '12px', 
                  background: '#ed5a5a', border: 'dotted', 
                  color: '#ebe5e5', cursor: 'pointer', 
                  fontSize: '0.8rem', fontWeight: 'bold'
                }}
                title="Delete Passage"
                >
                  ✕
              </button> 
              )}

              <div className="document-header">
                <h3 className="document-title">
                  {doc.title}
                </h3>
                
                <div className="document-meta" style={{ display: 'flex', gap: '16px' }}>
                  <div className="meta-item">
                    <span className="meta-icon">📅</span>
                    {formatDate(doc.uploaded_at)}
                  </div>
                  {/* Reading Time Indicator */}
                  <div className = "meta-item">
                    <span className="meta-icon">⏱️</span>
                    {calculateReadingTime(doc.parsed_text)} min read
                  </div>
                </div>
              </div>

              <div className="document-content">
                <p className="document-preview">
                  {doc.parsed_text?.substring(0, 150)}...
                </p>
              </div>

              <div className="document-tags">
                {getGradeName(doc.grade_level) && (
                  <span className="tag grade-tag">
                    {getGradeName(doc.grade_level)}
                  </span>
                )}

                {getSkillName(doc.skill_category) && (
                  <span className="tag skill-tag">
                    {getSkillName(doc.skill_category)}
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

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
          justifyContent: 'center', alignItems: 'center', zIndex: 1000 
        }}>
          <div className="card p-6 bg-white rounded-lg shadow-xl" style={{ maxWidth: '400px', width: '90%' }}>
            <h3 className="text-xl font-bold mb-4 text-gray-800">Delete Passage?</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete <strong>{documentToDelete?.title}</strong>? This action will permanently delete the passage, its questions, and all student results.
            </p>
            <div className="flex justify-end gap-4">              
            <div className="flex gap-4">
              <button onClick={confirmDelete} disabled={isDeleting} className="btn btn-danger">
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button onClick={cancelDelete} disabled={isDeleting} className="btn btn-cancel">
                Cancel
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;