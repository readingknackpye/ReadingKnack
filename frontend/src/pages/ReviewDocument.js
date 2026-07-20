import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI, questionsAPI, answersAPI } from '../api';

const ReviewDocument = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  
  const [docData, setDocData] = useState({ title: '', parsed_text: '' });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchDocumentData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await documentsAPI.getDetail(documentId);
      
      setDocData({
        title: res.data.title,
        parsed_text: res.data.parsed_text
      });
      setQuestions(res.data.questions || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load document for review.');
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchDocumentData();
  }, [fetchDocumentData]);

  const handleDocChange = (field, value) => {
    setDocData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (qIndex, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleAnswerChange = (qIndex, aIndex, field, value) => {
    const updatedQuestions = [...questions];
    
    // when setting a correct answer, reset all other answers to false 
    if (field === 'is_correct' && value === true) {
      updatedQuestions[qIndex].answers.forEach(ans => ans.is_correct = false);
    }
    
    updatedQuestions[qIndex].answers[aIndex][field] = value;
    setQuestions(updatedQuestions);
  };
  // save logic before publishing new doc 
  const handleSaveAndPublish = async () => {
    setSaving(true);
    setError(null);

    try {
      // save the document title and the parsed text
      await documentsAPI.update(documentId, {
        title: docData.title,
        parsed_text: docData.parsed_text
      });

      // prepare arrays of promises for questions and answers
      const questionPromises = [];
      const answerPromises = [];

      questions.forEach(q => {
        // queue question updates
        questionPromises.push(
          questionsAPI.update(q.id, {
            question_text: q.question_text,
            explanation: q.explanation
          })
        );

        // queue answer updates
        q.answers.forEach(a => {
          answerPromises.push(
            answersAPI.update(a.id, {
              choice_text: a.choice_text,
              is_correct: a.is_correct
            })
          );
        });
      });

      // executes all updates concurrently
      await Promise.all([...questionPromises, ...answerPromises]);

      // redirect to the library once validation and saving is complete
      navigate('/documents');

    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-message text-center p-8">Loading document for review...</div>;

  return (
    <div style={{ width: '100vw', position: 'relative', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', backgroundColor: '#f9fafb', paddingBottom: '4rem' }}>
      
      {/* centers all your content perfectly in the middle of the screen */}
      <div className="review-content" style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem 5%' }}>
        
        <div className="flex flex-col items-center justify-center mb-8 gap-4 w-full">
          <h1 className="text-4xl font-bold text-center w-full text-gray-800">Review & Edit Passage</h1>
          <div className="flex flex-row gap-4 items-center justify-center">
            <button
            onClick={() => navigate('/upload')}
            disabled={saving}
            className="btn btn-secondary px-8 py-3 text-lg font-bold shadow-md transition-colors"
            style={{ backgroundColor: '#6b7280', color: 'white', borderRadius: '8px' }}
            >
            ← Return to Uploads
            </button>

          <button 
            onClick={handleSaveAndPublish} 
            disabled={saving}
            className="btn btn-primary px-8 py-3 text-lg shadow-lg font-bold"
            style={{ backgroundColor: '#2563eb', color: 'white', borderRadius: '8px' }}
          >
            {saving ? 'Saving...' : 'Save & Publish to Library'}
          </button>
        </div>
    </div>

        {error && <div className="error-message mb-4 p-4 bg-red-100 text-red-700 rounded text-center font-bold">{error}</div>}

        {/* Document Section */}
        <div className="card mb-10 p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-3xl font-bold mb-6 text-center w-full text-gray-800">Passage Content</h2>
          
          <div className="form-group mb-6">
            <label className="form-label font-bold text-lg mb-2 block">Title</label>
            <input
              type="text"
              className="form-input w-full p-3 border rounded-lg text-lg"
              value={docData.title}
              onChange={(e) => handleDocChange('title', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label font-bold text-lg mb-2 block">Parsed Text</label>
            <textarea
              className="form-input w-full p-4 border rounded-lg text-base"
              rows="20"
              value={docData.parsed_text}
              onChange={(e) => handleDocChange('parsed_text', e.target.value)}
              style={{ fontFamily: 'monospace', lineHeight: '1.6' }}
            />
          </div>
        </div>

        {/* Questions Section */}
        <h2 className="text-3xl font-bold mb-8 mt-8 text-center w-full text-gray-800">Questions & Answers</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {questions.map((q, qIndex) => (
            <div key={q.id} className="card p-6 bg-white rounded-lg shadow-md border-t-4 border-blue-500 flex flex-col">
              
              <div className="form-group mb-6">
                <label className="form-label font-bold text-lg mb-2 block">Question {qIndex + 1}</label>
                <input
                  type="text"
                  className="form-input w-full p-3 border rounded-lg font-semibold"
                  value={q.question_text}
                  onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                />
              </div>

              <div className="answers-grid grid gap-3 mb-6 flex-grow">
                {q.answers.map((a, aIndex) => (
                  // clicking anywhere highlights the answer choice
                  <label 
                    key={a.id} 
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
                    style={
                      a.is_correct 
                        ? { backgroundColor: '#dcfce7', border: '2px solid #22c55e' } // bright Green if selected
                        : { backgroundColor: '#f3f4f6', border: '2px solid transparent' } // light gray if not
                    }
                  >
                    <input
                      type="radio"
                      name={`correct_answer_${q.id}`}
                      checked={a.is_correct === true}
                      onChange={() => handleAnswerChange(qIndex, aIndex, 'is_correct', true)}
                      className="w-6 h-6 cursor-pointer flex-shrink-0"
                    />
                    <span className="font-bold text-lg w-6">{a.choice_letter}.</span>
                    <input
                      type="text"
                      className="form-input flex-1 p-2 border rounded bg-white"
                      value={a.choice_text}
                      onChange={(e) => handleAnswerChange(qIndex, aIndex, 'choice_text', e.target.value)}
                    />
                  </label>
                ))}
              </div>

              <div className="form-group mt-auto pt-4 border-t border-gray-200">
                <label className="form-label font-bold text-gray-700 mb-2 block">Explanation (Optional)</label>
                <textarea
                  className="form-input w-full p-3 border rounded-lg text-base"
                  rows="4"
                  value={q.explanation || ''}
                  onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                  placeholder="Explain why the correct answer is right..."
                />
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewDocument;