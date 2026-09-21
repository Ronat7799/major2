import { useReveal, revealStyle } from '../../hooks/useReveal.js';

const TESTIMONIALS = [
  {
    name: 'Sopha Nara',
    context: 'Wedding',
    rating: 5,
    quote: 'Finding a vendor was so easy. Reab Jom connected us with a fantastic photographer and our photos are breathtaking!',
  },
  {
    name: 'Dara Chilean',
    context: 'Corporate Gala',
    rating: 4,
    quote: 'The corporate event was a massive success. The vendor we booked handled everything flawlessly.',
  },
  {
    name: 'Mei Nin',
    context: 'Birthday',
    rating: 5,
    quote: 'Best birthday party ever! The decor was exactly what I imagined.',
  },
];

function Stars({ count }) {
  return (
    <div className="flex gap-0.5 text-[#F5C400]" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index}>{index < count ? '★' : '☆'}</span>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const [ref, visible] = useReveal();

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-6 py-14">
      <h2 style={revealStyle(visible, 150)} className="text-center text-2xl font-bold text-black">
        Customer <span className="ui-yellow-text">feedbacks!</span>
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {TESTIMONIALS.map((testimonial, index) => (
          <div
            key={testimonial.name}
            style={revealStyle(visible, 300 + index * 120)}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            <p className="font-semibold text-black">{testimonial.name}</p>
            <p className="text-xs text-black/50">{testimonial.context}</p>
            <div className="mt-2">
              <Stars count={testimonial.rating} />
            </div>
            <p className="mt-3 text-sm text-black/60">&ldquo;{testimonial.quote}&rdquo;</p>
          </div>
        ))}
      </div>
    </section>
  );
}
