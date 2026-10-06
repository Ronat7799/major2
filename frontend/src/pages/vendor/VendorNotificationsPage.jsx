import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/apiError.js';

const RANGES = [
  { value: '', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

function DocumentIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M6 2.5h5.5L15 6v11a.5.5 0 0 1-.5.5h-8A.5.5 0 0 1 6 17V3a.5.5 0 0 1 .5-.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M11.3 2.5V6H15" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="m6.8 10 2.2 2.2 4.2-4.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="m7.5 7.5 5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="2.5" y="5.5" width="15" height="10.5" rx="1.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 8.5H17" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="13.3" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M10 2.6l2.3 4.8 5.2.7-3.8 3.7.9 5.2L10 14.5l-4.6 2.5.9-5.2-3.8-3.7 5.2-.7L10 2.6Z" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M3 4.5h14a1 1 0 0 1 1 1V13a1 1 0 0 1-1 1H8l-3.8 3v-3H3a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellEmptyIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 text-black/15" fill="none" aria-hidden="true">
      <path
        d="M32 8c-7.7 0-13.5 6.1-13.5 14v7.7c0 1.6-.6 3.8-1.6 5.1l-2.9 3.9c-1.9 2.6-.6 6.1 2.6 7 9.6 2.9 21.1 2.9 30.8 0 3.2-1 4.5-4.4 2.6-7l-2.9-3.9c-1-1.3-1.6-3.5-1.6-5.1V22C45.5 14.1 39.7 8 32 8Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M37.4 50.5a5.6 5.6 0 0 1-10.8 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const NOTIFICATION_META = {
  quotation_request: { icon: DocumentIcon, bg: 'bg-blue-50', color: 'text-blue-500' },
  quotation_revision_requested: { icon: DocumentIcon, bg: 'bg-amber-50', color: 'text-amber-500' },
  quotation_accepted: { icon: CheckIcon, bg: 'bg-green-50', color: 'text-green-500' },
  payment_deposit_paid: { icon: WalletIcon, bg: 'bg-purple-50', color: 'text-purple-500' },
  payment_balance_paid: { icon: WalletIcon, bg: 'bg-teal-50', color: 'text-teal-500' },
  booking_completed: { icon: CheckIcon, bg: 'bg-blue-50', color: 'text-blue-500' },
  booking_cancelled: { icon: XCircleIcon, bg: 'bg-red-50', color: 'text-red-500' },
  review: { icon: StarIcon, bg: 'bg-amber-50', color: 'text-amber-500' },
  message: { icon: MessageIcon, bg: 'bg-sky-50', color: 'text-sky-500' },
};

function formatRelativeTime(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
}

export default function VendorNotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('');
  const [markingRead, setMarkingRead] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get(`/vendors/me/notifications${range ? `?range=${range}` : ''}`)
      .then((response) => {
        if (!cancelled) {
          setNotifications(response.data.data.notifications);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load notifications.'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  const hasUnread = notifications.some((notification) => notification.unread);

  async function handleMarkAllRead() {
    setMarkingRead(true);
    try {
      await api.post('/vendors/me/notifications/read');
      setNotifications((current) => current.map((notification) => ({ ...notification, unread: false })));
      window.dispatchEvent(new Event('vendor-notifications-read'));
    } catch {
    } finally {
      setMarkingRead(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="ui-yellow-text text-[28px] font-extrabold tracking-tight">Notifications</h1>

        <div className="flex flex-wrap items-center gap-1.5 rounded-full bg-gray-100 p-1.5">
          {RANGES.map((item) => (
            <button
              key={item.value || 'all'}
              type="button"
              onClick={() => setRange(item.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-200 ${
                range === item.value ? 'ui-yellow text-black shadow-sm' : 'text-black/55 hover:text-black'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-black">Notifications</h2>
          {hasUnread ? (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingRead}
              className="ui-yellow-text text-sm font-semibold transition-colors hover:opacity-75 disabled:opacity-40"
            >
              Mark All Read
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
            {error}
          </p>
        ) : null}

        <div className="mt-4 divide-y divide-gray-100">
          {loading ? (
            <p className="py-6 text-center text-sm text-black/40">Loading...</p>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <BellEmptyIcon />
              <p className="mt-4 text-base font-bold text-black">No notifications yet.</p>
              <p className="mt-1 text-sm text-black/50">You&apos;ll see updates about your business here.</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const meta = NOTIFICATION_META[notification.type] || {
                icon: DocumentIcon,
                bg: 'bg-gray-100',
                color: 'text-gray-500',
              };
              const Icon = meta.icon;
              const content = (
                <>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.bg} ${meta.color}`}>
                    <Icon />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${notification.unread ? 'font-semibold text-black' : 'font-medium text-black/70'}`}>
                      {notification.text}
                    </p>
                    <p className="mt-0.5 text-xs text-black/45">{formatRelativeTime(notification.timestamp)}</p>
                  </div>
                  {notification.unread ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" /> : null}
                </>
              );

              return notification.path ? (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => navigate(notification.path)}
                  className="flex w-full items-start gap-3 rounded-lg py-3.5 text-left transition-colors first:pt-0 last:pb-0 hover:bg-gray-50/70"
                >
                  {content}
                </button>
              ) : (
                <div key={notification.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                  {content}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
