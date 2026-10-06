import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { VENDOR_CATEGORIES } from '../../constants/auth.js';

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="m17 17-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ClearFiltersIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M3 4h14l-5.5 6.5v5L8.5 17v-6.5L3 4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="m13.5 3.5 4 4m0-4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m4 17 5-5 3.5 3.5L16 12l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function formatUpdatedDate(dateString) {
  if (!dateString) {
    return 'N/A';
  }
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name_asc', label: 'A → Z' },
  { value: 'name_desc', label: 'Z → A' },
  { value: 'price_asc', label: 'Lowest Price' },
  { value: 'price_desc', label: 'Highest Price' },
];

const DEFAULT_FILTERS = {
  search: '',
  category: '',
  status: '',
  sort: 'newest',
  page: 1,
};

const DEFAULT_PAGINATION = { page: 1, pageSize: 6, total: 0, totalPages: 0 };

export default function ServiceManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      loadServices();
      return undefined;
    }

    const timeoutId = setTimeout(loadServices, 300);
    return () => clearTimeout(timeoutId);
  }, [filters]);

  async function loadServices() {
    setLoading(true);
    try {
      const response = await api.get('/services', {
        params: {
          search: filters.search || undefined,
          category: filters.category || undefined,
          status: filters.status || undefined,
          sort: filters.sort,
          page: filters.page,
        },
      });
      const { services: fetchedServices, pagination: fetchedPagination } = response.data.data;

      if (fetchedPagination.total > 0 && filters.page > fetchedPagination.totalPages) {
        setFilters((current) => ({ ...current, page: fetchedPagination.totalPages }));
        return;
      }

      setServices(fetchedServices);
      setPagination(fetchedPagination);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load services.');
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value, page: 1 }));
  }

  function goToPage(page) {
    setFilters((current) => ({ ...current, page }));
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  const banner = location.state?.serviceUpdated
    ? 'Service updated successfully.'
    : location.state?.serviceDeleted
      ? 'Service deleted successfully.'
      : '';

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="ui-yellow-text text-[28px] font-extrabold tracking-tight">Service Management</h1>
          <p className="mt-1 text-sm text-black/50">Manage and organize all your services</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/vendor/services/create')}
          className="ui-yellow ui-yellow-hover flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition-colors"
        >
          <PlusIcon />
          Add New Service
        </button>
      </div>

      {banner ? (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
          {banner}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-black/35">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Search services..."
            className="ui-yellow-border w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-black outline-none"
          />
        </div>

        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-black/35">
            <FilterIcon />
          </span>
          <select
            value={filters.category}
            onChange={(event) => updateFilter('category', event.target.value)}
            className="ui-yellow-border appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm text-black outline-none"
          >
            <option value="">All Categories</option>
            {VENDOR_CATEGORIES.map((category) => (
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
            <StatusIcon />
          </span>
          <select
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value)}
            className="ui-yellow-border appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm text-black outline-none"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
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
            value={filters.sort}
            onChange={(event) => updateFilter('sort', event.target.value)}
            className="ui-yellow-border appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm text-black outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <ChevronDownIcon />
          </span>
        </div>

        <button
          type="button"
          onClick={clearFilters}
          title="Clear Filters"
          aria-label="Clear Filters"
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-gray-200 text-black/55 hover:border-gray-300 hover:bg-gray-50 hover:text-black"
        >
          <ClearFiltersIcon />
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-black/60">Loading…</p>
      ) : services.length === 0 ? (
        <p className="mt-8 text-sm text-black/60">No services found.</p>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/vendor/services/${service.id}`, { state: { service } })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/vendor/services/${service.id}`, { state: { service } });
                  }
                }}
                className="cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative h-48 w-full bg-gray-100">
                  {service.image_url ? (
                    <img
                      src={service.image_url}
                      alt={service.service_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                      <ImagePlaceholderIcon />
                    </div>
                  )}

                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                      service.availability === 'Inactive' ? 'bg-rose-500 text-white' : 'ui-yellow text-black'
                    }`}
                  >
                    {service.availability === 'Inactive' ? 'Unavailable' : 'Available'}
                  </span>

                  {service.images?.length > 1 ? (
                    <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white">
                      +{service.images.length - 1} photos
                    </span>
                  ) : null}
                </div>

                <div className="p-5">
                  <span className="inline-block rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-black/50">
                    {service.service_category || 'Uncategorized'}
                  </span>

                  <h3 className="mt-3 text-lg font-bold leading-snug text-black">{service.service_name}</h3>

                  {service.service_description ? (
                    <p className="mt-1.5 line-clamp-2 text-sm text-black/55">{service.service_description}</p>
                  ) : null}

                  <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-4">
                    <div>
                      <p className="ui-yellow-text text-[11px] font-bold uppercase tracking-wide">
                        Starting From
                      </p>
                      <p className="ui-yellow-text text-lg font-bold">${service.starting_price}</p>
                    </div>
                    <p className="text-xs text-black/45">Updated {formatUpdatedDate(service.updated_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 ? (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-black/55">
                Showing {(pagination.page - 1) * pagination.pageSize + 1}–
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}{' '}
                services
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border border-gray-200 px-3.5 py-1.5 text-sm font-semibold text-black hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => goToPage(pageNumber)}
                    className={`h-9 w-9 rounded-lg border text-sm font-semibold transition-colors ${
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
                  className="rounded-lg border border-black px-3.5 py-1.5 text-sm font-semibold text-black hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-gray-200 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-black"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
