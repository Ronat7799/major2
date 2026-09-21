import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import AuthModal from '../components/AuthModal.jsx';
import BackLink from '../components/BackLink.jsx';
import SelectField from '../components/SelectField.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import TextField from '../components/TextField.jsx';
import { VENDOR_CATEGORIES, VENDOR_LOCATIONS } from '../constants/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import vendorRegisterPanelImage from '../assets/vendor-register-panel.jpg';

function UploadIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#F5C400]" fill="none" aria-hidden="true">
      <path
        d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3.5 13v2a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function VendorRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [form, setForm] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    business_category: '',
    business_address: '',
    agreed: false,
  });
  const [documentName, setDocumentName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

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
        company_name: form.company_name,
        contact_person: form.contact_person,
        email: form.email,
        phone: form.phone,
        password: form.password,
        confirm_password: form.confirm_password,
        business_category: form.business_category,
        business_address: form.business_address,
        role: 'vendor',
      });
      const { token, user } = response.data.data;
      setSession(token, user);
      navigate('/vendor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthModal maxWidthClassName="max-w-5xl" brandPanel brandImage={vendorRegisterPanelImage}>
      <BackLink to="/register" state={location.state} />
      <h1 className="text-xl font-extrabold text-black sm:text-2xl">Vendor Registration</h1>
      <p className="mt-1 text-sm text-black/55">Submit your business details for approval</p>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <TextField
            label="Company Name"
            placeholder="e.g. Phnom Penh Grand Ballroom"
            value={form.company_name}
            onChange={(event) => update('company_name', event.target.value)}
            required
          />
          <TextField
            label="Contact Person"
            placeholder="e.g. Ronath Phin"
            value={form.contact_person}
            onChange={(event) => update('contact_person', event.target.value)}
            autoComplete="name"
            required
          />
          <TextField
            label="Business Email"
            type="email"
            placeholder="ronat@gmail.com"
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            autoComplete="email"
            required
          />
          <TextField
            label="Phone Number"
            type="tel"
            placeholder="+855 012 345 678"
            value={form.phone}
            onChange={(event) => update('phone', event.target.value)}
            autoComplete="tel"
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
        </div>

        <SelectField
          label="Select Your Business Category"
          placeholder="e.g. Wedding, Party, Venue..."
          value={form.business_category}
          onChange={(event) => update('business_category', event.target.value)}
          options={VENDOR_CATEGORIES}
          required
        />

        <SelectField
          label="Business Address"
          placeholder="e.g. Phnom Penh, Siem Reap, Battambang..."
          value={form.business_address}
          onChange={(event) => update('business_address', event.target.value)}
          options={VENDOR_LOCATIONS}
          required
        />

        <div>
          <span className="mb-1.5 block text-sm font-medium text-black">
            Upload Business Verification Document
          </span>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-center hover:border-[#F5C400]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm">
              <UploadIcon />
            </span>
            <span className="text-sm text-black">
              Drag &amp; drop files or{' '}
              <span className="font-semibold text-[#F5C400] underline underline-offset-2">Browse</span>
            </span>
            <span className="text-xs text-black/45">Supported formats: PDF, JPG, PNG (Max 5MB)</span>
            {documentName ? <span className="text-xs font-medium text-black/70">{documentName}</span> : null}
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(event) => setDocumentName(event.target.files?.[0]?.name || '')}
            />
          </label>
        </div>

        <label className="flex items-start gap-2 text-sm text-black/70">
          <input
            type="checkbox"
            className="ui-yellow-accent mt-1"
            checked={form.agreed}
            onChange={(event) => update('agreed', event.target.checked)}
          />
          <span>
            I agree to the{' '}
            <span className="font-semibold text-black underline underline-offset-2">Terms of Service</span>{' '}
            and <span className="font-semibold text-black underline underline-offset-2">Privacy Policy</span>.
          </span>
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <SubmitButton loading={loading}>Submit for Approval</SubmitButton>
      </form>

      <p className="mt-4 text-center text-sm text-black/65">
        Already have an account?{' '}
        <Link
          to="/login"
          state={location.state}
          className="ui-yellow-text font-semibold underline-offset-2 hover:underline"
        >
          Log In
        </Link>
      </p>
    </AuthModal>
  );
}
