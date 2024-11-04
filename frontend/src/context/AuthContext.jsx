import React, { createContext, useState, useEffect } from 'react';

// Create the AuthContext with default values
export const AuthContext = createContext({
  token: null,
  setToken: () => {},
  userId: null,
  setUserId: () => {},
  userRole: null,
  setUserRole: () => {},
  logout: () => {},
});

// Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token');
  });

  const [userId, setUserId] = useState(() => {
    return localStorage.getItem('userId');
  });

  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('userRole');
  });

  const logout = () => {
    setToken(null);
    setUserId(null);
    setUserRole(null);
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem('userId', userId);
    } else {
      localStorage.removeItem('userId');
    }
  }, [userId]);

  useEffect(() => {
    if (userRole) {
      localStorage.setItem('userRole', userRole);
    } else {
      localStorage.removeItem('userRole');
    }
  }, [userRole]);

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken,
        userId,
        setUserId,
        userRole,
        setUserRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
