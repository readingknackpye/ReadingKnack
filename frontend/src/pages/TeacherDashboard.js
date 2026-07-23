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
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [busyAction, setBusyAction] = useState(null); // `${type}-${id}` while a request is in flight

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
      setExpandedId(response.data.id);
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

  const handleCopyCode = async (cls) => {
    try {
      await navigator.clipboard.writeText(cls.join_code);
      setCopiedId(cls.id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleRegenerateCode = async (id) => {
    if (!window.confirm('Generate a new code for this class? The old code will stop working.')) return;

    try {
      setBusyAction(`regen-${id}`);
      const response = await classroomsAPI.regenerateCode(id);
      setClasses(prev => prev.map(c => (c.id === id ? response.data : c)));
    } catch (err) {
      console.error('Error regenerating code:', err);
      setError('Failed to generate a new code. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleRemoveStudent = async (classId, studentId, studentLabel) => {
    if (!window.confirm(`Remove ${studentLabel} from this class?`)) return;

    try {
      setBusyAction(`remove-${studentId}`);
      const response = await classroomsAPI.removeStudent(classId, studentId);
      setClasses(prev => prev.map(c => (c.id === classId ? response.data : c)));
    } catch (err) {
      console.error('Error removing student:', err);
      setError('Failed to remove student. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const totalStudents = classes.reduce((sum, c) => sum + (c.student_count ?? c.students?.length ?? 0), 0);

  return (
    <div className="dashboardContainer">
      <div className="dashboardCard">
        <div className="dashboardHeader">
          <div className="dashboardHeaderText">
            <span className="dashboardEyebrow">Teacher Workspace</span>
            <h1>Your Classes</h1>
            <p className="dashboardSubtitle">Create classes and invite students with a shareable class code.</p>
          </div>

          <div className="dashboardStats">
            <div className="statPill">
              <span className="statValue">{classes.length}</span>
              <span className="statLabel">{classes.length === 1 ? 'Class' : 'Classes'}</span>
            </div>
            <div className="statPill">
              <span className="statValue">{totalStudents}</span>
              <span className="statLabel">{totalStudents === 1 ? 'Student' : 'Students'}</span>
            </div>
          </div>
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
              {creating ? 'Creating...' : '+ Create Class'}
            </button>
          </form>

          {error && <div className="errorMessage">{error}</div>}

          {loading ? (
            <div className="loadingMessage">Loading your classes...</div>
          ) : classes.length === 0 ? (
            <div className="emptyMessage">
              <div className="emptyIcon">📚</div>
              <p>You haven't created any classes yet.</p>
              <span>Start by naming your first class above.</span>
            </div>
          ) : (
            <div className="classList">
              {classes.map(cls => {
                const students = cls.students || [];
                const isExpanded = expandedId === cls.id;

                return (
                  <div className={`classCard ${isExpanded ? 'classCardExpanded' : ''}`} key={cls.id}>
                    <div className="classCardTop">
                      <button
                        type="button"
                        className="classNameToggle"
                        onClick={() => toggleExpanded(cls.id)}
                        aria-expanded={isExpanded}
                      >
                        <span className={`classChevron ${isExpanded ? 'classChevronOpen' : ''}`}>›</span>
                        <span className="className">{cls.name}</span>
                        <span className="rosterBadge">{students.length} {students.length === 1 ? 'student' : 'students'}</span>
                      </button>

                      <div className="classCardActions">
                        <div className="joinCodeChip" title="Share this code with students">
                          <span className="joinCodeLabel">CODE</span>
                          <span className="joinCodeValue">{cls.join_code}</span>
                          <button
                            type="button"
                            className="copyCodeButton"
                            onClick={() => handleCopyCode(cls)}
                          >
                            {copiedId === cls.id ? 'Copied ✓' : 'Copy'}
                          </button>
                        </div>
                        <button
                          className="deleteClassButton"
                          onClick={() => handleDeleteClass(cls.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="classRoster">
                        <div className="classRosterHeader">
                          <span>Invite students by sharing the code above.</span>
                          <button
                            type="button"
                            className="regenerateButton"
                            onClick={() => handleRegenerateCode(cls.id)}
                            disabled={busyAction === `regen-${cls.id}`}
                          >
                            {busyAction === `regen-${cls.id}` ? 'Generating...' : '⟳ New Code'}
                          </button>
                        </div>

                        {students.length === 0 ? (
                          <div className="rosterEmpty">No students have joined yet. Share the code to invite them.</div>
                        ) : (
                          <ul className="rosterList">
                            {students.map(student => {
                              const label = (student.first_name || student.last_name)
                                ? `${student.first_name} ${student.last_name}`.trim()
                                : student.username;

                              return (
                                <li className="rosterItem" key={student.id}>
                                  <span className="rosterAvatar">{label.charAt(0).toUpperCase()}</span>
                                  <div className="rosterInfo">
                                    <span className="rosterName">{label}</span>
                                    <span className="rosterEmail">{student.email || student.username}</span>
                                  </div>
                                  <button
                                    type="button"
                                    className="rosterRemoveButton"
                                    onClick={() => handleRemoveStudent(cls.id, student.id, label)}
                                    disabled={busyAction === `remove-${student.id}`}
                                  >
                                    {busyAction === `remove-${student.id}` ? '...' : 'Remove'}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
