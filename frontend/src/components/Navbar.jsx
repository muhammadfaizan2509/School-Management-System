import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './ProfileModal';
import { GraduationCap, LogOut, Bell, User as UserIcon, Settings } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="ITC Ghotki Logo" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.5px' }}>
            INFORMATION TECHNOLOGY COLLEGE GHOTKI
          </span>
        </div>

        <div className="navbar-actions">
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <Bell size={20} color="#94a3b8" />
            <span style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#ef4444'
            }} />
          </div>

          {user && (
            <div className="user-profile-badge">
              <img 
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                alt={user.full_name} 
                className="avatar-img"
                style={{ cursor: 'pointer' }}
                onClick={() => setIsProfileOpen(true)}
                title="Edit My Profile & Password"
              />
              <div style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => setIsProfileOpen(true)}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.full_name}</span>
                <span className={`role-badge role-${user.role}`} style={{ alignSelf: 'flex-start' }}>
                  {user.role}
                </span>
              </div>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: '0.5rem', padding: '0.4rem' }}
                title="My Account Profile & Security Settings"
              >
                <Settings size={16} color="#6366f1" />
              </button>

              <button 
                onClick={logout} 
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: '0.25rem', padding: '0.4rem' }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </nav>

      {user && (
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      )}
    </>
  );
};

export default Navbar;

