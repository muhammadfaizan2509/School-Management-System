import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  UserCheck, 
  Users, 
  GraduationCap, 
  BookOpen, 
  CalendarCheck, 
  Award, 
  CreditCard, 
  Megaphone,
  User
} from 'lucide-react';

const Sidebar = () => {
  const { role } = useAuth();

  const getMenuItems = () => {
    if (role === 'student') {
      return [
        { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/student-portal', label: 'My Student Portal', icon: UserCheck },
        { path: '/attendance', label: 'My Attendance', icon: CalendarCheck },
        { path: '/grades', label: 'Grades & Report Card', icon: Award },
        { path: '/fees', label: 'Fee Statement', icon: CreditCard },
        { path: '/notices', label: 'Notice Board', icon: Megaphone },
      ];
    }

    if (role === 'parent') {
      return [
        { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/student-portal', label: 'Child Profile & Progress', icon: UserCheck },
        { path: '/attendance', label: 'Attendance History', icon: CalendarCheck },
        { path: '/grades', label: 'Exam Results', icon: Award },
        { path: '/fees', label: 'Tuition Fees', icon: CreditCard },
        { path: '/notices', label: 'School Notices', icon: Megaphone },
      ];
    }

    if (role === 'teacher') {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/students', label: 'Students Roster', icon: Users },
        { path: '/classes', label: 'Classes & Subjects', icon: BookOpen },
        { path: '/attendance', label: 'Attendance Register', icon: CalendarCheck },
        { path: '/grades', label: 'Grades & Marksheet', icon: Award },
        { path: '/notices', label: 'Notice Board', icon: Megaphone },
      ];
    }

    // Admin default
    return [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/student-portal', label: 'Student Portal Preview', icon: UserCheck },
      { path: '/students', label: 'Student Directory', icon: Users },
      { path: '/teachers', label: 'Faculty & Staff', icon: GraduationCap },
      { path: '/classes', label: 'Classes & Subjects', icon: BookOpen },
      { path: '/attendance', label: 'Attendance Register', icon: CalendarCheck },
      { path: '/grades', label: 'Exams & Grades', icon: Award },
      { path: '/fees', label: 'Fee Management', icon: CreditCard },
      { path: '/notices', label: 'Announcements', icon: Megaphone },
    ];
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <img src="/logo.png" alt="ITC Ghotki Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>ITC GHOTKI</span>
      </div>

      <ul className="sidebar-menu">
        {getMenuItems().map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default Sidebar;
