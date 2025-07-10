import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { documentsAPI, gradeLevelsAPI, skillCategoriesAPI } from '../api';

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [documentsRes, gradeLevelsRes, skillCategoriesRes] = await Promise.all([
        documentsAPI.getAll(),
        gradeLevelsAPI.getAll(),
        skillCategoriesAPI.getAll()
      ]);
      
      setDocuments(documentsRes.data);
      setGradeLevels(gradeLevelsRes.data);
      setSkillCategories(skillCategoriesRes.data);
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.parsed_text?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = !selectedGrade || doc.grade_level?.id === parseInt(selectedGrade);
    const matchesSkill = !selectedSkill || doc.skill_category?.id === parseInt(selectedSkill);
    
    return matchesSearch && matchesGrade && matchesSkill;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Reading Passages</h1>
        <p className="text-gray-600">Browse and explore all uploaded reading passages</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search passages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Grade Level Filter */}
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Grade Levels</option>
            {gradeLevels.map(grade => (
              <option key={grade.id} value={grade.id}>{grade.name}</option>
            ))}
          </select>

          {/* Skill Category Filter */}
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Skills</option>
            {skillCategories.map(skill => (
              <option key={skill.id} value={skill.id}>{skill.name}</option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedGrade('');
              setSelectedSkill('');
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filteredDocuments.length} of {documents.length} passages
        </p>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No passages found</h3>
          <p className="text-gray-500 mb-4">
            {documents.length === 0 
              ? "No passages have been uploaded yet." 
              : "No passages match your current filters."
            }
          </p>
          {documents.length === 0 && (
            <Link
              to="/upload"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Upload Your First Passage
            </Link>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-100">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                  {doc.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {doc.parsed_text?.substring(0, 150)}...
                </p>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  📅
                  {formatDate(doc.uploaded_at)}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {doc.grade_level && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {doc.grade_level.name}
                    </span>
                  )}
                  {doc.skill_category && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      {doc.skill_category.name}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/documents/${doc.id}`}
                    className="flex-1 text-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span className="mr-1">📖</span>
                    Read
                  </Link>
                  <Link
                    to={`/quiz/${doc.id}`}
                    className="flex-1 text-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <span className="mr-1">🎓</span>
                    Quiz
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentList; 