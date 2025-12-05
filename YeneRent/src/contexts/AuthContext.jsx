import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const checkAuthStatus = () => {
      const loggedIn = sessionStorage.getItem('userLoggedIn') === 'true';
      const userData = sessionStorage.getItem('userData');

      if (loggedIn && userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }

      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      // This would normally make an API call
      // For now, we'll simulate authentication
      const mockUser = {
        id: 1,
        email: email,
        name: 'John Doe',
        avatar: null,
        role: 'admin'
      };

      setUser(mockUser);
      setIsAuthenticated(true);
      sessionStorage.setItem('userLoggedIn', 'true');
      sessionStorage.setItem('userData', JSON.stringify(mockUser));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('userLoggedIn');
    sessionStorage.removeItem('userData');
  };

  const signup = async (userData) => {
    try {
      // This would normally make an API call
      const newUser = {
        id: Date.now(),
        ...userData,
        role: 'user'
      };

      setUser(newUser);
      setIsAuthenticated(true);
      sessionStorage.setItem('userLoggedIn', 'true');
      sessionStorage.setItem('userData', JSON.stringify(newUser));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    signup
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
