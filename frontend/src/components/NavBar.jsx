import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './NavBar.css';

const NavBar = () => {
  const { token, logout } = useContext(AuthContext);
  const { userRole } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">Calendar</Link>
      </div>
      <ul className="navbar-links">
        {token ? (
          <>
            <li>
              <Link to="/calendar-upload">Upload</Link>
            </li>
            <li>
              <Link to="/calendar-query">Query</Link>
            </li>
            <li>
              <Link to="/friends">Friends</Link>
            </li>
            {userRole === 1 && (
              <li>
                <Link to="/admin">Admin</Link>
              </li>
            )}
            <li>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </li>
          </>
        ) : (
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
