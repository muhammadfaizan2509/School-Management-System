import React from 'react';

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase();
  return (
    <span className={`status-pill status-${normalized}`}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: 'currentColor'
      }} />
      {status}
    </span>
  );
};

export default StatusBadge;
