import React, { useEffect, useState } from 'react';
import { gradeAPI, classAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { Award, Plus, FileText, CheckCircle, Edit3, Search, Filter } from 'lucide-react';

const GradesPage = () => {
  const { role } = useAuth();
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [myGrades, setMyGrades] = useState(null);

  const [isExamModal, setIsExamModal] = useState(false);
  const [isGradeModal, setIsGradeModal] = useState(false);

  const [examForm, setExamForm] = useState({ title: '', class_id: '', subject_id: '', exam_date: '', max_marks: 100 });
  const [gradeForm, setGradeForm] = useState({ exam_id: '', student_id: '', marks_obtained: '', remarks: '' });

  const fetchInitialData = async () => {
    try {
      if (role === 'student' || role === 'parent') {
        const res = await gradeAPI.getMyGrades();
        setMyGrades(res.data);
      } else {
        const [eRes, cRes, stRes] = await Promise.all([
          gradeAPI.getExams(),
          classAPI.getClasses(),
          userAPI.getStudents()
        ]);
        setExams(eRes.data);
        setClasses(cRes.data);
        setAllStudents(stRes.data);

        if (eRes.data.length > 0 && !selectedExam) {
          setSelectedExam(eRes.data[0].id.toString());
        }
      }
    } catch (err) {
      console.error("Error loading gradebook data:", err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [role]);

  useEffect(() => {
    if (selectedExam && (role === 'admin' || role === 'teacher')) {
      fetchGradesForExam();
    }
  }, [selectedExam]);

  const fetchGradesForExam = async () => {
    try {
      const [gRes, stRes] = await Promise.all([
        gradeAPI.getGrades({ exam_id: parseInt(selectedExam) }),
        userAPI.getStudents()
      ]);
      setGrades(gRes.data);
      setAllStudents(stRes.data);
    } catch (err) {
      console.error("Error loading exam grades:", err);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await gradeAPI.createExam({
        ...examForm,
        class_id: parseInt(examForm.class_id),
        subject_id: parseInt(examForm.subject_id),
        max_marks: parseFloat(examForm.max_marks)
      });
      setIsExamModal(false);
      const eRes = await gradeAPI.getExams();
      setExams(eRes.data);
      if (eRes.data.length > 0) {
        setSelectedExam(eRes.data[eRes.data.length - 1].id.toString());
      }
    } catch (err) {
      alert("Failed to create exam");
    }
  };

  const handleClassChangeInExamForm = async (classId) => {
    setExamForm({...examForm, class_id: classId});
    if (classId) {
      const sRes = await classAPI.getSubjects(parseInt(classId));
      setSubjects(sRes.data);
    }
  };

  const openGradeModalForStudent = (studentUserId, currentMarks = '', currentRemarks = '') => {
    setGradeForm({
      exam_id: selectedExam,
      student_id: studentUserId.toString(),
      marks_obtained: currentMarks,
      remarks: currentRemarks
    });
    setIsGradeModal(true);
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    try {
      await gradeAPI.submitGrade({
        exam_id: parseInt(selectedExam),
        student_id: parseInt(gradeForm.student_id),
        marks_obtained: parseFloat(gradeForm.marks_obtained),
        remarks: gradeForm.remarks
      });
      setIsGradeModal(false);
      fetchGradesForExam();
    } catch (err) {
      alert("Failed to submit grade");
    }
  };

  if (role === 'student' || role === 'parent') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="panel-header">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award color="#10b981" />
            My Report Card & Exam Transcripts
          </h2>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-header">Cumulative GPA</div>
            <div className="metric-value" style={{ color: '#10b981' }}>{myGrades?.cumulative_gpa} / 4.0</div>
          </div>
          <div className="metric-card">
            <div className="metric-header">Exams Completed</div>
            <div className="metric-value" style={{ color: '#6366f1' }}>{myGrades?.total_exams}</div>
          </div>
        </div>

        <div className="glass-panel">
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Max</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {myGrades?.report_card.map((g) => (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 700 }}>{g.exam_title}</td>
                    <td>{g.subject_name}</td>
                    <td style={{ color: '#94a3b8' }}>{g.exam_date}</td>
                    <td style={{ color: '#10b981', fontWeight: 700 }}>{g.marks_obtained}</td>
                    <td>{g.max_marks}</td>
                    <td>{g.percentage}%</td>
                    <td>
                      <span className="role-badge role-teacher">{g.grade_letter}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  const currentExamObj = exams.find(e => e.id.toString() === selectedExam);

  // Filter students across entire school roster or by selected class filter & search text
  const displayedStudents = allStudents.filter(st => {
    const matchesClass = selectedClassFilter === 'all' || (st.class_id && st.class_id.toString() === selectedClassFilter);
    const matchesSearch = !search || 
      st.user_info.full_name.toLowerCase().includes(search.toLowerCase()) || 
      st.roll_number.toLowerCase().includes(search.toLowerCase());
    return matchesClass && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="panel-header">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award color="#10b981" />
            Exams & Gradebook Management
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Schedule exams and enter marks for all enrolled students across all classes</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => {
            setGradeForm({ exam_id: selectedExam, student_id: '', marks_obtained: '', remarks: '' });
            setIsGradeModal(true);
          }}>
            <Plus size={16} />
            <span>Enter Marks</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsExamModal(true)}>
            <Plus size={16} />
            <span>Schedule New Exam</span>
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', alignItems: 'end' }}>
          <div>
            <label className="form-label">Select Active Exam</label>
            <select className="form-select" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.title} — [{e.class_name}] ({e.subject_name})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Filter Student Roster by Class</label>
            <select className="form-select" value={selectedClassFilter} onChange={(e) => setSelectedClassFilter(e.target.value)}>
              <option value="all">All Classes (Show Entire School Roster)</option>
              {classes.map(c => (
                <option key={c.id} value={c.id.toString()}>{c.name} - Section {c.section}</option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <label className="form-label">Search Student</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by student name or roll #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Gradebook Roster Table */}
      <div className="glass-panel">
        <div className="panel-header">
          <h3 className="panel-title">
            Gradebook Roster ({currentExamObj ? `${currentExamObj.title} - ${currentExamObj.subject_name}` : 'All Students'})
          </h3>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Total Enrolled Students: <strong style={{ color: '#6366f1' }}>{displayedStudents.length}</strong>
          </span>
        </div>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Roll Number</th>
                <th>Enrolled Class</th>
                <th>Marks Obtained</th>
                <th>Max Marks</th>
                <th>Percentage</th>
                <th>Grade Letter</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedStudents.length > 0 ? displayedStudents.map((st) => {
                const existingGrade = grades.find(g => g.student_id === st.user_id);
                return (
                  <tr key={st.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{st.user_info.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{st.user_info.email}</div>
                    </td>
                    <td><strong style={{ color: '#6366f1' }}>{st.roll_number}</strong></td>
                    <td><span className="role-badge role-student">{st.class_name}</span></td>

                    {existingGrade ? (
                      <>
                        <td style={{ color: '#10b981', fontWeight: 800, fontSize: '1.05rem' }}>
                          {existingGrade.marks_obtained}
                        </td>
                        <td>{existingGrade.max_marks}</td>
                        <td>{existingGrade.percentage}%</td>
                        <td>
                          <span className="role-badge role-teacher">{existingGrade.grade_letter}</span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => openGradeModalForStudent(st.user_id, existingGrade.marks_obtained, existingGrade.remarks)}
                          >
                            <Edit3 size={14} /> Edit Grade
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td colSpan={4} style={{ color: '#f59e0b', fontSize: '0.875rem', fontWeight: 600 }}>
                          ⚠️ Not Graded Yet
                        </td>
                        <td>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => openGradeModalForStudent(st.user_id)}
                          >
                            <Plus size={14} /> Enter Grade
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    No students match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Exam Modal */}
      <Modal isOpen={isExamModal} onClose={() => setIsExamModal(false)} title="Schedule New Exam">
        <form onSubmit={handleCreateExam}>
          <div className="form-group">
            <label className="form-label">Exam Title</label>
            <input type="text" className="form-input" placeholder="e.g. Midterm 2026" required value={examForm.title} onChange={(e) => setExamForm({...examForm, title: e.target.value})} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Class</label>
              <select className="form-select" required value={examForm.class_id} onChange={(e) => handleClassChangeInExamForm(e.target.value)}>
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.section}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <select className="form-select" required value={examForm.subject_id} onChange={(e) => setExamForm({...examForm, subject_id: e.target.value})}>
                <option value="">Select Subject</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Exam Date</label>
              <input type="date" className="form-input" required value={examForm.exam_date} onChange={(e) => setExamForm({...examForm, exam_date: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Marks</label>
              <input type="number" className="form-input" value={examForm.max_marks} onChange={(e) => setExamForm({...examForm, max_marks: e.target.value})} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Schedule Exam</button>
        </form>
      </Modal>

      {/* Enter Marks Modal */}
      <Modal isOpen={isGradeModal} onClose={() => setIsGradeModal(false)} title="Submit Student Grade Entry">
        <form onSubmit={handleSubmitGrade}>
          <div className="form-group">
            <label className="form-label">Select Student</label>
            <select className="form-select" required value={gradeForm.student_id} onChange={(e) => setGradeForm({...gradeForm, student_id: e.target.value})}>
              <option value="">Select Student from Directory</option>
              {allStudents.map(s => (
                <option key={s.id} value={s.user_id}>
                  {s.user_info.full_name} (Roll #{s.roll_number}) — {s.class_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Marks Obtained</label>
            <input type="number" step="0.5" className="form-input" placeholder="e.g. 95.0" required value={gradeForm.marks_obtained} onChange={(e) => setGradeForm({...gradeForm, marks_obtained: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">Remarks</label>
            <input type="text" className="form-input" placeholder="Excellent performance" value={gradeForm.remarks} onChange={(e) => setGradeForm({...gradeForm, remarks: e.target.value})} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Submit Grade</button>
        </form>
      </Modal>
    </div>
  );
};

export default GradesPage;
