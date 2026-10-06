import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import AuthModal from '../components/AuthModal.jsx';
import GoogleButton from '../components/GoogleButton.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import TextField from '../components/TextField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import loginPanelImage from '../assets/login-panel.jpg';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', form);
      const { token, user } = response.data.data;
      setSession(token, user);
      const redirectTo = user.role === 'customer' ? location.state?.from : null;
      navigate(redirectTo || (user.role === 'vendor' ? '/vendor/dashboard' : '/'), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthModal maxWidthClassName="max-w-3xl" brandPanel brandImage={loginPanelImage}>
      <p className="ui-yellow-text text-sm font-bold tracking-tight">ReabJom</p>
      <h1 className="mt-2 text-2xl font-extrabold text-black sm:text-3xl">Welcome Back!</h1>
      <p className="mt-1.5 text-sm text-black/55">Enter your credentials to access your account.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <TextField
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          autoComplete="email"
          required
        />
        <TextField
          label="Password"
          type="password"
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          autoComplete="current-password"
          required
        />
        <div className="text-right">
          <button
            type="button"
            className="ui-yellow-text text-sm font-medium"
            onClick={() => setInfo('Forgot password is not available yet.')}
          >
            Forgot Password?
          </button>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {info ? <p className="text-sm text-black/55">{info}</p> : null}
        <SubmitButton loading={loading}>Login</SubmitButton>
      </form>

      <GoogleButton onClick={() => setInfo('Google sign-in is not available yet.')} />

      <p className="mt-6 text-center text-sm text-black/65">
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          state={location.state}
          className="ui-yellow-text font-semibold underline-offset-2 hover:underline"
        >
          Sign Up
        </Link>
      </p>
    </AuthModal>
  );
}
