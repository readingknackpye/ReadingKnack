import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:8000/api/documents/')
      .then(res => {
        setDocuments(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 700, margin: '3rem auto', textAlign: 'center' }}>
      <h2 style={{ fontWeight: 900, fontSize: '2rem', marginBottom: 24 }}>Uploaded Documents</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {documents.map(doc => (
            <li key={doc.id} style={{ background: '#fff', margin: '1rem 0', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(162,89,230,0.08)' }}>
              <strong>{doc.title}</strong>
              <div style={{ fontSize: 14, color: '#888' }}>{doc.uploaded_at}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Documents; 