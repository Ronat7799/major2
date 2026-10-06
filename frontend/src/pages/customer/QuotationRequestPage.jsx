import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/apiError.js';
import EventDateTimePicker from '../../components/customer/EventDateTimePicker.jsx';
import EventLocationPicker from '../../components/customer/EventLocationPicker.jsx';
import ImageLightbox from '../../components/ImageLightbox.jsx';
import { BlurOverlay, LoadingOverlay } from '../../components/StatusOverlay.jsx';
import { QUOTATION_EVENT_TYPES } from '../../constants/auth.js';
import { useAuth } from '../../context/AuthContext.jsx';

function LocationIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path
        d="M10 17.5s6-5.1 6-9.5a6 6 0 1 0-12 0c0 4.4 6 9.5 6 9.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function StarIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
      <path d="M10 2.5l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.6 5-.7L10 2.5Z" />
    </svg>
  );
}

function CloseIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ExpandIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path
        d="M7.5 3H3v4.5M12.5 3H17v4.5M7.5 17H3v-4.5M12.5 17H17v-4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UploadCloudIcon({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M7 17.5A4 4 0 0 1 6.5 9.6 5.5 5.5 0 0 1 17 8a4.5 4.5 0 0 1 .5 9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 20v-7M9 15.5 12 13l3 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="4" y="2.5" width="12" height="15" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 6h1.5M11.5 6H13M7 9h1.5M11.5 9H13M7 12h1.5M11.5 12H13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M10 2.5l1.4 4 4 1.4-4 1.4-1.4 4-1.4-4-4-1.4 4-1.4L10 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M13.5 3.5a3 3 0 0 0-4 3.9L4 13v2.5H6.5l5.6-5.6a3 3 0 0 0 3.9-4l-2 2-1.7-.5-.5-1.7 2-2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UtensilsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M5 2.5v6M7 2.5v6M5 8.5V17M9 2.5v15M15.5 2.5c-1.7 0-3 1.6-3 4s1.3 4 3 4V2.5Zm0 8V17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="2.5" y="5.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 5.5 8.2 3.5h3.6L13 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="10" cy="11" r="3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="2.5" y="5.5" width="10.5" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m13 8.5 4-2v7l-4-2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M8 14.5a2 2 0 1 1-2-2 2 2 0 0 1 2 2Zm7-1.5a2 2 0 1 1-2-2 2 2 0 0 1 2 2ZM8 14.5V4l7-1.5V11"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="7.5" y="2.5" width="5" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 9.5a5 5 0 0 0 10 0M10 14.5v3M7.5 17.5h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M3 12.5 4.5 8h11l1.5 4.5v3H3v-3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="6" cy="15" r="1.2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="14" cy="15" r="1.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ScissorsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="5" cy="5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5" cy="15" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6.5 6.3 16 15M6.5 13.7 16 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

const EVENT_TYPES = QUOTATION_EVENT_TYPES;

const MAX_INSPIRATION_IMAGES = 5;
const MAX_INSPIRATION_IMAGE_MB = 5;
const IMAGE_ACCEPT = 'image/png,image/jpeg';

const SERVICE_GROUPS = [
  {
    title: 'Event Setup',
    columns: 3,
    items: [
      { key: 'venue', label: 'Venue', icon: <BuildingIcon /> },
      { key: 'decoration', label: 'Decoration', icon: <SparkleIcon /> },
      { key: 'equipment_rental', label: 'Equipment Rental', icon: <WrenchIcon /> },
    ],
  },
  {
    title: 'Food & Beverage',
    items: [{ key: 'catering', label: 'Catering', icon: <UtensilsIcon /> }],
  },
  {
    title: 'Media',
    items: [
      { key: 'photography', label: 'Photography', icon: <CameraIcon /> },
      { key: 'videography', label: 'Videography', icon: <VideoIcon /> },
    ],
  },
  {
    title: 'Entertainment',
    items: [
      { key: 'dj_music', label: 'DJ / Music', icon: <MusicIcon /> },
      { key: 'mc_host', label: 'MC / Host', icon: <MicIcon /> },
    ],
  },
  {
    title: 'Support Services',
    columns: 3,
    items: [
      { key: 'transportation', label: 'Transportation', icon: <CarIcon /> },
      { key: 'makeup_hair', label: 'Makeup & Hair', icon: <ScissorsIcon /> },
      { key: 'other', label: 'Other', icon: <PlusIcon /> },
    ],
  },
];

function FieldLabel({ children }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/40">{children}</p>;
}

function LargeInput({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`ui-yellow-border w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm text-black outline-none transition-colors duration-200 placeholder:text-black/35 ${className}`}
    />
  );
}

function ServiceCheckboxCard({ label, icon, checked, onChange, className = '' }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-200 ${
        checked ? 'border-[#F5C400] bg-[#F5C400] shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      } ${className}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={`h-4 w-4 shrink-0 ${checked ? 'accent-black' : 'ui-yellow-accent'}`}
      />
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors duration-200 ${
          checked ? 'text-black' : 'text-black/55'
        }`}
      >
        {icon}
      </span>
      <span className="truncate text-sm font-semibold text-black">{label}</span>
    </label>
  );
}

export default function QuotationRequestPage() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const requestedServiceId = searchParams.get('service');
  const { user, loading: authLoading } = useAuth();

  const [vendor, setVendor] = useState(null);
  const [requestedService, setRequestedService] = useState(null);
  const [rating, setRating] = useState({ average: null, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookedDates, setBookedDates] = useState([]);

  const minEventDate = new Date();
  minEventDate.setHours(0, 0, 0, 0);
  minEventDate.setDate(minEventDate.getDate() + 3);

  const [eventType, setEventType] = useState('Wedding');
  const [services, setServices] = useState({});
  const [otherServiceNote, setOtherServiceNote] = useState('');
  const [eventDateTime, setEventDateTime] = useState({ date: null, startTime: '09:00 AM', endTime: '05:00 PM' });
  const [eventLocation, setEventLocation] = useState({ full_address: '', latitude: '', longitude: '' });
  const [guestsMin, setGuestsMin] = useState('');
  const [guestsMax, setGuestsMax] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [images, setImages] = useState([]);
  const [imageError, setImageError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const fileInputRef = useRef(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.image_url));
    };
  }, []);

  function addImageFiles(fileList) {
    const selected = Array.from(fileList || []);
    if (!selected.length) {
      return;
    }

    const remainingSlots = MAX_INSPIRATION_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setImageError(`You can upload up to ${MAX_INSPIRATION_IMAGES} images.`);
      return;
    }

    const valid = selected.filter(
      (file) => IMAGE_ACCEPT.includes(file.type) && file.size <= MAX_INSPIRATION_IMAGE_MB * 1024 * 1024
    );
    const accepted = valid.slice(0, remainingSlots);

    if (accepted.length < selected.length) {
      setImageError(`Only PNG/JPG images up to ${MAX_INSPIRATION_IMAGE_MB}MB are allowed, up to ${MAX_INSPIRATION_IMAGES} total.`);
    } else {
      setImageError('');
    }

    setImages((current) => [
      ...current,
      ...accepted.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        image_url: URL.createObjectURL(file),
      })),
    ]);
  }

  function removeImage(id) {
    setImages((current) => {
      const target = current.find((image) => image.id === id);
      if (target) {
        URL.revokeObjectURL(target.image_url);
      }
      return current.filter((image) => image.id !== id);
    });
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    addImageFiles(event.dataTransfer.files);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get(`/vendors/${vendorId}`)
      .then((response) => {
        if (!cancelled) {
          setVendor(response.data.data.vendor);
          setRating(response.data.data.rating);
          setError('');

          if (requestedServiceId) {
            const match = (response.data.data.services || []).find((service) => service.id === requestedServiceId);
            setRequestedService(match || null);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load this vendor.'));
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
  }, [vendorId, requestedServiceId]);

  useEffect(() => {
    let cancelled = false;

    api
      .get(`/vendors/${vendorId}/availability`)
      .then((response) => {
        if (!cancelled) {
          setBookedDates(response.data.data.bookedDates || []);
        }
      })
      .catch(() => {
      });

    return () => {
      cancelled = true;
    };
  }, [vendorId]);

  function toggleService(key) {
    setServices((current) => ({ ...current, [key]: !current[key] }));
  }

  function toIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function selectedServiceLabels() {
    return SERVICE_GROUPS.flatMap((group) => group.items)
      .filter((item) => services[item.key] && item.key !== 'other')
      .map((item) => item.label);
  }

  function buildFinalDescription() {
    const otherNote = services.other && otherServiceNote.trim() ? otherServiceNote.trim() : '';
    return [description.trim(), otherNote ? `Other services requested: ${otherNote}` : '']
      .filter(Boolean)
      .join('\n\n');
  }

  async function handleSubmit() {
    setSubmitError('');

    if (!eventDateTime.date) {
      setSubmitError('Please select an event date.');
      return;
    }
    if (!eventLocation.full_address) {
      setSubmitError('Please select an event location.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('vendor_id', vendorId);
      if (requestedService) {
        formData.append('service_id', requestedService.id);
      }
      formData.append('event_type', eventType);
      formData.append('event_date', toIsoDate(eventDateTime.date));
      formData.append('start_time', eventDateTime.startTime);
      formData.append('end_time', eventDateTime.endTime);
      formData.append('event_location', eventLocation.full_address);
      if (guestsMin) formData.append('guests_min', guestsMin);
      if (guestsMax) formData.append('guests_max', guestsMax);
      if (budgetMin) formData.append('budget_min', budgetMin);
      if (budgetMax) formData.append('budget_max', budgetMax);
      const finalDescription = buildFinalDescription();
      if (finalDescription) formData.append('additional_event_description', finalDescription);

      selectedServiceLabels().forEach((label) => formData.append('service_categories', label));
      images.forEach((image) => {
        if (image.file) formData.append('images', image.file);
      });

      await api.post('/quotation-requests', formData, {
        headers: { 'Content-Type': undefined },
      });

      setSubmitted(true);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Unable to submit your request.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || authLoading) {
    return <LoadingOverlay title="Loading request form..." message="Getting the vendor's details ready." />;
  }

  if (!user || user.role !== 'customer') {
    return (
      <div className="page-fade-in mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-black">Log In to Send a Request</h1>
        <p className="mt-2 text-sm text-black/55">
          Please log in with a customer account before requesting a quotation from {vendor?.company_name || 'this vendor'}.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate('/register/customer')}
            className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-semibold text-black transition-colors duration-200 hover:bg-gray-50"
          >
            Create an Account
          </button>
          <button
            type="button"
            onClick={() =>
              navigate('/login', {
                state: { from: `/vendors/${vendorId}/quotation`, backgroundLocation: location },
              })
            }
            className="ui-yellow ui-yellow-hover rounded-full px-6 py-2.5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="page-fade-in mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {error || 'Vendor not found.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/vendors')}
          className="ui-yellow ui-yellow-hover mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
        >
          Back to Browse Vendors
        </button>
      </div>
    );
  }

  return (
    <div className="page-fade-in">
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-[900px]">
          <h1 className="ui-yellow-text text-3xl font-extrabold sm:text-4xl">Create Event Request</h1>
          <p className="mt-2 text-sm text-black/55">
            Fill in your event details and send your request to the vendor.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[900px] px-6 py-10">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="rounded-2xl bg-[#F5C400]/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Sending Request To</p>
            <div className="mt-3 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black text-sm font-semibold text-white">
                {vendor.profile_image ? (
                  <img src={vendor.profile_image} alt="" className="h-full w-full object-cover" />
                ) : (
                  initialsOf(vendor.company_name)
                )}
              </div>
              <div>
                <p className="text-base font-bold text-black">{vendor.company_name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-black/55">
                  {vendor.business_address ? (
                    <span className="flex items-center gap-1.5">
                      <LocationIcon />
                      {vendor.business_address}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1.5">
                    <StarIcon className="h-4 w-4 text-black/40" />
                    {rating.total > 0 ? `${rating.average.toFixed(1)} (${rating.total} reviews)` : 'No reviews yet'}
                  </span>
                </div>
                {vendor.categories.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {vendor.categories.map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-black/55"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            {requestedService ? (
              <p className="mt-4 border-t border-black/10 pt-3 text-sm text-black/60">
                Requesting about: <span className="font-semibold text-black">{requestedService.service_name}</span>
              </p>
            ) : null}
          </div>

          <div className="my-8 border-t border-gray-100" />

          <div>
            <FieldLabel>Event Type</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEventType(type)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                    eventType === type
                      ? 'ui-yellow border-transparent text-black'
                      : 'border-gray-200 bg-white text-black/70 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <FieldLabel>Event Date &amp; Time</FieldLabel>
            <EventDateTimePicker
              value={eventDateTime}
              onChange={setEventDateTime}
              minDate={minEventDate}
              unavailableDates={bookedDates}
            />
          </div>

          <div className="mt-7">
            <FieldLabel>Event Location</FieldLabel>
            <EventLocationPicker value={eventLocation} onChange={setEventLocation} />
          </div>

          <div className="mt-7">
            <FieldLabel>Number of Guests</FieldLabel>
            <div className="grid grid-cols-2 gap-4">
              <LargeInput
                type="number"
                min="0"
                placeholder="Min Guests"
                value={guestsMin}
                onChange={(event) => setGuestsMin(event.target.value)}
              />
              <LargeInput
                type="number"
                min="0"
                placeholder="Max Guests"
                value={guestsMax}
                onChange={(event) => setGuestsMax(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-7">
            <FieldLabel>Budget Range</FieldLabel>
            <div className="grid grid-cols-2 gap-4">
              <LargeInput
                type="number"
                min="0"
                placeholder="Min Budget $"
                value={budgetMin}
                onChange={(event) => setBudgetMin(event.target.value)}
              />
              <LargeInput
                type="number"
                min="0"
                placeholder="Max Budget $"
                value={budgetMax}
                onChange={(event) => setBudgetMax(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-7">
            <FieldLabel>Required Services</FieldLabel>
            <div className="space-y-5">
              {SERVICE_GROUPS.map((group) => (
                <div key={group.title}>
                  <p className="mb-2 text-sm font-semibold text-black/70">{group.title}</p>
                  <div className={`grid grid-cols-1 gap-3 ${group.columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                    {group.items.map((item) => (
                      <ServiceCheckboxCard
                        key={item.key}
                        label={item.label}
                        icon={item.icon}
                        checked={Boolean(services[item.key])}
                        onChange={() => toggleService(item.key)}
                      />
                    ))}
                  </div>
                  {group.title === 'Support Services' && services.other ? (
                    <LargeInput
                      type="text"
                      placeholder="Please specify other services you require…"
                      className="mt-3"
                      value={otherServiceNote}
                      onChange={(event) => setOtherServiceNote(event.target.value)}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <FieldLabel>Event Description</FieldLabel>
            <textarea
              rows={6}
              placeholder="Describe your event vision, theme, special requirements…"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="ui-yellow-border w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm text-black outline-none transition-colors duration-200 placeholder:text-black/35"
            />
          </div>

          <div className="mt-7">
            <FieldLabel>Upload Inspiration Images</FieldLabel>

            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              multiple
              onChange={(event) => {
                addImageFiles(event.target.files);
                event.target.value = '';
              }}
              className="hidden"
            />

            {images.length < MAX_INSPIRATION_IMAGES ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                }}
                className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-200 ${
                  dragActive ? 'border-[#F5C400] bg-[#F5C400]/10' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <UploadCloudIcon className="h-9 w-9 text-black/35" />
                <p className="text-sm font-semibold text-black">Drag &amp; drop images here or click to browse</p>
                <p className="text-xs text-black/45">
                  PNG, JPG — up to {MAX_INSPIRATION_IMAGES} images, {MAX_INSPIRATION_IMAGE_MB}MB each
                </p>
              </button>
            ) : (
              <p className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-5 text-center text-sm text-black/45">
                Maximum of {MAX_INSPIRATION_IMAGES} images reached.
              </p>
            )}

            {imageError ? <p className="mt-2 text-sm text-red-600">{imageError}</p> : null}

            {images.length > 0 ? (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {images.map((image, imageIndex) => (
                  <div
                    key={image.id}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-gray-100 bg-gray-100"
                  >
                    <button
                      type="button"
                      onClick={() => setLightboxIndex(imageIndex)}
                      className="block h-full w-full"
                      aria-label="View image fullscreen"
                    >
                      <img
                        src={image.image_url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all duration-200 group-hover:bg-black/25 group-hover:opacity-100">
                        <ExpandIcon />
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeImage(image.id);
                      }}
                      aria-label="Remove image"
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100 hover:bg-black/80"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <ImageLightbox
            images={images}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />

          {submitError ? (
            <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
              {submitError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="ui-yellow ui-yellow-hover mt-9 w-full rounded-full py-4 text-base font-bold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            {submitting ? 'Sending…' : 'Submit Event Request'}
          </button>
        </div>
      </div>

      {submitting ? (
        <LoadingOverlay
          title="Sending your request..."
          message={`Please wait while we deliver your event details to ${vendor.company_name}.`}
        />
      ) : null}

      {submitted ? (
        <BlurOverlay>
          <div className="success-pop mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
              <path d="M5 12.5 10 17.5 19 7" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="mt-6 text-xl font-extrabold text-black">Request Sent!</h1>
          <p className="mt-2 text-sm text-black/45">
            Your event request has been sent to {vendor.company_name}. They&apos;ll review it and send you a
            quotation soon.
          </p>
          <button
            type="button"
            onClick={() => navigate('/vendors')}
            className="ui-yellow ui-yellow-hover mt-6 w-full rounded-full py-3.5 text-sm font-bold text-black shadow-sm transition-all hover:scale-[1.01] active:scale-100"
          >
            Browse More Vendors
          </button>
          <button
            type="button"
            onClick={() => navigate(`/vendors/${vendorId}`)}
            className="mt-3 w-full rounded-full border border-gray-200 py-3.5 text-sm font-semibold text-black transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            Back to Vendor
          </button>
        </BlurOverlay>
      ) : null}
    </div>
  );
}
