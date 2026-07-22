import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classroomsAPI } from '../api';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newClassName, setNewClassName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : null;

    if (!user || user.role !== 'teacher') {
      navigate('/');
      return;
    }

    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await classroomsAPI.getAll();
      setClasses(response.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load your classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      setCreating(true);
      setError(null);
      const response = await classroomsAPI.create({ name: newClassName.trim() });
      setClasses(prev => [response.data, ...prev]);
      setNewClassName('');
    } catch (err) {
      console.error('Error creating class:', err);
      setError('Failed to create class. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Delete this class? This cannot be undone.')) return;

    try {
      await classroomsAPI.delete(id);
      setClasses(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Error deleting class:', err);
      setError('Failed to delete class. Please try again.');
    }
  };

  return (
    <div className="dashboardContainer">
      <div className="dashboardCard">
        <div className="dashboardHeader">
          <h1>Teacher Dashboard</h1>
        </div>

        <div className="dashboardContent">
          <form className="createClassForm" onSubmit={handleCreateClass}>
            <input
              type="text"
              placeholder="New class name (e.g. Period 3 - Reading)"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="editInput"
              required
            />
            <button className="createClassButton" type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Class'}
            </button>
          </form>

          {error && <div className="errorMessage">{error}</div>}

          {loading ? (
            <div className="loadingMessage">Loading your classes...</div>
          ) : classes.length === 0 ? (
            <div className="emptyMessage">You haven't created any classes yet.</div>
          ) : (
            <div className="classList">
              {classes.map(cls => (
                <div className="classCard" key={cls.id}>
                  <span className="className">{cls.name}</span>
                  <button
                    className="deleteClassButton"
                    onClick={() => handleDeleteClass(cls.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
