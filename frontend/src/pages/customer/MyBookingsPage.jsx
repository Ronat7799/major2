import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/apiError.js';

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

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8h14M7 2.5v3M13 2.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function EmptyStateIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 text-black/15" fill="none" aria-hidden="true">
      <rect x="10" y="12" width="44" height="40" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <path d="M10 24h44" stroke="currentColor" strokeWidth="2.5" />
      <path d="M20 8v8M44 8v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 34l6 6 12-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SadFaceIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 text-black/20" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="24" cy="28" r="2.4" fill="currentColor" />
      <circle cx="40" cy="28" r="2.4" fill="currentColor" />
      <path d="M24 42c2.5-3 5.2-4.5 8-4.5s5.5 1.5 8 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
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

function formatMoney(value) {
  return `$${(Number(value) || 0).toLocaleString('en-US')}`;
}

const STATUS_STYLES = {
  'Pending Payment': 'bg-amber-50 text-amber-600',
  Confirmed: 'bg-blue-50 text-blue-600',
  Completed: 'bg-green-50 text-green-600',
  Cancelled: 'bg-red-50 text-red-600',
};

const FILTERS = ['All', 'Pending Payment', 'Confirmed', 'Completed', 'Cancelled'];
const PAGE_SIZE = 6;

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get('/bookings')
      .then((response) => {
        if (!cancelled) {
          setBookings(response.data.data.bookings);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load your bookings.'));
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
  }, []);

  const filtered = useMemo(
    () => bookings.filter((booking) => filter === 'All' || booking.status === filter),
    [bookings, filter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedBookings = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function changeFilter(nextFilter) {
    setFilter(nextFilter);
    setPage(1);
  }

  return (
    <div className="page-fade-in mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="ui-yellow-text text-3xl font-extrabold tracking-tight sm:text-4xl">My Bookings</h1>
          <p className="mt-2 text-sm text-black/55">View and manage your confirmed event bookings.</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-full bg-gray-100 p-1.5">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => changeFilter(item)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-200 ${
                filter === item ? 'ui-yellow text-black shadow-sm' : 'text-black/55 hover:text-black'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-10 text-sm text-black/60">Loading…</p>
      ) : bookings.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-20 text-center">
          <EmptyStateIcon />
          <p className="mt-4 text-lg font-bold text-black">No Bookings Yet</p>
          <p className="mt-1 text-sm text-black/50">Your confirmed bookings will appear here after payment.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="ui-yellow ui-yellow-hover mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            Go back home
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center py-16 text-center">
          <SadFaceIcon />
          <p className="mt-4 text-base font-bold text-black">No bookings match this filter.</p>
          <p className="mt-1 text-sm text-black/50">Try adjusting your filter to see more results.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {paginatedBookings.map((booking) => (
            <div
              key={booking.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/customer/bookings/${booking.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/customer/bookings/${booking.id}`);
                }
              }}
              className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                    STATUS_STYLES[booking.status] || STATUS_STYLES.Confirmed
                  }`}
                >
                  {booking.status}
                </span>
                <span className="text-xs font-semibold text-black/35">{booking.bookingCode}</span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black text-sm font-semibold text-white">
                  {booking.vendorLogo ? (
                    <img src={booking.vendorLogo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initialsOf(booking.vendorName)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-black">{booking.vendorName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {booking.eventType ? (
                      <span className="ui-yellow rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-black">
                        {booking.eventType}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1 text-xs text-black/45">
                      <CalendarIcon /> {formatDate(booking.bookingDate)}
                    </span>
                  </div>
                </div>
              </div>

              {booking.eventLocation ? (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-black/45">
                  <PinIcon /> {booking.eventLocation}
                </p>
              ) : null}

              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-2xl font-extrabold text-green-600">{formatMoney(booking.grandTotal)}</p>
                <p className="text-xs font-medium text-black/45">Total Package</p>
              </div>

              <div className="mt-3 flex items-center gap-1.5">
                {booking.ratingAverage !== null ? (
                  <>
                    <span className="flex items-center gap-0.5 text-[#F5C400]">
                      {Array.from({ length: 5 }, (_, index) => (
                        <StarIcon key={index} filled={index < Math.round(booking.ratingAverage)} />
                      ))}
                    </span>
                    <span className="text-sm font-bold text-black">{booking.ratingAverage.toFixed(1)}</span>
                  </>
                ) : (
                  <span className="text-xs text-black/40">No reviews yet</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && totalPages > 1 ? (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-6">
          <p className="text-sm text-black/55">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of{' '}
            {filtered.length} bookings
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage <= 1}
              className="rounded-lg border border-gray-200 px-3.5 py-1.5 text-sm font-semibold text-black transition-colors duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={`h-9 w-9 rounded-lg border text-sm font-semibold transition-colors duration-200 ${
                  pageNumber === currentPage
                    ? 'ui-yellow border-transparent text-black'
                    : 'border-gray-200 text-black hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-black px-3.5 py-1.5 text-sm font-semibold text-black transition-colors duration-200 hover:border-transparent hover:bg-[#F5C400] hover:text-black disabled:cursor-not-allowed disabled:border-gray-200 disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-transparent disabled:hover:text-black"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
