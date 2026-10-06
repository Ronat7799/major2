import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/apiError.js';
import ImageLightbox from '../../components/ImageLightbox.jsx';
import RevisionRequestNotice from '../../components/vendor/RevisionRequestNotice.jsx';

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12.5 4.5 6 10l6.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M3 4.5h14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H8l-3.5 3v-3H3a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeclineIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8h14M7 2.5v3M13 2.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function EventTypeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8h14" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M10 17.5s5.5-4.7 5.5-9A5.5 5.5 0 0 0 4.5 8.5c0 4.3 5.5 9 5.5 9Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function GuestsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 16c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="14" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12.5 12.2c2 .2 3.5 1.6 3.5 3.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function BudgetIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="2.5" y="5" width="15" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.4" />
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

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <rect x="4.5" y="9" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const STATUS_STYLES = {
  NEW: 'bg-blue-50 text-blue-600',
  PENDING: 'bg-amber-50 text-amber-600',
  ACCEPTED: 'bg-green-50 text-green-600',
  DECLINED: 'bg-red-50 text-red-600',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

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

function formatLongDate(dateString) {
  if (!dateString) {
    return 'Not specified';
  }
  return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatEventDate(dateString) {
  if (!dateString) {
    return 'Not specified';
  }
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMemberSince(dateString) {
  if (!dateString) {
    return 'Not available';
  }
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatTime(timeString) {
  if (!timeString) {
    return null;
  }
  const [hourStr, minuteStr] = timeString.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${period}`;
}

function formatTimeRange(startTime, endTime) {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  if (start && end) return `${start} - ${end}`;
  return start || end || 'Not specified';
}

function formatRange(min, max, prefix = '') {
  const hasMin = min !== null && min !== undefined;
  const hasMax = max !== null && max !== undefined;
  if (!hasMin && !hasMax) {
    return 'Not specified';
  }
  if (hasMin && hasMax && Number(min) !== Number(max)) {
    return `${prefix}${Number(min).toLocaleString('en-US')} - ${prefix}${Number(max).toLocaleString('en-US')}`;
  }
  return `${prefix}${Number(hasMin ? min : max).toLocaleString('en-US')}`;
}

function DetailField({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-black/35">{icon}</span>
      <div>
        <p className="text-xs font-medium text-black/40">{label}</p>
        <p className="mt-0.5 text-sm font-bold text-black">{value}</p>
      </div>
    </div>
  );
}

export default function QuotationRequestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get(`/quotation-requests/${id}`)
      .then((response) => {
        if (!cancelled) {
          setRequest(response.data.data.request);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load this quotation request.'));
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

  if (loading) {
    return <p className="text-sm text-black/60">Loading…</p>;
  }

  if (error || !request) {
    return (
      <div className="text-center">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {error || 'Quotation request not found.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/vendor/quotation-requests')}
          className="ui-yellow ui-yellow-hover mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
        >
          Back to Requests
        </button>
      </div>
    );
  }

  const canMessage = request.latestQuotation?.status === 'revision_requested';

  async function handleMessageCustomer() {
    if (!canMessage || sendingInvite) {
      return;
    }
    setSendingInvite(true);
    setInviteError('');
    try {
      const response = await api.post(`/quotations/${request.latestQuotation.id}/chat-invite`);
      const conversationId = response.data.data.conversationId;
      navigate('/vendor/messages', { state: { conversationId } });
    } catch (err) {
      setInviteError(getErrorMessage(err, 'Unable to start a chat with this customer.'));
    } finally {
      setSendingInvite(false);
    }
  }

  async function handleDecline() {
    if (declining) {
      return;
    }
    setDeclining(true);
    setInviteError('');
    try {
      const response = await api.post(`/quotation-requests/${id}/decline`);
      setRequest((current) => ({ ...current, status: response.data.data.request.status }));
    } catch (err) {
      setInviteError(getErrorMessage(err, 'Unable to decline this request.'));
    } finally {
      setDeclining(false);
    }
  }

  const isAccepted = request.status === 'ACCEPTED';
  const displayedServices = request.services.filter(
    (service) => service.trim().toLowerCase() !== 'other' && !service.trim().toLowerCase().startsWith('other:')
  );

  return (
    <div className="pb-4">
      <div className="flex items-center gap-2 text-sm text-black/45">
        <button
          type="button"
          onClick={() => navigate('/vendor/quotation-requests')}
          aria-label="Back to Requests"
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-black/5 hover:text-black"
        >
          <BackIcon />
        </button>
        <Link to="/vendor/quotation-requests" className="transition-colors hover:text-black">
          Quotation Requests
        </Link>
        <span>&gt;</span>
        <span className="font-semibold text-black">Request Details</span>
      </div>

      {location.state?.quotationSent ? (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
          Quotation sent to the customer.
        </p>
      ) : null}

      {inviteError ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {inviteError}
        </p>
      ) : null}

      {request.latestQuotation?.status === 'revision_requested' ? (
        <RevisionRequestNotice className="mt-4" note={request.latestQuotation.revisionNote} />
      ) : null}

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-black sm:text-[28px]">
            {request.eventType || 'Event'} — {request.customer.name}
          </h1>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[request.status] || STATUS_STYLES.CANCELLED}`}
          >
            {request.status}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {request.status === 'NEW' ? (
            <button
              type="button"
              onClick={() => navigate(`/vendor/quotation-requests/${id}/create-quotation`)}
              className="ui-yellow ui-yellow-hover rounded-full px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition-all hover:scale-[1.02]"
            >
              Create Quotation
            </button>
          ) : null}
          {request.latestQuotation?.status === 'revision_requested' ? (
            <button
              type="button"
              onClick={() => navigate(`/vendor/quotation-requests/${id}/create-quotation`)}
              className="ui-yellow ui-yellow-hover rounded-full px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition-all hover:scale-[1.02]"
            >
              Revise Quotation
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Message customer"
            title={canMessage ? 'Message customer' : 'Available once the customer requests changes'}
            disabled={!canMessage || sendingInvite}
            onClick={handleMessageCustomer}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-gray-200 text-black/60 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-transparent"
          >
            <MessageIcon />
          </button>
          {request.status === 'NEW' ? (
            <button
              type="button"
              onClick={handleDecline}
              disabled={declining}
              aria-label="Decline request"
              title="Decline"
              className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <DeclineIcon />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="ui-yellow-text text-base font-bold">Customer Information</h2>
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black text-base font-semibold text-white">
              {initialsOf(request.customer.name)}
            </div>
            <div>
              <p className="text-base font-bold text-black">{request.customer.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-black/45">
                <CalendarIcon />
                Member since {formatMemberSince(request.customer.memberSince)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Email</p>
              <p className="mt-1 text-sm font-semibold text-black">{request.customer.email || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Phone</p>
              {isAccepted ? (
                <p className="mt-1 text-sm font-semibold text-black">{request.customer.phone || 'Not provided'}</p>
              ) : (
                <p className="mt-1 flex items-center gap-1.5 text-sm italic text-black/40">
                  Contact info visible after acceptance <LockIcon />
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="ui-yellow-text text-base font-bold">Event Summary</h2>

        <div className="mt-4 border-t border-gray-100 pt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-black/40">Event Details</p>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField icon={<EventTypeIcon />} label="Event Type" value={request.eventType || 'Not specified'} />
            <DetailField icon={<CalendarIcon />} label="Date" value={formatEventDate(request.eventDate)} />
            <DetailField
              icon={<ClockIcon />}
              label="Time"
              value={formatTimeRange(request.startTime, request.endTime)}
            />
            <DetailField icon={<PinIcon />} label="Location" value={request.location || 'Not specified'} />
            <DetailField
              icon={<GuestsIcon />}
              label="Number of Guests"
              value={`${formatRange(request.guestsMin, request.guestsMax)}${
                request.guestsMin || request.guestsMax ? ' Guests' : ''
              }`}
            />
            <DetailField
              icon={<BudgetIcon />}
              label="Budget Range"
              value={formatRange(request.budgetMin, request.budgetMax, '$')}
            />
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-black/40">Event Description</p>
          <div className="mt-3 whitespace-pre-line rounded-xl bg-gray-50 px-4 py-3.5 text-sm leading-relaxed text-black/70">
            {request.description || 'The customer did not add an event description.'}
          </div>
        </div>

        {request.requestedService ? (
          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-xs font-bold uppercase tracking-wide text-black/40">Requested Service</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full ui-yellow px-3.5 py-1.5 text-sm font-semibold text-black">
                {request.requestedService.serviceName}
              </span>
              {request.requestedService.category ? (
                <span className="text-xs text-black/45">{request.requestedService.category}</span>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="mt-6 border-t border-gray-100 pt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-black/40">Required Services</p>
          {displayedServices.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {displayedServices.map((service) => (
                <span
                  key={service}
                  className="rounded-full bg-[#F5C400]/10 px-3.5 py-1.5 text-sm font-semibold text-black"
                >
                  {service}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-black/45">No specific services selected.</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="ui-yellow-text text-base font-bold">Inspiration Images</h2>
        <p className="mt-0.5 text-xs text-black/45">Uploaded by customer</p>

        {request.images.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {request.images.map((image, imageIndex) => (
              <button
                type="button"
                key={image.id}
                onClick={() => setLightboxIndex(imageIndex)}
                className="group relative aspect-square overflow-hidden rounded-xl border border-gray-100 bg-gray-100"
              >
                <img
                  src={image.image_url}
                  alt="Inspiration"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all duration-200 group-hover:bg-black/25 group-hover:opacity-100">
                  <ExpandIcon />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-black/45">No inspiration images uploaded.</p>
        )}

        <ImageLightbox
          images={request.images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="ui-yellow-text text-base font-bold">Request Information</h2>
        <div className="mt-4 grid grid-cols-1 gap-5 border-t border-gray-100 pt-5 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Request ID</p>
            <p className="mt-1 text-sm font-bold text-black">{request.requestCode}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Submitted Date</p>
            <p className="mt-1 text-sm font-bold text-black">{formatLongDate(request.submittedDate)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Status</p>
            <span
              className={`mt-1 inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[request.status] || STATUS_STYLES.CANCELLED}`}
            >
              {request.status}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
