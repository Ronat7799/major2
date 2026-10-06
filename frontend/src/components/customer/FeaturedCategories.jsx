import { useReveal, revealStyle } from '../../hooks/useReveal.js';

function WeddingIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-9 w-9" fill="none" aria-hidden="true">
      <circle cx="7" cy="11" r="4" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="13" cy="11" r="4" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function BirthdayIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-9 w-9" fill="none" aria-hidden="true">
      <rect x="3" y="8.5" width="14" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 11.5h14" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 8.5v8" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10 8.5c-1.2 0-2.5-.8-2.5-2.2 0-1 .8-1.6 1.6-1.6 1.1 0 1.9 1.4 1.9 1.4s.8-1.4 1.9-1.4c.8 0 1.6.6 1.6 1.6 0 1.4-1.3 2.2-2.5 2.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CorporateIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-9 w-9" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="14" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 7V5.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 11h14" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function GraduationIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-9 w-9" fill="none" aria-hidden="true">
      <path d="M10 4 2.5 7.5 10 11l7.5-3.5L10 4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path
        d="M5.5 9.3v3c0 1.1 2 2 4.5 2s4.5-.9 4.5-2v-3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M17.5 7.5v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function FuneralIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-9 w-9" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="5.3" r="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="14.7" cy="10" r="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="10" cy="14.7" r="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="5.3" cy="10" r="2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function OtherIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-9 w-9" fill="none" aria-hidden="true">
      <path
        d="m10 3 1.9 4.1 4.4.5-3.3 3 1 4.4L10 12.8 6 15l1-4.4-3.3-3 4.4-.5L10 3Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CATEGORIES = [
  { label: 'Weddings', icon: WeddingIcon },
  { label: 'Birthdays', icon: BirthdayIcon },
  { label: 'Corporate Events', icon: CorporateIcon },
  { label: 'Graduations', icon: GraduationIcon },
  { label: 'Funerals', icon: FuneralIcon },
  { label: 'Other Occasions', icon: OtherIcon },
];

export default function FeaturedCategories() {
  const [ref, visible] = useReveal();

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-6 py-14">
      <h2 style={revealStyle(visible, 150)} className="text-center text-2xl font-bold text-black">
        Featured <span className="ui-yellow-text">Categories</span>
      </h2>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {CATEGORIES.map((category, index) => {
          const Icon = category.icon;
          return (
            <div
              key={category.label}
              style={revealStyle(visible, 300 + index * 120)}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-16 w-16 items-center justify-center text-[#F5C400] transition-transform duration-200 group-hover:scale-110">
                <Icon />
              </div>
              <p className="text-sm font-semibold text-black">{category.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
