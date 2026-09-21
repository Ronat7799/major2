export default function TextAreaField({ id, label, value, onChange, required = false, rows = 4 }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-black">{label}</span>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        rows={rows}
        className="ui-yellow-border w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none"
      />
    </label>
  );
}
