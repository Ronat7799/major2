export default function SelectField({ label, value, onChange, options, placeholder, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-black">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          required={required}
          className="ui-yellow-border w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-black outline-none"
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40"
          fill="none"
          aria-hidden="true"
        >
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </label>
  );
}
