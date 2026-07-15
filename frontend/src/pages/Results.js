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
        <button onClick={() => navigate('/')}>Back Home</button>
      </div>
    );
  }

  return (
    // this is the page it takes you to after you finish the quiz, shows your score
    <div className="results-container">
      <h2>Quiz Results</h2>
      <p className="score">
        You scored {quizResult.score} / {quizResult.total_questions} (
        {quizResult.percentage}%)
      </p>
      {document?.title && <h3>{document.title}</h3>}
      <button onClick={() => navigate('/documents')}>
        Back to Passage
      </button>
    </div>
  );
};

export default Results;