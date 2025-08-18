import React from 'react';
import { documentsAPI } from '../api';
import './DocumentModal.css';

const DocumentModal = ({ isOpen, onClose, documentId, documentTitle }) => {
  const [document, setDocument] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (isOpen && documentId) {
      fetchDocument();
    }
  }, [isOpen, documentId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await documentsAPI.getDetail(documentId);
      setDocument(response.data);
    } catch (err) {
      setError('Failed to load document');
      console.error('Error fetching document:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {documentTitle || document?.title || 'Document'}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading document...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button className="btn btn-primary" onClick={fetchDocument}>
                Try Again
              </button>
            </div>
          ) : document ? (
            <div className="document-content">
              {/* Document Metadata */}
              <div className="document-meta">
                <div className="meta-item">
                  <span className="meta-icon">📅</span>
                  {formatDate(document.uploaded_at)}
                </div>
                
                {document.grade_level && (
                  <span className="meta-badge grade-badge">
                    {document.grade_level.name}
                  </span>
                )}
                
                {document.skill_category && (
                  <span className="meta-badge category-badge">
                    {document.skill_category.name}
                  </span>
                )}
              </div>

              {/* Document Text */}
              <div className="document-text">
                {document.parsed_text ? (
                  <div className="text-content">
                    {document.parsed_text}
                  </div>
                ) : (
                  <div className="no-content">
                    No content available for this document.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
                <a 
                  href={`/quiz/${document.id}`} 
                  className="btn btn-primary"
                >
                  <span className="btn-icon">🎓</span>
                  Take Quiz
                </a>
              </div>
            </div>
          ) : (
            <div className="no-content">
              Document not found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentModal; 