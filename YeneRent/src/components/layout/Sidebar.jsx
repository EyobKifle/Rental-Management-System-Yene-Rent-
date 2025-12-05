import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LanguageContext } from '../../contexts/LanguageContext';
import './Sidebar.css';

const Sidebar = ({ isOpen }) => {
  const { t } = useContext(LanguageContext);
  const location = useLocation();

  const navigationItems = [
    { path: '/dashboard', icon: 'fa-chart-pie', label: t('Dashboard') },
    { path: '/properties', icon: 'fa-building', label: t('Properties') },
    { path: '/tenants', icon: 'fa-users', label: t('Tenants') },
    { path: '/leases', icon: 'fa-file-lines', label: t('Leases') },
    { path: '/payments', icon: 'fa-credit-card', label: t('Payments') },
    { path: '/utilities', icon: 'fa-bolt', label: t('Utilities') },
    { path: '/maintenance', icon: 'fa-gear', label: t('Maintenance') },
    { path: '/documents', icon: 'fa-folder', label: t('Documents') },
    { path: '/analytics', icon: 'fa-chart-simple', label: t('Analytics') },
  ];

  return (
    <aside id="sidebar" className={`sidebar ${isOpen ? 'open' : ''}`}>
      <nav className="sidebar-nav">
        {navigationItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <i className={`fa-solid ${item.icon}`}></i>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
