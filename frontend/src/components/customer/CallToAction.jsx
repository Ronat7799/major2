import { useReveal, revealStyle } from '../../hooks/useReveal.js';

export default function CallToAction() {
  const [ref, visible] = useReveal();

  return (
    <section ref={ref} className="ui-yellow px-6 py-14 text-center">
      <h2 style={revealStyle(visible, 150)} className="text-2xl font-bold text-black sm:text-3xl">
        Ready to Start Planning?
      </h2>
      <p style={revealStyle(visible, 320)} className="mt-2 text-sm text-black/70">
        Browse verified vendors in your area and get the best deals.
      </p>
      <div style={revealStyle(visible, 480)} className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
        >
          Get Started
        </button>
        <button
          type="button"
          className="rounded-full border border-black px-6 py-3 text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-black/5 active:translate-y-0"
        >
          Learn More
        </button>
      </div>
    </section>
  );
}
