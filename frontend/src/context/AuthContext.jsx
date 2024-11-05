import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

// Create the AuthContext with default values
export const AuthContext = createContext({
  token: null,
  setToken: () => {},
  userId: null,
  setUserId: () => {},
  userRole: null,
  setUserRole: () => {},
  logout: () => {},
  apiRequest: () => {},
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

  const API_BASE_URL = 'http://localhost:3000'; // Replace with your actual backend URL

  // Helper function to make API requests using fetch
  const apiRequest = async (url, method = 'GET', body = null, token = null) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Include Authorization header if token is provided
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, options);

      // Debugging: Log the response status and URL
      console.log(
        `Request to ${API_BASE_URL}${url} responded with status ${response.status}`
      );

      // Check if response status is OK (200-299)
      if (!response.ok) {
        // Attempt to parse error message
        let errorMessage = 'An error occurred';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Parse JSON response
      const data = await response.json();
      return data;
    } catch (err) {
      // Re-throw the error to be handled in the calling function
      throw err;
    }
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
        apiRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
