import React from 'react';
import { ShieldCheck, GraduationCap, UserCheck, HeartHandshake } from 'lucide-react';

const QuickLoginCards = ({ onSelect }) => {
  const accounts = [
    {
      role: 'Admin',
      username: 'admin',
      pass: 'admin123',
      name: 'Dr. Pendelton',
      desc: 'Full System Control & Settings',
      icon: ShieldCheck,
      color: '#ef4444'
    },
    {
      role: 'Teacher',
      username: 'teacher_math',
      pass: 'teacher123',
      name: 'Dr. Sarah Mathers',
      desc: 'Class Register & Grading',
      icon: GraduationCap,
      color: '#10b981'
    },
    {
      role: 'Student',
      username: 'alex_morgan',
      pass: 'student123',
      name: 'Alex Morgan (Grade 10)',
      desc: 'Personal Portal, Grades & Fees',
      icon: UserCheck,
      color: '#6366f1'
    },
    {
      role: 'Parent',
      username: 'parent_morgan',
      pass: 'parent123',
      name: 'Marcus Morgan',
      desc: 'Child Performance Monitoring',
      icon: HeartHandshake,
      color: '#f59e0b'
    }
  ];

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
        ⚡ One-Click Demo Role Selector
      </div>
      <div className="quick-login-grid">
        {accounts.map((acc) => {
          const Icon = acc.icon;
          return (
            <div 
              key={acc.username}
              className="quick-login-card"
              onClick={() => onSelect(acc.username, acc.pass)}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: `${acc.color}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: acc.color,
                flexShrink: 0
              }}>
                <Icon size={20} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{acc.role}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {acc.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuickLoginCards;
