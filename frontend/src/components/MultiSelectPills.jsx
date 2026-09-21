export default function MultiSelectPills({ label, helperText, options, value, onChange, max }) {
  function toggle(option) {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
      return;
    }
    if (value.length >= max) {
      return;
    }
    onChange([...value, option]);
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-black">{label}</span>
      {helperText ? <p className="mb-2 text-xs text-black/45">{helperText}</p> : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option);
          const disabled = !selected && value.length >= max;
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => toggle(option)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                selected
                  ? 'ui-yellow border-transparent text-black'
                  : disabled
                    ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-black/30'
                    : 'border-gray-200 bg-white text-black/70 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
