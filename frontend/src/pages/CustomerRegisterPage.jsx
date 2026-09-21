import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import AuthModal from '../components/AuthModal.jsx';
import BackLink from '../components/BackLink.jsx';
import GoogleButton from '../components/GoogleButton.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import TextField from '../components/TextField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import customerRegisterPanelImage from '../assets/customer-register-panel.jpg';

export default function CustomerRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    agreed: false,
  });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setInfo('');

    if (!form.agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        confirm_password: form.confirm_password,
        role: 'customer',
      });
      const { token, user } = response.data.data;
      setSession(token, user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthModal maxWidthClassName="max-w-3xl" brandPanel brandImage={customerRegisterPanelImage}>
      <BackLink to="/register" state={location.state} />
      <h1 className="text-2xl font-extrabold text-black sm:text-3xl">Create Your Account</h1>
      <p className="mt-1.5 text-sm text-black/55">Join our platform to start planning your events.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <TextField
          label="Full Name"
          value={form.full_name}
          onChange={(event) => update('full_name', event.target.value)}
          autoComplete="name"
          required
        />
        <TextField
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(event) => update('email', event.target.value)}
          autoComplete="email"
          required
        />
        <TextField
          label="Password"
          type="password"
          value={form.password}
          onChange={(event) => update('password', event.target.value)}
          autoComplete="new-password"
          required
        />
        <TextField
          label="Confirm Password"
          type="password"
          value={form.confirm_password}
          onChange={(event) => update('confirm_password', event.target.value)}
          autoComplete="new-password"
          required
        />
        <label className="flex items-start gap-2 text-sm text-black/70">
          <input
            type="checkbox"
            className="ui-yellow-accent mt-1"
            checked={form.agreed}
            onChange={(event) => update('agreed', event.target.checked)}
          />
          <span>I agree to the Terms of Service and Privacy Policy.</span>
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {info ? <p className="text-sm text-black/55">{info}</p> : null}
        <SubmitButton loading={loading}>Join as a Client</SubmitButton>
      </form>

      <GoogleButton
        label="Or sign up with Google"
        onClick={() => setInfo('Google sign-in is not available yet.')}
      />

      <p className="mt-6 text-center text-sm text-black/65">
        Already have an account?{' '}
        <Link
          to="/login"
          state={location.state}
          className="ui-yellow-text font-semibold underline-offset-2 hover:underline"
        >
          Login
        </Link>
      </p>
    </AuthModal>
  );
}
