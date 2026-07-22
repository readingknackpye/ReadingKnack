import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI, quizAPI, authAPI } from '../api';
import './Quiz.css';

const Quiz = () => {
  // Toggle this to switch between mock and real data
  const USE_MOCK_DATA = false; // Set to false when ready for backend

  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [fontSize, setFontSize] = useState(1.1);
  const [currentUser, setCurrentUser] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [eliminatedAnswers, setEliminatedAnswers] = useState({});

  // Mock data functions
  const getMockDocument = () => {
    return Promise.resolve({
      data: {
        id: 1,
        title: "The Solar System",
        content: `A passage about planets, stars, and space...`
      }
    });
  };

  // simple timer
  useEffect(() => {
    let timer;
    if(!loading && !submitted){
      timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [loading, submitted]);

  // format timer into MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // only warn if they have started answering but haven't submitted
      if (Object.keys(answers).length > 0 && !submitted) {
        e.preventDefault();
        e.returnValue = ''; // required for Chrome
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [answers, submitted]);

  // autosave to LocalStorage
  useEffect(() => {
    if (!loading && !submitted && (Object.keys(answers).length > 0 || timeElapsed > 0)) {
      const progress = {
        answers,
        eliminatedAnswers,
        timeElapsed,
        currentQuestion
      };
      localStorage.setItem(`quiz_progress_${documentId}`, JSON.stringify(progress));
    }
  }, [answers, eliminatedAnswers, timeElapsed, currentQuestion, loading, submitted, documentId]);

  // clear autosave on submit
  const clearAutosave = () => {
    localStorage.removeItem(`quiz_progress_${documentId}`);
  };

  const getMockQuestions = () => {
    return Promise.resolve({
      data: {
        questions: [
          {
            id: 1,
            question_text: "How many planets are in our solar system?",
            answers: [
              { id: 1, choice_letter: "A", choice_text: "7 planets" },
              { id: 2, choice_letter: "B", choice_text: "8 planets" },
              { id: 3, choice_letter: "C", choice_text: "9 planets" },
              { id: 4, choice_letter: "D", choice_text: "10 planets" }
            ]
          },
          // ... keeping it brief for the snippet, you can paste your other mock questions here if needed
        ]
      }
    });
  };

  const fetchQuizData = useCallback(async () => {
    try {
      setLoading(true);

      let documentRes, questionsRes;

      if (USE_MOCK_DATA) {
        // Use mock data
        [documentRes, questionsRes] = await Promise.all([
          getMockDocument(),
          getMockQuestions()
        ]);
      } else {
        // use real API calls to fetch document, questions, and current user concurrently
        const [detailRes, userRes] = await Promise.all([
          documentsAPI.getDetail(documentId),
          authAPI.me().catch(() => ({ data: { user: null } })) // catch error just in case user isn't logged in
        ]);
        documentRes = { data: detailRes.data };
        questionsRes = { data: { questions: detailRes.data.questions || [] } };
        setCurrentUser(userRes.data.user);
      }

      setDocument(documentRes.data);
      setQuestions(questionsRes.data.questions || []);

      const savedProgress = localStorage.getItem(`quiz_progress_${documentId}`);
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          setAnswers(parsed.answers || {});
          setEliminatedAnswers(parsed.eliminatedAnswers || {});
          setTimeElapsed(parsed.timeElapsed || 0);
          setCurrentQuestion(parsed.currentQuestion || 0);
        } catch (e) {
          console.error("Failed to load saved progress");
        }
      }

    } catch (err) {
      setError('Failed to load quiz');
      console.error('Error fetching quiz data:', err);
    } finally {
      setLoading(false);
    }
  }, [documentId, USE_MOCK_DATA]);

  useEffect(() => {
    fetchQuizData();
  }, [fetchQuizData]);

  const handleAnswerSelect = (questionId, answerId) => {
    // if the answer is already eliminated, don't allow selecting it
    const questionElims = eliminatedAnswers[questionId] || [];
    if (questionElims.includes(answerId)) return;

    setAnswers(prev => {
      // if clicking the currently selected answer, unselect it (clear it)
      if (prev[questionId] === answerId) {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        return newAnswers;
      }
      // otherwise select the new answer
      return {
        ...prev,
        [questionId]: answerId
      };
    });
  };

  const toggleEliminate = (e, questionId, answerId) => {
    e.preventDefault();
    
    // toggle the elimination state
    setEliminatedAnswers(prev => {
      const questionElims = prev[questionId] || [];
      if(questionElims.includes(answerId)){
        return {...prev, [questionId]: questionElims.filter(id => id !== answerId)};
      } else {
        return {...prev, [questionId]: [...questionElims, answerId]};
      }
    });

    // if the answer being eliminated is currently selected, unselect it
    setAnswers(prev => {
      if (prev[questionId] === answerId) {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        return newAnswers;
      }
      return prev;
    });
  };

  // the highlighter function
  const handleTextHighlight = () => {
    const selection = window.getSelection();
    // ensure text is actually selected and it has length
    if (!selection.isCollapsed && selection.rangeCount > 0 && selection.toString().trim() !== "") {
      const range = selection.getRangeAt(0);
      
      const passageNode = window.document.getElementById('passage-text-container');
      
      if (passageNode && passageNode.contains(range.commonAncestorContainer)) {
        try {
          const span = window.document.createElement('mark'); 
          // add a nice blue background with rounded corners
          span.style.backgroundColor = '#d0e86f'; 
          span.style.color = 'inherit';
          span.style.borderRadius = '2px';
          span.style.padding = '0 2px';
          
          range.surroundContents(span);
          selection.removeAllRanges(); // deselect the text so it looks clean instantly
        } catch (e) {
          // if the selection crosses complex HTML boundaries, surroundContents can fail
          // we silently catch this to prevent crashes
          console.warn("Could not highlight across paragraph boundaries.");
        }
      }
    }
  };

  const handleSubmit = async () => {
    const unansweredQuestions = questions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      setError(`Please answer all questions. You have ${unansweredQuestions.length} unanswered question(s).`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const answersArray = Object.entries(answers).map(([questionId, answerId]) => ({
        question_id: parseInt(questionId),
        selected_answer_id: parseInt(answerId)
      }));

      let response;

      if (USE_MOCK_DATA) {
        // Mock submission with correct answers for scoring
        const correctAnswers = {
          1: 2, // 8 planets
          2: 6, // Mercury
          3: 10, // Jupiter
          4: 15, // Mars
          5: 18 // Gravity
        };

        let score = 0;
        Object.entries(answers).forEach(([questionId, answerId]) => {
          if (correctAnswers[parseInt(questionId)] === parseInt(answerId)) {
            score++;
          }
        });

        response = await new Promise(resolve => {
          setTimeout(() => {
            resolve({
              data: {
                score: score,
                total: questions.length,
              }
            });
          }, 1000);
        });

        // clear local storage because they finished
        clearAutosave();
        
        // for mock data show completion screen
        setSubmitted(true);

      } else {
        // Real API submission
        response = await quizAPI.submit({
          document_id: parseInt(documentId),
          user_name: 'Anonymous', // You can add a username input field later
          time_spent: timeElapsed,
          answers: answersArray
        });

        // clear local storage because they finished
        clearAutosave();

        // navigate to results page with quiz data
        navigate('/results', {
          state: {
            quizResult: response.data,
            document: document,
            questions: questions,
            userAnswers: answers
          }
        });
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setEliminatedAnswers({});
    setCurrentQuestion(0);
    setSubmitted(false);
    setError(null);
    clearAutosave(); // clear storage on manual reset
  };

  // show completion screen for mock data
  if (submitted && USE_MOCK_DATA) {
    const correctAnswers = {
      1: 2, 2: 6, 3: 10, 4: 15, 5: 18
    };

    let score = 0;
    Object.entries(answers).forEach(([questionId, answerId]) => {
      if (correctAnswers[parseInt(questionId)] === parseInt(answerId)) {
        score++;
      }
    });

    return (
      <div className="quiz-container">
        <div className="text-center py-12">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Quiz Completed!</h2>
          <p className="text-gray-600 mb-4">
            Great job! Your quiz has been submitted successfully.
          </p>
          <div className="text-2xl font-bold text-blue-600 mb-6">
            Your Score: {score}/{questions.length} ({Math.round((score / questions.length) * 100)}%)
          </div>
          <div className="space-y-4">
            <button
              onClick={handleReset}
              className="submit-button mr-4"
            >
              Take Quiz Again
            </button>
            <button
              onClick={() => navigate(`/documents/${documentId || ''}`)}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Document
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="quiz-container">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="quiz-container">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={fetchQuizData}
            className="submit-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="quiz-container">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Quiz Available</h2>
          <p className="text-gray-600 mb-6">
            This passage doesn't have any quiz questions yet.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              onClick={() => navigate(`/documents/`)}
              className="submit-button"
              style={{ width: 'auto', margin: 0, background: '#6b7280' }} 
            >
              ← Back to Documents
            </button>
            
            {/* ADMIN ONLY: Redirect to the Review page to add questions */}
            {currentUser?.is_staff && (
              <button
                onClick={() => navigate(`/review/${documentId}`)}
                className="submit-button"
                style={{ width: 'auto', margin: 0 }}
              >
                + Add Questions
              </button>
            )}
          </div>
          
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const passageText = document?.parsed_text || document?.content || document?.text || '';

  return (
    <div className="quiz-container">

      {/* Main Content - Two Column Layout */}
      <div className="quiz-layout">
        {/* Left Column - Passage */}
        <div className="passage-section">
          <div style = {{display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem'}}>
            <h2 className = "passage-title" style = {{marginBottom: 0}}>
              {document?.title || "Passage Title"}
            </h2>

            <div style={{display: 'flex', gap: '8px'}}>
              <button
              onClick={() => setFontSize(prev => Math.max(prev - 0.1, 0.8))}
              title="Decrease Size"
              style={{ 
                  color: '#333', 
                  padding: '4px 12px', 
                  background: '#88abf0', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '4px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}
              >
                A-
              </button>
              <button
              onClick={() => setFontSize(prev => Math.min(prev + 0.1, 2.0))}
              title="Increase Size"
              style={{ 
                  color: '#333', 
                  padding: '4px 12px', 
                  background: '#e79bde', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '4px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: '1.1rem' 
                }}
              >
                A+
              </button>
            </div>
          </div>
          
          {/*Attached the ID, cursor style, and onMouseUp event here */}
          <div
          id="passage-text-container"
          className="passage-box"
          onMouseUp={handleTextHighlight}
          style={{ fontSize: `${fontSize}rem`, transition: 'font-size 0.2s ease', cursor: 'text' }}
          >
            {passageText || "Passage"}
          </div>

        </div>

        {/* Right Column - Questions */}
        <div className="questions-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="questions-title" style={{ margin: 0 }}>Comprehension Questions</h2>
            <div style={{ fontWeight: 'bold', color: '#666', background: '#f3f4f6', padding: '4px 12px', borderRadius: '16px' }}>
              ⏱ {formatTime(timeElapsed)}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '2rem', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--rk-pink), var(--rk-purple))',
              width: `${(Object.keys(answers).length / questions.length) * 100}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div className="question-item">
            <div className="question-number">
              {currentQuestion + 1}. {currentQ.question_text}
            </div>

            <div className="answer-options">
              {currentQ.answers?.map((answer) => {
                const isEliminated = (eliminatedAnswers[currentQ.id] || []).includes(answer.id);
                const isSelected = answers[currentQ.id] === answer.id;
                  
                return (
                  <div key={answer.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* The Cross-out toggle button */}
                    <button 
                      onClick={(e) => toggleEliminate(e, currentQ.id, answer.id)}
                      style={{ 
                        background: 'none', border: 'none', cursor: 'pointer', 
                        fontSize: '1.2rem', opacity: isEliminated ? 1 : 0.3,
                        padding: '4px'
                      }}
                      title="Cross out this answer"
                    >
                      🚫
                    </button>

                    <label
                      className={`answer-option ${isSelected ? 'selected' : ''}`}
                      style={{ 
                        flex: 1, 
                        opacity: isEliminated ? 0.5 : 1,
                        textDecoration: isEliminated ? 'line-through' : 'none' 
                      }}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQ.id}`}
                        value={answer.id}
                        checked={isSelected}
                        onChange={() => {
                          // don't allow selecting an eliminated answer
                          if (!isEliminated) handleAnswerSelect(currentQ.id, answer.id)
                        }}
                        className="sr-only"
                      />
                      <div className="answer-letter">{answer.choice_letter}</div>
                      <div className="answer-text">{answer.choice_text}</div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div> 

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', gap: '1rem' }}>
            <button
              onClick={() => setCurrentQuestion(prev => prev - 1)}
              disabled={currentQuestion === 0 || submitting}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              style={{ opacity: currentQuestion === 0 ? 0.3 : 1, cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer', flex: 1 }}
            >
              Previous Question
            </button>

            <button
              onClick={() => {
                if (currentQuestion < questions.length - 1) {
                  setCurrentQuestion(prev => prev + 1);
                } else {
                  handleSubmit();
                }
              }}
              disabled={!answers[currentQ.id] || submitting}
              className="submit-button"
              style={{ opacity: (!answers[currentQ.id] || submitting) ? 0.5 : 1, cursor: (!answers[currentQ.id] || submitting) ? 'not-allowed' : 'pointer', flex: 1, margin: 0 }}
            >
              {submitting ? 'Submitting...' : currentQuestion < questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default Quiz;