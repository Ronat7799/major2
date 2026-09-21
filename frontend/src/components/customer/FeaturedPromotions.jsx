import { useReveal, revealStyle } from '../../hooks/useReveal.js';

function promoImage(seed) {
  return `https://picsum.photos/seed/${seed}/500/300`;
}

const PROMOTIONS = [
  {
    tag: 'Weddings',
    title: 'Book Your Dream Wedding Venue',
    description: 'Exclusive packages with catering, decor, and coordination.',
    image: promoImage('reabjom-wedding'),
  },
  {
    tag: 'Corporate',
    title: 'Corporate Event Packages Available',
    description: 'Gala dinners, team-building, and conference solutions.',
    image: promoImage('reabjom-corporate'),
  },
  {
    tag: 'Birthdays',
    title: '50% Off Birthday Party Bundles',
    description: 'Decor, catering, and entertainment - all in one package.',
    image: promoImage('reabjom-birthday'),
  },
  {
    tag: 'Graduations',
    title: 'Graduation Party Planning Made Easy',
    description: 'Venue, catering, and decor - tailored for your celebration.',
    image: promoImage('reabjom-graduation'),
  },
  {
    tag: 'Funerals',
    title: 'Compassionate Funeral Service Planning',
    description: 'Respectful, dignified arrangements handled with care.',
    image: promoImage('reabjom-funeral'),
  },
  {
    tag: 'Anniversaries',
    title: 'Anniversary Celebration Specials',
    description: 'Romantic venues, catering, and decor for milestone anniversaries.',
    image: promoImage('reabjom-anniversary'),
  },
];

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

export default function FeaturedPromotions() {
  const [ref, visible] = useReveal();

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-6 py-14">
      <div className="flex items-center justify-between">
        <div style={revealStyle(visible, 150)}>
          <p className="ui-yellow-text text-xs font-bold uppercase tracking-wide">Sponsored</p>
          <h2 className="mt-1 text-2xl font-bold text-black">Featured Promotions</h2>
        </div>
        <button
          type="button"
          style={revealStyle(visible, 150)}
          className="group ui-yellow-text flex items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          See All Ads
          <ArrowRightIcon className="group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PROMOTIONS.map((promo, index) => (
          <div
            key={promo.title}
            style={revealStyle(visible, 300 + index * 120)}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="h-36 w-full shrink-0 overflow-hidden bg-gray-100">
              <img
                src={promo.image}
                alt={promo.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-black">
                {promo.title}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-xs text-black/55">{promo.description}</p>
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-4">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-black/55">
                  {promo.tag}
                </span>
                <button
                  type="button"
                  className="ui-yellow ui-yellow-hover shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
