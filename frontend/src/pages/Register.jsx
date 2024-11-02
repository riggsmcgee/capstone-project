import RegisterForm from '../components/RegisterForm';
import { Link } from 'react-router-dom';

function Register() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Register</h1>
      <RegisterForm />
      <p className="mt-4 text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-500 hover:text-blue-600">
          Login here
        </Link>
      </p>
    </div>
  );
}

export default Register;
