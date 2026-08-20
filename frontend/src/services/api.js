import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('school_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authAPI = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
};

export const userAPI = {
  getUsers: (role) => api.get('/users', { params: { role } }),
  getStudents: (classId) => api.get('/users/students', { params: { class_id: classId } }),
  getMyStudentProfile: () => api.get('/users/student-profile/me'),
  createUser: (userData) => api.post('/users', userData),
  updateOwnProfile: (data) => api.put('/users/me', data),
  changePassword: (data) => api.post('/users/me/change-password', data),
  updateUser: (userId, data) => api.put(`/users/${userId}`, data),
  resetPassword: (userId, data) => api.put(`/users/${userId}/reset-password`, data),
  deleteUser: (userId) => api.delete(`/users/${userId}`),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/upload-avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadUserAvatar: (userId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/users/${userId}/upload-avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  requestPasswordReset: (reason) => api.post('/users/request-password-reset', { reason }),
  getPasswordResetRequests: () => api.get('/users/password-reset-requests'),
  fulfillPasswordReset: (requestId, newPassword) => api.post(`/users/password-reset-requests/${requestId}/fulfill`, { new_password: newPassword }),
};

export const classAPI = {
  getClasses: () => api.get('/classes'),
  createClass: (classData) => api.post('/classes', classData),
  getSubjects: (classId) => api.get('/subjects', { params: { class_id: classId } }),
  createSubject: (subjData) => api.post('/subjects', subjData),
};

export const attendanceAPI = {
  getAttendance: (params) => api.get('/attendance', { params }),
  recordBulk: (bulkData) => api.post('/attendance/bulk', bulkData),
  getMyAttendance: () => api.get('/attendance/my-attendance'),
};

export const gradeAPI = {
  getExams: (classId) => api.get('/exams', { params: { class_id: classId } }),
  createExam: (examData) => api.post('/exams', examData),
  getGrades: (params) => api.get('/grades', { params }),
  submitGrade: (gradeData) => api.post('/grades', gradeData),
  getMyGrades: () => api.get('/grades/my-grades'),
};

export const feeAPI = {
  getInvoices: (params) => api.get('/fees', { params }),
  createInvoice: (invData) => api.post('/fees', invData),
  updateInvoice: (invoiceId, invData) => api.put(`/fees/${invoiceId}`, invData),
  deleteInvoice: (invoiceId) => api.delete(`/fees/${invoiceId}`),
  payInvoice: (invoiceId) => api.put(`/fees/${invoiceId}/pay`),
  getMyInvoices: () => api.get('/fees/my-invoices'),
};

export const noticeAPI = {
  getNotices: () => api.get('/notices'),
  createNotice: (noticeData) => api.post('/notices', noticeData),
  deleteNotice: (noticeId) => api.delete(`/notices/${noticeId}`),
};

export const dashboardAPI = {
  getMetrics: () => api.get('/dashboard/metrics'),
};

export default api;
