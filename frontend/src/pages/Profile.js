import React, { useState} from 'react';
import './Profile.css'

const Profile = () => {
    const [user, setUser] = useState({
        username : 'Username',
        bio: "Tell us about yourself",
        avatar: 'Placeholder'
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        username: user.username,
        bio: user.bio
    });

    const handleProfileEdit = (e) => {
        setIsEditing(true);
    };

    const handleSave = () => {
        setUser({
            ...user, 
            username: editForm.username,
            bio: editForm.bio
        });
        setIsEditing(false);
    }

    const handleCancel = () => {
        setEditForm ({
            username: user.username,
            bio: user.bio
        });
        setIsEditing(false);
    };

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setEditForm(prev => ({
            ...prev,
            [name] : value
        }));
    };

    return (
        <div className = 'profileContainer'> 
            <div className = "profileCard"> 
                <div className = "profileHeader">
                    <h1 className = 'profileTitle'>Profile</h1>
                    {!isEditing && (
                        <button className = "editButton"
                        onClick = {handleProfileEdit}>
                        Edit Profile
                        </button>
                    )}
                    </div>

                    <div className = "profileContent">
                        {/* Avatar Section */}
                        <div className = "avatarSection">
                            <div className = "avatarContainer">
                                <img 
                                    src = {user.avatar}
                                    alt = "User Avatar"
                                    className = "userAvatar"
                            />
                                <div className = "avatarOverlay">
                                    <span className = "avatarEditIcon">📝</span>
                                </div>
                        </div>
                    </div>

                    {/* Username Section*/}
                    <div className = "usernameSection">
                        <label className = "fieldLabel">Username</label>
                        {isEditing? (
                            <input 
                                type = "text"
                                name = "username" 
                                value = {editForm.username}
                                onChange ={handleInputChange}
                                className = "editInput"
                                placeholder = "Enter username"
                            />
                        ):(
                            <div className = "usernameDisplay">{user.username}</div>
                        )}
                    </div>               
                    {/*bio Section */}
                    <div className = "bioSection">
                    <label className = "fieldLabel">bio</label>
                        {isEditing? (
                            <textarea
                            name = "bio"
                            value = {editForm.bio}
                            onChange = {handleInputChange}
                            className = "editbio"
                            placeholder='Tell us about yourself...'
                            rows ={4}
                            />
                        ):(
                            <div className = "bioDisplay">{user.bio}</div>
                        )}
                        </div>

                        {/* Buttons*/}
                        {isEditing && (
                            <div className = "actionButtons">
                                <button className = "saveButton"
                                onClick = {handleSave}>
                                    Save Changes
                                </button>
                                <button className = "cancelButton"
                                onClick = {handleCancel}>
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