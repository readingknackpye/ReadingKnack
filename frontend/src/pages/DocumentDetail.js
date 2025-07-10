import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { documentsAPI } from '../api';

const DocumentDetail = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true);
      const response = await documentsAPI.getDetail(id);
      setDocument(response.data);
    } catch (err) {
      setError('Failed to load document');
      console.error('Error fetching document:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error || 'Document not found'}</div>
        <Link
          to="/documents"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <span className="mr-2">←</span>
          Back to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/documents"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <span className="mr-2">←</span>
          Back to Documents
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{document.title}</h1>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <span className="mr-2">📅</span>
            {formatDate(document.uploaded_at)}
          </div>
          
          {document.grade_level && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              {document.grade_level.name}
            </span>
          )}
          
          {document.skill_category && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              {document.skill_category.name}
            </span>
          )}
        </div>

        <div className="flex gap-4">
          <Link
            to={`/quiz/${document.id}`}
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span className="mr-2">🎓</span>
            Take Quiz
          </Link>
          
          {document.questions && document.questions.length > 0 && (
            <span className="inline-flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg">
              <span className="mr-2">📖</span>
              {document.questions.length} Question{document.questions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Reading Passage */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Reading Passage</h2>
            <div className="prose max-w-none">
              {document.parsed_text ? (
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {document.parsed_text}
                </div>
              ) : (
                <div className="text-gray-500 italic">
                  No content available for this passage.
                </div>
              )}
            </div>
          </div>

          {/* Quiz Questions Preview */}
          {document.questions && document.questions.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Quiz Questions Preview</h2>
              <div className="space-y-6">
                {document.questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">
                      Question {index + 1}: {question.question_text}
                    </h3>
                    
                    {question.answers && question.answers.length > 0 && (
                      <div className="space-y-2">
                        {question.answers.map((answer) => (
                          <div
                            key={answer.id}
                            className={`p-3 rounded-lg border ${
                              answer.is_correct
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <span className="font-medium text-gray-700">
                              {answer.choice_letter}. {answer.choice_text}
                            </span>
                            {answer.is_correct && (
                              <span className="ml-2 text-green-600 text-sm font-medium">
                                ✓ Correct Answer
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {question.explanation && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Explanation:</h4>
                        <p className="text-blue-700 text-sm">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <Link
                  to={`/quiz/${document.id}`}
                  className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <span className="mr-2">🎓</span>
                  Start Quiz
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Document Info */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Document Information</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-600">Title:</span>
                <p className="text-gray-800">{document.title}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-600">Uploaded:</span>
                <p className="text-gray-800">{formatDate(document.uploaded_at)}</p>
              </div>
              
              {document.grade_level && (
                <div>
                  <span className="font-medium text-gray-600">Grade Level:</span>
                  <p className="text-gray-800">{document.grade_level.name}</p>
                </div>
              )}
              
              {document.skill_category && (
                <div>
                  <span className="font-medium text-gray-600">Skill Category:</span>
                  <p className="text-gray-800">{document.skill_category.name}</p>
                </div>
              )}
              
              <div>
                <span className="font-medium text-gray-600">Questions:</span>
                <p className="text-gray-800">
                  {document.questions ? document.questions.length : 0} question{document.questions && document.questions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to={`/quiz/${document.id}`}
                className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <span className="mr-2">🎓</span>
                Take Quiz
              </Link>
              
              <Link
                to="/documents"
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="mr-2">📖</span>
                Browse All Passages
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail; 