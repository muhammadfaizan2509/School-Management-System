import React, { useEffect, useState } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { GraduationCap, Plus, Mail, Phone, Edit3, KeyRound, Trash2, Camera } from 'lucide-react';

const TeachersPage = () => {
  const { role } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'teacher',
    employee_id: '',
    qualification: '',
    specialization: ''
  });

  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    employee_id: '',
    qualification: '',
    specialization: ''
  });

  const fetchTeachers = async () => {
    try {
      const res = await userAPI.getUsers('teacher');
      setTeachers(res.data);
    } catch (err) {
      console.error("Error fetching teachers:", err);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      await userAPI.createUser({
        ...formData,
        username: formData.username.trim(),
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        employee_id: formData.employee_id.trim(),
        phone: formData.phone.trim()
      });
      setIsAddModalOpen(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'teacher',
        employee_id: '',
        qualification: '',
        specialization: ''
      });
      fetchTeachers();
    } catch (err) {
      const detail = err.response?.data?.detail;
      let errorMsg = "Failed to add teacher.";
      if (typeof detail === 'string') {
        errorMsg = detail;
      }
      alert(errorMsg);
    }
  };

  const openEditModal = (t) => {
    setSelectedTeacher(t);
    setEditFormData({
      full_name: t.full_name || '',
      email: t.email || '',
      phone: t.phone || '',
      employee_id: t.employee_id || '',
      qualification: t.qualification || '',
      specialization: t.specialization || '',
      avatar: t.avatar || ''
    });
    setIsEditModalOpen(true);
  };

  const handleTeacherAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedTeacher) return;
    try {
      const res = await userAPI.uploadUserAvatar(selectedTeacher.id, file);
      setEditFormData(prev => ({ ...prev, avatar: res.data.avatar_url }));
      fetchTeachers();
    } catch (err) {
      alert("Failed to upload profile picture for teacher");
    }
  };

  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    try {
      await userAPI.updateUser(selectedTeacher.id, {
        full_name: editFormData.full_name.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim(),
        employee_id: editFormData.employee_id.trim(),
        qualification: editFormData.qualification.trim(),
        specialization: editFormData.specialization.trim(),
        avatar: editFormData.avatar
      });
      setIsEditModalOpen(false);
      fetchTeachers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update teacher profile");
    }
  };

  const openResetModal = (t) => {
    setSelectedTeacher(t);
    setResetPasswordInput('');
    setIsResetModalOpen(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedTeacher || !resetPasswordInput) return;
    try {
      await userAPI.resetPassword(selectedTeacher.id, { new_password: resetPasswordInput });
      alert(`Password for '${selectedTeacher.full_name}' reset successfully!`);
      setIsResetModalOpen(false);
      setResetPasswordInput('');
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to reset password");
    }
  };

  const handleDeleteTeacher = async (userId) => {
    if (window.confirm("Are you sure you want to delete this teacher account?")) {
      try {
        await userAPI.deleteUser(userId);
        fetchTeachers();
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to delete teacher");
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="panel-header">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap color="#10b981" />
            Faculty & Academic Staff
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>School teachers, departments, passwords, and qualifications</p>
        </div>

        {role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
            <span>Add New Teacher</span>
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {teachers.map((t) => (
          <div key={t.id} className="glass-panel" style={{ position: 'relative', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <img 
                src={t.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.username}`} 
                alt="Teacher Avatar" 
                style={{ width: 56, height: 56, borderRadius: '50%', border: '2px solid #10b981' }}
              />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t.full_name}</h3>
                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Faculty Instructor</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} color="#6366f1" />
                <span>{t.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} color="#06b6d4" />
                <span>{t.phone || '+1 555-0199'}</span>
              </div>
            </div>

            {role === 'admin' && (
              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => openEditModal(t)}
                  title="Edit Teacher Info"
                >
                  <Edit3 size={14} color="#6366f1" /> Edit
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => openResetModal(t)}
                  title="Reset Password"
                >
                  <KeyRound size={14} color="#f59e0b" /> Password
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteTeacher(t.id)}
                  title="Delete Teacher Account"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Teacher Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Faculty Member">
        <form onSubmit={handleCreateTeacher}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input type="text" className="form-input" placeholder="e.g. Dr. Robert Vance" required value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input type="text" className="form-input" placeholder="e.g. vance_math" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Password *</label>
              <input type="password" className="form-input" placeholder="Set password (e.g. pass123)" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input type="email" className="form-input" placeholder="vance@apexacademy.edu" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" placeholder="+92 300 9876543" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input type="text" className="form-input" placeholder="EMP-105" value={formData.employee_id} onChange={(e) => setFormData({...formData, employee_id: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Qualification</label>
              <input type="text" className="form-input" placeholder="Ph.D. / M.Sc. Physics" value={formData.qualification} onChange={(e) => setFormData({...formData, qualification: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Specialization / Department</label>
            <input type="text" className="form-input" placeholder="e.g. Theoretical Physics & Robotics" value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Register Teacher
          </button>
        </form>
      </Modal>

      {/* Edit Teacher Modal */}
      {isEditModalOpen && selectedTeacher && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Faculty Profile: ${selectedTeacher.full_name}`}>
          <form onSubmit={handleUpdateTeacher}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem 1rem', borderRadius: '12px' }}>
              <img 
                src={editFormData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedTeacher.username}`} 
                alt="Teacher Avatar" 
                style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #6366f1' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Profile Picture</span>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontSize: '0.75rem' }}>
                  <Camera size={13} /> Change Photo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleTeacherAvatarUpload} />
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input type="text" className="form-input" required value={editFormData.full_name} onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input type="email" className="form-input" required value={editFormData.email} onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-input" value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Employee ID</label>
                <input type="text" className="form-input" value={editFormData.employee_id} onChange={(e) => setEditFormData({...editFormData, employee_id: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Qualification</label>
                <input type="text" className="form-input" value={editFormData.qualification} onChange={(e) => setEditFormData({...editFormData, qualification: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Specialization / Department</label>
              <input type="text" className="form-input" value={editFormData.specialization} onChange={(e) => setEditFormData({...editFormData, specialization: e.target.value})} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Save Faculty Info
            </button>
          </form>
        </Modal>
      )}

      {/* Admin Reset Teacher Password Modal */}
      {isResetModalOpen && selectedTeacher && (
        <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title={`Reset Password for ${selectedTeacher.full_name}`}>
          <form onSubmit={handleResetPassword}>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Directly reset password for teacher account <strong>{selectedTeacher.username}</strong>.
            </p>
            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input 
                type="password" 
                className="form-input" 
                required 
                placeholder="Enter new password (e.g. pass123)"
                value={resetPasswordInput} 
                onChange={(e) => setResetPasswordInput(e.target.value)} 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Reset Account Password
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default TeachersPage;
