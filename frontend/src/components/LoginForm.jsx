import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import { AuthContext } from '../context/AuthContext';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { setToken } = useContext(AuthContext);
  const { setUserId } = useContext(AuthContext);
  const { setUserRole } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser({ username, password });
      console.log('Login successful:', data);
      // console.log(data.user.id);
      // console.log(data.user.role);

      setToken(data.token);
      setUserId(data.user.id);
      setUserRole(data.user.role);
      // console.log('Data Token:', data.token);
      console.log('Local Storage Token:', localStorage.getItem('token'));
      navigate('/calendar-query');
    } catch (error) {
      setError(error.toString());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Username:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
}

export default LoginForm;
