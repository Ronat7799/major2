/* Compact single-star rating shown inline next to a vendor's name on the
   customer quotation/booking cards. Renders nothing when the vendor has no
   reviews yet, keeping the name row clean. */
export default function VendorRating({ average }) {
  if (average === null || average === undefined) {
    return null;
  }

  return (
    <span
      className="flex shrink-0 items-center gap-1 text-xs font-bold text-black"
      aria-label={`Rated ${average.toFixed(1)} out of 5`}
    >
      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-[#F5C400]" fill="currentColor" aria-hidden="true">
        <path d="M10 2.5l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.6 5-.7L10 2.5Z" />
      </svg>
      {average.toFixed(1)}
    </span>
  );
}
