import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/apiError.js';
import ImageLightbox from '../../components/ImageLightbox.jsx';

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12.5 4.5 6 10l6.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ filled, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path
        d="M10 2.5l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.6 5-.7L10 2.5Z"
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.3}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EventTypeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8h14" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8h14M7 2.5v3M13 2.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M3 6.5h2.3L6.5 4.5h7l1.2 2H17a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="11" r="3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function initialsOf(name) {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatDate(dateString) {
  if (!dateString) return 'Not specified';
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const RATING_LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };
const ASPECTS = ['Communication', 'Professionalism', 'Quality', 'Value for Money'];
const REVIEW_MAX_LENGTH = 500;

function StarRating({ value, onChange, size = 'sm', readOnly = false }) {
  const [hovered, setHovered] = useState(0);
  const display = readOnly ? value : hovered || value;
  const starClass = size === 'lg' ? 'h-9 w-9' : 'h-5 w-5';

  if (readOnly) {
    return (
      <div className="flex items-center gap-1 text-[#F5C400]">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon key={star} filled={star <= display} className={starClass} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onClick={() => onChange(star)}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          className="text-[#F5C400] transition-transform duration-150 hover:scale-110"
        >
          <StarIcon filled={star <= display} className={starClass} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [aspectRatings, setAspectRatings] = useState(() =>
    ASPECTS.reduce((acc, aspect) => ({ ...acc, [aspect]: 0 }), {})
  );

  const aspectValues = Object.values(aspectRatings);
  const allAspectsRated = aspectValues.every((value) => value > 0);
  const overallRatingRaw = allAspectsRated
    ? aspectValues.reduce((sum, value) => sum + value, 0) / aspectValues.length
    : 0;
  const overallRatingRounded = Math.round(overallRatingRaw);

  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [recommend, setRecommend] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get(`/bookings/${id}`)
      .then((response) => {
        if (!cancelled) {
          setBooking(response.data.data.booking);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load this booking.'));
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
  }, [id]);

  useEffect(() => {
    return () => {
      photos.forEach((photo) => URL.revokeObjectURL(photo.image_url));
    };
  }, []);

  function handleAddPhotos(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const newPhotos = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      image_url: URL.createObjectURL(file),
    }));
    setPhotos((current) => [...current, ...newPhotos]);
    event.target.value = '';
  }

  function handleRemovePhoto(photoId) {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === photoId);
      if (target) URL.revokeObjectURL(target.image_url);
      return current.filter((photo) => photo.id !== photoId);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!allAspectsRated) {
      setSubmitError('Please rate every aspect before submitting.');
      return;
    }

    setSubmitError('');
    setSubmitting(true);
    try {
      await api.post(`/bookings/${id}/review`, {
        rating: overallRatingRounded,
        comment: reviewText.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Unable to submit your review.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="page-fade-in mx-auto max-w-3xl px-6 py-16 text-sm text-black/60">Loading…</p>;
  }

  if (error || !booking) {
    return (
      <div className="page-fade-in mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {error || 'Booking not found.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/customer/bookings')}
          className="ui-yellow ui-yellow-hover mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
        >
          Back to My Bookings
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="page-fade-in mx-auto flex max-w-3xl flex-col items-center px-6 py-16 text-center">
        <div className="success-pop flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
          <StarIcon filled className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="mt-6 text-2xl font-extrabold text-black">Thank You for Your Review!</h1>
        <p className="mt-2 max-w-sm text-sm text-black/50">
          Your feedback has been submitted and helps other customers choose the right vendor.
        </p>
        <button
          type="button"
          onClick={() => navigate(`/customer/bookings/${id}`)}
          className="ui-yellow ui-yellow-hover mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
        >
          Back to Booking Details
        </button>
      </div>
    );
  }

  return (
    <div className="page-fade-in mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center gap-2 text-sm text-black/45">
        <button
          type="button"
          onClick={() => navigate(`/customer/bookings/${id}`)}
          aria-label="Back to Booking Details"
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-black/5 hover:text-black"
        >
          <BackIcon />
        </button>
        <span>Back to Booking Details</span>
      </div>

      <h1 className="mt-3 text-3xl font-extrabold text-black sm:text-4xl">Leave a Review</h1>
      <p className="mt-2 text-sm text-black/55">Share your experience with {booking.vendor.name}.</p>

      {submitError ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {submitError}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
      >
        <div>
          <h2 className="text-base font-bold text-black">Your Experience</h2>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black text-sm font-semibold text-white">
              {booking.vendor.logo ? (
                <img src={booking.vendor.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                initialsOf(booking.vendor.name)
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-black">{booking.vendor.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-black/50">
                <EventTypeIcon />
                {booking.event.eventType || 'Event'}
                <span className="text-black/25">·</span>
                <CalendarIcon />
                {formatDate(booking.bookingDate)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <h2 className="text-base font-bold text-black">Rate Specific Aspects</h2>
          <div className="mt-4 space-y-3.5">
            {ASPECTS.map((aspect) => (
              <div key={aspect} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-black/70">{aspect}</span>
                <StarRating
                  value={aspectRatings[aspect]}
                  onChange={(star) => setAspectRatings((current) => ({ ...current, [aspect]: star }))}
                />
              </div>
            ))}
          </div>
          {!allAspectsRated ? (
            <p className="mt-3 text-xs text-black/35">Rate every aspect to see your overall rating.</p>
          ) : null}
        </div>

        {allAspectsRated ? (
          <div className="success-pop mt-8 border-t border-gray-100 pt-6 text-center">
            <h2 className="text-base font-bold text-black">Overall Rating</h2>
            <div className="mt-4 flex justify-center">
              <StarRating value={overallRatingRounded} readOnly size="lg" />
            </div>
            <p className="mt-2 text-sm font-bold text-[#F5C400]">
              {overallRatingRaw.toFixed(1)} {RATING_LABELS[overallRatingRounded]}
            </p>
          </div>
        ) : null}

        <div className="mt-8 border-t border-gray-100 pt-6">
          <h2 className="text-base font-bold text-black">Write Your Review</h2>
          <div className="relative mt-3">
            <textarea
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value.slice(0, REVIEW_MAX_LENGTH))}
              rows={5}
              placeholder="Share the details of your experience — what made it special, what the vendor did well, any suggestions..."
              className="ui-yellow-border w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm text-black outline-none transition-shadow"
            />
            <span className="pointer-events-none absolute bottom-3 right-4 text-xs text-black/35">
              {reviewText.length} / {REVIEW_MAX_LENGTH}
            </span>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <h2 className="text-base font-bold text-black">Upload Event Photos</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <label className="flex h-28 w-28 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 text-black/40 transition-colors hover:border-[#F5C400] hover:text-[#F5C400]">
              <CameraIcon />
              <span className="text-xs font-semibold">Add Photo</span>
              <input type="file" accept="image/*" multiple onChange={handleAddPhotos} className="hidden" />
            </label>

            {photos.map((photo, photoIndex) => (
              <div key={photo.id} className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-gray-100">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(photoIndex)}
                  className="h-full w-full"
                  aria-label="View photo"
                >
                  <img src={photo.image_url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(photo.id)}
                  aria-label="Remove photo"
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
                >
                  <RemoveIcon />
                </button>
              </div>
            ))}
          </div>

          <ImageLightbox images={photos} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onNavigate={setLightboxIndex} />
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <h2 className="text-base font-bold text-black">Would you recommend this vendor?</h2>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setRecommend('yes')}
              className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                recommend === 'yes' ? 'ui-yellow text-black' : 'border border-gray-200 text-black/60 hover:bg-gray-50'
              }`}
            >
              Yes, I recommend
            </button>
            <button
              type="button"
              onClick={() => setRecommend('no')}
              className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                recommend === 'no' ? 'bg-black text-white' : 'border border-gray-200 text-black/60 hover:bg-gray-50'
              }`}
            >
              Not really
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="ui-yellow ui-yellow-hover mt-8 w-full rounded-full py-3.5 text-sm font-bold text-black shadow-sm transition-all hover:scale-[1.01] active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          {submitting ? 'Submitting…' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}
