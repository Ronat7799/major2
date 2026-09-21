import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/apiError.js';
import { QUOTATION_EVENT_TYPES } from '../../constants/auth.js';

// Pre-acceptance events only — once a quotation is accepted it becomes a
// booking, and that event (plus everything after it) belongs on the Booking
// Management page's activity feed instead.
const ACTIVITY_TYPES_PARAM = 'quotation_request,quotation_revision_requested';
const ACTIVITY_PREVIEW_LIMIT = 3;
const ACTIVITY_MODAL_LIMIT = 50;

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Fetches its own, longer list on open rather than reusing the preview's 3
// items — keeps the compact card's request small and this one only costs
// anything when the vendor actually asks for it.
function AllActivityModal({ onClose }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    api
      .get(`/vendors/me/recent-activity?types=${ACTIVITY_TYPES_PARAM}&limit=${ACTIVITY_MODAL_LIMIT}`)
      .then((response) => {
        if (!cancelled) {
          setItems(response.data.data.activity);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-xl sm:p-7"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-black">All Recent Activity</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-gray-100 hover:text-black"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-4 max-h-[60vh] divide-y divide-gray-100 overflow-y-auto">
          {loading ? (
            <p className="py-6 text-center text-sm text-black/40">Loading...</p>
          ) : items.length === 0 ? (
            <p className="py-6 text-center text-sm text-black/40">No recent activity yet.</p>
          ) : (
            items.map((activity) =>
              activity.path ? (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(activity.path);
                  }}
                  className="flex w-full items-start gap-3 rounded-lg py-3 text-left transition-colors first:pt-0 last:pb-0 hover:bg-gray-50/70"
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ACTIVITY_DOT_COLORS[activity.type] || 'bg-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-black">{activity.text}</p>
                    <p className="mt-0.5 text-xs text-black/45">{formatRelativeTime(activity.timestamp)}</p>
                  </div>
                </button>
              ) : (
                <div key={activity.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ACTIVITY_DOT_COLORS[activity.type] || 'bg-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-black">{activity.text}</p>
                    <p className="mt-0.5 text-xs text-black/45">{formatRelativeTime(activity.timestamp)}</p>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const ACTIVITY_DOT_COLORS = {
  quotation_request: 'bg-blue-500',
  quotation_revision_requested: 'bg-amber-500',
};

function formatRelativeTime(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="m17 17-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function StatusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="m7.5 10 1.8 1.8L13 8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M3 4h14l-5.5 6.5v5L8.5 17v-6.5L3 4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M4 5h12M6 10h8M8 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-black/40" fill="none" aria-hidden="true">
      <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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

function EmptyStateIcon() {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 text-black/15" fill="none" aria-hidden="true">
      <rect x="12" y="8" width="34" height="44" rx="3" stroke="currentColor" strokeWidth="2.5" />
      <path d="M20 20h18M20 28h18M20 36h11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="46" cy="46" r="12" fill="white" stroke="currentColor" strokeWidth="2.5" />
      <path d="m42 46 3 3 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STATUS_STYLES = {
  NEW: 'bg-blue-50 text-blue-600',
  PENDING: 'bg-amber-50 text-amber-600',
  ACCEPTED: 'bg-green-50 text-green-600',
  DECLINED: 'bg-red-50 text-red-600',
  CANCELLED: 'bg-gray-100 text-gray-500',
  'REVISION REQUESTED': 'bg-blue-50 text-blue-600',
};

const AVATAR_COLORS = ['bg-rose-400', 'bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-teal-500'];

function avatarColorFor(name) {
  const index = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function initialsOf(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatDate(dateString) {
  if (!dateString) {
    return 'Not specified';
  }
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// event_date comes back as a plain "YYYY-MM-DD" string (no time/offset); parsing
// it with `new Date()` treats it as UTC midnight and can print the wrong day in
// negative-UTC timezones, so build the local Date from the parts instead.
function formatEventDate(dateString) {
  if (!dateString) {
    return 'Not specified';
  }
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const PAGE_SIZE = 5;

export default function QuotationRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/quotation-requests')
      .then((response) => {
        if (!cancelled) {
          setRequests(response.data.data.requests);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load quotation requests.'));
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

  const [recentActivity, setRecentActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [showActivityModal, setShowActivityModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get(`/vendors/me/recent-activity?types=${ACTIVITY_TYPES_PARAM}&limit=${ACTIVITY_PREVIEW_LIMIT}`)
      .then((response) => {
        if (!cancelled) {
          setRecentActivity(response.data.data.activity);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecentActivity([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setActivityLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredRequests = useMemo(() => {
    let result = requests.filter((request) => {
      const matchesSearch =
        !search ||
        request.customerName.toLowerCase().includes(search.toLowerCase()) ||
        request.eventTitle.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || request.status === statusFilter;
      const matchesCategory = !categoryFilter || request.eventCategory === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });

    result = [...result].sort((a, b) => {
      if (sort === 'oldest') {
        return new Date(a.submittedDate) - new Date(b.submittedDate);
      }
      if (sort === 'budget_high') {
        return b.budgetSort - a.budgetSort;
      }
      if (sort === 'budget_low') {
        return a.budgetSort - b.budgetSort;
      }
      return new Date(b.submittedDate) - new Date(a.submittedDate);
    });

    return result;
  }, [requests, search, statusFilter, categoryFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRequests = filteredRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function updateAndResetPage(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  function getPageNumbers() {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    const pages = new Set([1, 2, totalPages - 1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    return Array.from(pages)
      .filter((value) => value >= 1 && value <= totalPages)
      .sort((a, b) => a - b);
  }

  const pageNumbers = getPageNumbers();

  return (
    <div>
      <div>
        <h1 className="ui-yellow-text text-[28px] font-extrabold tracking-tight">Quotation Requests</h1>
        <p className="mt-1 text-sm text-black/50">Manage incoming quotation requests from customers.</p>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-black">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowActivityModal(true)}
              className="ui-yellow-text text-sm font-semibold transition-colors hover:opacity-75"
            >
              View All
            </button>
          ) : null}
        </div>

        <div className="mt-4 divide-y divide-gray-100">
          {activityLoading ? (
            <p className="py-3 text-sm text-black/40">Loading...</p>
          ) : recentActivity.length === 0 ? (
            <p className="py-3 text-sm text-black/40">No recent activity yet.</p>
          ) : (
            recentActivity.map((activity) =>
              activity.path ? (
                <button
                  key={activity.id}
                  type="button"
                  onClick={() => navigate(activity.path)}
                  className="flex w-full items-start gap-3 rounded-lg py-3 text-left transition-colors first:pt-0 last:pb-0 hover:bg-gray-50/70"
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ACTIVITY_DOT_COLORS[activity.type] || 'bg-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-black">{activity.text}</p>
                    <p className="mt-0.5 text-xs text-black/45">{formatRelativeTime(activity.timestamp)}</p>
                  </div>
                </button>
              ) : (
                <div key={activity.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ACTIVITY_DOT_COLORS[activity.type] || 'bg-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-black">{activity.text}</p>
                    <p className="mt-0.5 text-xs text-black/45">{formatRelativeTime(activity.timestamp)}</p>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-black/35">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(event) => updateAndResetPage(setSearch)(event.target.value)}
            placeholder="Search requests..."
            className="ui-yellow-border w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-black outline-none transition-shadow"
          />
        </div>

        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-black/35">
            <StatusIcon />
          </span>
          <select
            value={statusFilter}
            onChange={(event) => updateAndResetPage(setStatusFilter)(event.target.value)}
            className="ui-yellow-border appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm text-black outline-none transition-shadow"
          >
            <option value="">All Status</option>
            {Object.keys(STATUS_STYLES).map((status) => (
              <option key={status} value={status}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <ChevronDownIcon />
          </span>
        </div>

        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-black/35">
            <FilterIcon />
          </span>
          <select
            value={categoryFilter}
            onChange={(event) => updateAndResetPage(setCategoryFilter)(event.target.value)}
            className="ui-yellow-border appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm text-black outline-none transition-shadow"
          >
            <option value="">All Categories</option>
            {QUOTATION_EVENT_TYPES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <ChevronDownIcon />
          </span>
        </div>

        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-black/35">
            <SortIcon />
          </span>
          <select
            value={sort}
            onChange={(event) => updateAndResetPage(setSort)(event.target.value)}
            className="ui-yellow-border appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm text-black outline-none transition-shadow"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="budget_high">Highest Budget</option>
            <option value="budget_low">Lowest Budget</option>
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <ChevronDownIcon />
          </span>
        </div>
      </div>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-8 text-sm text-black/60">Loading…</p>
      ) : requests.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <EmptyStateIcon />
          <p className="mt-4 text-base font-bold text-black">No quotation requests yet.</p>
          <p className="mt-1 text-sm text-black/50">When customers send requests they will appear here.</p>
        </div>
      ) : paginatedRequests.length === 0 ? (
        <p className="mt-8 text-sm text-black/60">No requests match your filters.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {paginatedRequests.map((request) => (
            <div
              key={request.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/vendor/quotation-requests/${request.id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/vendor/quotation-requests/${request.id}`);
                }
              }}
              className="flex cursor-pointer flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 sm:w-48">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColorFor(
                      request.customerName,
                    )}`}
                  >
                    {initialsOf(request.customerName)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-black">{request.customerName}</p>
                    <p className="text-xs text-black/45">Submitted {formatDate(request.submittedDate)}</p>
                  </div>
                </div>

                <div className="sm:w-52">
                  <p className="text-sm font-bold text-black">{request.eventTitle}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-black/50">
                    <CalendarIcon />
                    {formatEventDate(request.eventDate)}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-black/50">
                    <PinIcon />
                    {request.location}
                  </p>
                </div>

                <div className="flex gap-6 sm:gap-8">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Budget</p>
                    <p className="ui-yellow-text mt-0.5 text-sm font-bold">{request.budgetLabel}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Guests</p>
                    <p className="mt-0.5 text-sm font-bold text-black">{request.guestsLabel}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[request.status]}`}
                >
                  {request.status}
                </span>
                {request.status === 'NEW' ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/vendor/quotation-requests/${request.id}/create-quotation`);
                    }}
                    className="ui-yellow ui-yellow-hover rounded-full px-5 py-2 text-sm font-semibold text-black shadow-sm transition-all hover:scale-[1.02]"
                  >
                    Create Quotation
                  </button>
                ) : null}
                {request.status === 'REVISION REQUESTED' ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/vendor/quotation-requests/${request.id}/create-quotation`);
                    }}
                    className="ui-yellow ui-yellow-hover rounded-full px-5 py-2 text-sm font-semibold text-black shadow-sm transition-all hover:scale-[1.02]"
                  >
                    Revise Quotation
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredRequests.length > 0 ? (
        <div className="mt-8 flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={currentPage <= 1}
            className="rounded-lg border border-gray-200 px-3.5 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          {pageNumbers.map((pageNumber, index) => {
            const previous = pageNumbers[index - 1];
            const showEllipsis = previous !== undefined && pageNumber - previous > 1;
            return (
              <span key={pageNumber} className="flex items-center gap-1.5">
                {showEllipsis ? <span className="px-1 text-sm text-black/40">...</span> : null}
                <button
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`h-9 w-9 rounded-lg border text-sm font-semibold transition-colors ${
                    pageNumber === currentPage
                      ? 'ui-yellow border-transparent text-black'
                      : 'border-gray-200 text-black hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              </span>
            );
          })}

          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-gray-200 px-3.5 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}

      {showActivityModal ? <AllActivityModal onClose={() => setShowActivityModal(false)} /> : null}
    </div>
  );
}
