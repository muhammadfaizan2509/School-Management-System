import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import Modal from './Modal';
import { User, Lock, KeyRound, CheckCircle2, AlertCircle, Camera, Upload } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, refreshUser, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // profile, password, requestReset

  // Profile Form
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    avatar: ''
  });

  // Password Form
  const [pwdData, setPwdData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Reset Request
  const [resetReason, setResetReason] = useState('');

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setProfileData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        date_of_birth: user.date_of_birth || '',
        avatar: user.avatar || ''
      });
      setMessage(null);
      setError(null);
    }
  }, [user, isOpen]);

  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError(null);
    setMessage(null);
    try {
      const res = await userAPI.uploadAvatar(file);
      const newAvatarUrl = res.data.avatar_url;
      setProfileData(prev => ({ ...prev, avatar: newAvatarUrl }));
      updateUser({ avatar: newAvatarUrl });
      await refreshUser();
      setMessage("Profile picture uploaded and updated successfully!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload avatar image.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await userAPI.updateOwnProfile(profileData);
      updateUser(res.data);
      await refreshUser();
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdData.new_password !== pwdData.confirm_password) {
      setError("New passwords do not match!");
      return;
    }
    if (pwdData.new_password.length < 4) {
      setError("New password must be at least 4 characters long.");
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      await userAPI.changePassword({
        old_password: pwdData.old_password,
        new_password: pwdData.new_password
      });
      setMessage("Password changed successfully!");
      setPwdData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to change password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestPasswordReset = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await userAPI.requestPasswordReset(resetReason);
      setMessage(res.data.message || "Password reset request sent to Admin.");
      setResetReason('');
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit password reset request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Account & Profile Settings">
      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('profile'); setMessage(null); setError(null); }}
          className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <User size={16} /> Edit Info
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('password'); setMessage(null); setError(null); }}
          className={`btn ${activeTab === 'password' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <Lock size={16} /> Change Password
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('requestReset'); setMessage(null); setError(null); }}
          className={`btn ${activeTab === 'requestReset' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <KeyRound size={16} /> Request Admin Reset
        </button>
      </div>

      {/* Notifications */}
      {message && (
        <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <CheckCircle2 size={18} /> {message}
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Tab 1: Edit Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile}>
          {/* Avatar Upload Banner */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', background: 'rgba(255, 255, 255, 0.04)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ position: 'relative' }}>
              <img 
                src={profileData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} 
                alt="Profile Avatar" 
                style={{ width: '75px', height: '75px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #6366f1' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>Profile Picture</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>Upload an image file (JPG, PNG, WEBP, SVG)</p>
              <div>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontSize: '0.8rem' }}>
                  <Camera size={14} /> {uploadingAvatar ? 'Uploading...' : 'Upload New Photo'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFileUpload} disabled={uploadingAvatar} />
                </label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" required value={profileData.full_name} onChange={(e) => setProfileData({...profileData, full_name: e.target.value})} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" required value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" placeholder="+1 555 0199" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" className="form-input" value={profileData.date_of_birth} onChange={(e) => setProfileData({...profileData, date_of_birth: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Avatar Image URL</label>
              <input type="text" className="form-input" placeholder="https://..." value={profileData.avatar} onChange={(e) => setProfileData({...profileData, avatar: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input type="text" className="form-input" placeholder="Address..." value={profileData.address} onChange={(e) => setProfileData({...profileData, address: e.target.value})} />
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {submitting ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </form>
      )}

      {/* Tab 2: Change Password */}
      {activeTab === 'password' && (
        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input type="password" className="form-input" required value={pwdData.old_password} onChange={(e) => setPwdData({...pwdData, old_password: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input type="password" className="form-input" required value={pwdData.new_password} onChange={(e) => setPwdData({...pwdData, new_password: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input type="password" className="form-input" required value={pwdData.confirm_password} onChange={(e) => setPwdData({...pwdData, confirm_password: e.target.value})} />
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {submitting ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      )}

      {/* Tab 3: Request Admin Reset */}
      {activeTab === 'requestReset' && (
        <form onSubmit={handleRequestPasswordReset}>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Submit a request to the Admin to reset your account password. Once approved by Admin, your password will be reset.
          </p>

          <div className="form-group">
            <label className="form-label">Reason / Notes for Admin (Optional)</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Forgot my current password or need a security reset."
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {submitting ? 'Sending Request...' : 'Send Password Reset Request to Admin'}
          </button>
        </form>
      )}
    </Modal>
  );
};

export default ProfileModal;
