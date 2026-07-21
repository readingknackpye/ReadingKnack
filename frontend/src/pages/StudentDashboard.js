
import React, { useEffect, useState } from 'react';
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
        {test.percentage !== undefined
          ? ` (${test.percentage}%)`
          : ''}
      </td>
      <td>
        {test.submitted_at
          ? new Date(test.submitted_at).toLocaleString()
          : 'N/A'}
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