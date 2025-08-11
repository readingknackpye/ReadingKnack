import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI, quizAPI } from '../api';

const Quiz = () => {
  // Toggle this to switch between mock and real data
  const USE_MOCK_DATA = true; // Set to false when ready for backend

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

  // Mock data functions
  const getMockDocument = () => {
    return Promise.resolve({
      data: {
        id: 1,
        title: "The Solar System",
        content: "A passage about planets, stars, and space..."
      }
    });
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
          {
            id: 2,
            question_text: "Which planet is closest to the Sun?",
            answers: [
              { id: 5, choice_letter: "A", choice_text: "Venus" },
              { id: 6, choice_letter: "B", choice_text: "Mercury" },
              { id: 7, choice_letter: "C", choice_text: "Earth" },
              { id: 8, choice_letter: "D", choice_text: "Mars" }
            ]
          },
          {
            id: 3,
            question_text: "What is the largest planet in our solar system?",
            answers: [
              { id: 9, choice_letter: "A", choice_text: "Saturn" },
              { id: 10, choice_letter: "B", choice_text: "Jupiter" },
              { id: 11, choice_letter: "C", choice_text: "Neptune" },
              { id: 12, choice_letter: "D", choice_text: "Uranus" }
            ]
          },
          {
            id: 4,
            question_text: "Which planet is known as the 'Red Planet'?",
            answers: [
              { id: 13, choice_letter: "A", choice_text: "Venus" },
              { id: 14, choice_letter: "B", choice_text: "Jupiter" },
              { id: 15, choice_letter: "C", choice_text: "Mars" },
              { id: 16, choice_letter: "D", choice_text: "Saturn" }
            ]
          },
          {
            id: 5,
            question_text: "What force keeps planets in orbit around the Sun?",
            answers: [
              { id: 17, choice_letter: "A", choice_text: "Magnetism" },
              { id: 18, choice_letter: "B", choice_text: "Gravity" },
              { id: 19, choice_letter: "C", choice_text: "Centrifugal force" },
              { id: 20, choice_letter: "D", choice_text: "Solar wind" }
            ]
          }
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
        // Use real API calls
        [documentRes, questionsRes] = await Promise.all([
          documentsAPI.getById(documentId),
          documentsAPI.getDetail(documentId)
        ]);
      }
      
      setDocument(documentRes.data);
      setQuestions(questionsRes.data.questions || []);
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
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
  //   if (!userName.trim()) {
  //     setError('Please enter your name');
  //     return;
  //   }

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
          5: 18  // Gravity
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
                // user_name: userName
              }
            });
          }, 1000);
        });
        
        // For mock data, show completion screen
        setSubmitted(true);
        
      } else {
        // Real API submission
        response = await quizAPI.submit({
          document_id: parseInt(documentId),
          // user_name: userName,
          answers: answersArray
        });

        // Navigate to results page with quiz data (when backend is ready)
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
    // setUserName('');
    setCurrentQuestion(0);
    setSubmitted(false);
    setError(null);
  };

  const getProgressPercentage = () => {
    return (Object.keys(answers).length / questions.length) * 100;
  };

  // Show completion screen for mock data
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
      <div className="max-w-4xl mx-auto text-center py-12 px-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Quiz Completed!</h2>
          <p className="text-gray-600 mb-4">
            Great job! Your quiz has been submitted successfully.
          </p>
          <div className="text-2xl font-bold text-blue-600 mb-6">
            Your Score: {score}/{questions.length} ({Math.round((score/questions.length) * 100)}%)
          </div>
          <div className="space-y-4">
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-4 transition-colors"
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchQuizData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Quiz Available</h2>
        <p className="text-gray-600 mb-6">
          This passage doesn't have any quiz questions yet.
        </p>
        <button
          onClick={() => navigate(`/documents/${documentId}`)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Passage
        </button>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Development Mode Indicator */}
      {USE_MOCK_DATA && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p className="text-yellow-800 text-sm font-medium">
            🚧 Development Mode: Using mock data
          </p>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/documents/${documentId}`)}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
        >
          ← Back to Passage
        </button>
        
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Quiz: {document?.title}</h1>
        <p className="text-lg text-gray-600">Test your comprehension of the reading passage</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-700">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-sm text-gray-500">
            {Object.keys(answers).length} of {questions.length} answered
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* User Name Input
      {!userName && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">👋 Before we start, what's your name?</h3>
          <input
            type="text"
            placeholder="Enter your name here..."
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
            onKeyPress={(e) => e.key === 'Enter' && userName.trim() && setUserName(userName)}
          />
        </div>
      )} */}

      {/* Question Navigation */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 Question Navigation</h3>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
          {questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => setCurrentQuestion(index)}
              className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md ${
                currentQuestion === index
                  ? 'bg-blue-600 text-white shadow-md'
                  : answers[question.id]
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

      {/* Question */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
              Question {currentQuestion + 1}
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 leading-relaxed">
            {currentQ.question_text}
          </h2>
        </div>

        {/* Answer Choices */}
        <div className="space-y-4">
          {currentQ.answers?.map((answer) => (
            <label
              key={answer.id}
              className={`flex items-center p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                answers[currentQ.id] === answer.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <input
                type="radio"
                name={`question-${currentQ.id}`}
                value={answer.id}
                checked={answers[currentQ.id] === answer.id}
                onChange={() => handleAnswerSelect(currentQ.id, answer.id)}
                className="sr-only"
              />
              <div className="flex items-center w-full">
                <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 ${
                  answers[currentQ.id] === answer.id
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {answers[currentQ.id] === answer.id && (
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="font-medium text-gray-700 text-lg">
                  <span className="font-bold text-blue-600 mr-3">{answer.choice_letter}.</span>
                  {answer.choice_text}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <p className="text-red-700 font-medium">⚠️ {error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          ← Previous
        </button>

        <div className="flex gap-4">
          {currentQuestion < questions.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!answers[currentQ.id]}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Next Question →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < questions.length}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center">
                  🎯 Submit Quiz
                </div>
              )}
            </button>
          )}
        </div>
      </div>


        
        <div className="mt-4 flex items-center text-sm text-gray-600 space-x-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
            Current
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-200 rounded mr-2"></div>
            Answered
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 border-2 border-gray-200 rounded mr-2"></div>
            Unanswered
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;