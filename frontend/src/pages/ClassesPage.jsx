import React, { useEffect, useState } from 'react';
import { classAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { BookOpen, Plus, Users, DoorOpen } from 'lucide-react';

const ClassesPage = () => {
  const { role } = useAuth();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isClassModal, setIsClassModal] = useState(false);
  const [isSubjModal, setIsSubjModal] = useState(false);

  const [classForm, setClassForm] = useState({ name: '', grade_level: 10, section: 'A', room_number: 'Room 101', class_teacher_id: '' });
  const [subjForm, setSubjForm] = useState({ name: '', code: '', class_id: '', teacher_id: '' });

  const fetchData = async () => {
    try {
      const [cRes, sRes, tRes] = await Promise.all([
        classAPI.getClasses(),
        classAPI.getSubjects(),
        userAPI.getUsers('teacher')
      ]);
      setClasses(cRes.data);
      setSubjects(sRes.data);
      setTeachers(tRes.data);
    } catch (err) {
      console.error("Error loading classes:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await classAPI.createClass({
        ...classForm,
        grade_level: parseInt(classForm.grade_level),
        class_teacher_id: classForm.class_teacher_id ? parseInt(classForm.class_teacher_id) : null
      });
      setIsClassModal(false);
      fetchData();
    } catch (err) {
      alert("Failed to create class.");
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await classAPI.createSubject({
        ...subjForm,
        class_id: parseInt(subjForm.class_id),
        teacher_id: subjForm.teacher_id ? parseInt(subjForm.teacher_id) : null
      });
      setIsSubjModal(false);
      fetchData();
    } catch (err) {
      alert("Failed to add subject.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="panel-header">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen color="#6366f1" />
            Class Sections & Subject Offerings
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>School grade sections, assigned room numbers, and subject curricula</p>
        </div>

        {role === 'admin' && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => setIsSubjModal(true)}>
              <Plus size={16} />
              <span>Add Subject</span>
            </button>
            <button className="btn btn-primary" onClick={() => setIsClassModal(true)}>
              <Plus size={16} />
              <span>Add Class</span>
            </button>
          </div>
        )}
      </div>

      {/* Class Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {classes.map((c) => (
          <div key={c.id} className="glass-panel" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{c.name} - Section {c.section}</h3>
              <span className="role-badge role-teacher">{c.room_number || 'Room TBD'}</span>
            </div>

            <div style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              <div>Class Incharge: <strong style={{ color: '#f8fafc' }}>{c.class_teacher_name}</strong></div>
              <div>Students Enrolled: <strong style={{ color: '#6366f1' }}>{c.student_count}</strong></div>
              <div>Subjects Taught: <strong style={{ color: '#10b981' }}>{c.subject_count}</strong></div>
            </div>
          </div>
        ))}
      </div>

      {/* Subjects Roster Table */}
      <div className="glass-panel">
        <div className="panel-header">
          <h3 className="panel-title">Master Subject Directory</h3>
        </div>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Course Code</th>
                <th>Assigned Class</th>
                <th>Subject Teacher</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700 }}>{s.name}</td>
                  <td><span style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 700, fontSize: '0.8rem' }}>{s.code}</span></td>
                  <td>{s.class_name}</td>
                  <td style={{ color: '#10b981', fontWeight: 600 }}>{s.teacher_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Class Modal */}
      <Modal isOpen={isClassModal} onClose={() => setIsClassModal(false)} title="Create New Class">
        <form onSubmit={handleCreateClass}>
          <div className="form-group">
            <label className="form-label">Class Name</label>
            <input type="text" className="form-input" placeholder="e.g. Grade 12" required value={classForm.name} onChange={(e) => setClassForm({...classForm, name: e.target.value})} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Grade Level</label>
              <input type="number" className="form-input" value={classForm.grade_level} onChange={(e) => setClassForm({...classForm, grade_level: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Section</label>
              <input type="text" className="form-input" placeholder="A, B, C" value={classForm.section} onChange={(e) => setClassForm({...classForm, section: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Class Teacher</label>
            <select className="form-select" value={classForm.class_teacher_id} onChange={(e) => setClassForm({...classForm, class_teacher_id: e.target.value})}>
              <option value="">Select Teacher</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Save Class</button>
        </form>
      </Modal>

      {/* Add Subject Modal */}
      <Modal isOpen={isSubjModal} onClose={() => setIsSubjModal(false)} title="Create New Subject">
        <form onSubmit={handleCreateSubject}>
          <div className="form-group">
            <label className="form-label">Subject Name</label>
            <input type="text" className="form-input" placeholder="e.g. Physics 101" required value={subjForm.name} onChange={(e) => setSubjForm({...subjForm, name: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Subject Code</label>
            <input type="text" className="form-input" placeholder="PHY-101" required value={subjForm.code} onChange={(e) => setSubjForm({...subjForm, code: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Select Class</label>
            <select className="form-select" required value={subjForm.class_id} onChange={(e) => setSubjForm({...subjForm, class_id: e.target.value})}>
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Assign Teacher</label>
            <select className="form-select" value={subjForm.teacher_id} onChange={(e) => setSubjForm({...subjForm, teacher_id: e.target.value})}>
              <option value="">Select Teacher</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Save Subject</button>
        </form>
      </Modal>
    </div>
  );
};

export default ClassesPage;
