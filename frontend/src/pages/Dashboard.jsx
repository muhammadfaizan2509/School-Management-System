import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, noticeAPI, attendanceAPI, feeAPI, userAPI } from '../services/api';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  CalendarCheck, 
  DollarSign, 
  Megaphone,
  TrendingUp,
  Award,
  KeyRound,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { user, role } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [notices, setNotices] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fulfill Reset Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [fulfillModalOpen, setFulfillModalOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      const [mRes, nRes] = await Promise.all([
        dashboardAPI.getMetrics(),
        noticeAPI.getNotices()
      ]);
      setMetrics(mRes.data);
      setNotices(nRes.data);

      if (role === 'admin') {
        const resetRes = await userAPI.getPasswordResetRequests().catch(() => ({ data: [] }));
        setResetRequests(resetRes.data.filter(r => r.status === 'pending'));

        const attRes = await attendanceAPI.getAttendance().catch(() => ({ data: [] }));
        const attLogs = attRes.data || [];
        const grouped = {};
        attLogs.forEach(a => {
          if (!grouped[a.date]) grouped[a.date] = { date: a.date, present: 0, total: 0 };
          grouped[a.date].total += 1;
          if (a.status === 'present' || a.status === 'late') grouped[a.date].present += 1;
        });

        const trend = Object.values(grouped)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-7)
          .map(item => ({
            day: item.date.slice(5),
            percentage: item.total > 0 ? Math.round((item.present / item.total) * 100) : 100
          }));

        setAttendanceData(trend.length > 0 ? trend : [
          { day: '07-25', percentage: 92 },
          { day: '07-26', percentage: 95 },
          { day: '07-27', percentage: 88 },
          { day: '07-28', percentage: 96 },
          { day: '07-29', percentage: 90 },
          { day: '07-30', percentage: 94 },
          { day: '07-31', percentage: mRes.data?.today_attendance_percentage || 94 }
        ]);
      } else if (role === 'student' || role === 'parent') {
        const myAttRes = await attendanceAPI.getMyAttendance().catch(() => ({ data: null }));
        const logs = myAttRes.data?.history || [];
        const trend = logs.slice(-7).map(a => ({
          day: a.date.slice(5),
          percentage: (a.status === 'present' || a.status === 'late') ? 100 : 0
        }));
        setAttendanceData(trend.length > 0 ? trend : [
          { day: '07-25', percentage: 100 },
          { day: '07-26', percentage: 100 },
          { day: '07-27', percentage: 100 },
          { day: '07-28', percentage: 100 },
          { day: '07-29', percentage: 100 },
          { day: '07-30', percentage: 100 },
          { day: '07-31', percentage: mRes.data?.my_attendance_percentage || 100 }
        ]);
      }
    } catch (err) {
      console.error("Dashboard metrics error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [role]);

  const handleFulfillReset = async (e) => {
    e.preventDefault();
    if (!selectedRequest || !newPasswordInput) return;
    try {
      await userAPI.fulfillPasswordReset(selectedRequest.id, newPasswordInput);
      alert(`Password for '${selectedRequest.username}' updated successfully!`);
      setFulfillModalOpen(false);
      setNewPasswordInput('');
      fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to reset user password.");
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading Live Dashboard Data...</div>;

  const feeDistributionData = role === 'admin' ? [
    { name: 'Collected Fees (RS)', value: metrics?.collected_fees_amount || 0, color: '#10b981' },
    { name: 'Pending / Overdue (RS)', value: metrics?.pending_fees_amount || 0, color: '#f59e0b' }
  ] : [
    { name: 'My Paid Fees (RS)', value: metrics?.my_paid_fees || 0, color: '#10b981' },
    { name: 'My Pending Fees (RS)', value: metrics?.my_pending_fees || 0, color: '#f59e0b' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Welcome Back, {user?.full_name}! 👋</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Information Technology College Ghotki | Role: <span className={`role-badge role-${role}`}>{role}</span>
            {(role === 'student' || role === 'parent') && (
              <span> | Profile: <strong style={{ color: '#f8fafc' }}>{metrics?.user_full_name} ({metrics?.roll_number}) - {metrics?.class_name}</strong></span>
            )}
          </p>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#94a3b8', background: 'rgba(15,23,42,0.6)', padding: '0.6rem 1.25rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
          🟢 System Mode: <strong style={{ color: '#10b981' }}>{role === 'admin' ? 'System-Wide Overview' : 'Personal Dashboard'}</strong>
        </div>
      </div>

      {/* Role-Specific KPI Metrics */}
      {role === 'admin' ? (
        <div className="metrics-grid">
          <MetricCard title="Total Enrolled Students" value={metrics?.total_students || 0} subtitle="Real-time Database Count" icon={Users} color="#6366f1" />
          <MetricCard title="Faculty & Staff" value={metrics?.total_teachers || 0} subtitle="Active Teaching Staff" icon={GraduationCap} color="#10b981" />
          <MetricCard title="Active Classes" value={metrics?.total_classes || 0} subtitle="Configured Grade Sections" icon={BookOpen} color="#06b6d4" />
          <MetricCard title="Today's Attendance Rate" value={`${metrics?.today_attendance_percentage || 0}%`} subtitle="Live School Presence" icon={CalendarCheck} color="#8b5cf6" />
        </div>
      ) : (role === 'student' || role === 'parent') ? (
        <div className="metrics-grid">
          <MetricCard title="My Attendance Rate" value={`${metrics?.my_attendance_percentage ?? 100}%`} subtitle="Presence Percentage" icon={CalendarCheck} color="#6366f1" />
          <MetricCard title="Cumulative GPA" value={metrics?.my_gpa ?? 'N/A'} subtitle="Calculated Academic Standing" icon={Award} color="#10b981" />
          <MetricCard title="Outstanding Fee Balance" value={`RS ${(metrics?.my_pending_fees || 0).toFixed(2)}`} subtitle="Pending Billing Invoices" icon={DollarSign} color="#f59e0b" />
          <MetricCard title="Total Exams Graded" value={metrics?.total_exams || 0} subtitle="Recorded Marksheets" icon={UserCheck} color="#06b6d4" />
        </div>
      ) : (
        <div className="metrics-grid">
          <MetricCard title="Assigned Classes" value={metrics?.my_classes_count || 0} subtitle="Active Teaching Sections" icon={BookOpen} color="#6366f1" />
          <MetricCard title="Students Taught" value={metrics?.my_students_taught || 0} subtitle="Enrolled in My Classes" icon={Users} color="#10b981" />
          <MetricCard title="Class Attendance Rate" value={`${metrics?.today_attendance_percentage || 0}%`} subtitle="Presence Rate" icon={CalendarCheck} color="#8b5cf6" />
          <MetricCard title="Active Bulletins" value={metrics?.active_notices || 0} subtitle="Posted School Notices" icon={Megaphone} color="#06b6d4" />
        </div>
      )}

      {/* Admin Password Reset Requests Queue */}
      {role === 'admin' && resetRequests.length > 0 && (
        <div className="glass-panel" style={{ border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.05)' }}>
          <div className="panel-header">
            <h3 className="panel-title" style={{ color: '#f59e0b' }}>
              <KeyRound size={20} color="#f59e0b" />
              Pending Account Password Reset Requests ({resetRequests.length})
            </h3>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Request Reason</th>
                  <th>Submitted At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {resetRequests.map((req) => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 700 }}>{req.full_name}</td>
                    <td><strong style={{ color: '#6366f1' }}>{req.username}</strong></td>
                    <td><span className={`role-badge role-${req.role}`}>{req.role}</span></td>
                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{req.reason || 'Password reset request'}</td>
                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSelectedRequest(req);
                          setFulfillModalOpen(true);
                        }}
                      >
                        <CheckCircle2 size={14} /> Fulfill & Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Attendance Trend Chart */}
        <div className="glass-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <TrendingUp size={20} color="#6366f1" />
              {role === 'admin' ? 'School-Wide Attendance Trend (%)' : 'Personal Attendance History (%)'}
            </h3>
          </div>
          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[50, 100]} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAtt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fee Breakdown Chart */}
        <div className="glass-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <DollarSign size={20} color="#10b981" />
              {role === 'admin' ? 'Overall School Fee Collection' : 'Personal Fee Billing Status'}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', height: 260 }}>
            <div style={{ width: 180, height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={feeDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {feeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{role === 'admin' ? 'Total Collected Fees' : 'Total Paid Fees'}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
                  RS {(role === 'admin' ? metrics?.collected_fees_amount : metrics?.my_paid_fees || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{role === 'admin' ? 'Total Pending Invoices' : 'Pending Fee Balance'}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>
                  RS {(role === 'admin' ? metrics?.pending_fees_amount : metrics?.my_pending_fees || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Bulletin Board */}
      <div className="glass-panel">
        <div className="panel-header">
          <h3 className="panel-title">
            <Megaphone size={20} color="#ec4899" />
            School Announcements
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {notices.length > 0 ? notices.slice(0, 3).map((n) => (
            <div key={n.id} style={{
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{n.title}</h4>
                <StatusBadge status={n.priority} />
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5' }}>{n.content}</p>
            </div>
          )) : (
            <p style={{ color: '#94a3b8', padding: '1rem' }}>No announcements posted yet.</p>
          )}
        </div>
      </div>

      {/* Admin Reset Password Modal */}
      {fulfillModalOpen && selectedRequest && (
        <Modal isOpen={fulfillModalOpen} onClose={() => setFulfillModalOpen(false)} title={`Reset Password for ${selectedRequest.full_name}`}>
          <form onSubmit={handleFulfillReset}>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Reset password for account <strong>{selectedRequest.username}</strong> ({selectedRequest.role}).
            </p>
            <div className="form-group">
              <label className="form-label">Set New Password *</label>
              <input
                type="password"
                className="form-input"
                required
                placeholder="Enter new password (e.g. pass123)"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Confirm Password Reset & Mark Fulfilled
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
