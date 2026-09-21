export default function SubmitButton({ children, loading }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="ui-yellow ui-yellow-hover w-full rounded-full px-4 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}
