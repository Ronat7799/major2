import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import logo from '../../assets/logo.png';

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

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Browse Vendors', to: '/vendors' },
  { label: 'Quotations', to: '/customer/quotations', requiresAuth: true },
  { label: 'Bookings', to: '/customer/bookings', requiresAuth: true },
  { label: 'Messages', to: '/customer/messages', requiresAuth: true },
];

export default function CustomerNavbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.requiresAuth || user);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="ui-yellow-text flex items-center gap-2 text-xl font-extrabold tracking-tight">
          <img src={logo} alt="" className="h-7 w-auto" />
          ReabJom
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {visibleNavItems.map((item) =>
            item.to ? (
              <NavLink
                key={item.label}
                to={item.to}
                end
                className={({ isActive }) =>
                  `nav-underline pb-1 transition-colors duration-200 ${
                    isActive ? 'ui-yellow-text is-active font-semibold' : 'text-black/65 hover:text-black'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ) : (
              <span key={item.label} className="cursor-not-allowed text-black/30">
                {item.label}
              </span>
            )
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full text-black/45 transition-transform duration-200 hover:scale-110">
                <BellIcon />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              </div>
              <button
                type="button"
                onClick={() => navigate('/customer/profile')}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-black text-xs font-semibold text-white transition-transform duration-200 hover:scale-110"
              >
                {user?.profile_image ? (
                  <img src={user.profile_image} alt="" className="h-full w-full object-cover" />
                ) : (
                  initialsOf(user?.full_name)
                )}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              state={{ backgroundLocation: location }}
              className="ui-yellow ui-yellow-hover rounded-full px-4 py-2 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
