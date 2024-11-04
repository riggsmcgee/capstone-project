import { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CalendarUpload from './pages/CalendarUpload';
import CalendarQuery from './pages/CalendarQuery';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/calendar-upload" element={<CalendarUpload />} />
          <Route path="/calendar-query" element={<CalendarQuery />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
