import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function RegisterForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setToken } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    console.log('Username:', username);
    console.log('Password:', password);

    // Basic validation

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      // Step 1: Register the user
      console.log('Attempting to register user...');
      const registerResponse = await fetch(
        'http://localhost:3000/api/users/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const registerData = await registerResponse.json();
      console.log('Register response:', registerData);

      if (!registerResponse.ok) {
        console.error('Registration failed:', registerData.error);
        throw new Error(registerData.error || 'Registration failed');
      }
      console.log('Registration successful! Attempting to log in...');

      // After successful registration, automatically log in
      const loginResponse = await fetch(
        'http://localhost:3000/api/users/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        }
      );

      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);

      if (!loginResponse.ok) {
        console.error('Login after registration failed:', loginData.error);
        throw new Error(loginData.error || 'Login after registration failed');
      }

      setToken(loginData.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col">
        <label htmlFor="username" className="mb-1">
          Username:
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 rounded"
          required
          minLength={3}
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="password" className="mb-1">
          Password:
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
          required
          minLength={6}
        />
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Register
      </button>
    </form>
  );
}

export default RegisterForm;
