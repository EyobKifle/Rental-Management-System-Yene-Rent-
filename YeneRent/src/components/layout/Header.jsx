import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { LanguageContext } from '../../contexts/LanguageContext';
import './Header.css';

const Header = ({ onSidebarToggle, pageTitle }) => {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const { language, setLanguage, t } = useContext(LanguageContext);
  const navigate = useNavigate();

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setShowLanguageMenu(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button
          id="sidebar-toggle"
          className="header-icon-btn"
          onClick={onSidebarToggle}
        >
          <i className="fa-solid fa-bars"></i>
        </button>
      </div>

      <div className="header-center">
        <h1 id="page-title">{pageTitle || t('Rental Management')}</h1>
      </div>

      <div className="header-right">
        <div className="language-menu menu-container">
          <button
            id="language-menu-button"
            className="header-icon-btn"
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          >
            <i className="fa-solid fa-globe"></i>
          </button>
          {showLanguageMenu && (
            <div id="language-menu-dropdown" className="dropdown-menu">
              <a
                href="#"
                className="dropdown-item"
                onClick={() => handleLanguageChange('en')}
              >
                {t('English')}
              </a>
              <a
                href="#"
                className="dropdown-item"
                onClick={() => handleLanguageChange('am')}
              >
                {t('Amharic')}
              </a>
            </div>
          )}
        </div>

        <button className="header-icon-btn notification-btn">
          <i className="fa-solid fa-bell"></i>
          <span className="notification-badge hidden"></span>
        </button>

        <div className="user-menu menu-container">
          <button
            id="user-menu-button"
            className="header-icon-btn"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div id="user-avatar-container" className="user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt="User avatar" />
              ) : (
                <i className="fa-solid fa-user"></i>
              )}
            </div>
          </button>
          {showUserMenu && (
            <div id="user-menu-dropdown" className="dropdown-menu">
              <a href="#" className="dropdown-item" onClick={() => navigate('/profile')}>
                {t('My Profile')}
              </a>
              <a href="#" className="dropdown-item" onClick={() => navigate('/settings')}>
                {t('Settings')}
              </a>
              <div className="dropdown-divider"></div>
              <a href="#" id="logout-btn" className="dropdown-item" onClick={handleLogout}>
                {t('Log Out')}
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
