import React, { createContext, useState, useEffect } from 'react';
import { settingsService } from '../utils/settingsService'; // Import settingsService

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('light');

  useEffect(() => {
    // Load theme preference from settingsService
    const savedSettings = settingsService.getSettings();
    const savedTheme = savedSettings.appearance.theme;
    if (savedTheme) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      // If no theme saved, apply default 'light'
      applyTheme('light');
    }
  }, []);

  const applyTheme = (themeName) => {
    document.body.setAttribute('data-theme', themeName);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    const currentSettings = settingsService.getSettings();
    settingsService.saveSettings({
      ...currentSettings,
      appearance: { ...currentSettings.appearance, theme: newTheme },
    });
    applyTheme(newTheme);
  };

  const changeTheme = (themeName) => {
    setThemeState(themeName);
    const currentSettings = settingsService.getSettings();
    settingsService.saveSettings({
      ...currentSettings,
      appearance: { ...currentSettings.appearance, theme: themeName },
    });
    applyTheme(themeName);
  };

  const value = {
    theme,
    toggleTheme,
    setTheme: changeTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};