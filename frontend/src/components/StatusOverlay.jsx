import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/* Full-screen blurred overlay with a centered card — shared by blocking
   loading states (payment processing, sending an event request) and the
   success cards that follow them, so the page underneath stays visible
   instead of being swapped for a blank white screen. Rendered through a
   portal into <body> because the customer pages' `page-fade-in` animation
   puts a transform on the page wrapper, which would otherwise make
   `position: fixed` resolve against that wrapper (pinning the overlay to
   the top of the page instead of the viewport). */
export function BlurOverlay({ children, size = 'md' }) {
  const widthClass = size === 'sm' ? 'max-w-sm' : 'max-w-md';

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <div className="login-overlay-fade fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        className={`login-modal-pop w-full ${widthClass} rounded-3xl bg-white/95 p-10 text-center shadow-[0_30px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

export function LoadingOverlay({ title, message }) {
  return (
    <BlurOverlay size="sm">
      <div role="status" aria-live="polite">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-[#F5C400]/15 animate-ping" />
          <span className="h-14 w-14 rounded-full border-4 border-black/10 border-t-[#F5C400] animate-spin" />
        </div>
        <h1 className="mt-6 text-xl font-extrabold text-black">{title}</h1>
        {message ? <p className="mt-2 text-sm text-black/45">{message}</p> : null}
      </div>
    </BlurOverlay>
  );
}
