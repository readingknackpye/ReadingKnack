import React, { useEffect, useState, useMemo } from 'react';
import { quizAPI, classroomsAPI } from '../api';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [testHistory, setTestHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinResult, setJoinResult] = useState(null); // { type: 'success' | 'error', message }

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

  const handleJoinClass = async (e) => {
    e.preventDefault();
    const code = joinCode.trim();
    if (!code) return;

    try {
      setJoining(true);
      setJoinResult(null);
      const response = await classroomsAPI.join(code);
      setJoinResult({ type: 'success', message: `You've joined ${response.data.name}! Your teacher can now see your progress.` });
      setJoinCode('');
    } catch (err) {
      console.error('Join class error:', err);
      const message = err.response?.data?.detail || 'Could not join that class. Double-check the code and try again.';
      setJoinResult({ type: 'error', message });
    } finally {
      setJoining(false);
    }
  };

  // automatically calculate stats whenever testHistory changes
  const stats = useMemo(() => {
    if (!testHistory || testHistory.length === 0) return null;

    let totalPercentage = 0;
    let totalSeconds = 0;
    const skillStats = {};

    testHistory.forEach(test => {
      // average score
      totalPercentage += (test.percentage || 0);

      // total duration in a quiz in MM:SS format
      if (test.duration && typeof test.duration === 'string') {
        const [mins, secs] = test.duration.split(':').map(Number);
        if (!isNaN(mins) && !isNaN(secs)) {
          totalSeconds += (mins * 60) + secs;
        }
      }

      // identify what makes a weak skill
      const skill = test.skill || 'Uncategorized';
      if (!skillStats[skill]) {
        skillStats[skill] = { totalPct: 0, count: 0 };
      }
      skillStats[skill].totalPct += (test.percentage || 0);
      skillStats[skill].count += 1;
    });

    const avgScore = Math.round(totalPercentage / testHistory.length);
    const totalMins = Math.floor(totalSeconds / 60);
    const formattedTotalTime = `${totalMins}m ${totalSeconds % 60}s`;

    // find what the weakest skill is
    let weakestSkill = 'N/A';
    let lowestAvg = 100;
    
    Object.keys(skillStats).forEach(skill => {
      // ignore uncategorized if there are actual skills to measure
      if (skill === 'Uncategorized' && Object.keys(skillStats).length > 1) return;
      
      const avg = skillStats[skill].totalPct / skillStats[skill].count;
      if (avg <= lowestAvg) {
        lowestAvg = avg;
        weakestSkill = skill;
      }
    });

    return {
      totalTests: testHistory.length,
      avgScore,
      formattedTotalTime,
      weakestSkill: { name: weakestSkill, avg: Math.round(lowestAvg) }
    };
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

      {/* Join a Class Section */}
      <section className="join-class-card">
        <div className="join-class-text">
          <h2>Join a Class</h2>
          <p>Enter the code your teacher shared with you to join their class.</p>
        </div>
        <form className="join-class-form" onSubmit={handleJoinClass}>
          <input
            type="text"
            placeholder="e.g. 7F3K9X"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="join-class-input"
            required
          />
          <button type="submit" className="join-class-button" disabled={joining}>
            {joining ? 'Joining...' : 'Join Class'}
          </button>
        </form>
        {joinResult && (
          <div className={`join-class-result join-class-result-${joinResult.type}`}>
            {joinResult.message}
          </div>
        )}
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
                  <th>Test Name</th>
                  <th>Grade Level</th>
                  <th>Skill</th>
                  <th>Time Spent</th>
                  <th>Score</th>
                  <th>Completed At</th>
                </tr>
              </thead>
              <tbody>
                {testHistory.map((test) => (
                  <tr key={test.id}>
                    <td>{test.test_name || 'N/A'}</td>
                    <td>{test.grade_level || 'N/A'}</td>
                    <td>{test.skill || 'N/A'}</td>
                    <td>{test.duration || 'N/A'}</td>
                    <td>
                      {test.score ?? 'N/A'} / {test.total_questions ?? 'N/A'}
                      {test.percentage !== undefined ? ` (${test.percentage}%)` : ''}
                    </td>
                    <td>
                      {test.submitted_at ? new Date(test.submitted_at).toLocaleString() : 'N/A'}
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