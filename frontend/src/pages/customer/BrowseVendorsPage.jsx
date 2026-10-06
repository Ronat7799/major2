import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/apiError.js';
import { VENDOR_CATEGORIES, VENDOR_LOCATIONS } from '../../constants/auth.js';
import { useReveal, revealStyle } from '../../hooks/useReveal.js';
import { useAuth } from '../../context/AuthContext.jsx';

function ImagePlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m4 17 5-5 3.5 3.5L16 12l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="ui-yellow-text h-4 w-4 shrink-0" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="m17 17-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 20 20" className="ui-yellow-text h-4 w-4 shrink-0" fill="none" aria-hidden="true">
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

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-black/40" fill="none" aria-hidden="true">
      <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill={filled ? '#F43F5E' : 'none'} aria-hidden="true">
      <path
        d="M10 17s-6.5-4-6.5-8.6C3.5 5.6 5.5 4 7.5 4c1 0 2 .5 2.5 1.4C10.5 4.5 11.5 4 12.5 4c2 0 4 1.6 4 4.4C16.5 13 10 17 10 17Z"
        stroke={filled ? '#F43F5E' : '#000000'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
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

const BUDGET_OPTIONS = [
  { value: 'under_500', label: 'Under $500' },
  { value: '500_2000', label: '$500 – $2K' },
  { value: '2000_5000', label: '$2K – $5K' },
  { value: '5000_10000', label: '$5K – $10K' },
  { value: 'over_10000', label: '$10K+' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Lowest Price' },
  { value: 'price_desc', label: 'Highest Price' },
];

const DEFAULT_FILTERS = { category: '', budget: '', location: '', search: '', sort: 'newest', page: 1 };
const DEFAULT_PAGINATION = { page: 1, pageSize: 6, total: 0, totalPages: 0 };

function PillFilterGroup({ title, options, value, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-base font-bold text-black">{title}</p>
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-xs font-medium text-black/40 transition-colors duration-200 hover:text-black/60"
        >
          Clear
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(value === option.value ? '' : option.value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
              value === option.value
                ? 'ui-yellow border-transparent text-black'
                : 'border-gray-200 bg-white text-black/70 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BrowseVendorsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedServiceIds, setSavedServiceIds] = useState(() => new Set());
  const isFirstRun = useRef(true);
  const [gridRef, gridVisible] = useReveal();

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      loadVendors();
      return undefined;
    }

    const timeoutId = setTimeout(loadVendors, 300);
    return () => clearTimeout(timeoutId);
  }, [filters]);

  useEffect(() => {
    if (!user || user.role !== 'customer') {
      setSavedServiceIds(new Set());
      return;
    }

    let cancelled = false;
    api
      .get('/saved-services/ids')
      .then((response) => {
        if (!cancelled) {
          setSavedServiceIds(new Set(response.data.data.serviceIds));
        }
      })
      .catch(() => {
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function loadVendors() {
    setLoading(true);
    try {
      const response = await api.get('/vendors', {
        params: {
          page: filters.page,
          category: filters.category || undefined,
          budget: filters.budget || undefined,
          location: filters.location || undefined,
          search: filters.search || undefined,
          sort: filters.sort,
        },
      });
      setVendors(response.data.data.vendors);
      setPagination(response.data.data.pagination);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load vendors.'));
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(event, serviceId) {
    event.stopPropagation();

    if (!user || user.role !== 'customer') {
      navigate('/login', { state: { backgroundLocation: location, from: '/vendors' } });
      return;
    }

    const alreadySaved = savedServiceIds.has(serviceId);
    setSavedServiceIds((current) => {
      const next = new Set(current);
      if (alreadySaved) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });

    try {
      if (alreadySaved) {
        await api.delete(`/saved-services/${serviceId}`);
      } else {
        await api.post('/saved-services', { service_id: serviceId });
      }
    } catch {
      setSavedServiceIds((current) => {
        const next = new Set(current);
        if (alreadySaved) {
          next.add(serviceId);
        } else {
          next.delete(serviceId);
        }
        return next;
      });
    }
  }

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value, page: 1 }));
  }

  function goToPage(nextPage) {
    setFilters((current) => ({
      ...current,
      page: Math.min(Math.max(1, nextPage), pagination.totalPages || 1),
    }));
  }

  return (
    <div className="page-fade-in mx-auto max-w-[1600px] px-6 py-10">
      <h1 className="ui-yellow-text text-2xl font-bold">Browse Vendors</h1>
      <p className="mt-1 text-sm text-black/55">Find the perfect vendor for your event.</p>

      <div className="mt-6 flex flex-col divide-y divide-gray-100 overflow-hidden rounded-full border border-gray-100 bg-white shadow-sm transition-shadow duration-200 focus-within:shadow-md sm:flex-row sm:items-stretch sm:divide-x sm:divide-y-0">
        <div className="flex flex-1 items-center gap-3 px-6 py-3.5">
          <SearchIcon />
          <input
            type="text"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Search by service name, vendor…"
            className="w-full border-0 bg-transparent text-sm text-black outline-none placeholder:text-black/40"
          />
        </div>
        <div className="flex flex-1 items-center gap-3 px-6 py-3.5">
          <LocationIcon />
          <select
            value={filters.location}
            onChange={(event) => updateFilter('location', event.target.value)}
            className="w-full appearance-none border-0 bg-transparent text-sm text-black outline-none"
          >
            <option value="">Location</option>
            {VENDOR_LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
          <ChevronDownIcon />
        </div>
        <button
          type="button"
          className="ui-yellow ui-yellow-hover shrink-0 px-10 py-3.5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          Search
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit space-y-6">
          <PillFilterGroup
            title="Categories"
            options={VENDOR_CATEGORIES.map((category) => ({ value: category, label: category }))}
            value={filters.category}
            onChange={(value) => updateFilter('category', value)}
          />

          <div className="border-t border-gray-100 pt-6">
            <PillFilterGroup
              title="Budget Range"
              options={BUDGET_OPTIONS}
              value={filters.budget}
              onChange={(value) => updateFilter('budget', value)}
            />
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-black">
              {pagination.total} {pagination.total === 1 ? 'vendor' : 'vendors'} found
            </p>
            <div className="flex items-center gap-2 text-sm text-black/60">
              <span>Sort by:</span>
              <div className="relative">
                <select
                  value={filters.sort}
                  onChange={(event) => updateFilter('sort', event.target.value)}
                  className="appearance-none rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-sm font-semibold text-black outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                  <ChevronDownIcon />
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <p className="mt-8 text-sm text-black/60">Loading…</p>
          ) : error ? (
            <p className="mt-8 text-sm text-red-600">{error}</p>
          ) : vendors.length === 0 ? (
            <div className="mt-8 flex flex-col items-center py-16 text-center">
              <SadFaceIcon />
              <p className="mt-4 text-base font-bold text-black">No vendors available.</p>
              <p className="mt-1 text-sm text-black/50">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div
              ref={gridRef}
              className={`mt-6 flex flex-wrap gap-6 ${
                vendors.length === 2 ? 'justify-center' : 'justify-start'
              }`}
            >
                {vendors.map((vendor, index) => (
                  <div
                    key={vendor.id}
                    style={revealStyle(gridVisible, (index % 6) * 120)}
                    className="group flex h-full w-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl sm:w-[calc(50%-0.75rem)] xl:w-[calc(33.333%-1rem)]"
                  >
                    <div className="relative h-48 w-full shrink-0 bg-gray-100">
                      <div className="h-full w-full overflow-hidden">
                        {vendor.cover_image ? (
                          <img
                            src={vendor.cover_image}
                            alt={vendor.company_name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <ImagePlaceholderIcon />
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        aria-label={savedServiceIds.has(vendor.id) ? 'Remove from saved vendors' : 'Save this service'}
                        onClick={(event) => toggleFavorite(event, vendor.id)}
                        className="ui-yellow absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-transform duration-200 hover:scale-110"
                      >
                        <HeartIcon filled={savedServiceIds.has(vendor.id)} />
                      </button>

                      <div className="absolute -bottom-6 left-4 h-14 w-14 overflow-hidden rounded-full border-4 border-white bg-black shadow-sm">
                        {vendor.profile_image ? (
                          <img src={vendor.profile_image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-white">
                            {initialsOf(vendor.company_name)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col px-5 pb-5 pt-9">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 break-words text-lg font-bold leading-snug text-black">
                          {vendor.service_name}
                        </h3>
                        <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-black/50">
                          <span className="text-[#F5C400]">★</span>
                          {(vendor.rating_average ?? 0).toFixed(1)} ({vendor.rating_total || 0})
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-black/45">by {vendor.company_name}</p>

                      {vendor.business_category ? (
                        <span className="mt-3 inline-block w-fit rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-black/50">
                          {vendor.business_category}
                        </span>
                      ) : null}

                      {vendor.business_description ? (
                        <p className="mt-3 line-clamp-2 break-words text-sm leading-relaxed text-black/55">
                          {vendor.business_description}
                        </p>
                      ) : null}

                      <div className="mt-auto pt-4">
                        <div className="border-t border-gray-100 pt-4">
                          <p className="ui-yellow-text text-xs font-bold uppercase tracking-wide">
                            Starting From
                          </p>
                          <p className="ui-yellow-text text-2xl font-bold">${vendor.starting_price}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate(`/vendors/${vendor.vendor_id}?service=${vendor.id}`)}
                          className="ui-yellow ui-yellow-hover mt-4 w-full rounded-full px-4 py-2.5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {!loading && !error && vendors.length > 0 && pagination.totalPages > 1 ? (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-6">
          <p className="text-sm text-black/55">
            Showing {(pagination.page - 1) * pagination.pageSize + 1}–
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} vendors
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-lg border border-gray-200 px-3.5 py-1.5 text-sm font-semibold text-black transition-colors duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => goToPage(pageNumber)}
                className={`h-9 w-9 rounded-lg border text-sm font-semibold transition-colors duration-200 ${
                  pageNumber === pagination.page
                    ? 'ui-yellow border-transparent text-black'
                    : 'border-gray-200 text-black hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
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
