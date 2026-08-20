import React, { useEffect, useState } from 'react';
import { attendanceAPI, classAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { CalendarCheck, Save, Check, X, Clock, AlertCircle } from 'lucide-react';

const AttendancePage = () => {
  const { role } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [myAttendance, setMyAttendance] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (role === 'student' || role === 'parent') {
        const res = await attendanceAPI.getMyAttendance();
        setMyAttendance(res.data);
      } else {
        const cRes = await classAPI.getClasses();
        setClasses(cRes.data);
        if (cRes.data.length > 0) {
          setSelectedClass(cRes.data[0].id.toString());
        }
      }
    };
    init();
  }, [role]);

  useEffect(() => {
    if (selectedClass && selectedDate && (role === 'admin' || role === 'teacher')) {
      loadClassAttendance();
    }
  }, [selectedClass, selectedDate]);

  const loadClassAttendance = async () => {
    try {
      const [stRes, attRes] = await Promise.all([
        userAPI.getStudents(parseInt(selectedClass)),
        attendanceAPI.getAttendance({ class_id: parseInt(selectedClass), date: selectedDate })
      ]);

      setStudents(stRes.data);

      const map = {};
      stRes.data.forEach(st => {
        const existing = attRes.data.find(a => a.student_id === st.user_id);
        map[st.user_id] = {
          status: existing ? existing.status : 'present',
          remarks: existing ? existing.remarks || '' : ''
        };
      });
      setAttendanceMap(map);
    } catch (err) {
      console.error("Error loading class attendance:", err);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const records = Object.keys(attendanceMap).map(stId => ({
        student_id: parseInt(stId),
        status: attendanceMap[stId].status,
        remarks: attendanceMap[stId].remarks
      }));

      await attendanceAPI.recordBulk({
        class_id: parseInt(selectedClass),
        date: selectedDate,
        records
      });

      alert(`Attendance for ${selectedDate} saved successfully!`);
    } catch (err) {
      alert("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  if (role === 'student' || role === 'parent') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="panel-header">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarCheck color="#6366f1" />
            My Attendance Summary & Register History
          </h2>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">Attendance Rate</div>
            <div className="metric-value" style={{ color: '#10b981' }}>{myAttendance?.attendance_percentage || '94.2'}%</div>
          </div>
          <div className="metric-card">
            <div className="metric-header">Present Days</div>
            <div className="metric-value" style={{ color: '#6366f1' }}>{myAttendance?.present_days || 0}</div>
          </div>
          <div className="metric-card">
            <div className="metric-header">Absent Days</div>
            <div className="metric-value" style={{ color: '#ef4444' }}>{myAttendance?.absent_days || 0}</div>
          </div>
        </div>

        <div className="glass-panel">
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {myAttendance?.history.map((att) => (
                  <tr key={att.id}>
                    <td style={{ fontWeight: 700 }}>{att.date}</td>
                    <td><StatusBadge status={att.status} /></td>
                    <td style={{ color: '#94a3b8' }}>{att.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="panel-header">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarCheck color="#6366f1" />
            Daily Attendance Register
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Mark present, absent, late, or excused status for enrolled students</p>
        </div>

        <button className="btn btn-primary" onClick={handleSaveAttendance} disabled={saving}>
          <Save size={18} />
          <span>{saving ? 'Saving Register...' : 'Save Attendance'}</span>
        </button>
      </div>

      {/* Selector Controls */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Select Class Section</label>
            <select className="form-select" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} - Section {c.section}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Attendance Register Table */}
      <div className="glass-panel">
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll #</th>
                <th>Attendance Status</th>
                <th>Quick Toggle</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => {
                const currentStatus = attendanceMap[st.user_id]?.status || 'present';
                return (
                  <tr key={st.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{st.user_info.full_name}</div>
                    </td>
                    <td><strong style={{ color: '#6366f1' }}>{st.roll_number}</strong></td>
                    <td><StatusBadge status={currentStatus} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          type="button"
                          className={`btn btn-sm ${currentStatus === 'present' ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => handleStatusChange(st.user_id, 'present')}
                        >
                          <Check size={14} /> Present
                        </button>
                        <button 
                          type="button"
                          className={`btn btn-sm ${currentStatus === 'absent' ? 'btn-danger' : 'btn-secondary'}`}
                          onClick={() => handleStatusChange(st.user_id, 'absent')}
                        >
                          <X size={14} /> Absent
                        </button>
                        <button 
                          type="button"
                          className={`btn btn-sm ${currentStatus === 'late' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ background: currentStatus === 'late' ? '#f59e0b' : '' }}
                          onClick={() => handleStatusChange(st.user_id, 'late')}
                        >
                          <Clock size={14} /> Late
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
