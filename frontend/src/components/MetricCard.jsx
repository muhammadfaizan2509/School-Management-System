import React from 'react';

const MetricCard = ({ title, value, subtitle, icon: Icon, color = "#6366f1" }) => {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <span>{title}</span>
        <div className="metric-icon" style={{ background: `${color}20`, color: color }}>
          {Icon && <Icon size={22} />}
        </div>
      </div>
      <div className="metric-value">{value}</div>
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    </div>
  );
};

export default MetricCard;
