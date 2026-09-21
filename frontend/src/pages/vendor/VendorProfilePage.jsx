import { useEffect, useState } from 'react';
import api from '../../api/client';
import MultiSelectPills from '../../components/MultiSelectPills.jsx';
import SelectField from '../../components/SelectField.jsx';
import SubmitButton from '../../components/SubmitButton.jsx';
import TextAreaField from '../../components/TextAreaField.jsx';
import TextField from '../../components/TextField.jsx';
import LocationPicker from '../../components/vendor/LocationPicker.jsx';
import LocationView from '../../components/vendor/LocationView.jsx';
import { MAX_VENDOR_LANGUAGES, VENDOR_CATEGORIES, VENDOR_LANGUAGES, VENDOR_LOCATIONS } from '../../constants/auth.js';
import { useAuth } from '../../context/AuthContext.jsx';

const EMPTY_PROFILE = {
  company_name: '',
  contact_person: '',
  business_category: '',
  business_address: '',
  business_description: '',
  year_of_experience: '',
  languages_spoken: [],
  profile_image: '',
  cover_image: '',
  full_address: '',
  latitude: '',
  longitude: '',
  phone: '',
  email: '',
};

const IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

function toFormValues(profile) {
  return {
    company_name: profile.company_name || '',
    contact_person: profile.contact_person || '',
    business_category: profile.business_category || '',
    business_address: profile.business_address || '',
    business_description: profile.business_description || '',
    year_of_experience:
      profile.year_of_experience === null || profile.year_of_experience === undefined
        ? ''
        : String(profile.year_of_experience),
    languages_spoken: Array.isArray(profile.languages_spoken) ? profile.languages_spoken : [],
    profile_image: profile.profile_image || '',
    cover_image: profile.cover_image || '',
    full_address: profile.full_address || '',
    latitude: profile.latitude === null || profile.latitude === undefined ? '' : profile.latitude,
    longitude: profile.longitude === null || profile.longitude === undefined ? '' : profile.longitude,
    phone: profile.phone || '',
    email: profile.email || '',
  };
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M13.5 3.5l3 3L7 16H4v-3L13.5 3.5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SectionHeading({ children }) {
  return <h2 className="text-base font-bold text-black">{children}</h2>;
}

function InfoField({ label, value, multiline = false }) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-black/40">{label}</span>
      <div
        className={`rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-black ${
          multiline ? 'min-h-[88px] whitespace-pre-wrap' : ''
        }`}
      >
        {value || 'N/A'}
      </div>
    </div>
  );
}

export default function VendorProfilePage() {
  const { user, token, setSession } = useAuth();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [form, setForm] = useState(EMPTY_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get('/vendors/me');
        setProfile(toFormValues(response.data.data.profile));
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load vendor profile.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateLocation(location) {
    setForm((current) => ({
      ...current,
      full_address: location.full_address || '',
      latitude: location.latitude,
      longitude: location.longitude,
    }));
  }

  function startEditing() {
    setError('');
    setSuccessMessage('');
    setForm(profile);
    setIsEditing(true);
  }

  function cancelEditing() {
    setError('');
    setIsEditing(false);
  }

  async function handleImageUpload(event, kind) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const endpoint = kind === 'profile' ? '/vendors/me/profile-image' : '/vendors/me/cover-image';
    const setUploading = kind === 'profile' ? setUploadingProfileImage : setUploadingCoverImage;

    setError('');
    setSuccessMessage('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': undefined },
      });
      const updated = toFormValues(response.data.data.profile);
      setProfile(updated);
      setForm(updated);
      setSuccessMessage(kind === 'profile' ? 'Profile image updated.' : 'Cover image updated.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to upload image.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!form.company_name.trim() || !form.contact_person.trim()) {
      setError('Company Name and Contact Person are required.');
      return;
    }

    const hasAddress = form.full_address.trim() !== '';
    const hasLatitude = form.latitude !== '' && form.latitude !== null;
    const hasLongitude = form.longitude !== '' && form.longitude !== null;
    if ((hasAddress || hasLatitude || hasLongitude) && !(hasAddress && hasLatitude && hasLongitude)) {
      setError('Please select a location from the map search before saving.');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put('/vendors/me', form);
      const updated = toFormValues(response.data.data.profile);
      setProfile(updated);
      setSession(token, { ...user, full_name: updated.contact_person });
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update vendor profile.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-black/60">Loading…</p>;
  }

  if (!isEditing) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="h-44 w-full bg-gray-100 sm:h-52">
            {profile.cover_image ? (
              <img src={profile.cover_image} alt="Cover" className="h-full w-full object-cover" />
            ) : null}
          </div>

          <div className="px-6 pb-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="-mt-12 flex items-end gap-4 sm:-mt-10">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-black shadow-sm sm:h-24 sm:w-24">
                  {profile.profile_image ? (
                    <img src={profile.profile_image} alt="Company logo" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="pb-1">
                  <h1 className="text-xl font-bold text-black sm:text-2xl">{profile.company_name || 'N/A'}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-black/50">
                    <span>No reviews yet</span>
                    {profile.year_of_experience ? (
                      <>
                        <span aria-hidden="true">&bull;</span>
                        <span>{profile.year_of_experience} Years Experience</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={startEditing}
                className="flex items-center gap-1.5 self-start rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-50 sm:self-auto"
              >
                <PencilIcon />
                Edit Profile
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          <div className="space-y-8 px-6 py-6 sm:px-8 sm:py-8">
            <section>
              <SectionHeading>Basic Information</SectionHeading>
              <div className="mt-4 space-y-5">
                <InfoField label="Company Name" value={profile.company_name} />
                <InfoField label="Owner / Manager Name" value={profile.contact_person} />
                <InfoField label="Years of Experience" value={profile.year_of_experience} />
                <InfoField label="Languages Spoken" value={profile.languages_spoken.join(', ')} />
                <InfoField label="Business Category" value={profile.business_category} />
                <InfoField label="Business Address" value={profile.business_address} />
                <InfoField label="Company Description" value={profile.business_description} multiline />
              </div>
            </section>

            <div className="border-t border-gray-100" />

            <section>
              <SectionHeading>Contact Information</SectionHeading>
              <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
                <div className="space-y-5">
                  <InfoField label="Phone Number" value={profile.phone} />
                  <InfoField label="Email Address" value={profile.email} />
                  <InfoField label="Office Address" value={profile.full_address} />
                </div>
                <div>
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-black/40">
                    Google Maps Location
                  </span>
                  <LocationView
                    latitude={profile.latitude === '' ? null : profile.latitude}
                    longitude={profile.longitude === '' ? null : profile.longitude}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {successMessage ? <p className="mt-4 text-sm text-green-700">{successMessage}</p> : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="relative h-44 w-full bg-gray-100 sm:h-52">
          {form.cover_image ? (
            <img src={form.cover_image} alt="Cover" className="h-full w-full object-cover" />
          ) : null}
          <label className="absolute bottom-3 right-3 cursor-pointer rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-black shadow-sm hover:bg-gray-50">
            {uploadingCoverImage ? 'Uploading…' : 'Change Cover'}
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              onChange={(event) => handleImageUpload(event, 'cover')}
              disabled={uploadingCoverImage}
              className="hidden"
            />
          </label>
        </div>

        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-12 flex items-end gap-4 sm:-mt-10">
            <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
              <div className="h-full w-full overflow-hidden rounded-full border-4 border-white bg-black shadow-sm">
                {form.profile_image ? (
                  <img src={form.profile_image} alt="Company logo" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <label className="absolute -bottom-1 -right-1 cursor-pointer rounded-full border border-gray-300 bg-white p-1.5 text-black shadow-sm hover:bg-gray-50">
                <PencilIcon />
                <input
                  type="file"
                  accept={IMAGE_ACCEPT}
                  onChange={(event) => handleImageUpload(event, 'profile')}
                  disabled={uploadingProfileImage}
                  className="hidden"
                />
              </label>
            </div>
            <h1 className="pb-1 text-xl font-bold text-black sm:text-2xl">Edit Vendor Profile</h1>
          </div>
          {uploadingProfileImage ? <p className="mt-2 text-xs text-black/55">Uploading logo…</p> : null}
        </div>

        <div className="border-t border-gray-100" />

        <form onSubmit={handleSubmit} className="space-y-8 px-6 py-6 sm:px-8 sm:py-8">
          <section className="space-y-5">
            <SectionHeading>Basic Information</SectionHeading>
            <TextField
              label="Company Name"
              value={form.company_name}
              onChange={(event) => update('company_name', event.target.value)}
              required
            />
            <TextField
              label="Owner / Manager Name"
              value={form.contact_person}
              onChange={(event) => update('contact_person', event.target.value)}
              required
            />
            <TextField
              label="Years of Experience"
              type="number"
              value={form.year_of_experience}
              onChange={(event) => update('year_of_experience', event.target.value)}
            />
            <MultiSelectPills
              label="Languages Spoken"
              helperText={`Select up to ${MAX_VENDOR_LANGUAGES} languages.`}
              options={VENDOR_LANGUAGES}
              value={form.languages_spoken}
              onChange={(value) => update('languages_spoken', value)}
              max={MAX_VENDOR_LANGUAGES}
            />
            <SelectField
              label="Business Category"
              placeholder="Select a category"
              value={form.business_category}
              onChange={(event) => update('business_category', event.target.value)}
              options={VENDOR_CATEGORIES}
            />
            <SelectField
              label="Business Address"
              placeholder="Select a location"
              value={form.business_address}
              onChange={(event) => update('business_address', event.target.value)}
              options={VENDOR_LOCATIONS}
            />
            <TextAreaField
              label="Company Description"
              value={form.business_description}
              onChange={(event) => update('business_description', event.target.value)}
            />
          </section>

          <div className="border-t border-gray-100" />

          <section className="space-y-5">
            <SectionHeading>Contact Information</SectionHeading>
            <TextField
              label="Phone Number"
              type="tel"
              value={form.phone}
              onChange={(event) => update('phone', event.target.value)}
            />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-black">Email Address</span>
              <input
                type="email"
                value={form.email}
                readOnly
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-black/60 outline-none"
              />
            </label>
            <LocationPicker
              value={{
                full_address: form.full_address,
                latitude: form.latitude,
                longitude: form.longitude,
              }}
              onChange={updateLocation}
            />
          </section>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex gap-3">
            <SubmitButton loading={saving}>Save</SubmitButton>
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              className="w-full rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-black hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
