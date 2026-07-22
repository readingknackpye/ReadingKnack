import React, { useEffect, useState, useMemo } from 'react';
import { quizAPI } from '../api';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [testHistory, setTestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await quizAPI.getStudentDashboard();
        setTestHistory(response.data || []);
      } catch (err) {
        console.error('Dashboard error:', err);

        if (err.response?.status === 401) {
          setError('Please log in to view your dashboard.');
        } else {
          setError('Dashboard data could not be loaded.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) {
    return 'N/A';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds} sec`;
  }

  return `${minutes} min ${remainingSeconds} sec`;
};

const formatDate = (dateValue) => {
  if (!dateValue) {
    return 'N/A';
  }

  return new Date(dateValue).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getScoreClass = (percentage) => {
  const numericScore = Number(percentage || 0);

  if (numericScore >= 80) {
    return 'score-high';
  }

  if (numericScore >= 60) {
    return 'score-medium';
  }

  return 'score-low';
};

const stats = useMemo(() => {
  if (!testHistory || testHistory.length === 0) {
    return null;
  }

  const totalTests = testHistory.length;

  const avgScore = Math.round(
    testHistory.reduce((sum, t) => sum + (t.percentage || 0), 0) / totalTests
  );

  const totalSeconds = testHistory.reduce(
    (sum, t) => sum + (t.duration_seconds || 0),
    0
  );
  const formattedTotalTime = formatDuration(totalSeconds);

  // group by skill, average percentage per skill, find the lowest
  const skillTotals = {};
  testHistory.forEach((t) => {
    const skill = t.skill || 'N/A';
    if (!skillTotals[skill]) {
      skillTotals[skill] = { sum: 0, count: 0 };
    }
    skillTotals[skill].sum += t.percentage || 0;
    skillTotals[skill].count += 1;
  });

  let weakestSkill = { name: 'N/A', avg: 0 };
  Object.entries(skillTotals).forEach(([name, { sum, count }]) => {
    const avg = Math.round(sum / count);
    if (weakestSkill.name === 'N/A' || avg < weakestSkill.avg) {
      weakestSkill = { name, avg };
    }
  });

  return { totalTests, avgScore, formattedTotalTime, weakestSkill };
}, [testHistory]);

  if (loading) {
    return (
      <main className="student-dashboard">
        <div className="dashboard-empty">
          Loading dashboard...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="student-dashboard">
        <div className="dashboard-empty">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="student-dashboard">
      <section className="student-dashboard-header">
        <h1>Student Dashboard</h1>
        <p>View your previous tests and performance.</p>
      </section>

      {/* Stat Card Section */}
      {stats && (
        <section className="dashboard-stats">
          <div className="stat-card">
            <h3>Tests Completed</h3>
            <p className="stat-value">{stats.totalTests}</p>
          </div>
          
          <div className="stat-card">
            <h3>Average Score</h3>
            <p className="stat-value">{stats.avgScore}%</p>
          </div>
          
          <div className="stat-card">
            <h3>Total Reading Time</h3>
            <p className="stat-value">{stats.formattedTotalTime}</p>
          </div>

          <div className="stat-card weak-skill-card">
            <h3>Focus Area</h3>
            <p className="stat-value skill-name">{stats.weakestSkill.name}</p>
            <div className="skill-bar-bg">
              {/* The progress bar width matches their average score in this skill */}
              <div 
                className="skill-bar-fill" 
                style={{ width: `${stats.weakestSkill.avg}%` }}
              ></div>
            </div>
            <p className="skill-subtext">{stats.weakestSkill.avg}% Average</p>
          </div>
        </section>
      )}

      <section className="student-dashboard-content">
        <h2>Previous Tests</h2>

        {testHistory.length === 0 ? (
          <div className="dashboard-empty">
            You have not completed any tests yet.
          </div>
        ) : (
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
  <tr>
    <th>📚 Test</th>
    <th>🎓 Grade Level</th>
    <th>⭐ Skill</th>
    <th>⏱️ Time</th>
    <th>🏆 Score</th>
    <th>📅 Date</th>
  </tr>
</thead>

  

              <tbody>
  {testHistory.map((test) => (
    <tr key={test.id}>
      <td>
        <div className="test-name-cell">
          <span className="test-icon">📘</span>

          <div>
            <strong>{test.test_name || 'N/A'}</strong>
            <small>Reading Quiz</small>
          </div>
        </div>
      </td>

      <td>
        <span className="dashboard-badge grade-badge">
          🎓 {test.grade_level || 'N/A'}
        </span>
      </td>

      <td>
        <span className="dashboard-badge skill-badge">
          ⭐ {test.skill || 'N/A'}
        </span>
      </td>

      <td>
        <span className="dashboard-badge time-badge">
          ⏱️ {formatDuration(test.duration_seconds)}
        </span>
      </td>

      <td>
        <span
          className={`score-badge ${getScoreClass(
            test.percentage
          )}`}
        >
          {test.score ?? 'N/A'} / {test.total_questions ?? 'N/A'}
          {test.percentage !== undefined
            ? ` • ${test.percentage}%`
            : ''}
        </span>
      </td>

      <td>
        <span className="dashboard-badge date-badge">
          📅 {formatDate(test.submitted_at)}
        </span>
      </td>
    </tr>
  ))}
</tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
};

export default StudentDashboard;