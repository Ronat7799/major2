import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import ToggleSwitch from '../../components/ToggleSwitch.jsx';
import { getErrorMessage } from '../../utils/apiError.js';

const ACCOUNT_SETTINGS_ROWS = [
  {
    key: 'email_notifications',
    title: 'Email Notifications',
    description: 'Receive instant email updates for new quotes and bookings.',
    defaultChecked: true,
  },
  {
    key: 'sms_notifications',
    title: 'SMS Notifications',
    description: 'Get urgent text message updates directly to your mobile phone.',
    defaultChecked: false,
  },
  {
    key: 'push_notifications',
    title: 'Push Notifications',
    description: 'Stay updated with real-time web alerts in your browser.',
    defaultChecked: true,
  },
  {
    key: 'two_factor_auth',
    title: 'Two-Factor Authentication',
    description: 'Secure your vendor account with an extra verification layer.',
    defaultChecked: false,
  },
];

export default function VendorSettingsPage() {
  const navigate = useNavigate();
  const [accountSettings, setAccountSettings] = useState(() =>
    ACCOUNT_SETTINGS_ROWS.reduce((acc, row) => ({ ...acc, [row.key]: row.defaultChecked }), {})
  );

  const [payoutStatus, setPayoutStatus] = useState(null);
  const [payoutLoading, setPayoutLoading] = useState(true);
  const [payoutActionLoading, setPayoutActionLoading] = useState(false);
  const [payoutError, setPayoutError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setPayoutLoading(true);

    api
      .get('/vendors/me/stripe/status')
      .then((response) => {
        if (!cancelled) {
          setPayoutStatus(response.data.data.status);
          setPayoutError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPayoutError(getErrorMessage(err, 'Unable to load payout status.'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPayoutLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleConnect() {
    setPayoutActionLoading(true);
    setPayoutError('');
    try {
      const response = await api.post('/vendors/me/stripe/onboarding-link');
      window.location.href = response.data.data.url;
    } catch (err) {
      setPayoutError(getErrorMessage(err, 'Unable to start Stripe onboarding.'));
      setPayoutActionLoading(false);
    }
  }

  return (
    <div>
      <div>
        <h1 className="ui-yellow-text text-[28px] font-extrabold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-black/50">Manage your ReabJom vendor account settings and preferences.</p>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-black">Account Settings</h2>

        <div className="mt-4 divide-y divide-gray-100">
          {ACCOUNT_SETTINGS_ROWS.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-6 rounded-lg px-2 py-4 -mx-2 transition-colors hover:bg-gray-50/70 first:pt-3"
            >
              <div>
                <p className="text-sm font-bold text-black">{row.title}</p>
                <p className="mt-0.5 text-sm text-black/45">{row.description}</p>
              </div>
              <ToggleSwitch
                checked={accountSettings[row.key]}
                onChange={(value) => setAccountSettings((current) => ({ ...current, [row.key]: value }))}
                label={row.title}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() => navigate('/vendor/settings/change-password')}
            className="flex w-full items-center justify-between gap-6 rounded-lg px-2 py-4 -mx-2 text-left transition-colors hover:bg-gray-50/70 last:pb-3"
          >
            <div>
              <p className="text-sm font-bold text-black">Change Password</p>
              <p className="mt-0.5 text-sm text-black/45">Update the password you use to sign in.</p>
            </div>
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-black">Payouts</h2>

        {payoutError ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
            {payoutError}
          </p>
        ) : null}

        {payoutLoading ? (
          <p className="mt-4 text-sm text-black/40">Loading payout status...</p>
        ) : payoutStatus?.chargesEnabled && payoutStatus?.payoutsEnabled ? (
          <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-green-50 px-4 py-3">
            <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
            <p className="text-sm font-bold text-green-700">Payouts Active</p>
          </div>
        ) : payoutStatus?.connected ? (
          <>
            <p className="mt-2 text-sm text-black/50">
              Setup incomplete — finish verifying your details with Stripe to start receiving payouts from customer
              payments.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={payoutActionLoading}
              className="ui-yellow ui-yellow-hover mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {payoutActionLoading ? 'Redirecting…' : 'Continue Setup'}
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-black/50">
              Connect a Stripe account to receive payouts from customer bookings. This takes a few minutes and is
              handled securely by Stripe.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={payoutActionLoading}
              className="ui-yellow ui-yellow-hover mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {payoutActionLoading ? 'Redirecting…' : 'Connect with Stripe'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
