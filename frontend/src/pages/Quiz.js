import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI, quizAPI } from '../api';

const Quiz = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [userName, setUserName] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuizData = useCallback(async () => {
    try {
      setLoading(true);
      const [documentRes, questionsRes] = await Promise.all([
        documentsAPI.getById(documentId),
        documentsAPI.getDetail(documentId)
      ]);
      
      setDocument(documentRes.data);
      setQuestions(questionsRes.data.questions || []);
    } catch (err) {
      setError('Failed to load quiz');
      console.error('Error fetching quiz data:', err);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

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
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

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

      const response = await quizAPI.submit({
        document_id: parseInt(documentId),
        user_name: userName,
        answers: answersArray
      });

      // Navigate to results page with quiz data
      navigate('/results', {
        state: {
          quizResult: response.data,
          document: document,
          questions: questions,
          userAnswers: answers
        }
      });

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const getProgressPercentage = () => {
    return (Object.keys(answers).length / questions.length) * 100;
  };

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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/documents/${documentId}`)}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          Back to Passage
        </button>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Quiz: {document?.title}</h1>
        <p className="text-gray-600">Test your comprehension of the reading passage</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-700">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-sm text-gray-500">
            {Object.keys(answers).length} of {questions.length} answered
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* User Name Input */}
      {!userName && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Enter Your Name</h3>
          <input
            type="text"
            placeholder="Your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Question */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Question {currentQuestion + 1}: {currentQ.question_text}
          </h2>
        </div>

        {/* Answer Choices */}
        <div className="space-y-3">
          {currentQ.answers?.map((answer) => (
            <label
              key={answer.id}
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                answers[currentQ.id] === answer.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
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
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  answers[currentQ.id] === answer.id
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {answers[currentQ.id] === answer.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
                <span className="font-medium text-gray-700">
                  {answer.choice_letter}. {answer.choice_text}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        <div className="flex gap-4">
          {currentQuestion < questions.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!answers[currentQ.id]}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next Question
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < questions.length || !userName.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center">
                  Submit Quiz
                </div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Question Navigation */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Question Navigation</h3>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => setCurrentQuestion(index)}
              className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                currentQuestion === index
                  ? 'bg-blue-600 text-white'
                  : answers[question.id]
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Quiz; 