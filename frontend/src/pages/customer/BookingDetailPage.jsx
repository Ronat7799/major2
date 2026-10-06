import { useEffect, useState } from 'react';
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

function StarIcon({ filled }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
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

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
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
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 16c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="14" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12.5 12.2c2 .2 3.5 1.6 3.5 3.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
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
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatLongDate(dateString) {
  if (!dateString) return 'Not available';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatMemberSince(dateString) {
  if (!dateString) return 'Not available';
  return new Date(dateString).getFullYear();
}

function formatTime(timeString) {
  if (!timeString) return null;
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

function formatRange(min, max) {
  const hasMin = min !== null && min !== undefined;
  const hasMax = max !== null && max !== undefined;
  if (!hasMin && !hasMax) return 'Not specified';
  if (hasMin && hasMax && Number(min) !== Number(max)) {
    return `${Number(min).toLocaleString('en-US')} - ${Number(max).toLocaleString('en-US')}`;
  }
  return `${Number(hasMin ? min : max).toLocaleString('en-US')}`;
}

function formatMoney(value) {
  return `$${(Number(value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

const STATUS_STYLES = {
  'Pending Payment': 'bg-amber-50 text-amber-600',
  Confirmed: 'bg-blue-50 text-blue-600',
  Completed: 'bg-green-50 text-green-600',
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

export default function BookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

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

  const isBookingOpen = booking.status !== 'Cancelled' && booking.status !== 'Declined';

  let depositCountdownLabel = null;
  let depositCountdownStyle = 'text-black/55';
  const depositAwaitingPayment = isBookingOpen && booking.payment && !booking.payment.deposit.paid;
  if (depositAwaitingPayment && booking.depositDueAt) {
    const diffMs = new Date(booking.depositDueAt).getTime() - nowTick;
    if (diffMs > 0) {
      const totalMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      depositCountdownLabel = `Pay deposit within ${hours}h ${pad(minutes)}m`;
      if (hours >= 12) depositCountdownStyle = 'text-black/55';
      else if (hours >= 4) depositCountdownStyle = 'text-orange-600';
      else depositCountdownStyle = 'text-red-600';
    }
  }

  return (
    <div className="page-fade-in mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center gap-2 text-sm text-black/45">
        <button
          type="button"
          onClick={() => navigate('/customer/bookings')}
          aria-label="Back to My Bookings"
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-black/5 hover:text-black"
        >
          <BackIcon />
        </button>
        <Link to="/customer/bookings" className="transition-colors hover:text-black">
          My Bookings
        </Link>
        <span>&gt;</span>
        <span className="font-semibold text-black">{booking.bookingCode}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold text-black sm:text-[28px]">Booking Details</h1>
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[booking.status] || STATUS_STYLES.Confirmed}`}>
          {booking.status}
        </span>
        {depositCountdownLabel ? (
          <span className={`flex items-center gap-1.5 text-sm font-semibold ${depositCountdownStyle}`}>
            <ClockIcon />
            {depositCountdownLabel}
          </span>
        ) : null}
      </div>

      {(booking.status === 'Cancelled' || booking.status === 'Declined') && booking.cancellationReason ? (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600/70">
            {booking.status === 'Declined' ? 'Decline Reason' : 'Cancellation Reason'}
          </p>
          <p className="mt-1 text-sm text-red-700">{booking.cancellationReason}</p>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="ui-yellow-text text-base font-bold">Event Summary</h2>
            <div className="mt-4 grid grid-cols-1 gap-5 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField icon={<EventTypeIcon />} label="Event Type" value={booking.event.eventType || 'Not specified'} />
              <DetailField icon={<CalendarIcon />} label="Event Date" value={formatDate(booking.bookingDate)} />
              <DetailField icon={<ClockIcon />} label="Event Time" value={formatTimeRange(booking.startTime, booking.endTime)} />
              <DetailField icon={<PinIcon />} label="Event Location" value={booking.event.location || 'Not specified'} />
              <DetailField
                icon={<GuestsIcon />}
                label="Number of Guests"
                value={formatRange(booking.event.guestsMin, booking.event.guestsMax)}
              />
            </div>
            {booking.event.description ? (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Event Description</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-black/60">{booking.event.description}</p>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="ui-yellow-text text-base font-bold">Payment Breakdown</h2>

            <div className="mt-4 border-t border-gray-100">
              {booking.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-black">{item.serviceName}</p>
                    {item.description ? <p className="mt-0.5 text-xs text-black/50">{item.description}</p> : null}
                  </div>
                  <p className="shrink-0 text-sm font-bold text-black">{formatMoney(item.totalPrice)}</p>
                </div>
              ))}

              {booking.charges.length > 0 ? (
                <div className="mt-1 border-t border-gray-100 pt-2">
                  {booking.charges.map((charge) => (
                    <div key={charge.id} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-black/70">{charge.chargeName}</span>
                      <span className="font-semibold text-black">{formatMoney(charge.chargePrice)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="text-base font-bold text-black">Grand Total</span>
              <span className="text-2xl font-extrabold text-green-600">{formatMoney(booking.grandTotal)}</span>
            </div>
          </div>

          {booking.payment ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="ui-yellow-text text-base font-bold">Payment Summary</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Deposit</p>
                  <p className="mt-1 text-sm font-bold text-black">{formatMoney(booking.payment.deposit.amount)}</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      booking.payment.deposit.paid ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {booking.payment.deposit.paid ? 'Paid' : 'Due'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Balance</p>
                  <p className="mt-1 text-sm font-bold text-black">{formatMoney(booking.payment.balance.amount)}</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      booking.payment.balance.paid
                        ? 'bg-green-50 text-green-600'
                        : booking.payment.deposit.paid
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {booking.payment.balance.paid ? 'Paid' : booking.payment.deposit.paid ? 'Due' : 'Not Yet Due'}
                  </span>
                </div>
              </div>

              {isBookingOpen && !booking.payment.deposit.paid ? (
                <button
                  type="button"
                  onClick={() => navigate(`/customer/quotations/${booking.quotationId}/payment?stage=deposit`)}
                  className="ui-yellow ui-yellow-hover mt-5 w-full rounded-full py-3 text-sm font-bold text-black shadow-sm transition-all hover:scale-[1.01] active:scale-100"
                >
                  Pay Deposit
                </button>
              ) : isBookingOpen && !booking.payment.balance.paid ? (
                <button
                  type="button"
                  onClick={() => navigate(`/customer/quotations/${booking.quotationId}/payment?stage=balance`)}
                  className="ui-yellow ui-yellow-hover mt-5 w-full rounded-full py-3 text-sm font-bold text-black shadow-sm transition-all hover:scale-[1.01] active:scale-100"
                >
                  Pay Balance
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-black">Your Vendor</h2>
            <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black text-base font-semibold text-white">
                {booking.vendor.logo ? (
                  <img src={booking.vendor.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  initialsOf(booking.vendor.name)
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-black">{booking.vendor.name}</p>
                {booking.vendor.category ? (
                  <span className="ui-yellow mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-black">
                    {booking.vendor.category}
                  </span>
                ) : null}
              </div>
            </div>

            {booking.vendor.address ? (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-black/55">
                <PinIcon /> {booking.vendor.address}
              </p>
            ) : null}

            <div className="mt-2 flex items-center gap-1.5">
              {booking.vendor.ratingAverage !== null ? (
                <>
                  <span className="flex items-center gap-0.5 text-[#F5C400]">
                    {Array.from({ length: 5 }, (_, index) => (
                      <StarIcon key={index} filled={index < Math.round(booking.vendor.ratingAverage)} />
                    ))}
                  </span>
                  <span className="text-sm font-bold text-black">{booking.vendor.ratingAverage.toFixed(1)}</span>
                </>
              ) : (
                <span className="text-xs text-black/40">No reviews yet</span>
              )}
            </div>

            <p className="mt-4 border-t border-gray-100 pt-4 text-[11px] font-semibold uppercase tracking-wide text-black/40">
              Member Since
            </p>
            <p className="mt-0.5 text-sm font-bold text-black">{formatMemberSince(booking.vendor.memberSince)}</p>

            <button
              type="button"
              disabled={!booking.conversationId}
              onClick={() => navigate('/customer/messages', { state: { conversationId: booking.conversationId } })}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-transparent"
            >
              <MessageIcon /> Message Vendor
            </button>

            {booking.status === 'Completed' ? (
              <button
                type="button"
                onClick={() => navigate(`/customer/bookings/${id}/review`)}
                className="ui-yellow ui-yellow-hover mt-2.5 w-full rounded-full px-4 py-2.5 text-sm font-bold text-black shadow-sm transition-all hover:scale-[1.01] active:scale-100"
              >
                Leave a Review
              </button>
            ) : null}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-black">Booking Info</h2>
            <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Booking ID</p>
                <p className="mt-0.5 text-sm font-bold text-black">{booking.bookingCode}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Confirmed On</p>
                <p className="mt-0.5 text-sm font-bold text-black">{formatLongDate(booking.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
