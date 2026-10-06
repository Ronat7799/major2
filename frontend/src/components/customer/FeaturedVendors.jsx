import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/apiError.js';
import { useReveal, revealStyle } from '../../hooks/useReveal.js';

function ImagePlaceholderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m4 17 5-5 3.5 3.5L16 12l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-3.5 w-3.5 transition-transform duration-200 ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 10h12M11 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

export default function FeaturedVendors() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ref, visible] = useReveal();

  useEffect(() => {
    let cancelled = false;

    async function loadVendors() {
      try {
        const response = await api.get('/vendors/featured');
        if (!cancelled) {
          setVendors(response.data.data.vendors);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load vendors.'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadVendors();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section ref={ref} className="bg-gray-50 px-6 py-14">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-end justify-between">
          <div style={revealStyle(visible, 150)}>
            <h2 className="text-2xl font-bold text-black">Featured Vendors</h2>
            <p className="mt-1 text-sm text-black/55">Discover the best service providers for your big day.</p>
          </div>
          <button
            type="button"
            style={revealStyle(visible, 150)}
            className="group ui-yellow-text flex shrink-0 items-center gap-1.5 text-sm font-semibold hover:underline"
          >
            View all vendors
            <ArrowRightIcon className="group-hover:translate-x-0.5" />
          </button>
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-black/60">Loading…</p>
        ) : error ? (
          <p className="mt-8 text-sm text-red-600">{error}</p>
        ) : vendors.length === 0 ? (
          <p className="mt-8 text-sm text-black/60">No vendors available yet.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor, index) => (
              <div
                key={vendor.id}
                style={revealStyle(visible, 300 + index * 120)}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-48 w-full bg-gray-100">
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

                  <div className="absolute -bottom-5 left-4 h-12 w-12 overflow-hidden rounded-full border-4 border-white bg-black shadow-sm">
                    {vendor.profile_image ? (
                      <img src={vendor.profile_image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-white">
                        {initialsOf(vendor.company_name)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5 pt-8">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-black">{vendor.service_name}</h3>
                    <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-black/40">
                      <span className="text-[#F5C400]">★</span>
                      New
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-black/45">by {vendor.company_name}</p>

                  <div className="mt-2">
                    <p className="ui-yellow-text text-[11px] font-bold uppercase tracking-wide">Starting From</p>
                    <p className="ui-yellow-text text-lg font-bold">${vendor.starting_price}</p>
                  </div>

                  {vendor.business_category ? (
                    <span className="mt-3 inline-block rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-black/50">
                      {vendor.business_category}
                    </span>
                  ) : null}

                  {vendor.business_description ? (
                    <p className="mt-3 line-clamp-2 text-sm text-black/55">{vendor.business_description}</p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => navigate(`/vendors/${vendor.vendor_id}?service=${vendor.id}`)}
                    className="ui-yellow ui-yellow-hover mt-4 w-full rounded-full px-4 py-2 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
