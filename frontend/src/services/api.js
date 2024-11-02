import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/users/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    // console.log('Login successful:', response.data);
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Login failed';
  }
};

export default api;
