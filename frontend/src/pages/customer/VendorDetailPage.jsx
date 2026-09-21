import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import ImageLightbox from '../../components/ImageLightbox.jsx';
import { getErrorMessage } from '../../utils/apiError.js';
import { useAuth } from '../../context/AuthContext.jsx';

function ExpandIcon({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path
        d="M7.5 3H4a1 1 0 0 0-1 1v3.5M12.5 3H16a1 1 0 0 1 1 1v3.5M7.5 17H4a1 1 0 0 1-1-1v-3.5M12.5 17H16a1 1 0 0 0 1-1v-3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ImagePlaceholderIcon({ className = 'h-9 w-9' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m4 17 5-5 3.5 3.5L16 12l4 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function LocationIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
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

function StarOutlineIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path
        d="M10 2.5l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.6 5-.7L10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlobeIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M2.5 10h15M10 2.5c1.8 2 2.8 4.9 2.8 7.5s-1 5.5-2.8 7.5c-1.8-2-2.8-4.9-2.8-7.5S8.2 4.5 10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function MailIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="m3.5 5.5 6.5 5 6.5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path
        d="M5 3.5h2.3l1 3-1.6 1.4a9 9 0 0 0 4.4 4.4l1.4-1.6 3 1v2.3c0 .8-.7 1.4-1.5 1.3A13 13 0 0 1 4.2 5c-.1-.8.5-1.5 1.3-1.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldCheckIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <path
        d="M10 2.5l6 2.2v4.6c0 4-2.6 6.7-6 8.2-3.4-1.5-6-4.2-6-8.2V4.7L10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="m7.3 10 1.8 1.8 3.6-3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TeamIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.3 16c0-2.6 2.1-4.3 4.7-4.3s4.7 1.7 4.7 4.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="14" cy="7.5" r="2.1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12.7 12c2 .2 3.6 1.7 3.6 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function MapPlaceholderIcon({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function FacebookIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7h-2.5v-2.9h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6v1.9h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z" />
    </svg>
  );
}

function InstagramIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function TwitterIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.4-1.3 1.7-2.2-.8.5-1.7.8-2.6 1a3.7 3.7 0 0 0-6.4 3.4A10.6 10.6 0 0 1 4.3 4.9a3.7 3.7 0 0 0 1.1 5 3.6 3.6 0 0 1-1.7-.4 3.7 3.7 0 0 0 3 3.6c-.6.2-1.2.2-1.8.1a3.7 3.7 0 0 0 3.5 2.6A7.5 7.5 0 0 1 2 17.3a10.6 10.6 0 0 0 5.7 1.7c6.9 0 10.6-5.7 10.6-10.6v-.5c.7-.5 1.4-1.2 1.9-2Z" />
    </svg>
  );
}

function LinkedinIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" />
      <path
        d="M7.5 9.5h2.7v9H7.5v-9Zm1.35-4.3a1.55 1.55 0 1 1 0 3.1 1.55 1.55 0 0 1 0-3.1ZM12.6 9.5h2.6v1.3h.04c.36-.68 1.24-1.4 2.56-1.4 2.74 0 3.24 1.8 3.24 4.14v5h-2.7v-4.43c0-1.06-.02-2.42-1.48-2.42-1.48 0-1.7 1.16-1.7 2.35v4.5h-2.7v-9Z"
        fill="#fff"
      />
    </svg>
  );
}

function PortfolioTile({ image, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className}`}
    >
      <img
        src={image.image_url}
        alt=""
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity duration-200 group-hover:bg-black/25 group-hover:opacity-100">
        <ExpandIcon className="ui-yellow-text h-7 w-7" />
      </span>
    </button>
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

function StarRating({ value, size = 'text-sm' }) {
  const rounded = Math.round(value || 0);
  return (
    <span className={`${size} tracking-tight text-[#F5C400]`} aria-hidden="true">
      {'★★★★★'.slice(0, rounded)}
      <span className="text-black/20">{'★★★★★'.slice(rounded)}</span>
    </span>
  );
}

function SectionHeading({ children }) {
  return <h2 className="ui-yellow-text text-2xl font-bold">{children}</h2>;
}

function CardHeading({ children }) {
  return (
    <div className="mb-5">
      <h2 className="ui-yellow-text text-2xl font-bold">{children}</h2>
      <div className="mt-4 border-b border-gray-100" />
    </div>
  );
}

function InfoRow({ icon, label, value, badge }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-black/50">
          {icon}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-black/40">{label}</p>
          <p className="mt-0.5 text-sm font-bold text-black">{value}</p>
        </div>
      </div>
      {badge}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
        <path d="m5 10.5 3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Verified
    </span>
  );
}

// No API key needed for a basic "output=embed" iframe. Prefers exact
// coordinates when the vendor has pinned a location; otherwise falls back to
// a text-address search so the map still shows something useful.
function buildMapEmbedUrl(vendor) {
  if (vendor.latitude != null && vendor.longitude != null) {
    return `https://www.google.com/maps?q=${vendor.latitude},${vendor.longitude}&z=15&output=embed`;
  }
  const address = vendor.full_address || vendor.business_address;
  return address ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed` : null;
}

const TABS = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'details', label: 'Details' },
  { id: 'reviews', label: 'Reviews' },
];

export default function VendorDetailPage() {
  const { vendorId } = useParams();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get('service');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('portfolio');
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setActiveTab('portfolio');
    setShowAllPhotos(false);
    setLightboxIndex(null);

    api
      .get(`/vendors/${vendorId}`, { params: { service: serviceId || undefined } })
      .then((response) => {
        if (!cancelled) {
          setDetail(response.data.data);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load this vendor.'));
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
  }, [vendorId, serviceId]);

  if (loading) {
    return <p className="page-fade-in mx-auto max-w-7xl px-6 py-16 text-sm text-black/60">Loading…</p>;
  }

  if (error || !detail) {
    return (
      <div className="page-fade-in mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {error || 'Vendor not found.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/vendors')}
          className="ui-yellow ui-yellow-hover mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
        >
          Back to Browse Vendors
        </button>
      </div>
    );
  }

  const { vendor, portfolio, portfolio_service_name, reviews, rating } = detail;
  const mapEmbedUrl = buildMapEmbedUrl(vendor);

  return (
    <div className="page-fade-in">
      {/* Hero */}
      <div className="relative h-[380px] w-full overflow-hidden bg-gray-200">
        {vendor.cover_image ? (
          <img src={vendor.cover_image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <ImagePlaceholderIcon className="h-16 w-16" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-6 pb-8">
          <h1 className="text-4xl font-extrabold text-white">
            {portfolio_service_name || vendor.company_name}
          </h1>
          {portfolio_service_name ? (
            <p className="mt-1 text-sm text-white/75">by {vendor.company_name}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/90">
            {vendor.business_address ? (
              <span className="flex items-center gap-1.5">
                <LocationIcon />
                {vendor.business_address}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <StarRating value={rating.average} />
              {rating.total > 0 ? (
                <span>
                  {rating.average.toFixed(1)} ({rating.total} reviews)
                </span>
              ) : (
                <span>No reviews yet</span>
              )}
            </span>
          </div>

          {vendor.categories.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {vendor.categories.map((category) => (
                <span
                  key={category}
                  className="rounded-full border border-white/50 px-3.5 py-1 text-xs font-semibold text-white"
                >
                  {category}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Company info bar */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-black shadow-sm">
              {vendor.profile_image ? (
                <img src={vendor.profile_image} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-white">{initialsOf(vendor.company_name)}</span>
              )}
            </div>
            <div>
              <p className="text-lg font-bold text-black">{vendor.company_name}</p>
              {vendor.business_address ? (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-black/55">
                  <LocationIcon className="h-4 w-4 text-black/40" />
                  {vendor.business_address}
                </p>
              ) : null}
              {vendor.categories.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {vendor.categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-black/60"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const quotationPath = `/vendors/${vendorId}/quotation`;
              if (user && user.role === 'customer') {
                navigate(quotationPath);
              } else {
                navigate('/login', { state: { from: quotationPath, backgroundLocation: location } });
              }
            }}
            className="ui-yellow ui-yellow-hover shrink-0 rounded-full px-8 py-3 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            Request a Quotation
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex justify-between border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`nav-underline -mb-px py-4 text-sm font-semibold transition-colors duration-200 ${
                activeTab === tab.id ? 'ui-yellow-text is-active' : 'text-black/50 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10">
        {activeTab === 'portfolio' ? (
          <section>
            <div className="flex items-baseline justify-between">
              <SectionHeading>Portfolio</SectionHeading>
              <span className="text-sm text-black/45">
                {portfolio_service_name ? `${portfolio_service_name} highlights` : 'Selected event highlights'}
              </span>
            </div>
            <p className="mt-2 text-sm text-black/55">
              {portfolio_service_name
                ? `Images uploaded for "${portfolio_service_name}".`
                : "Browse this vendor's uploaded service images."}
            </p>

            {portfolio.length === 0 ? (
              <p className="mt-8 text-sm text-black/60">No portfolio images available.</p>
            ) : (
              <>
                {showAllPhotos ? (
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {portfolio.map((image, idx) => (
                      <PortfolioTile
                        key={image.id}
                        image={image}
                        className="aspect-[4/3]"
                        onClick={() => setLightboxIndex(idx)}
                      />
                    ))}
                  </div>
                ) : portfolio.length >= 3 ? (
                  <div className="mt-6 grid h-[440px] grid-cols-3 grid-rows-2 gap-4">
                    <PortfolioTile
                      image={portfolio[0]}
                      className="col-span-2 row-span-2"
                      onClick={() => setLightboxIndex(0)}
                    />
                    <PortfolioTile image={portfolio[1]} onClick={() => setLightboxIndex(1)} />
                    <PortfolioTile image={portfolio[2]} onClick={() => setLightboxIndex(2)} />
                  </div>
                ) : (
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {portfolio.map((image, idx) => (
                      <PortfolioTile
                        key={image.id}
                        image={image}
                        className="aspect-[4/3]"
                        onClick={() => setLightboxIndex(idx)}
                      />
                    ))}
                  </div>
                )}

                {portfolio.length > 3 ? (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowAllPhotos((current) => !current)}
                      className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-semibold text-black transition-colors duration-200 hover:bg-gray-50"
                    >
                      {showAllPhotos ? 'Show Fewer Photos' : `View All Photos (${portfolio.length})`}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        ) : activeTab === 'details' ? (
          <section className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <CardHeading>Company Information</CardHeading>

              {vendor.business_description ? (
                <p className="text-sm leading-relaxed text-black/60">{vendor.business_description}</p>
              ) : null}

              <div className="mt-6 divide-y divide-gray-100">
                {vendor.year_of_experience != null ? (
                  <InfoRow
                    icon={<StarOutlineIcon />}
                    label="Years of Experience"
                    value={`${vendor.year_of_experience}+ Years`}
                  />
                ) : null}
                <InfoRow
                  icon={<ShieldCheckIcon />}
                  label="Business Registration"
                  value="Verified and Registered Business"
                  badge={<VerifiedBadge />}
                />
                <InfoRow icon={<TeamIcon />} label="Team Size" value="150-250 Professionals" />
                {vendor.languages_spoken.length > 0 ? (
                  <InfoRow
                    icon={<GlobeIcon />}
                    label="Languages Spoken"
                    value={vendor.languages_spoken.join(', ')}
                  />
                ) : null}
                {vendor.email ? <InfoRow icon={<MailIcon />} label="Company Email" value={vendor.email} /> : null}
                {vendor.phone ? <InfoRow icon={<PhoneIcon />} label="Business Phone" value={vendor.phone} /> : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <CardHeading>Business Location</CardHeading>

                {vendor.full_address || vendor.business_address ? (
                  <p className="flex items-start gap-2 text-sm text-black/70">
                    <LocationIcon className="mt-0.5 h-4 w-4 shrink-0 text-black/40" />
                    {vendor.full_address || vendor.business_address}
                  </p>
                ) : null}

                {mapEmbedUrl ? (
                  <div className="mt-5 h-[180px] w-full overflow-hidden rounded-2xl border border-gray-100">
                    <iframe
                      title="Vendor location map"
                      src={mapEmbedUrl}
                      className="h-full w-full"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : (
                  <div className="mt-5 flex h-[180px] w-full flex-col items-center justify-center gap-2 rounded-2xl bg-gray-100 text-black/40">
                    <MapPlaceholderIcon />
                    <span className="text-sm font-semibold">Google Maps</span>
                  </div>
                )}

                {vendor.business_address ? (
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-black/40">
                      Service Coverage Areas
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="ui-yellow rounded-full px-3 py-1 text-xs font-semibold text-black">
                        {vendor.business_address}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
                <CardHeading>Socials &amp; Website</CardHeading>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-[#1877F2]">
                    <FacebookIcon />
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-[#E4405F]">
                    <InstagramIcon />
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-black">
                    <TwitterIcon />
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-[#0A66C2]">
                    <LinkedinIcon />
                  </span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section>
            <SectionHeading>Customer Reviews</SectionHeading>

            {rating.total > 0 ? (
              <div className="mt-3 flex items-center gap-3">
                <span className="text-3xl font-bold text-black">{rating.average.toFixed(1)}</span>
                <StarRating value={rating.average} size="text-lg" />
                <span className="text-sm text-black/45">{rating.total} reviews</span>
              </div>
            ) : null}

            {reviews.length === 0 ? (
              <p className="mt-6 text-sm text-black/60">No customer reviews yet.</p>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                          {initialsOf(review.reviewer_name)}
                        </span>
                        <p className="text-sm font-bold text-black">{review.reviewer_name}</p>
                      </div>
                      <StarRating value={review.rating} />
                    </div>
                    {review.comment ? (
                      <p className="mt-3 text-sm leading-relaxed text-black/60">{review.comment}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <ImageLightbox
        images={portfolio}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}
