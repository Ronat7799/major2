import { useReveal, revealStyle } from '../../hooks/useReveal.js';

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="m10 2 2.2 5.1 5.5.5-4.2 3.6 1.3 5.4L10 13.8 5.2 16.6l1.3-5.4-4.2-3.6 5.5-.5L10 2Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.4c0-.87.24-1.46 1.5-1.46H16V4.35A20 20 0 0 0 13.8 4.2c-2.2 0-3.7 1.34-3.7 3.8v2.5H7.6v3h2.5V21h3.4Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M4 4l7.2 9.6L4.4 20h2.3l5.9-5.7L17 20h3l-7.5-10L19.7 4h-2.3l-5.4 5.3L7.3 4H4Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8" cy="8.2" r="1.2" />
      <rect x="7.1" y="10.5" width="1.8" height="7" />
      <path d="M11 10.5h1.7v1c.5-.8 1.3-1.2 2.3-1.2 1.9 0 2.9 1.2 2.9 3.4v3.8h-1.8v-3.5c0-1-.4-1.7-1.4-1.7-.8 0-1.3.5-1.5 1.1-.1.2-.1.5-.1.8v3.3H11v-7Z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { label: 'Facebook', icon: FacebookIcon },
  { label: 'Instagram', icon: InstagramIcon },
  { label: 'Twitter', icon: TwitterIcon },
  { label: 'LinkedIn', icon: LinkedInIcon },
];

const QUICK_LINKS = ['Browse Vendors', 'Special Offers', 'How It Works', 'Trust & Safety'];
const CATEGORY_LINKS = ['Weddings', 'Birthdays', 'Corporate', 'Graduations'];

export default function CustomerFooter() {
  const [ref, visible] = useReveal();

  return (
    <footer ref={ref} className="border-t border-gray-200 bg-white">
      <div
        style={revealStyle(visible)}
        className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <p className="ui-yellow-text flex items-center gap-1.5 text-lg font-extrabold">
            <StarIcon />
            Reab Jom
          </p>
          <p className="mt-3 text-sm leading-relaxed text-black/55">
            Plan Your Perfect Event. The most trusted event planning marketplace in Cambodia.
          </p>
          <div className="mt-4 flex items-center gap-2">
            {SOCIAL_LINKS.map((social) => {
              const Icon = social.icon;
              return (
                <span
                  key={social.label}
                  aria-label={social.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-black/55 transition-all duration-200 hover:scale-110 hover:bg-[#F5C400]/15 hover:text-black"
                >
                  <Icon />
                </span>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-black">Quick Links</p>
          <ul className="mt-3 space-y-2 text-sm text-black/55">
            {QUICK_LINKS.map((link) => (
              <li key={link}>{link}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-black">Categories</p>
          <ul className="mt-3 space-y-2 text-sm text-black/55">
            {CATEGORY_LINKS.map((link) => (
              <li key={link}>{link}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-black">Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-black/55">
            <li>reabjom@gmail.com</li>
            <li>+855 61 977 702</li>
            <li>Phnom Penh, Cambodia</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-100 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-black/45 sm:flex-row">
          <div className="flex items-center gap-4">
            <span className="transition-colors duration-200 hover:text-black/70">Privacy Policy</span>
            <span className="transition-colors duration-200 hover:text-black/70">Terms of Service</span>
          </div>
          <p>© {new Date().getFullYear()} Reab Jom. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
