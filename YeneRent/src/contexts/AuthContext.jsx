// YeneRent/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('currentUser');
    const loggedIn = sessionStorage.getItem('userLoggedIn') === 'true';
    if (loggedIn && storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    if (email === 'demo@user.com' && password === 'password') {
      const dummyUser = {
        id: 'user-1',
        name: 'Demo User',
        email: email,
        avatarUrl: null,
      };
      setUser(dummyUser);
      setIsLoggedIn(true);
      sessionStorage.setItem('currentUser', JSON.stringify(dummyUser));
      sessionStorage.setItem('userLoggedIn', 'true');
      setLoading(false);
      return { success: true };
    } else {
      setLoading(false);
      return { success: false, error: 'Invalid credentials' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('userLoggedIn');
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};