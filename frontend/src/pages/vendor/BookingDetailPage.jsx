import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/apiError.js';

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

function CheckboxIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="m6.5 10.3 2.3 2.3 4.7-4.9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CancelIcon() {
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

function initialsOf(name) {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatEventDate(dateString) {
  if (!dateString) return 'Not specified';
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatShortDate(dateString) {
  if (!dateString) return 'Not available';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMemberSince(dateString) {
  if (!dateString) return 'Not available';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatTime(timeString) {
  if (!timeString) return null;
  const [hourStr, minuteStr] = timeString.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${period}`;
}

function toIsoTime(timeString) {
  if (!timeString) return null;
  const [hh = '00', mm = '00', ss = '00'] = timeString.split(':');
  return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:${ss.padStart(2, '0')}`;
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
  if (!hasMin && !hasMax) return 'Not specified';
  if (hasMin && hasMax && Number(min) !== Number(max)) {
    return `${prefix}${Number(min).toLocaleString('en-US')} - ${prefix}${Number(max).toLocaleString('en-US')}`;
  }
  return `${prefix}${Number(hasMin ? min : max).toLocaleString('en-US')}`;
}

function formatMoney(value) {
  if (value === null || value === undefined) return 'Not available';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const BOOKING_STATUS_STYLES = {
  'Pending Payment': 'bg-amber-50 text-amber-600',
  Confirmed: 'bg-green-50 text-green-600',
  Completed: 'bg-blue-50 text-blue-600',
  Cancelled: 'bg-red-50 text-red-600',
  Declined: 'bg-orange-50 text-orange-600',
};

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

const CANCELLATION_REASONS = [
  'Customer requested cancellation',
  'Scheduling conflict',
  'Unable to fulfill the event requirements',
  'Weather or unforeseen circumstances',
  'Other',
];

function CancelBookingModal({ customerName, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    if (!reason) {
      setError('Please select a reason for cancelling.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const combinedReason = notes.trim() ? `${reason}: ${notes.trim()}` : reason;
      await onConfirm(combinedReason);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to cancel this booking.'));
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-7"
      >
        <h2 className="text-lg font-bold text-black">Cancel this booking?</h2>
        <p className="mt-1 text-sm text-black/50">
          This will notify {customerName} and cannot be undone.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-black">Reason for cancellation</span>
            <div className="relative">
              <select
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="ui-yellow-border w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-black outline-none"
              >
                <option value="" disabled>
                  Select a reason
                </option>
                {CANCELLATION_REASONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-black">Additional details (optional)</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Add any extra context for the customer…"
              className="ui-yellow-border w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-black outline-none"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-full border border-gray-200 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Keep Booking
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Cancelling…' : 'Yes, Cancel Booking'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

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

  if (loading) {
    return <p className="text-sm text-black/60">Loading…</p>;
  }

  if (error || !booking) {
    return (
      <div className="text-center">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {error || 'Booking not found.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/vendor/bookings')}
          className="ui-yellow ui-yellow-hover mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  const displayedServices = booking.requiredServices.filter(
    (service) => service.trim().toLowerCase() !== 'other' && !service.trim().toLowerCase().startsWith('other:')
  );

  const isFinal = booking.bookingStatus === 'Completed' || booking.bookingStatus === 'Cancelled';
  const eventHasEnded = Boolean(
    booking.eventDate && booking.endTime && new Date(`${booking.eventDate}T${toIsoTime(booking.endTime)}`) <= new Date()
  );
  const canMarkCompleted = booking.bookingStatus === 'Confirmed' && eventHasEnded;

  async function handleMarkCompleted() {
    setActionError('');
    setCompleting(true);
    try {
      const response = await api.post(`/bookings/${id}/complete`);
      setBooking((current) => ({ ...current, bookingStatus: response.data.data.booking.bookingStatus }));
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to mark this booking as completed.'));
    } finally {
      setCompleting(false);
    }
  }

  async function handleCancelBooking(reason) {
    const response = await api.post(`/bookings/${id}/cancel`, { reason });
    setBooking((current) => ({ ...current, bookingStatus: response.data.data.booking.bookingStatus }));
    setShowCancelModal(false);
  }

  return (
    <div className="pb-4">
      <div className="flex items-center gap-2 text-sm text-black/45">
        <button
          type="button"
          onClick={() => navigate('/vendor/bookings')}
          aria-label="Back to Bookings"
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-black/5 hover:text-black"
        >
          <BackIcon />
        </button>
        <Link to="/vendor/bookings" className="transition-colors hover:text-black">
          Booking Management
        </Link>
        <span>&gt;</span>
        <span className="font-semibold text-black">Booking Details</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-black sm:text-[28px]">Booking Details</h1>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${BOOKING_STATUS_STYLES[booking.bookingStatus]}`}
          >
            {booking.bookingStatus}
          </span>
          <span className="text-xs font-semibold text-black/35">{booking.bookingCode}</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/vendor/messages', { state: { conversationId: booking.conversationId } })}
            disabled={!booking.conversationId}
            aria-label="Message customer"
            title="Message Customer"
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-gray-200 text-black/60 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-black disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-transparent"
          >
            <MessageIcon />
          </button>

          <button
            type="button"
            onClick={handleMarkCompleted}
            disabled={isFinal || !canMarkCompleted || completing}
            aria-label="Mark as completed"
            title={
              isFinal
                ? 'This booking is already finalized'
                : canMarkCompleted
                  ? 'Mark as Completed'
                  : 'Available after event end time'
            }
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-green-500 text-white shadow-sm transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-black/25 disabled:shadow-none disabled:hover:bg-gray-100"
          >
            <CheckboxIcon />
          </button>

          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            disabled={isFinal}
            aria-label="Cancel booking"
            title={isFinal ? 'This booking is already finalized' : 'Cancel Booking'}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-black/25 disabled:shadow-none disabled:hover:bg-gray-100"
          >
            <CancelIcon />
          </button>
        </div>
      </div>

      {actionError ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {actionError}
        </p>
      ) : null}

      {(booking.bookingStatus === 'Cancelled' || booking.bookingStatus === 'Declined') && booking.cancellationReason ? (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600/70">
            {booking.bookingStatus === 'Declined' ? 'Decline Reason' : 'Cancellation Reason'}
          </p>
          <p className="mt-1 text-sm text-red-700">{booking.cancellationReason}</p>
        </div>
      ) : null}

      <div className="mt-6 space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="ui-yellow-text text-base font-bold">Customer Information</h2>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black text-base font-semibold text-white">
                {initialsOf(booking.customerName)}
              </div>
              <div>
                <p className="text-base font-bold text-black">{booking.customerName}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-black/45">
                  <CalendarIcon />
                  Member since {formatMemberSince(booking.memberSince)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Email</p>
                <p className="mt-1 text-sm font-semibold text-black">{booking.customerEmail || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Phone</p>
                <p className="mt-1 text-sm font-semibold text-black">{booking.customerPhone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="ui-yellow-text text-base font-bold">Event Summary</h2>
          <div className="mt-4 grid grid-cols-1 gap-5 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField icon={<EventTypeIcon />} label="Event Type" value={booking.eventType || 'Not specified'} />
            <DetailField icon={<CalendarIcon />} label="Event Date" value={formatEventDate(booking.eventDate)} />
            <DetailField icon={<ClockIcon />} label="Event Time" value={formatTimeRange(booking.startTime, booking.endTime)} />
            <DetailField icon={<PinIcon />} label="Location" value={booking.location || 'Not specified'} />
            <DetailField
              icon={<GuestsIcon />}
              label="Number of Guests"
              value={`${formatRange(booking.guestsMin, booking.guestsMax)} Guests`}
            />
            <DetailField
              icon={<BudgetIcon />}
              label="Budget Range"
              value={formatRange(booking.budgetMin, booking.budgetMax, '$')}
            />
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-xs font-bold uppercase tracking-wide text-black/40">Event Description</p>
            <div className="mt-3 whitespace-pre-line rounded-xl bg-gray-50 px-4 py-3.5 text-sm leading-relaxed text-black/70">
              {booking.description || 'No description provided.'}
            </div>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-xs font-bold uppercase tracking-wide text-black/40">Required Services</p>
            {displayedServices.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {displayedServices.map((service) => (
                  <span key={service} className="rounded-full bg-[#F5C400]/10 px-3.5 py-1.5 text-sm font-semibold text-black">
                    {service}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-black/45">No specific services selected.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="ui-yellow-text text-base font-bold">Payment Summary</h2>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-black/60">Services Total</span>
              <span className="font-semibold text-black">{formatMoney(booking.servicesTotal)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 text-sm">
              <span className="text-black/60">Additional Charges</span>
              <span className="font-semibold text-black">{formatMoney(booking.additionalCharges)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-base font-bold text-black">Grand Total</span>
              <span className="text-xl font-extrabold text-green-600">{formatMoney(booking.totalAmount)}</span>
            </div>
          </div>

          {booking.payment ? (
            <div className="mt-5 grid grid-cols-1 gap-5 border-t border-gray-100 pt-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Deposit</p>
                <p className="mt-1 text-sm font-bold text-black">{formatMoney(booking.payment.deposit.amount)}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    booking.payment.deposit.paid ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {booking.payment.deposit.paid ? 'Paid' : 'Awaiting Payment'}
                </span>
                {booking.payment.deposit.paid ? (
                  <p className="mt-1.5 text-xs text-black/45">
                    Paid on {formatShortDate(booking.payment.deposit.paidAt)}
                    {booking.payment.deposit.transactionId ? ` · ${booking.payment.deposit.transactionId}` : ''}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Balance</p>
                <p className="mt-1 text-sm font-bold text-black">{formatMoney(booking.payment.balance.amount)}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    booking.payment.balance.paid
                      ? 'bg-green-50 text-green-600'
                      : booking.payment.deposit.paid
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {booking.payment.balance.paid ? 'Paid' : booking.payment.deposit.paid ? 'Awaiting Payment' : 'Not Yet Due'}
                </span>
                {booking.payment.balance.paid ? (
                  <p className="mt-1.5 text-xs text-black/45">
                    Paid on {formatShortDate(booking.payment.balance.paidAt)}
                    {booking.payment.balance.transactionId ? ` · ${booking.payment.balance.transactionId}` : ''}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {showCancelModal ? (
        <CancelBookingModal
          customerName={booking.customerName}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelBooking}
        />
      ) : null}
    </div>
  );
}
