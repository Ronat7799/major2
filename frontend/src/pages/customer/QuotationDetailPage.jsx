import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/apiError.js';

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12.5 4.5 6 10l6.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ filled }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill={filled ? 'currentColor' : 'none'} aria-hidden="true">
      <path
        d="M10 2.5l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.6 5-.7L10 2.5Z"
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.3}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EventTypeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8h14" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8h14M7 2.5v3M13 2.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M10 17.5s5.5-4.7 5.5-9A5.5 5.5 0 0 0 4.5 8.5c0 4.3 5.5 9 5.5 9Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function GuestsIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 16c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="14" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12.5 12.2c2 .2 3.5 1.6 3.5 3.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function DeclineIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function BudgetIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <rect x="2.5" y="5" width="15" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M3 4.5h14a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H8l-3.5 3v-3H3a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function initialsOf(name) {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatEventDate(dateString) {
  if (!dateString) return 'Not specified';
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(timeString) {
  if (!timeString) return null;
  const [hourStr, minuteStr] = timeString.split(':');
  const hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${period}`;
}

function formatTimeRange(startTime, endTime) {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  if (start && end) return `${start} - ${end}`;
  return start || end || 'Not specified';
}

function formatRange(min, max, prefix = '') {
  const hasMin = min !== null && min !== undefined;
  const hasMax = max !== null && max !== undefined;
  if (!hasMin && !hasMax) return 'Not specified';
  if (hasMin && hasMax && Number(min) !== Number(max)) {
    return `${prefix}${Number(min).toLocaleString('en-US')} - ${prefix}${Number(max).toLocaleString('en-US')}`;
  }
  return `${prefix}${Number(hasMin ? min : max).toLocaleString('en-US')}`;
}

function formatMoney(value) {
  return `$${(Number(value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatLongDate(dateString) {
  if (!dateString) return 'Not available';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatMemberSince(dateString) {
  if (!dateString) return 'Not available';
  return new Date(dateString).getFullYear();
}

function pad(value) {
  return String(value).padStart(2, '0');
}

const STATUS_LABELS = {
  pending: 'Pending',
  accepted: 'Accepted',
  cancelled: 'Declined',
  revision_requested: 'Revision Requested',
  revised: 'Revised',
};

const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-600',
  Accepted: 'bg-green-50 text-green-600',
  Declined: 'bg-red-50 text-red-600',
  'Revision Requested': 'bg-blue-50 text-blue-600',
  Revised: 'bg-gray-100 text-gray-500',
};

function DetailField({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-black/35">{icon}</span>
      <div>
        <p className="text-xs font-medium text-black/40">{label}</p>
        <p className="mt-0.5 text-sm font-bold text-black">{value}</p>
      </div>
    </div>
  );
}

export default function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [acting, setActing] = useState('');
  const [nowTick, setNowTick] = useState(Date.now());
  const [showRequestChanges, setShowRequestChanges] = useState(false);
  const [changesNote, setChangesNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get(`/quotations/${id}`)
      .then((response) => {
        if (!cancelled) {
          setQuotation(response.data.data.quotation);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Unable to load this quotation.'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleAccept() {
    setActionError('');
    setActing('accept');
    try {
      const response = await api.post(`/quotations/${id}/accept`);
      setQuotation((current) => ({
        ...current,
        status: response.data.data.quotation.status,
        conversationId: response.data.data.quotation.conversationId,
      }));
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to accept this quotation.'));
    } finally {
      setActing('');
    }
  }

  async function handleDecline() {
    setActionError('');
    setActing('decline');
    try {
      const response = await api.post(`/quotations/${id}/decline`);
      setQuotation((current) => ({ ...current, status: response.data.data.quotation.status }));
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to decline this quotation.'));
    } finally {
      setActing('');
    }
  }

  async function handleRequestChanges() {
    setActionError('');
    setActing('request-changes');
    try {
      const response = await api.post(`/quotations/${id}/request-changes`, { note: changesNote.trim() });
      setQuotation((current) => ({
        ...current,
        status: response.data.data.quotation.status,
        revisionNote: response.data.data.quotation.revisionNote,
      }));
      setShowRequestChanges(false);
      setChangesNote('');
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to send your change request.'));
    } finally {
      setActing('');
    }
  }

  if (loading) {
    return <p className="page-fade-in mx-auto max-w-3xl px-6 py-16 text-sm text-black/60">Loading…</p>;
  }

  if (error || !quotation) {
    return (
      <div className="page-fade-in mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {error || 'Quotation not found.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/customer/quotations')}
          className="ui-yellow ui-yellow-hover mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
        >
          Back to My Quotations
        </button>
      </div>
    );
  }

  const statusLabel = STATUS_LABELS[quotation.status] || 'Pending';
  const isPending = statusLabel === 'Pending';

  const displayedServices = quotation.event.requiredServices.filter(
    (service) => service.trim().toLowerCase() !== 'other' && !service.trim().toLowerCase().startsWith('other:')
  );

  let countdownLabel = null;
  let countdownStyle = 'text-green-600 bg-green-50';
  const expired = quotation.isExpired;
  if (isPending && !expired && quotation.expiresAt) {
    const diffMs = new Date(quotation.expiresAt).getTime() - nowTick;
    if (diffMs > 0) {
      const totalMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      countdownLabel = `Expires in ${hours}h ${pad(minutes)}m`;
      if (hours >= 3) countdownStyle = 'text-green-600 bg-green-50';
      else if (hours >= 1) countdownStyle = 'text-orange-600 bg-orange-50';
      else countdownStyle = 'text-red-600 bg-red-50';
    }
  }

  return (
    <div className="page-fade-in mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center gap-2 text-sm text-black/45">
        <button
          type="button"
          onClick={() => navigate('/customer/quotations')}
          aria-label="Back to My Quotations"
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-black/5 hover:text-black"
        >
          <BackIcon />
        </button>
        <Link to="/customer/quotations" className="transition-colors hover:text-black">
          My Quotations
        </Link>
        <span>&gt;</span>
        <span className="font-semibold text-black">{quotation.quotationCode}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-black sm:text-[28px]">Quotation Details</h1>
          <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[statusLabel]}`}>
            {expired ? 'Expired' : statusLabel}
          </span>
        </div>

        {isPending && !expired ? (
          <div className="flex flex-wrap items-center gap-2.5">
            {quotation.canRequestChanges ? (
              <button
                type="button"
                onClick={() => setShowRequestChanges((current) => !current)}
                disabled={acting !== ''}
                className="rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Request Changes
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleAccept}
              disabled={acting !== ''}
              className="ui-yellow ui-yellow-hover rounded-full px-5 py-2.5 text-sm font-bold text-black shadow-sm transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {acting === 'accept' ? 'Accepting…' : 'Accept Quotation'}
            </button>
            <button
              type="button"
              onClick={handleDecline}
              disabled={acting !== ''}
              aria-label="Decline quotation"
              title="Decline"
              className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <DeclineIcon />
            </button>
          </div>
        ) : null}
      </div>

      {isPending && !expired && quotation.canRequestChanges && showRequestChanges ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-black/40" htmlFor="changes-note">
            What would you like changed?
          </label>
          <textarea
            id="changes-note"
            value={changesNote}
            onChange={(event) => setChangesNote(event.target.value)}
            rows={3}
            placeholder="e.g. Could you lower the transportation fee and add a backup generator?"
            className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/30"
          />
          <div className="mt-3 flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRequestChanges}
              disabled={acting !== ''}
              className="ui-yellow ui-yellow-hover rounded-full px-5 py-2 text-sm font-semibold text-black shadow-sm transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {acting === 'request-changes' ? 'Sending…' : 'Send Request'}
            </button>
            <button
              type="button"
              onClick={() => setShowRequestChanges(false)}
              disabled={acting !== ''}
              className="text-sm font-semibold text-black/50 transition-colors hover:text-black"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {statusLabel === 'Revision Requested' ? (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-blue-700">Waiting for the vendor to send a revised quotation.</p>
            {quotation.inviteConversationId ? (
              <button
                type="button"
                onClick={() =>
                  navigate('/customer/messages', { state: { conversationId: quotation.inviteConversationId } })
                }
                className="ui-yellow ui-yellow-hover rounded-full px-4 py-2 text-sm font-semibold text-black shadow-sm transition-all hover:scale-[1.02]"
              >
                {quotation.inviteStatus === 'invited' ? 'Vendor wants to chat' : 'View conversation'}
              </button>
            ) : null}
          </div>
          {quotation.revisionNote ? (
            <p className="mt-1 text-sm text-blue-700/80">Your request: “{quotation.revisionNote}”</p>
          ) : null}
        </div>
      ) : null}

      {statusLabel === 'Revised' ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-sm font-semibold text-black/60">A revised quotation has been sent for this request.</p>
          {quotation.nextQuotationId ? (
            <button
              type="button"
              onClick={() => navigate(`/customer/quotations/${quotation.nextQuotationId}`)}
              className="ui-yellow ui-yellow-hover rounded-full px-4 py-2 text-sm font-semibold text-black shadow-sm transition-all hover:scale-[1.02]"
            >
              View Revised Quotation
            </button>
          ) : null}
        </div>
      ) : null}

      {quotation.history && quotation.history.length > 1 ? (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowHistory((current) => !current)}
            className="text-sm font-semibold text-black/50 underline-offset-2 transition-colors hover:text-black hover:underline"
          >
            {showHistory ? 'Hide Revision History' : 'View Revision History'}
          </button>

          {showHistory ? (
            <div className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
              {quotation.history.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3 ${entry.isCurrent ? 'bg-[#F5C400]/5' : ''}`}
                >
                  <div>
                    <p className="text-sm font-bold text-black">
                      Revision {entry.revisionNumber}
                      {entry.isCurrent ? ' (Current)' : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-black/45">{formatLongDate(entry.createdAt)}</p>
                    {entry.revisionNote ? (
                      <p className="mt-1 text-xs italic text-black/50">“{entry.revisionNote}”</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-bold text-black">${Number(entry.grandTotal).toLocaleString('en-US')}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                        STATUS_STYLES[STATUS_LABELS[entry.status]] || STATUS_STYLES.Pending
                      }`}
                    >
                      {STATUS_LABELS[entry.status] || entry.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {actionError ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {actionError}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="ui-yellow-text text-base font-bold">Event Summary</h2>
            <div className="mt-4 grid grid-cols-1 gap-5 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField icon={<EventTypeIcon />} label="Event Type" value={quotation.event.eventType || 'Not specified'} />
              <DetailField icon={<CalendarIcon />} label="Event Date" value={formatEventDate(quotation.event.eventDate)} />
              <DetailField icon={<ClockIcon />} label="Event Time" value={formatTimeRange(quotation.event.startTime, quotation.event.endTime)} />
              <DetailField icon={<PinIcon />} label="Event Location" value={quotation.event.location || 'Not specified'} />
              <DetailField
                icon={<GuestsIcon />}
                label="Number of Guests"
                value={formatRange(quotation.event.guestsMin, quotation.event.guestsMax)}
              />
              <DetailField
                icon={<BudgetIcon />}
                label="Budget Range"
                value={formatRange(quotation.event.budgetMin, quotation.event.budgetMax, '$')}
              />
            </div>
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Required Services</p>
              {displayedServices.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {displayedServices.map((service) => (
                    <span key={service} className="ui-yellow rounded-full px-3 py-1 text-xs font-semibold text-black">
                      {service}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-black/45">No specific services selected.</p>
              )}
            </div>
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-black/40">Event Description</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-black/60">
                {quotation.event.description || 'No description provided.'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="ui-yellow-text text-base font-bold">Quotation Summary</h2>

            <div className="mt-4 border-t border-gray-100">
              {quotation.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-black">{item.serviceName}</p>
                    {item.description ? <p className="mt-0.5 text-xs text-black/50">{item.description}</p> : null}
                  </div>
                  <p className="shrink-0 text-sm font-bold text-black">{formatMoney(item.totalPrice)}</p>
                </div>
              ))}

              {quotation.charges.length > 0 ? (
                <div className="mt-1 border-t border-gray-100 pt-2">
                  {quotation.charges.map((charge) => (
                    <div key={charge.id} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-black/70">{charge.chargeName}</span>
                      <span className="font-semibold text-black">{formatMoney(charge.chargePrice)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="text-base font-bold text-black">Grand Total</span>
              <span className="text-2xl font-extrabold text-green-600">{formatMoney(quotation.grandTotal)}</span>
            </div>

            {quotation.serviceMessage ? (
              <p className="mt-4 whitespace-pre-line rounded-xl bg-[#F5C400]/10 px-4 py-3.5 text-sm leading-relaxed text-black/70">
                {quotation.serviceMessage}
              </p>
            ) : null}

          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-black">Your Vendor</h2>
            <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black text-base font-semibold text-white">
                {quotation.vendor.logo ? (
                  <img src={quotation.vendor.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  initialsOf(quotation.vendor.name)
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-black">{quotation.vendor.name}</p>
                {quotation.vendor.category ? (
                  <span className="ui-yellow mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-black">
                    {quotation.vendor.category}
                  </span>
                ) : null}
              </div>
            </div>

            {quotation.vendor.address ? (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-black/55">
                <PinIcon /> {quotation.vendor.address}
              </p>
            ) : null}

            <div className="mt-2 flex items-center gap-1.5">
              {quotation.vendor.ratingAverage !== null ? (
                <>
                  <span className="flex items-center gap-0.5 text-[#F5C400]">
                    {Array.from({ length: 5 }, (_, index) => (
                      <StarIcon key={index} filled={index < Math.round(quotation.vendor.ratingAverage)} />
                    ))}
                  </span>
                  <span className="text-sm font-bold text-black">{quotation.vendor.ratingAverage.toFixed(1)}</span>
                </>
              ) : (
                <span className="text-xs text-black/40">No reviews yet</span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Member Since</p>
                <p className="mt-0.5 text-sm font-bold text-black">{formatMemberSince(quotation.vendor.memberSince)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Events</p>
                <p className="mt-0.5 text-sm font-bold text-black">{quotation.vendor.completedEvents}+</p>
              </div>
            </div>

            <button
              type="button"
              disabled={!quotation.conversationId}
              onClick={() => navigate('/customer/messages', { state: { conversationId: quotation.conversationId } })}
              title={quotation.conversationId ? undefined : 'Chat unlocks once you accept this quotation.'}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-200 disabled:hover:bg-transparent"
            >
              <MessageIcon /> Message Vendor
            </button>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-black">Quotation Status</h2>
            <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Status</p>
                <p className="mt-0.5 text-sm font-bold text-black">
                  {expired
                    ? 'Expired'
                    : isPending
                      ? 'Pending Customer Response'
                      : statusLabel}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Submitted Date</p>
                <p className="mt-0.5 text-sm font-bold text-black">{formatLongDate(quotation.submittedDate)}</p>
              </div>
            </div>

            {isPending ? (
              <div className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${expired ? 'bg-gray-100 text-gray-500' : countdownStyle}`}>
                <ClockIcon />
                {expired ? 'This quotation has expired.' : countdownLabel}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
