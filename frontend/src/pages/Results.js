import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Results.css';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { quizResult, document, questions, userAnswers } = location.state || {};

  if (!quizResult || !questions) {
    return (
      <div className="results-container">
        <div className="results-card">
          <div className="results-empty">
            <h2>No quiz results to show</h2>
            <p>Take a quiz first to see your results here.</p>
            <button className="results-button" onClick={() => navigate('/documents')}>
              Browse Documents
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { score, total_questions: totalQuestions, percentage } = quizResult;

  return (
    <div className="results-container">
      <div className="results-card">
        <h1 className="results-title">Quiz Results</h1>
        <div className="results-score">
          You scored {score} / {totalQuestions} ({percentage}%)
        </div>
        {document?.title && <div className="results-subtitle">{document.title}</div>}

        <hr className="results-divider" />

        {questions.map((question, index) => {
          const selectedAnswerId = userAnswers?.[question.id];
          const selectedAnswer = question.answers?.find(
            (answer) => String(answer.id) === String(selectedAnswerId)
          );
          const correctAnswer = question.answers?.find((answer) => answer.is_correct);
          const isCorrect = Boolean(selectedAnswer?.is_correct);

          return (
            <div
              key={question.id}
              className={`result-question ${isCorrect ? 'result-correct' : 'result-incorrect'}`}
            >
              <div className="result-question-text">
                {index + 1}. {question.question_text}
              </div>

              <div className="result-answer-line">
                Your answer:{' '}
                {selectedAnswer
                  ? `${selectedAnswer.choice_letter}. ${selectedAnswer.choice_text}`
                  : 'No answer'}
                <span className="result-icon">{isCorrect ? '✅' : '❌'}</span>
              </div>

              {!isCorrect && correctAnswer && (
                <div className="result-correct-line">
                  Correct Answer: {correctAnswer.choice_letter}. {correctAnswer.choice_text}
                </div>
              )}

              {question.explanation && (
                <div className="result-explanation">
                  <strong>Explanation:</strong> {question.explanation}
                </div>
              )}
            </div>
          );
        })}

        <button className="results-button" onClick={() => navigate('/documents')}>
          Back to Documents
        </button>
      </div>
    </div>
  );
};

export default Results;
