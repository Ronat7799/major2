import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function AuthModal({ children, maxWidthClassName = 'max-w-md', brandPanel = false, brandImage = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;

  function closeModal() {
    if (backgroundLocation) {
      const target = `${backgroundLocation.pathname}${backgroundLocation.search || ''}${backgroundLocation.hash || ''}`;
      navigate(target, { replace: true });
    } else {
      navigate('/');
    }
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        closeModal();
      }
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [backgroundLocation]);

  return (
    <div className="login-overlay-fade fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-md sm:py-10">
      <button
        type="button"
        aria-label="Close"
        onClick={closeModal}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div
        className={`login-modal-pop relative flex max-h-[calc(100vh-3rem)] w-full ${maxWidthClassName} ${
          brandPanel ? 'flex-col sm:flex-row' : 'flex-col'
        } overflow-hidden rounded-3xl bg-white/95 shadow-[0_30px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl`}
      >
        {brandPanel ? (
          <div className="hidden shrink-0 flex-col bg-[#F5C400] p-8 sm:flex sm:w-2/5">
            {brandImage ? (
              <div className="flex h-full flex-col items-center text-center">
                <p className="text-xl font-extrabold tracking-tight text-black">ReabJom</p>
                <p className="mt-3 text-2xl font-extrabold leading-snug text-black">Plan Your Perfect Event</p>
                <div className="mt-6 w-full flex-1 overflow-hidden rounded-2xl">
                  <img src={brandImage} alt="" className="h-full w-full object-cover" />
                </div>
                <p className="mt-6 w-full text-left text-xs font-medium text-black/55">
                  © {new Date().getFullYear()} ReabJom
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-between">
                <div>
                  <p className="text-xl font-extrabold tracking-tight text-black">ReabJom</p>
                  <p className="mt-6 text-2xl font-extrabold leading-snug text-black">Plan Your Perfect Event</p>
                </div>
                <p className="text-xs font-medium text-black/55">© {new Date().getFullYear()} ReabJom</p>
              </div>
            )}
          </div>
        ) : null}

        <button
          type="button"
          onClick={closeModal}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-black/40 transition-colors duration-200 hover:bg-black/5 hover:text-black"
        >
          <CloseIcon />
        </button>

        <div className="no-scrollbar flex-1 overflow-y-auto p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
