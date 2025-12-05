import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

const themes = {
  light: {
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8f9fa',
    '--bg-hover': '#e9ecef',
    '--bg-active': '#dee2e6',
    '--text-primary': '#212529',
    '--text-secondary': '#6c757d',
    '--border-color': '#dee2e6',
    '--accent-color': '#007bff',
    '--success-color': '#28a745',
    '--warning-color': '#ffc107',
    '--error-color': '#dc3545',
    '--info-color': '#17a2b8'
  },
  dark: {
    '--bg-primary': '#1a1a1a',
    '--bg-secondary': '#2d2d2d',
    '--bg-hover': '#3d3d3d',
    '--bg-active': '#454545',
    '--text-primary': '#ffffff',
    '--text-secondary': '#adb5bd',
    '--border-color': '#495057',
    '--accent-color': '#0d6efd',
    '--success-color': '#198754',
    '--warning-color': '#fd7e14',
    '--error-color': '#dc3545',
    '--info-color': '#0dcaf0'
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Load theme preference from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && themes[savedTheme]) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (themeName) => {
    const themeVars = themes[themeName];
    if (themeVars) {
      Object.entries(themeVars).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
      });
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setTheme(themeName);
      localStorage.setItem('theme', themeName);
      applyTheme(themeName);
    }
  };

  const value = {
    theme,
    themes: Object.keys(themes),
    toggleTheme,
    setTheme: changeTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
