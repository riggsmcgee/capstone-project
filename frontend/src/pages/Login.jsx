import LoginForm from '../components/auth/LoginForm';
import { Link } from 'react-router-dom';

function Login() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1>Login</h1>
      <LoginForm />
      <p className="mt-4 text-center">
        Don't have an account?{''}
        <Link to="/register" className="text-blue-500 hover:text-blue-600">
          Register here
        </Link>
      </p>
    </div>
  );
}

export default Login;
