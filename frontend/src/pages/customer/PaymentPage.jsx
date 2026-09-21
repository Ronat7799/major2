import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import api from '../../api/client';
import { getErrorMessage } from '../../utils/apiError.js';
import { stripePromise } from '../../api/stripe.js';

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M12.5 4.5 6 10l6.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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

function StripeMark() {
  return <span className="rounded-md bg-[#635BFF] px-2.5 py-1 text-xs font-bold italic text-white">stripe</span>;
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

function SummaryRow({ icon, label, value }) {
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

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-black">{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'ui-yellow-border w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none';

const CARD_ELEMENT_OPTIONS = {
  hidePostalCode: true,
  style: {
    base: {
      fontSize: '14px',
      color: '#000',
      fontFamily: 'inherit',
      '::placeholder': { color: 'rgba(0,0,0,0.3)' },
    },
    invalid: { color: '#dc2626' },
  },
};

// Lives inside <Elements> so it can use the Stripe hooks — collects the
// cardholder name/ZIP alongside Stripe's own Card Element and confirms the
// Payment Intent the parent already created.
function StripeCardForm({ quotationId, stage, clientSecret, cardholderName, setCardholderName, zip, setZip }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [cardFocused, setCardFocused] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setPayError('');
    setPaying(true);
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: cardholderName || undefined,
            address: zip ? { postal_code: zip } : undefined,
          },
        },
      });

      if (error) {
        setPayError(error.message || 'Payment failed. Please check your card details and try again.');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        navigate(`/customer/quotations/${quotationId}/payment/success?stage=${stage}`);
      }
    } finally {
      setPaying(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold text-black">Complete Your Payment Method</h2>
      <p className="mt-1 text-sm text-black/45">Enter your card details below to pay for this booking.</p>

      <div className="mt-5 space-y-4 border-t border-gray-100 pt-5">
        <Field label="Cardholder Name">
          <input
            type="text"
            value={cardholderName}
            onChange={(event) => setCardholderName(event.target.value)}
            placeholder="Name on card"
            className={inputClass}
          />
        </Field>

        <Field label="Card Details">
          <div
            className={`rounded-lg border bg-white px-3 py-3 transition-shadow ${
              cardFocused ? 'border-[#F5C400] shadow-[0_0_0_3px_rgba(245,196,0,0.35)]' : 'border-gray-200'
            }`}
          >
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onFocus={() => setCardFocused(true)}
              onBlur={() => setCardFocused(false)}
            />
          </div>
        </Field>

        <Field label="Billing ZIP / Postal Code">
          <input
            type="text"
            value={zip}
            onChange={(event) => setZip(event.target.value)}
            placeholder="12000"
            className={inputClass}
          />
        </Field>
      </div>

      {payError ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {payError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || paying}
        className="ui-yellow ui-yellow-hover mt-6 w-full rounded-full py-3.5 text-sm font-bold text-black shadow-sm transition-all hover:scale-[1.01] active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {paying ? 'Processing…' : 'Pay Now'}
      </button>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-black/40">
        Secured by <StripeMark />
      </p>
      <p className="mt-2 text-center text-xs text-black/40">
        By completing payment you agree to our Terms of Service and Cancellation Policy.
      </p>
    </form>
  );
}

export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stage = searchParams.get('stage') === 'balance' ? 'balance' : 'deposit';

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [clientSecret, setClientSecret] = useState('');
  const [amountDue, setAmountDue] = useState(null);
  const [intentLoading, setIntentLoading] = useState(true);
  const [intentError, setIntentError] = useState('');

  const [cardholderName, setCardholderName] = useState('');
  const [zip, setZip] = useState('');

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

  useEffect(() => {
    if (!quotation?.bookingId) return undefined;
    let cancelled = false;
    setIntentLoading(true);

    api
      .post(`/bookings/${quotation.bookingId}/pay-${stage}`)
      .then((response) => {
        if (!cancelled) {
          setClientSecret(response.data.data.clientSecret);
          setAmountDue(response.data.data.amount);
          setIntentError('');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setIntentError(getErrorMessage(err, 'Unable to prepare payment.'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIntentLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [quotation?.bookingId, stage]);

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

  const itemsSubtotal = quotation.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);

  return (
    <div className="page-fade-in mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-center gap-2 text-sm text-black/45">
        <button
          type="button"
          onClick={() => navigate(`/customer/quotations/${id}`)}
          aria-label="Back to Quotation Details"
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-black/5 hover:text-black"
        >
          <BackIcon />
        </button>
        <Link to={`/customer/quotations/${id}`} className="transition-colors hover:text-black">
          Quotation Details
        </Link>
        <span>&gt;</span>
        <span className="font-semibold text-black">Payment</span>
      </div>

      <h1 className="mt-3 text-2xl font-extrabold text-black sm:text-[28px]">Payment</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column — Stripe payment form */}
        <div className="lg:col-span-2">
          {clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <StripeCardForm
                quotationId={id}
                stage={stage}
                clientSecret={clientSecret}
                cardholderName={cardholderName}
                setCardholderName={setCardholderName}
                zip={zip}
                setZip={setZip}
              />
            </Elements>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-black">Complete Your Payment Method</h2>
              {intentLoading ? (
                <p className="mt-4 text-sm text-black/45">Preparing secure payment…</p>
              ) : (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                  {intentError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right column — Order summary */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-black">Order Summary</h2>

            <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black text-sm font-semibold text-white">
                {quotation.vendor.logo ? (
                  <img src={quotation.vendor.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  initialsOf(quotation.vendor.name)
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-black">{quotation.vendor.name}</p>
                {quotation.vendor.category ? (
                  <span className="ui-yellow mt-1 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-black">
                    {quotation.vendor.category}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
              <SummaryRow icon={<EventTypeIcon />} label="Event Type" value={quotation.event.eventType || 'Not specified'} />
              <SummaryRow icon={<CalendarIcon />} label="Event Date" value={formatEventDate(quotation.event.eventDate)} />
              <SummaryRow
                icon={<ClockIcon />}
                label="Event Time"
                value={formatTimeRange(quotation.event.startTime, quotation.event.endTime)}
              />
              <SummaryRow icon={<PinIcon />} label="Location" value={quotation.event.location || 'Not specified'} />
              <SummaryRow
                icon={<GuestsIcon />}
                label="Guests"
                value={formatRange(quotation.event.guestsMin, quotation.event.guestsMax)}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-black">Payment Breakdown</h2>

            <div className="mt-4 border-t border-gray-100">
              {quotation.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="text-black/70">{item.serviceName}</span>
                  <span className="shrink-0 font-semibold text-black">{formatMoney(item.totalPrice)}</span>
                </div>
              ))}

              {quotation.charges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="text-black/70">{charge.chargeName}</span>
                  <span className="shrink-0 font-semibold text-black">{formatMoney(charge.chargePrice)}</span>
                </div>
              ))}
            </div>

            <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
              <span className="text-black/60">Subtotal</span>
              <span className="font-semibold text-black">{formatMoney(itemsSubtotal)}</span>
            </div>

            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-black/60">Grand Total</span>
              <span className="font-semibold text-black">{formatMoney(quotation.grandTotal)}</span>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F5C400]/10 px-4 py-3.5">
              <span className="text-sm font-bold text-black">
                {stage === 'deposit' ? 'Deposit Due Now (30%)' : 'Balance Due Now'}
              </span>
              <span className="text-xl font-extrabold text-green-600">
                {formatMoney(amountDue ?? (stage === 'deposit' ? quotation.grandTotal * 0.3 : quotation.grandTotal))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
