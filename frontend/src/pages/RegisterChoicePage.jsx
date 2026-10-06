import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthModal from '../components/AuthModal.jsx';
import GoogleButton from '../components/GoogleButton.jsx';
import registerPanelImage from '../assets/register-panel.jpg';

const customerPoints = [
  'Browse verified vendors',
  'Request quotations',
  'Compare offers',
  'Secure online booking',
  'Real-time messaging',
];

const vendorPoints = [
  'Company profile',
  'Receive quotations',
  'Create quotations',
  'Manage bookings',
  'Track performance',
];

function YellowCheck() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        d="M3 8.5 6.2 11.5 13 4.5"
        fill="none"
        stroke="#F5C400"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PointList({ items }) {
  return (
    <ul className="mt-4 space-y-2 text-sm text-black/70">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-2">
          <YellowCheck />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function RegisterChoicePage() {
  const location = useLocation();
  const [info, setInfo] = useState('');

  return (
    <AuthModal maxWidthClassName="max-w-5xl" brandPanel brandImage={registerPanelImage}>
      <p className="ui-yellow-text text-sm font-bold tracking-tight">ReabJom</p>
      <h1 className="mt-2 text-2xl font-extrabold text-black sm:text-3xl">Create Your Account</h1>
      <p className="mt-1.5 text-sm text-black/55">Choose how you&apos;d like to use ReabJom.</p>

      <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-gray-200 p-6 transition-shadow duration-200 hover:shadow-lg">
          <h2 className="text-xl font-bold text-[#F5C400]">Customer</h2>
          <p className="mt-2 min-h-[5.5rem] text-sm leading-6 text-black/65">
            Book trusted event planning services, compare quotations, communicate with vendors, and
            manage your bookings easily.
          </p>
          <PointList items={customerPoints} />
          <div className="flex-1" />
          <Link
            to="/register/customer"
            state={location.state}
            className="ui-yellow ui-yellow-hover mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            Register as Customer
          </Link>
        </div>
        <div className="flex flex-col rounded-2xl border border-gray-200 p-6 transition-shadow duration-200 hover:shadow-lg">
          <h2 className="text-xl font-bold text-[#F5C400]">Vendor</h2>
          <p className="mt-2 min-h-[5.5rem] text-sm leading-6 text-black/65">
            Register your event planning company, receive quotations, manage bookings, and grow your
            business.
          </p>
          <PointList items={vendorPoints} />
          <div className="flex-1" />
          <Link
            to="/register/vendor"
            state={location.state}
            className="ui-yellow ui-yellow-hover mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            Register as Vendor
          </Link>
        </div>
      </div>

      <GoogleButton
        label="or continue with"
        onClick={() => setInfo('Google sign-in is not available yet.')}
      />
      {info ? <p className="mt-3 text-center text-sm text-black/55">{info}</p> : null}

      <p className="mt-6 text-center text-sm text-black/65">
        Already have an account?{' '}
        <Link
          to="/login"
          state={location.state}
          className="ui-yellow-text font-semibold underline-offset-2 hover:underline"
        >
          Sign In
        </Link>
      </p>
    </AuthModal>
  );
}
