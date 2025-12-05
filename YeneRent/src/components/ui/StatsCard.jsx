import React from 'react';
import './StatsCard.css';

const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'primary',
  className = '',
  ...props
}) => {
  const cardClasses = [
    'stats-card',
    `stats-card-${color}`,
    className
  ].filter(Boolean).join(' ');

  const renderTrend = () => {
    if (!trend || !trendValue) return null;

    const isPositive = trend === 'up';
    const trendIcon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
    const trendColor = isPositive ? 'var(--success-color)' : 'var(--error-color)';

    return (
      <div className="stats-trend" style={{ color: trendColor }}>
        <i className={`fas ${trendIcon}`}></i>
        <span>{Math.abs(trendValue)}%</span>
      </div>
    );
  };

  return (
    <div className={cardClasses} {...props}>
      <div className="stats-header">
        <div className="stats-icon">
          {icon && <i className={`fas ${icon}`}></i>}
        </div>
        {renderTrend()}
      </div>

      <div className="stats-content">
        <div className="stats-value">{value}</div>
        <div className="stats-title">{title}</div>
        {subtitle && <div className="stats-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
};

export default StatsCard;
