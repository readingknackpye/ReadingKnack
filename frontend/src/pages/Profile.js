import React, { useState } from 'react';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState({
    username: 'Username',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user.username,
  });

  const handleProfileEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setUser({
      ...user,
      username: editForm.username,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      username: user.username,
    });
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="profileContainer">
      <div className="profileCard">
        <div className="profileHeader">
          <h1 className="profileTitle">Profile</h1>
          {!isEditing && (
            <button className="editButton" onClick={handleProfileEdit}>
              Edit Profile
            </button>
          )}
        </div>

        <div className="profileContent">
          {/* Username Section */}
          <div className="usernameSection">
            <label className="fieldLabel">Username</label>
            {isEditing ? (
              <input
                type="text"
                name="username"
                value={editForm.username}
                onChange={handleInputChange}
                className="editInput"
                placeholder="Enter username"
              />
            ) : (
              <div className="usernameDisplay">{user.username}</div>
            )}
          </div>

          {/* Buttons */}
          {isEditing && (
            <div className="actionButtons">
              <button className="saveButton" onClick={handleSave}>
                Save Changes
              </button>
              <button className="cancelButton" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
