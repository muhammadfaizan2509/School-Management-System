import React, { useEffect, useState } from 'react';
import { feeAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { CreditCard, Plus, CheckCircle, Edit, Trash2 } from 'lucide-react';

const FeesPage = () => {
  const { role } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ student_id: '', title: '', amount: 500, due_date: '' });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: null, student_id: '', title: '', amount: 0, due_date: '', status: 'pending' });

  const fetchInvoices = async () => {
    try {
      if (role === 'student' || role === 'parent') {
        const res = await feeAPI.getMyInvoices();
        setInvoices(res.data);
      } else {
        const [invRes, stRes] = await Promise.all([
          feeAPI.getInvoices(),
          userAPI.getStudents()
        ]);
        setInvoices(invRes.data);
        setStudents(stRes.data);
      }
    } catch (err) {
      console.error("Error loading invoices:", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [role]);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      await feeAPI.createInvoice({
        ...formData,
        student_id: parseInt(formData.student_id),
        amount: parseFloat(formData.amount)
      });
      setIsModalOpen(false);
      setFormData({ student_id: '', title: '', amount: 500, due_date: '' });
      fetchInvoices();
    } catch (err) {
      alert("Failed to issue fee invoice");
    }
  };

  const handleOpenEditModal = (inv) => {
    setEditFormData({
      id: inv.id,
      student_id: inv.student_id,
      title: inv.title,
      amount: inv.amount,
      due_date: inv.due_date,
      status: inv.status
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateInvoice = async (e) => {
    e.preventDefault();
    try {
      await feeAPI.updateInvoice(editFormData.id, {
        student_id: parseInt(editFormData.student_id),
        title: editFormData.title,
        amount: parseFloat(editFormData.amount),
        due_date: editFormData.due_date,
        status: editFormData.status
      });
      setIsEditModalOpen(false);
      fetchInvoices();
    } catch (err) {
      alert("Failed to update fee invoice");
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm("Are you sure you want to delete this invoice? This action cannot be undone.")) return;
    try {
      await feeAPI.deleteInvoice(invoiceId);
      fetchInvoices();
    } catch (err) {
      alert("Failed to delete invoice");
    }
  };

  const handlePayInvoice = async (invoiceId) => {
    try {
      await feeAPI.payInvoice(invoiceId);
      fetchInvoices();
    } catch (err) {
      alert("Payment processing failed");
    }
  };

  const totalCollected = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="panel-header">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard color="#f59e0b" />
            Fee Management & Billing Statements
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Tuition, lab, and activity fee invoices</p>
        </div>

        {role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>Generate Invoice</span>
          </button>
        )}
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">Total Fee Revenue Collected</div>
          <div className="metric-value" style={{ color: '#10b981' }}>RS {totalCollected.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-header">Outstanding Pending Fees</div>
          <div className="metric-value" style={{ color: '#f59e0b' }}>RS {totalPending.toFixed(2)}</div>
        </div>
      </div>

      <div className="glass-panel">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice Title</th>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Class</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 700 }}>{inv.title}</td>
                  <td>{inv.student_name}</td>
                  <td><strong style={{ color: '#6366f1' }}>{inv.roll_number}</strong></td>
                  <td>{inv.class_name}</td>
                  <td style={{ fontWeight: 700, color: '#f59e0b' }}>RS {inv.amount.toFixed(2)}</td>
                  <td style={{ color: '#94a3b8' }}>{inv.due_date}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td>
                    {role === 'admin' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {inv.status !== 'paid' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handlePayInvoice(inv.id)} title="Mark Paid">
                            <CheckCircle size={14} /> Paid
                          </button>
                        )}
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => handleOpenEditModal(inv)} 
                          title="Edit Invoice"
                          style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleDeleteInvoice(inv.id)} 
                          title="Delete Invoice"
                          style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    ) : inv.status === 'paid' ? (
                      <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>Paid on {inv.paid_date}</span>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600 }}>Pending Payment</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate New Invoice Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue New Fee Invoice">
        <form onSubmit={handleCreateInvoice}>
          <div className="form-group">
            <label className="form-label">Select Student</label>
            <select className="form-select" required value={formData.student_id} onChange={(e) => setFormData({...formData, student_id: e.target.value})}>
              <option value="">Select Student</option>
              {students.map(s => (
                <option key={s.id} value={s.user_id}>{s.user_info.full_name} ({s.roll_number})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Invoice Title</label>
            <input type="text" className="form-input" placeholder="Fall 2026 Tuition" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Amount (RS)</label>
              <input type="number" step="0.01" className="form-input" required value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" required value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Generate & Issue Invoice</button>
        </form>
      </Modal>

      {/* Edit Invoice Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Fee Invoice">
        <form onSubmit={handleUpdateInvoice}>
          <div className="form-group">
            <label className="form-label">Select Student</label>
            <select className="form-select" required value={editFormData.student_id} onChange={(e) => setEditFormData({...editFormData, student_id: e.target.value})}>
              <option value="">Select Student</option>
              {students.map(s => (
                <option key={s.id} value={s.user_id}>{s.user_info.full_name} ({s.roll_number})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Invoice Title</label>
            <input type="text" className="form-input" required value={editFormData.title} onChange={(e) => setEditFormData({...editFormData, title: e.target.value})} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Amount (RS)</label>
              <input type="number" step="0.01" className="form-input" required value={editFormData.amount} onChange={(e) => setEditFormData({...editFormData, amount: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" required value={editFormData.due_date} onChange={(e) => setEditFormData({...editFormData, due_date: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={editFormData.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Save Invoice Changes</button>
        </form>
      </Modal>
    </div>
  );
};

export default FeesPage;
