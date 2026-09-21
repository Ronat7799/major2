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

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmptyStateIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 text-black/15" fill="none" aria-hidden="true">
      <rect x="10" y="14" width="44" height="36" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <path d="M18 26h28M18 34h20M18 42h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="48" cy="46" r="12" fill="white" stroke="currentColor" strokeWidth="2.5" />
      <path d="M48 41v5l3.5 3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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

function formatRelativeTime(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

const UNQUOTED_BADGE_STYLES = {
  'Awaiting Response': 'bg-blue-50 text-blue-600',
  Declined: 'bg-red-50 text-red-600',
  Cancelled: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  cancelled: 'Declined',
  revision_requested: 'Revision Requested',
  revised: 'Revised',
};

const BADGE_STYLES = {
  NEW: 'bg-blue-50 text-blue-600',
  PENDING: 'bg-amber-50 text-amber-600',
  ACCEPTED: 'bg-green-50 text-green-600',
  DECLINED: 'bg-red-50 text-red-600',
  EXPIRED: 'bg-gray-100 text-gray-500',
  'REVISION REQUESTED': 'bg-blue-50 text-blue-600',
  REVISED: 'bg-gray-100 text-gray-500',
};

const FILTERS = ['All', 'Pending', 'Accepted', 'Declined', 'Expired'];
const PAGE_SIZE = 6;

export default function MyQuotationsPage() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [nowTick, setNowTick] = useState(Date.now());
  const [cancellingId, setCancellingId] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get('/quotations')
      .then((response) => {
        if (!cancelled) {
          setQuotations(response.data.data.quotations);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load your quotations.'));
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

  async function handleCancelRequest(quotationRequestId) {
    if (cancellingId) return;
    setCancellingId(quotationRequestId);
    try {
      const response = await api.post(`/quotation-requests/${quotationRequestId}/cancel`);
      setQuotations((current) =>
        current.map((item) =>
          item.quotationRequestId === quotationRequestId
            ? { ...item, status: 'cancelled', statusLabel: response.data.data.request.status === 'CANCELLED' ? 'Cancelled' : item.statusLabel }
            : item
        )
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to withdraw this request.'));
    } finally {
      setCancellingId(null);
    }
  }

  // expiresAt/isExpired come straight from the backend now (real, enforced
  // server-side) — nowTick just keeps the countdown text ticking down live.
  const enriched = useMemo(
    () =>
      quotations
        .filter((quotation) => quotation.hasQuotation)
        .map((quotation) => {
          const statusLabel = STATUS_LABELS[quotation.status] || 'Pending';

          let countdownLabel = null;
          let countdownStyle = '';
          const expired = quotation.isExpired;

          if (statusLabel === 'Pending' && !expired && quotation.expiresAt) {
            const diffMs = new Date(quotation.expiresAt).getTime() - nowTick;
            if (diffMs > 0) {
              const totalMinutes = Math.floor(diffMs / 60000);
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;
              countdownLabel = `Expires in ${pad(hours)}h ${pad(minutes)}m`;
              if (hours >= 3) countdownStyle = 'text-green-600 bg-green-50';
              else if (hours >= 1) countdownStyle = 'text-orange-600 bg-orange-50';
              else countdownStyle = 'text-red-600 bg-red-50';
            }
          }

          const isNew = statusLabel === 'Pending' && !expired && Date.now() - new Date(quotation.submittedDate).getTime() < 24 * 3600000;
          const badgeLabel = expired ? 'EXPIRED' : isNew ? 'NEW' : statusLabel.toUpperCase();

          return { ...quotation, statusLabel, countdownLabel, countdownStyle, expired, badgeLabel };
        }),
    [quotations, nowTick]
  );

  // Not-yet-quoted requests only show under "All" — they're a different kind
  // of card (no price, no navigation) and don't map cleanly onto the
  // Pending/Accepted/Declined/Expired filters, which are about quotations.
  const unquotedItems = quotations.filter((quotation) => !quotation.hasQuotation);

  const filtered = enriched.filter((quotation) => {
    if (filter === 'All') return true;
    if (filter === 'Expired') return quotation.expired;
    return quotation.statusLabel === filter && !quotation.expired;
  });

  const displayItems =
    filter === 'All'
      ? [...filtered, ...unquotedItems].sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate))
      : filtered;

  const totalPages = Math.max(1, Math.ceil(displayItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = displayItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function changeFilter(nextFilter) {
    setFilter(nextFilter);
    setPage(1);
  }

  return (
    <div className="page-fade-in mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="ui-yellow-text text-3xl font-extrabold tracking-tight sm:text-4xl">My Quotations</h1>
          <p className="mt-2 text-sm text-black/55">
            Review and compare quotations from vendors before choosing the best offer.
          </p>
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
      ) : quotations.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-6 py-20 text-center">
          <EmptyStateIcon />
          <p className="mt-4 text-lg font-bold text-black">No Quotations Yet</p>
          <p className="mt-1 text-sm text-black/50">Your vendors haven't responded yet.</p>
          <button
            type="button"
            onClick={() => navigate('/vendors')}
            className="ui-yellow ui-yellow-hover mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            Browse Vendors
          </button>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="mt-10 flex flex-col items-center py-16 text-center">
          <SadFaceIcon />
          <p className="mt-4 text-base font-bold text-black">No quotations match this filter.</p>
          <p className="mt-1 text-sm text-black/50">Try adjusting your filter to see more results.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {paginatedItems.map((quotation) =>
            !quotation.hasQuotation ? (
              <div
                key={quotation.quotationRequestId}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <span
                  className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${UNQUOTED_BADGE_STYLES[quotation.statusLabel] || UNQUOTED_BADGE_STYLES['Awaiting Response']}`}
                >
                  {quotation.statusLabel}
                </span>

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black text-sm font-semibold text-white">
                    {quotation.vendorLogo ? (
                      <img src={quotation.vendorLogo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initialsOf(quotation.vendorName)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-black">{quotation.vendorName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {quotation.eventCategory ? (
                        <span className="ui-yellow rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-black">
                          {quotation.eventCategory}
                        </span>
                      ) : null}
                      <span className="text-xs text-black/45">Submitted {formatRelativeTime(quotation.submittedDate)}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-black/50">
                  {quotation.statusLabel === 'Awaiting Response'
                    ? "Waiting for this vendor to send you a quotation."
                    : quotation.statusLabel === 'Declined'
                      ? 'This vendor declined your request.'
                      : 'You withdrew this request.'}
                </p>

                {quotation.statusLabel === 'Awaiting Response' ? (
                  <button
                    type="button"
                    onClick={() => handleCancelRequest(quotation.quotationRequestId)}
                    disabled={cancellingId === quotation.quotationRequestId}
                    className="mt-4 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancellingId === quotation.quotationRequestId ? 'Withdrawing…' : 'Withdraw Request'}
                  </button>
                ) : null}
              </div>
            ) : (
              <div
                key={quotation.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/customer/quotations/${quotation.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/customer/quotations/${quotation.id}`);
                  }
                }}
                className="cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <span
                  className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${BADGE_STYLES[quotation.badgeLabel] || BADGE_STYLES.PENDING}`}
                >
                  {quotation.badgeLabel}
                </span>

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black text-sm font-semibold text-white">
                    {quotation.vendorLogo ? (
                      <img src={quotation.vendorLogo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initialsOf(quotation.vendorName)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-black">{quotation.vendorName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {quotation.eventCategory ? (
                        <span className="ui-yellow rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-black">
                          {quotation.eventCategory}
                        </span>
                      ) : null}
                      <span className="text-xs text-black/45">Submitted {formatRelativeTime(quotation.submittedDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-2xl font-extrabold text-green-600">
                    ${Number(quotation.grandTotal).toLocaleString('en-US')}
                  </p>
                  <p className="text-xs font-medium text-black/45">Total Package</p>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  {quotation.ratingAverage !== null ? (
                    <>
                      <span className="flex items-center gap-0.5 text-[#F5C400]">
                        {Array.from({ length: 5 }, (_, index) => (
                          <StarIcon key={index} filled={index < Math.round(quotation.ratingAverage)} />
                        ))}
                      </span>
                      <span className="text-sm font-bold text-black">{quotation.ratingAverage.toFixed(1)}</span>
                    </>
                  ) : (
                    <span className="text-xs text-black/40">No reviews yet</span>
                  )}
                </div>

                {quotation.statusLabel === 'Pending' ? (
                  <div className="mt-4">
                    {quotation.expired ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
                        <ClockIcon /> Expired
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${quotation.countdownStyle}`}
                      >
                        <ClockIcon /> {quotation.countdownLabel}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            )
          )}
        </div>
      )}

      {!loading && displayItems.length > 0 && totalPages > 1 ? (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-6">
          <p className="text-sm text-black/55">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, displayItems.length)} of{' '}
            {displayItems.length} quotations
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
