import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/apiError.js';
import TextField from '../../components/TextField.jsx';
import SubmitButton from '../../components/SubmitButton.jsx';

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12.5 4.5 6 10l6.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function VendorChangePasswordPage() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });
      setSuccess('Your password has been updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => navigate('/vendor/settings'), 1200);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update your password.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-black/45">
        <button
          type="button"
          onClick={() => navigate('/vendor/settings')}
          aria-label="Back to Settings"
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-black/5 hover:text-black"
        >
          <BackIcon />
        </button>
        <Link to="/vendor/settings" className="transition-colors hover:text-black">
          Settings
        </Link>
        <span>&gt;</span>
        <span className="font-semibold text-black">Change Password</span>
      </div>

      <h1 className="ui-yellow-text mt-3 text-[28px] font-extrabold tracking-tight">Change Password</h1>
      <p className="mt-1 text-sm text-black/50">Update the password you use to sign in.</p>

      <div className="mt-6 max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            id="current_password"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <TextField
            id="new_password"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
          <TextField
            id="confirm_new_password"
            label="Confirm New Password"
            type="password"
            value={confirmNewPassword}
            onChange={(event) => setConfirmNewPassword(event.target.value)}
            autoComplete="new-password"
            required
          />

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
              {success}
            </p>
          ) : null}

          <SubmitButton loading={saving}>Update Password</SubmitButton>
        </form>
      </div>
    </div>
  );
}
