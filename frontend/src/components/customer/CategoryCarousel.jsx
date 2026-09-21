import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReveal, revealStyle } from '../../hooks/useReveal.js';

const SLIDE_INTERVAL_MS = 3000;

const SLIDES = [
  {
    tag: 'WEDDINGS',
    title: 'Make Your Wedding Day Unforgettable',
    description: 'Connect with top-rated wedding planners and venues.',
    buttonLabel: 'Find Wedding Vendors',
    image: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&w=1600&q=80',
  },
  {
    tag: 'BIRTHDAYS',
    title: 'Celebrate Every Birthday in Style',
    description: 'Book party planners, decorators, and entertainers in minutes.',
    buttonLabel: 'Find Birthday Vendors',
    image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1600&q=80',
  },
  {
    tag: 'CORPORATE EVENTS',
    title: 'Host Corporate Events That Impress',
    description: 'From conferences to galas, find vendors built for business.',
    buttonLabel: 'Find Corporate Vendors',
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1600&q=80',
  },
  {
    tag: 'GRADUATIONS',
    title: 'Mark the Milestone in Style',
    description: 'Plan a graduation celebration your family will remember.',
    buttonLabel: 'Find Graduation Vendors',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1600&q=80',
  },
  {
    tag: 'OTHER OCCASIONS',
    title: 'A Vendor for Every Occasion',
    description: 'Whatever you are planning, we have a vendor for it.',
    buttonLabel: 'Browse All Vendors',
    image: 'https://images.unsplash.com/photo-1517456793572-1d8efd6dc135?auto=format&fit=crop&w=1600&q=80',
  },
];

function ChevronIcon({ direction }) {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M12.5 4.5 6 10l6.5 5.5' : 'M7.5 4.5 14 10l-6.5 5.5'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CategoryCarousel() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const timeoutRef = useRef(null);
  const [sectionRef, visible] = useReveal();

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setActiveIndex((current) => (current + 1) % SLIDES.length);
    }, SLIDE_INTERVAL_MS);

    return () => clearTimeout(timeoutRef.current);
  }, [activeIndex]);

  function goTo(index) {
    setActiveIndex((index + SLIDES.length) % SLIDES.length);
  }

  return (
    <section ref={sectionRef} style={revealStyle(visible)} className="relative w-full overflow-hidden pb-14">
      <div className="relative h-[340px] w-full overflow-hidden sm:h-[380px]">
        <div
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {SLIDES.map((slide) => (
            <div
              key={slide.tag}
              className="h-full w-full shrink-0 bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.55) 100%), url(${slide.image})`,
              }}
            >
              <div className="mx-auto flex h-full max-w-6xl items-center justify-center px-6">
                <div className="flex max-w-xl flex-col items-center gap-3 text-center">
                  <span className="ui-yellow inline-block w-fit rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-black">
                    {slide.tag}
                  </span>
                  <h3
                    className="text-2xl font-extrabold leading-tight text-white drop-shadow-sm sm:text-4xl"
                  >
                    {slide.title}
                  </h3>
                  <p className="text-sm text-white/85 sm:text-base">{slide.description}</p>
                  <button
                    type="button"
                    onClick={() => navigate('/vendors')}
                    className="ui-yellow ui-yellow-hover mt-3 w-fit rounded-full px-6 py-2.5 text-sm font-semibold text-black shadow-lg transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {slide.buttonLabel}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          aria-label="Previous slide"
          className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/30 sm:left-8"
        >
          <ChevronIcon direction="left" />
        </button>
        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          aria-label="Next slide"
          className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/30 sm:right-8"
        >
          <ChevronIcon direction="right" />
        </button>

        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.tag}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex ? 'w-6 bg-[#F5C400]' : 'w-1.5 bg-white/60 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
