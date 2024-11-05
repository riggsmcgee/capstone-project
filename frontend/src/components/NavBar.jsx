// src/components/NavBar.jsx
import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './NavBar.css'; // We'll create this CSS file next

const NavBar = () => {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to home after logout
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">Calendar</Link>
      </div>
      <ul className="navbar-links">
        {token ? (
          // Logged In Links
          <>
            <li>
              <Link to="/calendar-upload">Upload</Link>
            </li>
            <li>
              <Link to="/calendar-query">Query</Link>
            </li>
            <li>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </li>
          </>
        ) : (
          // Logged Out Links
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default NavBar;
