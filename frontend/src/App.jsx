import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentPortal from './pages/StudentPortal';
import StudentsPage from './pages/StudentsPage';
import TeachersPage from './pages/TeachersPage';
import ClassesPage from './pages/ClassesPage';
import AttendancePage from './pages/AttendancePage';
import GradesPage from './pages/GradesPage';
import FeesPage from './pages/FeesPage';
import NoticesPage from './pages/NoticesPage';

const ProtectedLayout = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Initializing System...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="content-body">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />

      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/student-portal" element={<ProtectedLayout><StudentPortal /></ProtectedLayout>} />
      <Route path="/students" element={<ProtectedLayout><StudentsPage /></ProtectedLayout>} />
      <Route path="/teachers" element={<ProtectedLayout><TeachersPage /></ProtectedLayout>} />
      <Route path="/classes" element={<ProtectedLayout><ClassesPage /></ProtectedLayout>} />
      <Route path="/attendance" element={<ProtectedLayout><AttendancePage /></ProtectedLayout>} />
      <Route path="/grades" element={<ProtectedLayout><GradesPage /></ProtectedLayout>} />
      <Route path="/fees" element={<ProtectedLayout><FeesPage /></ProtectedLayout>} />
      <Route path="/notices" element={<ProtectedLayout><NoticesPage /></ProtectedLayout>} />

      <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
