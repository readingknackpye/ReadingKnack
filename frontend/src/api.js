import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:8000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,          // <-- send/receive cookies (sessionid, csrftoken)
  xsrfCookieName: "csrftoken",    // <-- Django defaults
  xsrfHeaderName: "X-CSRFToken",
  headers: { "Content-Type": "application/json" },
});

/** -------- AUTH API -------- **/
export const authAPI = {
  // call once to set CSRF cookie (or GET /api/auth/login/ if you set @ensure_csrf_cookie there)
  csrf: () => api.get("/auth/csrf/"),
  register: (payload) => api.post("/auth/register/", payload),
  login: (payload) => api.post("/auth/login/", payload),
  logout: () => api.post("/auth/logout/"),
  me: () => api.get("/auth/profile/"),
};

// Documents API
export const documentsAPI = {
  // Get all documents
  getAll: () => api.get('/documents/'),
  
  // Get document by ID
  getById: (id) => api.get(`/documents/${id}/`),
  
  // Get document detail with questions
  getDetail: (id) => api.get(`/documents/${id}/detail/`),
  
 // Upload new document
upload: (formData) => api.post('documents/', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
}),
 
  // Update document
  update: (id, data) => api.patch(`/documents/${id}/`, data),
  
  // Delete document
  delete: (id) => api.delete(`/documents/${id}/`),
};

// Questions API
export const questionsAPI = {
  // Get questions for a document
  getByDocument: (documentId) => api.get(`/questions/?document_id=${documentId}`),
  
  // Get all questions
  getAll: () => api.get('/questions/'),
  
  // Create new question
  create: (data) => api.post('/questions/', data),
  
  // Update question
  update: (id, data) => api.patch(`/questions/${id}/`, data),
  
  // Delete question
  delete: (id) => api.delete(`/questions/${id}/`),
};

// Answers API
export const answersAPI = {
  // Get answers for a question
  getByQuestion: (questionId) => api.get(`/answers/?question=${questionId}`),
  
  // Create new answer
  create: (data) => api.post('/answers/', data),
  
  // Update answer
  update: (id, data) => api.patch(`/answers/${id}/`, data),
  
  // Delete answer
  delete: (id) => api.delete(`/answers/${id}/`),
};

// Quiz API
export const quizAPI = {
  // Submit quiz responses
  submit: (data) => api.post('/submit-quiz/', data),
  
  // Get quiz responses
  getResponses: () => api.get('/responses/'),
  
  // Get response by ID
  getResponse: (id) => api.get(`/responses/${id}/`),

  // Get student dashboard data
  getStudentDashboard: () => api.get('/student-dashboard/'),
};

// Classrooms API
export const classroomsAPI = {
  // Teacher: manage own classes
  getAll: () => api.get('/classrooms/'),
  create: (data) => api.post('/classrooms/', data),
  delete: (id) => api.delete(`/classrooms/${id}/`),
  regenerateCode: (id) => api.post(`/classrooms/${id}/regenerate-code/`),
  removeStudent: (id, studentId) => api.post(`/classrooms/${id}/remove-student/`, { student_id: studentId }),

  // Student: join a class with a teacher-shared code
  join: (code) => api.post('/classrooms/join/', { code }),
};

// Assignments API
export const assignmentsAPI = {
  // Teacher: list/create passage assignments for one of their classes
  listForClassroom: (classroomId) => api.get(`/classrooms/${classroomId}/assignments/`),
  create: (classroomId, data) => api.post(`/classrooms/${classroomId}/assignments/`, data),

  // Student: everything assigned across classes they've joined
  mine: () => api.get('/my-assignments/'),
};

// Grade Levels API
export const gradeLevelsAPI = {
  getAll: () => api.get('/grade-levels/'),
};

// Skill Categories API
export const skillCategoriesAPI = {
  getAll: () => api.get('/skill-categories/'),
};

export default api; 
