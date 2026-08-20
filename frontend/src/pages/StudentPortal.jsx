import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, attendanceAPI, gradeAPI, feeAPI, noticeAPI } from '../services/api';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';
import { 
  User, 
  Award, 
  CalendarCheck, 
  CreditCard, 
  BookOpen, 
  FileText, 
  Phone, 
  MapPin, 
  Calendar,
  Megaphone
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const StudentPortal = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [grades, setGrades] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [profRes, attRes, gradeRes, feeRes, noticeRes] = await Promise.allSettled([
          userAPI.getMyStudentProfile(),
          attendanceAPI.getMyAttendance(),
          gradeAPI.getMyGrades(),
          feeAPI.getMyInvoices(),
          noticeAPI.getNotices()
        ]);

        if (profRes.status === 'fulfilled') setProfile(profRes.value.data);
        if (attRes.status === 'fulfilled') setAttendance(attRes.value.data);
        if (gradeRes.status === 'fulfilled') setGrades(gradeRes.value.data);
        if (feeRes.status === 'fulfilled') setInvoices(feeRes.value.data);
        if (noticeRes.status === 'fulfilled') setNotices(noticeRes.value.data);

        if (profRes.status === 'rejected') {
          console.warn("Student profile fetch failed:", profRes.reason);
        }
      } catch (err) {
        console.error("Error loading student portal data:", err);
        setErrorMsg("Could not load complete student details.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [user]);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading Live Student Portal Data...</div>;
  }

  const reportCardList = grades?.report_card || [];
  const attendanceHistory = attendance?.history || [];
  const invoiceList = invoices || [];

  const chartData = reportCardList.map(g => ({
    subject: g.subject_name.length > 12 ? g.subject_name.substring(0, 12) + '...' : g.subject_name,
    score: g.percentage
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Student Banner Header */}
      <div className="glass-panel" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.2) 100%)',
        border: '1px solid rgba(99,102,241,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <img 
            src={profile?.user_info?.avatar || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} 
            alt="Student Avatar" 
            style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid #6366f1', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                {profile?.user_info?.full_name || user?.full_name || 'Student Account'}
              </h2>
              <span className="role-badge role-student">
                Roll #{profile?.roll_number || `STU-${user?.id}`}
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Enrolled Class: <strong style={{ color: '#f8fafc' }}>{profile?.class_name || 'Assigned Section'}</strong> | Academic Term 2026
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(15,23,42,0.6)', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>GPA Standing</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{grades?.cumulative_gpa ?? 'N/A'} / 4.0</div>
          </div>

          <div style={{ padding: '0.75rem 1.25rem', background: 'rgba(15,23,42,0.6)', borderRadius: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Attendance</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6366f1' }}>{attendance?.attendance_percentage ?? '100'}%</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <MetricCard title="Cumulative GPA" value={grades?.cumulative_gpa ?? 'N/A'} subtitle="Calculated from Gradebook" icon={Award} color="#10b981" />
        <MetricCard title="Attendance Rate" value={`${attendance?.attendance_percentage ?? 100}%`} subtitle={`${attendance?.present_days ?? 0} Present / ${attendance?.total_days ?? 0} Days`} icon={CalendarCheck} color="#6366f1" />
        <MetricCard title="Recorded Exams" value={grades?.total_exams ?? 0} subtitle="Grades Submitted" icon={FileText} color="#06b6d4" />
        <MetricCard title="Pending Invoices" value={invoiceList.filter(i => i.status !== 'paid').length} subtitle="Fee Statement" icon={CreditCard} color="#f59e0b" />
      </div>

      {/* Student Personal Data & Academic Transcripts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Personal & Bio Info Card */}
        <div className="glass-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <User size={20} color="#6366f1" />
              Student Personal Records
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94a3b8' }}>Full Name:</span>
              <strong style={{ color: '#f8fafc' }}>{profile?.user_info?.full_name || user?.full_name}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94a3b8' }}>Roll Number:</span>
              <strong>{profile?.roll_number || 'N/A'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94a3b8' }}>Class & Section:</span>
              <strong>{profile?.class_name || 'Not Enrolled'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94a3b8' }}>Date of Birth:</span>
              <span><Calendar size={14} style={{ marginRight: 4 }} />{profile?.date_of_birth || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94a3b8' }}>Gender:</span>
              <span>{profile?.gender || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94a3b8' }}>Parent / Guardian:</span>
              <strong>{profile?.parent_name || 'N/A'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#94a3b8' }}>Guardian Contact:</span>
              <span><Phone size={14} style={{ marginRight: 4 }} />{profile?.guardian_contact || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>Home Address:</span>
              <span><MapPin size={14} style={{ marginRight: 4 }} />{profile?.address || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Academic Marks & Performance Chart */}
        <div className="glass-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Award size={20} color="#10b981" />
              Subject Score Breakdown (%)
            </h3>
          </div>
          {chartData.length > 0 ? (
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '3rem' }}>No exam grades recorded for this student account yet.</p>
          )}
        </div>
      </div>

      {/* Academic Marksheet / Transcripts Table */}
      <div className="glass-panel">
        <div className="panel-header">
          <h3 className="panel-title">
            <BookOpen size={20} color="#6366f1" />
            Official Exam Transcripts & Gradebook
          </h3>
        </div>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Exam Title</th>
                <th>Subject Name</th>
                <th>Exam Date</th>
                <th>Marks Obtained</th>
                <th>Max Marks</th>
                <th>Percentage</th>
                <th>Grade Letter</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {reportCardList.length > 0 ? reportCardList.map((g) => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 700 }}>{g.exam_title}</td>
                  <td>{g.subject_name}</td>
                  <td style={{ color: '#94a3b8' }}>{g.exam_date}</td>
                  <td style={{ fontWeight: 700, color: '#10b981' }}>{g.marks_obtained}</td>
                  <td>{g.max_marks}</td>
                  <td>{g.percentage}%</td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      background: g.percentage >= 85 ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)',
                      color: g.percentage >= 85 ? '#6ee7b7' : '#a5b4fc'
                    }}>
                      {g.grade_letter}
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{g.remarks}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                    No transcript entries available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee Statement & Attendance History */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Fee Invoices */}
        <div className="glass-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <CreditCard size={20} color="#f59e0b" />
              Fee Statement & Billing
            </h3>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Invoice Title</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoiceList.length > 0 ? invoiceList.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 600 }}>{inv.title}</td>
                    <td style={{ fontWeight: 700 }}>RS {inv.amount.toFixed(2)}</td>
                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{inv.due_date}</td>
                    <td><StatusBadge status={inv.status} /></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                      No invoices issued for this student.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance Log History */}
        <div className="glass-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <CalendarCheck size={20} color="#06b6d4" />
              Recent Attendance Log History
            </h3>
          </div>
          <div className="table-container" style={{ maxHeight: 280, overflowY: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.length > 0 ? attendanceHistory.map((att) => (
                  <tr key={att.id}>
                    <td style={{ fontWeight: 600 }}>{att.date}</td>
                    <td><StatusBadge status={att.status} /></td>
                    <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{att.remarks || '-'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="glass-panel">
        <div className="panel-header">
          <h3 className="panel-title">
            <Megaphone size={20} color="#ec4899" />
            School Announcements
          </h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {notices.map((n) => (
            <div key={n.id} style={{
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>{n.title}</h4>
                <StatusBadge status={n.priority} />
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.5' }}>{n.content}</p>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>
                Posted by {n.posted_by_name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
