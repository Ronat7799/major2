import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/apiError.js';
import RevisionRequestNotice from '../../components/vendor/RevisionRequestNotice.jsx';

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M4 6h12M8 6V4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V6m-7.5 0 .6 9.4a1.5 1.5 0 0 0 1.5 1.4h5.8a1.5 1.5 0 0 0 1.5-1.4L15.5 6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
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

function initialsOf(name) {
  if (!name) {
    return '';
  }
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatEventDate(dateString) {
  if (!dateString) {
    return 'Not specified';
  }
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(timeString) {
  if (!timeString) {
    return null;
  }
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
  if (!hasMin && !hasMax) {
    return 'Not specified';
  }
  if (hasMin && hasMax && Number(min) !== Number(max)) {
    return `${prefix}${Number(min).toLocaleString('en-US')}-${prefix}${Number(max).toLocaleString('en-US')}`;
  }
  return `${prefix}${Number(hasMin ? min : max).toLocaleString('en-US')}`;
}

function formatMoney(value) {
  return `$${(Number(value) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function emptyItem() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    service_name: '',
    quantity: 1,
    unit_price: '',
    description: '',
  };
}

function FieldLabel({ children }) {
  return <span className="mb-1.5 block text-xs font-medium text-black/45">{children}</span>;
}

export default function CreateQuotationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [items, setItems] = useState([emptyItem()]);
  const [transportationFee, setTransportationFee] = useState('');
  const [equipmentFee, setEquipmentFee] = useState('');
  const [otherCharges, setOtherCharges] = useState('');
  const [serviceMessage, setServiceMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const isRevising = request?.latestQuotation?.status === 'revision_requested';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get(`/quotation-requests/${id}`)
      .then((response) => {
        if (!cancelled) {
          const loadedRequest = response.data.data.request;
          setRequest(loadedRequest);
          setLoadError('');

          const latest = loadedRequest.latestQuotation;
          if (latest?.status === 'revision_requested') {
            if (latest.items?.length) {
              setItems(
                latest.items.map((item) => ({
                  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  service_name: item.service_name || '',
                  quantity: item.quantity ?? 1,
                  unit_price: item.unit_price ?? '',
                  description: item.description || '',
                }))
              );
            }
            const chargeByName = new Map(latest.charges?.map((charge) => [charge.charge_name, charge.charge_price]));
            setTransportationFee(chargeByName.get('Transportation Fee')?.toString() || '');
            setEquipmentFee(chargeByName.get('Equipment Fee')?.toString() || '');
            setOtherCharges(chargeByName.get('Other Charges')?.toString() || '');
            setServiceMessage(latest.serviceMessage || '');
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(getErrorMessage(err, 'Unable to load this quotation request.'));
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

  function updateItem(itemId, field, value) {
    setItems((current) => current.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems((current) => [...current, emptyItem()]);
  }

  function removeItem(itemId) {
    setItems((current) => (current.length > 1 ? current.filter((item) => item.id !== itemId) : current));
  }

  function itemTotal(item) {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    return quantity * unitPrice;
  }

  const subtotal = items.reduce((sum, item) => sum + itemTotal(item), 0);
  const additionalTotal =
    (Number(transportationFee) || 0) + (Number(equipmentFee) || 0) + (Number(otherCharges) || 0);
  const grandTotal = subtotal + additionalTotal;

  async function handleSend() {
    setSubmitError('');

    const validItems = items.filter(
      (item) => item.service_name.trim() && Number(item.quantity) > 0 && item.unit_price !== '' && Number(item.unit_price) >= 0
    );
    if (!validItems.length) {
      setSubmitError('Add at least one service with a name, quantity, and unit price.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: validItems.map((item) => ({
          service_name: item.service_name.trim(),
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          description: item.description.trim() || undefined,
        })),
        charges: [
          { charge_name: 'Transportation Fee', charge_price: Number(transportationFee) || 0 },
          { charge_name: 'Equipment Fee', charge_price: Number(equipmentFee) || 0 },
          { charge_name: 'Other Charges', charge_price: Number(otherCharges) || 0 },
        ].filter((charge) => charge.charge_price > 0),
        service_message: serviceMessage.trim() || undefined,
      };

      if (isRevising) {
        await api.post(`/quotations/${request.latestQuotation.id}/revise`, payload);
      } else {
        await api.post(`/quotation-requests/${id}/quotation`, payload);
      }
      window.dispatchEvent(new Event('vendor-quotation-requests-changed'));
      navigate(`/vendor/quotation-requests/${id}`, { state: { quotationSent: true } });
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Unable to send this quotation.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-black/60">Loading…</p>;
  }

  if (loadError || !request) {
    return (
      <div className="text-center">
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {loadError || 'Quotation request not found.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/vendor/quotation-requests')}
          className="ui-yellow ui-yellow-hover mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
        >
          Back to Requests
        </button>
      </div>
    );
  }

  if (request.status !== 'NEW' && !isRevising) {
    return (
      <div className="text-center">
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700">
          A quotation has already been sent for this request.
        </p>
        <button
          type="button"
          onClick={() => navigate(`/vendor/quotation-requests/${id}`)}
          className="ui-yellow ui-yellow-hover mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
        >
          Back to Request Details
        </button>
      </div>
    );
  }

  const displayedServices = request.services.filter(
    (service) => service.trim().toLowerCase() !== 'other' && !service.trim().toLowerCase().startsWith('other:')
  );

  return (
    <div className="pb-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-black/40">
        <Link to="/vendor/quotation-requests" className="transition-colors hover:text-black">
          Requests
        </Link>
        <span>&gt;</span>
        <Link to={`/vendor/quotation-requests/${id}`} className="transition-colors hover:text-black">
          Request Details
        </Link>
        <span>&gt;</span>
        <span className="text-black/60">Create Quotation</span>
      </div>

      <h1 className="mt-2 text-[28px] font-extrabold tracking-tight text-black">
        {isRevising ? 'Revise Quotation' : 'Create Quotation'}
      </h1>
      {isRevising ? (
        <RevisionRequestNotice className="mt-4" note={request.latestQuotation.revisionNote} />
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-10">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black text-base font-semibold text-white">
                {initialsOf(request.customer.name)}
              </div>
              <div>
                <p className="text-base font-bold text-black">{request.customer.name}</p>
                <span className="mt-1 inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-black/45">
                  {request.requestCode}
                </span>
              </div>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-5">
              <h2 className="text-sm font-bold text-black">Event Details</h2>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="flex items-center gap-1.5 text-xs text-black/40">
                    <EventTypeIcon /> Event Type
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-black">{request.eventType || 'Not specified'}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs text-black/40">
                    <CalendarIcon /> Date
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-black">{formatEventDate(request.eventDate)}</p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs text-black/40">
                    <ClockIcon /> Time
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-black">
                    {formatTimeRange(request.startTime, request.endTime)}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 text-xs text-black/40">
                    <PinIcon /> Location
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-black">{request.location || 'Not specified'}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Guests</p>
                <p className="mt-0.5 text-sm font-bold text-black">
                  {formatRange(request.guestsMin, request.guestsMax)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Budget</p>
                <p className="mt-0.5 text-sm font-bold text-green-600">
                  {formatRange(request.budgetMin, request.budgetMax, '$')}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-5">
              <h2 className="text-sm font-bold text-black">Required Services</h2>
              {displayedServices.length > 0 ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {displayedServices.map((service) => (
                    <span
                      key={service}
                      className="ui-yellow rounded-full px-3 py-1 text-xs font-semibold text-black"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2.5 text-xs text-black/45">No specific services selected.</p>
              )}
            </div>

            <div className="mt-5 border-t border-gray-100 pt-5">
              <h2 className="text-sm font-bold text-black">Event Description</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-black/60">
                {request.description || 'The customer did not add an event description.'}
              </p>
            </div>

            {request.images.length > 0 ? (
              <div className="mt-5 border-t border-gray-100 pt-5">
                <h2 className="text-sm font-bold text-black">Inspiration Photos</h2>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {request.images.slice(0, 3).map((image) => (
                    <div key={image.id} className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                      <img src={image.image_url} alt="Inspiration" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-black">Service Breakdown</h2>
              <button
                type="button"
                onClick={addItem}
                className="ui-yellow-text flex items-center gap-1.5 text-sm font-semibold transition-colors"
              >
                <PlusIcon />
                Add Service
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-100 p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_0.7fr_1fr_1fr_auto] sm:items-end">
                    <label className="block">
                      <FieldLabel>Service Name</FieldLabel>
                      <input
                        type="text"
                        value={item.service_name}
                        onChange={(event) => updateItem(item.id, 'service_name', event.target.value)}
                        placeholder="e.g. Venue Decoration"
                        className="ui-yellow-border w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-black outline-none transition-shadow"
                      />
                    </label>
                    <label className="block">
                      <FieldLabel>Qty</FieldLabel>
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(event) => updateItem(item.id, 'quantity', event.target.value)}
                        className="ui-yellow-border w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-black outline-none transition-shadow"
                      />
                    </label>
                    <label className="block">
                      <FieldLabel>Unit Price</FieldLabel>
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-black/40">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={item.unit_price}
                          onChange={(event) => updateItem(item.id, 'unit_price', event.target.value)}
                          placeholder="0"
                          className="ui-yellow-border w-full rounded-lg border border-gray-200 bg-white py-2 pl-6 pr-3 text-sm text-black outline-none transition-shadow"
                        />
                      </div>
                    </label>
                    <div>
                      <FieldLabel>Total</FieldLabel>
                      <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm font-bold text-black">
                        {formatMoney(itemTotal(item))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                      aria-label="Delete service"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  <label className="mt-3 block">
                    <FieldLabel>Description</FieldLabel>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(event) => updateItem(item.id, 'description', event.target.value)}
                      placeholder="Add a description for this service..."
                      className="ui-yellow-border w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-black outline-none transition-shadow"
                    />
                  </label>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-black/60">
              Services Subtotal: <span className="font-bold text-green-600">{formatMoney(subtotal)}</span>
            </p>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <h2 className="text-lg font-bold text-black">Additional Charges</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <FieldLabel>Transportation Fee</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-black/40">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={transportationFee}
                      onChange={(event) => setTransportationFee(event.target.value)}
                      placeholder="0"
                      className="ui-yellow-border w-full rounded-lg border border-gray-200 py-2.5 pl-6 pr-3 text-sm text-black outline-none transition-shadow"
                    />
                  </div>
                </label>
                <label className="block">
                  <FieldLabel>Equipment Fee</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-black/40">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={equipmentFee}
                      onChange={(event) => setEquipmentFee(event.target.value)}
                      placeholder="0"
                      className="ui-yellow-border w-full rounded-lg border border-gray-200 py-2.5 pl-6 pr-3 text-sm text-black outline-none transition-shadow"
                    />
                  </div>
                </label>
                <label className="block">
                  <FieldLabel>Other Charges</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-black/40">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={otherCharges}
                      onChange={(event) => setOtherCharges(event.target.value)}
                      placeholder="0"
                      className="ui-yellow-border w-full rounded-lg border border-gray-200 py-2.5 pl-6 pr-3 text-sm text-black outline-none transition-shadow"
                    />
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-xl bg-[#F5C400]/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Services Subtotal</p>
                <p className="mt-0.5 text-base font-bold text-black">{formatMoney(subtotal)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Additional Fees</p>
                <p className="mt-0.5 text-base font-bold text-black">+{formatMoney(additionalTotal)}</p>
              </div>
              <div className="sm:text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Total Quotation</p>
                <p className="mt-0.5 text-2xl font-extrabold text-green-600">{formatMoney(grandTotal)}</p>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <h2 className="text-lg font-bold text-black">Vendor Message</h2>
              <textarea
                rows={4}
                value={serviceMessage}
                onChange={(event) => setServiceMessage(event.target.value)}
                placeholder="Write a message to the customer..."
                className="ui-yellow-border mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-black outline-none transition-shadow placeholder:text-black/35"
              />
            </div>

            {submitError ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                {submitError}
              </p>
            ) : null}

            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
              <button
                type="button"
                onClick={() => navigate(`/vendor/quotation-requests/${id}`)}
                className="text-sm font-semibold text-black/45 transition-colors hover:text-black"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={submitting}
                className="ui-yellow ui-yellow-hover rounded-full px-7 py-2.5 text-sm font-bold text-black shadow-sm transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                {submitting ? 'Sending…' : isRevising ? 'Send Revised Quotation' : 'Send Quotation'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
