import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Results.css';

const Results = () => {
  const location = useLocation();
  // allows you to navigate through the app
  const navigate = useNavigate();
  // state that is passed from quiz page to results page
  const { quizResult, document, questions, userAnswers } = location.state || {};

  if (!quizResult) {
    // if the user gets to the page without finishing quiz, it shows this page and return home
    return (
      <div className="results-container">
        <h2>No quiz results to show</h2>
        <p>Looks like you got here without finishing a quiz.</p>
        <button className = "submit-button"onClick={() => navigate('/')}>Back Home</button>
      </div>
    );
  }

  return (
    // this is the page it takes you to after you finish the quiz, shows your score
    <div className="results-container">
      <div className="results-header">
        <h2>Quiz Results</h2>
        <p className="score">
          You scored {quizResult.score} / {quizResult.total_questions} ({quizResult.percentage}%)
        </p>
        {document?.title && <h3 className="document-title">{document.title}</h3>}
      </div>

      <div className = "review-section">
        {questions.map((question, index) => {
          const selectedAnswerId = userAnswers[question.id];
          const selectedAnswer = question.answers.find(a => a.id === selectedAnswerId);
          const correctAnswer = question.answers.find(a => a.is_correct)
          const isCorrect = selectedAnswer?.is_correct;

          return (
            <div key={question.id} className={`review-card ${isCorrect ? 'correct-card' : 'incorrect-card'}`}>
              <h4 className="question-text">{index + 1}. {question.question_text}</h4>

              <div className="answers-comparison">
                <div className="user-answer" style={{ marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Your answer:</strong> {selectedAnswer ? `${selectedAnswer.choice_letter}.` : "None"}
                  </div>
                  {selectedAnswer && (
                    <div style={{ marginLeft: '8px' }}>
                      {selectedAnswer.choice_text} {isCorrect ? "✅" : "❌"}
                    </div>
                  )}
                </div>

                {/* only show the correct answer line if they got it wrong */}
                {!isCorrect && correctAnswer && (
                  <div className="correct-answer">
                    <div style={{ marginBottom: '4px' }}>
                      <strong>Correct Answer:</strong> {correctAnswer.choice_letter}.
                    </div>
                    <div style={{ marginLeft: '8px' }}>
                      {correctAnswer.choice_text}
                    </div>
                  </div>
                )}
              </div>

              {/* display the explanation from the parser */}
              {question.explanation && (
                <div className="explanation-box">
                  <strong>Explanation: </strong> {question.explanation}
                  </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="submit-button" onClick={() => navigate(`/documents`)}>
        Back to Documents
      </button>
    </div>
  );
};

export default Results;
