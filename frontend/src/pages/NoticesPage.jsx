import React, { useEffect, useState } from 'react';
import { noticeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Megaphone, Plus, Trash2 } from 'lucide-react';

const NoticesPage = () => {
  const { role } = useAuth();
  const [notices, setNotices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', target_role: 'all', priority: 'normal' });

  const fetchNotices = async () => {
    try {
      const res = await noticeAPI.getNotices();
      setNotices(res.data);
    } catch (err) {
      console.error("Error loading notices:", err);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    try {
      await noticeAPI.createNotice(formData);
      setIsModalOpen(false);
      fetchNotices();
    } catch (err) {
      alert("Failed to post notice");
    }
  };

  const handleDeleteNotice = async (id) => {
    if (window.confirm("Delete announcement?")) {
      try {
        await noticeAPI.deleteNotice(id);
        fetchNotices();
      } catch (err) {
        alert("Failed to delete notice");
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="panel-header">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Megaphone color="#ec4899" />
            School Announcements & Bulletin Board
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Official school circulars, exam notifications, and events</p>
        </div>

        {(role === 'admin' || role === 'teacher') && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>Broadcast Announcement</span>
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {notices.map((n) => (
          <div key={n.id} className="glass-panel" style={{ margin: 0, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{n.title}</h3>
              <StatusBadge status={n.priority} />
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.925rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>{n.content}</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
              <span>Target: <strong style={{ color: '#a5b4fc', textTransform: 'uppercase' }}>{n.target_role}</strong></span>
              <span>Posted by {n.posted_by_name}</span>
            </div>

            {role === 'admin' && (
              <button 
                onClick={() => handleDeleteNotice(n.id)}
                style={{ position: 'absolute', bottom: 12, right: 12, background: 'transparent', color: '#ef4444' }}
                title="Delete Notice"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Broadcast New Notice">
        <form onSubmit={handleCreateNotice}>
          <div className="form-group">
            <label className="form-label">Notice Title</label>
            <input type="text" className="form-input" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea className="form-input" rows={4} required value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <select className="form-select" value={formData.target_role} onChange={(e) => setFormData({...formData, target_role: e.target.value})}>
                <option value="all">Everyone</option>
                <option value="student">Students Only</option>
                <option value="teacher">Teachers Only</option>
                <option value="parent">Parents Only</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Post Notice</button>
        </form>
      </Modal>
    </div>
  );
};

export default NoticesPage;
