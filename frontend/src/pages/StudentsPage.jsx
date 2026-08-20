import React, { useEffect, useState } from 'react';
import { userAPI, classAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { Users, Plus, Search, Trash2, Edit3, KeyRound, Camera } from 'lucide-react';

const StudentsPage = () => {
  const { role } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Selected Student for Edit / Password Reset
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [resetPasswordInput, setResetPasswordInput] = useState('');

  // Form State for New Student
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'student',
    roll_number: '',
    class_id: '',
    date_of_birth: '',
    gender: 'Male',
    address: ''
  });

  // Form State for Editing Student
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    roll_number: '',
    class_id: '',
    date_of_birth: '',
    gender: 'Male',
    address: ''
  });

  const fetchData = async () => {
    try {
      const [stRes, clsRes] = await Promise.all([
        userAPI.getStudents(),
        classAPI.getClasses()
      ]);
      setStudents(stRes.data);
      setClasses(clsRes.data);
      if (clsRes.data.length > 0 && !formData.class_id) {
        setFormData(prev => ({ ...prev, class_id: clsRes.data[0].id.toString() }));
      }
    } catch (err) {
      console.error("Error loading students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      const assignedClassId = formData.class_id ? parseInt(formData.class_id) : (classes.length > 0 ? classes[0].id : null);
      await userAPI.createUser({
        ...formData,
        username: formData.username.trim(),
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        roll_number: formData.roll_number.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        class_id: assignedClassId
      });
      setIsAddModalOpen(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'student',
        roll_number: '',
        class_id: classes.length > 0 ? classes[0].id.toString() : '',
        date_of_birth: '',
        gender: 'Male',
        address: ''
      });
      fetchData();
    } catch (err) {
      const detail = err.response?.data?.detail;
      let errorMsg = "Failed to create student";
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map(item => item.msg ? `${item.loc ? item.loc.join(' -> ') + ': ' : ''}${item.msg}` : JSON.stringify(item)).join('\n');
      }
      alert(errorMsg);
    }
  };

  const openEditModal = (st) => {
    setSelectedStudent(st);
    setEditFormData({
      full_name: st.user_info.full_name || '',
      email: st.user_info.email || '',
      phone: st.user_info.phone || st.guardian_contact || '',
      roll_number: st.roll_number || '',
      class_id: st.class_id ? st.class_id.toString() : '',
      date_of_birth: st.date_of_birth || '',
      gender: st.gender || 'Male',
      address: st.address || '',
      avatar: st.user_info.avatar || ''
    });
    setIsEditModalOpen(true);
  };

  const handleStudentAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedStudent) return;
    try {
      const res = await userAPI.uploadUserAvatar(selectedStudent.user_id, file);
      setEditFormData(prev => ({ ...prev, avatar: res.data.avatar_url }));
      fetchData();
    } catch (err) {
      alert("Failed to upload profile picture");
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      await userAPI.updateUser(selectedStudent.user_id, {
        full_name: editFormData.full_name.trim(),
        email: editFormData.email.trim(),
        phone: editFormData.phone.trim(),
        roll_number: editFormData.roll_number.trim(),
        class_id: editFormData.class_id ? parseInt(editFormData.class_id) : null,
        date_of_birth: editFormData.date_of_birth,
        gender: editFormData.gender,
        address: editFormData.address.trim(),
        avatar: editFormData.avatar
      });
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update student profile");
    }
  };

  const openResetModal = (st) => {
    setSelectedStudent(st);
    setResetPasswordInput('');
    setIsResetModalOpen(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !resetPasswordInput) return;
    try {
      await userAPI.resetPassword(selectedStudent.user_id, { new_password: resetPasswordInput });
      alert(`Password for student '${selectedStudent.user_info.full_name}' reset successfully!`);
      setIsResetModalOpen(false);
      setResetPasswordInput('');
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to reset password");
    }
  };

  const handleDeleteStudent = async (userId) => {
    if (window.confirm("Are you sure you want to delete this student account?")) {
      try {
        await userAPI.deleteUser(userId);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to delete student account");
      }
    }
  };

  const filteredStudents = students.filter(s => 
    s.user_info.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(search.toLowerCase()) ||
    s.class_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="panel-header">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users color="#6366f1" />
            Student Directory & Rosters
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Manage enrolled students, profiles, passwords, addresses, and contacts</p>
        </div>

        {role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
            <span>Add New Student</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by student name, roll number, or class..."
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="glass-panel">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Enrolled Class</th>
                <th>Parent / Guardian</th>
                <th>Contact</th>
                <th>Address</th>
                {role === 'admin' && <th>Admin Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((st) => (
                <tr key={st.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img 
                        src={st.user_info.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${st.user_info.username}`} 
                        alt="Student" 
                        style={{ width: 36, height: 36, borderRadius: '50%' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700 }}>{st.user_info.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{st.user_info.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><strong style={{ color: '#6366f1' }}>{st.roll_number}</strong></td>
                  <td>{st.class_name}</td>
                  <td>{st.parent_name}</td>
                  <td style={{ color: '#94a3b8' }}>{st.user_info.phone || st.guardian_contact || 'N/A'}</td>
                  <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{st.address || 'N/A'}</td>
                  {role === 'admin' && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => openEditModal(st)}
                          title="Edit Student Profile"
                        >
                          <Edit3 size={15} color="#6366f1" />
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => openResetModal(st)}
                          title="Reset Account Password"
                        >
                          <KeyRound size={15} color="#f59e0b" />
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteStudent(st.user_id)}
                          title="Delete Student"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Student Account">
        <form onSubmit={handleCreateStudent}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input type="text" className="form-input" placeholder="e.g. Muhammad Faizan" required value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input type="text" className="form-input" placeholder="e.g. faizan_001" required value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Password *</label>
              <input type="password" className="form-input" placeholder="Set password (e.g. pass123)" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input type="email" className="form-input" placeholder="faizan@gmail.com" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone / Guardian Contact</label>
              <input type="text" className="form-input" placeholder="+92 300 1234567" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Roll Number</label>
              <input type="text" className="form-input" placeholder="e.g. D-001 or STU-105" value={formData.roll_number} onChange={(e) => setFormData({...formData, roll_number: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Assign Class Section *</label>
              <select className="form-select" required value={formData.class_id} onChange={(e) => setFormData({...formData, class_id: e.target.value})}>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" className="form-input" value={formData.date_of_birth} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-select" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Home Address</label>
            <input type="text" className="form-input" placeholder="e.g. House #12, Street 4, Islamabad" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Submit Student Registration
          </button>
        </form>
      </Modal>

      {/* Edit Student Modal (Admin Only) */}
      {isEditModalOpen && selectedStudent && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Profile: ${selectedStudent.user_info.full_name}`}>
          <form onSubmit={handleUpdateStudent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.75rem 1rem', borderRadius: '12px' }}>
              <img 
                src={editFormData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStudent.user_info.username}`} 
                alt="Student Avatar" 
                style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #6366f1' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Profile Picture</span>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontSize: '0.75rem' }}>
                  <Camera size={13} /> Change Photo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleStudentAvatarUpload} />
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
                <label className="form-label">Roll Number</label>
                <input type="text" className="form-input" value={editFormData.roll_number} onChange={(e) => setEditFormData({...editFormData, roll_number: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Class Section</label>
                <select className="form-select" value={editFormData.class_id} onChange={(e) => setEditFormData({...editFormData, class_id: e.target.value})}>
                  <option value="">Unassigned</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-input" value={editFormData.date_of_birth} onChange={(e) => setEditFormData({...editFormData, date_of_birth: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={editFormData.gender} onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Home Address</label>
              <input type="text" className="form-input" value={editFormData.address} onChange={(e) => setEditFormData({...editFormData, address: e.target.value})} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Save Student Info
            </button>
          </form>
        </Modal>
      )}

      {/* Admin Reset Student Password Modal */}
      {isResetModalOpen && selectedStudent && (
        <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title={`Reset Password for ${selectedStudent.user_info.full_name}`}>
          <form onSubmit={handleResetPassword}>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Directly reset password for student account <strong>{selectedStudent.user_info.username}</strong>.
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

export default StudentsPage;
