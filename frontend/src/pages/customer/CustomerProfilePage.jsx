import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/apiError.js';
import { useAuth } from '../../context/AuthContext.jsx';

const MOCK_PROFILE_DETAILS = {
  phone: '+855 12 345 678',
  date_of_birth: 'March 15, 1995',
  location: 'Phnom Penh, Cambodia',
  preferred_language: 'Khmer / English',
  member_since: '2023',
};

const MOCK_VENDORS = [
  {
    id: 1,
    name: 'Elegant Moments',
    category: 'Wedding Planner',
    rating: 0,
    image:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 2,
    name: 'Royal Events',
    category: 'Catering',
    rating: 0,
    image:
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 3,
    name: 'Lumina Studio',
    category: 'Photography',
    rating: 0,
    image:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
  },
];

const CARD_SHADOW = 'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_rgba(16,24,40,0.06)]';

const DEFAULT_SETTINGS = [
  { key: 'email_notifications', label: 'Email Notifications', enabled: true },
  { key: 'sms_notifications', label: 'SMS Notifications', enabled: false },
  { key: 'push_notifications', label: 'Push Notifications', enabled: true },
  { key: 'two_factor_auth', label: 'Two-Factor Authentication', enabled: false },
];

function CameraIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M7 5.5 8 4h4l1 1.5h1.5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1H7Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10.2" r="2.3" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.5 17c.8-3.4 3.6-5.5 6.5-5.5s5.7 2.1 6.5 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10 2.8v1.6M10 15.6v1.6M17.2 10h-1.6M4.4 10H2.8M15 5l-1.1 1.1M6.1 13.9 5 15M15 15l-1.1-1.1M6.1 6.1 5 5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M8 3.5H4.5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1H8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12.5 13.5 16 10l-3.5-3.5M16 10H7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ filled }) {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path
        d="M10 2.5l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.6 5-.7L10 2.5Z"
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.3}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path
        d="M10 17.5c-.3 0-.6-.1-.8-.3C6.7 15 2 10.9 2 7.2 2 4.6 4 2.5 6.5 2.5c1.4 0 2.7.7 3.5 1.8.8-1.1 2.1-1.8 3.5-1.8 2.5 0 4.5 2.1 4.5 4.7 0 3.7-4.7 7.8-7.2 10-.2.2-.5.3-.8.3Z"
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m4 17 5-5 3.5 3.5L16 12l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'ui-yellow' : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

const SIDEBAR_TABS = [
  { key: 'info', label: 'Personal Information', icon: PersonIcon },
  { key: 'settings', label: 'Account Settings', icon: GearIcon },
];

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

function ProfileSidebar({ user, activeTab, onSelectTab, onSignOut, onUploadImage, uploadingImage, uploadError }) {
  return (
    <aside className={`h-fit rounded-2xl bg-white p-6 ${CARD_SHADOW}`}>
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-black text-lg font-semibold text-white">
            {user?.profile_image ? (
              <img src={user.profile_image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{initialsOf(user?.full_name)}</span>
            )}
          </div>
          <label className="ui-yellow absolute -bottom-0.5 -right-0.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white text-black transition-transform duration-200 hover:scale-110">
            <CameraIcon />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={onUploadImage}
              disabled={uploadingImage}
              className="hidden"
            />
          </label>
        </div>
        {uploadingImage ? <p className="mt-2 text-xs text-black/45">Uploading photo…</p> : null}
        {uploadError ? <p className="mt-2 text-xs text-red-600">{uploadError}</p> : null}
        <p className="mt-4 text-base font-bold leading-snug text-black">{user?.full_name || 'Guest User'}</p>
        <p className="text-sm text-black/50">{user?.email}</p>
        <p className="mt-1 text-xs text-black/40">Member since {MOCK_PROFILE_DETAILS.member_since}</p>
      </div>

      <nav className="mt-6 space-y-1.5">
        {SIDEBAR_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold transition-colors duration-200 ${
                isActive ? 'ui-yellow text-black' : 'text-black/65 hover:bg-black/5'
              }`}
            >
              <Icon />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold text-red-500 transition-colors duration-200 hover:bg-red-50"
        >
          <SignOutIcon />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

function PersonalInformationCard({ user, onEditClick, editNotice }) {
  const fields = [
    { label: 'Full Name', value: user?.full_name || 'N/A' },
    { label: 'Email', value: user?.email || 'N/A' },
    { label: 'Phone', value: MOCK_PROFILE_DETAILS.phone },
    { label: 'Date of Birth', value: MOCK_PROFILE_DETAILS.date_of_birth },
    { label: 'Location', value: MOCK_PROFILE_DETAILS.location },
    { label: 'Preferred Language', value: MOCK_PROFILE_DETAILS.preferred_language },
  ];

  return (
    <section className={`rounded-2xl bg-white p-6 ${CARD_SHADOW} sm:p-8`}>
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold text-black">Personal Information</h2>
        <button
          type="button"
          onClick={onEditClick}
          className="ui-yellow-text text-sm font-semibold underline underline-offset-2"
        >
          Edit
        </button>
      </div>
      {editNotice ? <p className="mt-3 text-xs text-black/45">{editNotice}</p> : null}
      <div className="mt-7 grid grid-cols-1 gap-x-16 gap-y-8 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/40">{field.label}</p>
            <p className="mt-1.5 text-sm font-semibold text-black">{field.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function VendorMiniCard({ vendor, onUnsave }) {
  return (
    <div
      className={`group overflow-hidden rounded-2xl bg-white ${CARD_SHADOW} transition-transform duration-200 hover:-translate-y-1`}
    >
      <div className="relative h-36 w-full overflow-hidden bg-gray-100">
        {vendor.image ? (
          <img
            src={vendor.image}
            alt={vendor.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <ImagePlaceholderIcon />
          </div>
        )}
        {onUnsave ? (
          <button
            type="button"
            aria-label="Remove from saved vendors"
            onClick={() => onUnsave(vendor)}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm transition-transform duration-200 hover:scale-110"
          >
            <HeartIcon filled />
          </button>
        ) : (
          <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm">
            <HeartIcon filled />
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-bold text-black">{vendor.name}</p>
        <p className="mt-0.5 text-xs text-black/45">{vendor.category}</p>
        <div className="mt-2.5 flex items-center gap-0.5 text-[#F5C400]">
          {Array.from({ length: 5 }).map((_, index) => (
            <StarIcon key={index} filled={index < vendor.rating} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VendorRow({ title, vendors, emptyMessage, onUnsave }) {
  return (
    <section className={`rounded-2xl bg-white p-6 ${CARD_SHADOW} sm:p-8`}>
      <h2 className="text-lg font-bold text-black">{title}</h2>
      {vendors.length === 0 ? (
        <p className="mt-4 text-sm text-black/50">{emptyMessage}</p>
      ) : (
        <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <VendorMiniCard key={vendor.id} vendor={vendor} onUnsave={onUnsave} />
          ))}
        </div>
      )}
    </section>
  );
}

function AccountSettingsCard({ settings, onToggle, onChangePassword }) {
  return (
    <section className={`rounded-2xl bg-white p-6 ${CARD_SHADOW} sm:p-8`}>
      <h2 className="text-lg font-bold text-black">Account Settings</h2>
      <div className="mt-6 divide-y divide-gray-100">
        {settings.map((setting) => (
          <div key={setting.key} className="flex items-center justify-between py-4 first:pt-0">
            <p className="text-sm font-semibold text-black">{setting.label}</p>
            <ToggleSwitch
              checked={setting.enabled}
              label={setting.label}
              onChange={() => onToggle(setting.key)}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={onChangePassword}
          className="flex w-full items-center justify-between gap-6 py-4 text-left last:pb-0"
        >
          <div>
            <p className="text-sm font-semibold text-black">Change Password</p>
            <p className="mt-0.5 text-xs text-black/45">Update the password you use to sign in.</p>
          </div>
        </button>
      </div>
    </section>
  );
}

function toSavedServiceCard(row) {
  return {
    id: row.id,
    service_id: row.service_id,
    vendor_id: row.vendor_id,
    name: row.service_name,
    category: row.company_name,
    rating: 0,
    image: row.cover_image || row.profile_image || null,
  };
}

export default function CustomerProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [editNotice, setEditNotice] = useState('');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedServices, setSavedServices] = useState([]);
  const [savedServicesLoading, setSavedServicesLoading] = useState(true);
  const [savedServicesError, setSavedServicesError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadSavedServices() {
      try {
        const response = await api.get('/saved-services');
        if (!cancelled) {
          setSavedServices(response.data.data.services.map(toSavedServiceCard));
        }
      } catch (err) {
        if (!cancelled) {
          setSavedServicesError(getErrorMessage(err, 'Unable to load saved vendors.'));
        }
      } finally {
        if (!cancelled) {
          setSavedServicesLoading(false);
        }
      }
    }

    loadSavedServices();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSignOut() {
    logout();
    navigate('/login');
  }

  async function handleUploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadError('');
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/users/me/profile-image', formData, {
        headers: { 'Content-Type': undefined },
      });
      updateUser(response.data.data.user);
    } catch (err) {
      setUploadError(getErrorMessage(err, 'Unable to upload photo.'));
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  }

  function toggleSetting(key) {
    setSettings((current) =>
      current.map((setting) => (setting.key === key ? { ...setting, enabled: !setting.enabled } : setting))
    );
  }

  async function handleUnsaveService(service) {
    setSavedServices((current) => current.filter((item) => item.service_id !== service.service_id));
    try {
      await api.delete(`/saved-services/${service.service_id}`);
    } catch {
      setSavedServices((current) => [...current, service]);
    }
  }

  return (
    <div className="page-fade-in min-h-screen bg-[#f8f9fb]">
      <div className="border-b border-gray-100 bg-[#f4f5f7] px-6 py-10">
        <div className="mx-auto max-w-[1600px]">
          <h1 className="ui-yellow-text text-3xl font-extrabold tracking-tight">My Profile</h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-10">
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[280px_1fr]">
          <ProfileSidebar
            user={user}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onSignOut={handleSignOut}
            onUploadImage={handleUploadImage}
            uploadingImage={uploadingImage}
            uploadError={uploadError}
          />

          {activeTab === 'info' ? (
            <div className="space-y-6">
              <PersonalInformationCard
                user={user}
                editNotice={editNotice}
                onEditClick={() => setEditNotice('Editing your profile isn’t available yet.')}
              />
              {savedServicesLoading ? (
                <section className={`rounded-2xl bg-white p-6 ${CARD_SHADOW} sm:p-8`}>
                  <h2 className="text-lg font-bold text-black">Saved Vendors</h2>
                  <p className="mt-4 text-sm text-black/50">Loading…</p>
                </section>
              ) : savedServicesError ? (
                <section className={`rounded-2xl bg-white p-6 ${CARD_SHADOW} sm:p-8`}>
                  <h2 className="text-lg font-bold text-black">Saved Vendors</h2>
                  <p className="mt-4 text-sm text-red-600">{savedServicesError}</p>
                </section>
              ) : (
                <VendorRow
                  title="Saved Vendors"
                  vendors={savedServices}
                  emptyMessage="Tap the heart icon on a vendor to save it here."
                  onUnsave={handleUnsaveService}
                />
              )}
              <VendorRow title="Recent Vendors" vendors={MOCK_VENDORS} emptyMessage="No recently viewed vendors yet." />
            </div>
          ) : (
            <AccountSettingsCard
              settings={settings}
              onToggle={toggleSetting}
              onChangePassword={() => navigate('/customer/change-password')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
