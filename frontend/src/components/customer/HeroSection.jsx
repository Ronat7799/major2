import { useNavigate } from 'react-router-dom';
import heroBanner from '../../assets/hero-banner.png';
import { useReveal, revealStyle } from '../../hooks/useReveal.js';

function TagIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M9.4 2.5H4.6A2.1 2.1 0 0 0 2.5 4.6v4.8c0 .56.22 1.1.62 1.48l7.1 7.1a2.1 2.1 0 0 0 2.96 0l5.1-5.1a2.1 2.1 0 0 0 0-2.96l-7.1-7.1a2.1 2.1 0 0 0-1.48-.62Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="6.7" cy="6.7" r="1.1" fill="currentColor" />
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

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8h14M7 2.5v3M13 2.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const SEARCH_FIELDS = [
  { icon: TagIcon, label: 'Event Type', value: 'Select Category' },
  { icon: PinIcon, label: 'Location', value: 'Phnom Penh' },
  { icon: CalendarIcon, label: 'Date', value: 'Pick a Date' },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const [ref, visible] = useReveal();

  return (
    <section
      className="relative flex min-h-[420px] items-center justify-center bg-cover bg-center px-6 py-20 text-center text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${heroBanner})`,
      }}
    >
      <div ref={ref} className="w-full max-w-4xl">
        <h1 style={revealStyle(visible, 150)} className="text-3xl font-extrabold sm:text-5xl">
          Plan <span className="ui-yellow-text">Your</span> Perfect <span className="ui-yellow-text">Event!</span>
        </h1>
        <p style={revealStyle(visible, 320)} className="mt-4 text-sm text-white/85 sm:text-base">
          Connect with top-rated local vendors for any occasion. From dream weddings to grand corporate
          celebrations.
        </p>

        <div
          style={revealStyle(visible, 480)}
          className="mx-auto mt-7 flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white text-left shadow-xl sm:flex-row sm:items-stretch sm:rounded-full"
        >
          {SEARCH_FIELDS.map((field, index) => (
            <div key={field.label} className="flex flex-1 items-stretch">
              <div className="flex flex-1 items-center gap-2.5 px-5 py-3.5 sm:py-3">
                <span className="ui-yellow-text flex h-8 w-8 shrink-0 items-center justify-center">
                  <field.icon />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-black/40">{field.label}</p>
                  <p className="truncate text-sm font-bold text-black">{field.value}</p>
                </div>
              </div>
              {index < SEARCH_FIELDS.length - 1 ? (
                <span className="my-3 hidden w-px shrink-0 bg-gray-200 sm:block" />
              ) : null}
            </div>
          ))}

          <button
            type="button"
            onClick={() => navigate('/vendors')}
            className="ui-yellow ui-yellow-hover flex shrink-0 items-center justify-center px-8 py-4 text-sm font-semibold text-black transition-colors duration-200"
          >
            Search Vendors
          </button>
        </div>
      </div>
    </section>
  );
}
