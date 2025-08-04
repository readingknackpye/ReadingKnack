import React, { useState } from 'react';
import axios from 'axios';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post('http://localhost:8000/api/documents/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('Upload successful!');
    } catch (err) {
      setMessage('Upload failed.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '3rem auto', textAlign: 'center' }}>
      <h2 style={{ fontWeight: 900, fontSize: '2rem', marginBottom: 24 }}>Upload Document</h2>
      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 2px 12px rgba(162,89,230,0.08)' }}>
        <input type="file" accept=".docx" onChange={handleFileChange} style={{ marginBottom: 16 }} />
        <button type="submit" className="btn" style={{ width: '100%' }}>Upload</button>
        {message && <div style={{ marginTop: 16 }}>{message}</div>}
      </form>
    </div>
  );
};

export default Upload;