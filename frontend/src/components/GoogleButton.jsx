export default function GoogleButton({ label = 'Or sign in with Google', onClick }) {
  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-3 text-xs text-ink/45">
        <span className="h-px flex-1 bg-gray-200" />
        {label}
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium hover:bg-gray-50"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt=""
          className="h-4 w-4"
        />
        Continue with Google
      </button>
    </div>
  );
}
