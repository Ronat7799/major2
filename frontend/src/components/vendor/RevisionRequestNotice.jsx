/* Highlighted card telling the vendor the customer asked for changes to
   their quotation, with the customer's note quoted underneath. Shared by
   the request detail page and the revise-quotation form. */
export default function RevisionRequestNotice({ note, className = '' }) {
  return (
    <div className={`ui-yellow rounded-2xl p-5 shadow-sm ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-wide text-black/55">Revision Requested</p>
      <p className="mt-0.5 text-sm font-bold text-black">The customer asked for changes to your quotation.</p>

      {note ? (
        <blockquote className="mt-3 whitespace-pre-line break-words rounded-xl bg-white px-4 py-3 text-sm leading-relaxed text-black/75">
          {note}
        </blockquote>
      ) : null}
    </div>
  );
}
