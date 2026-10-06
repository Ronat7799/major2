import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext.jsx';

function BellIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M10 2.5c-2.5 0-4.2 1.9-4.2 4.4v2.4c0 .5-.2 1.2-.5 1.6L4.4 12.3c-.6.8-.2 1.9.8 2.2 3 .9 6.6.9 9.6 0 .9-.3 1.3-1.4.8-2.2l-.9-1.4c-.3-.4-.5-1.1-.5-1.6V6.9c0-2.4-1.8-4.4-4.2-4.4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M11.7 16.9a1.8 1.8 0 0 1-3.4 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function initialsOf(name) {
  if (!name) {
    return '';
  }
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

const UNREAD_POLL_MS = 45000;

export default function VendorTopbar() {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadProfileImage() {
      try {
        const response = await api.get('/vendors/me');
        if (!cancelled) {
          setProfileImage(response.data.data.profile.profile_image || null);
        }
      } catch {
      }
    }

    loadProfileImage();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    function loadUnreadCount() {
      api
        .get('/vendors/me/notifications/unread-count')
        .then((response) => {
          if (!cancelled) {
            setUnreadCount(response.data.data.count);
          }
        })
        .catch(() => {
        });
    }

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, UNREAD_POLL_MS);
    window.addEventListener('vendor-notifications-read', loadUnreadCount);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('vendor-notifications-read', loadUnreadCount);
    };
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-end gap-4 border-b border-gray-200 bg-white px-8">
      <Link
        to="/vendor/notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-black/45 transition-colors hover:bg-black/5 hover:text-black/70"
      >
        <BellIcon />
        {unreadCount > 0 ? <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" /> : null}
      </Link>

      <Link
        to="/vendor/profile"
        className="flex items-center gap-3 rounded-full py-1 pl-3 pr-1 transition-colors hover:bg-black/5"
      >
        <span className="text-sm font-semibold text-black">{user?.full_name}</span>
        <div className="h-9 w-9 overflow-hidden rounded-full bg-black text-xs font-semibold text-white">
          {profileImage ? (
            <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              {initialsOf(user?.full_name)}
            </span>
          )}
        </div>
      </Link>
    </header>
  );
}
