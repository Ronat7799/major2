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

function VisaBadge() {
  return <span className="rounded bg-[#1A1F71] px-2 py-1 text-[10px] font-extrabold italic text-white">VISA</span>;
}

function MastercardBadge() {
  return (
    <span className="flex items-center rounded bg-white px-1.5 py-1">
      <span className="h-3.5 w-3.5 rounded-full bg-[#EB001B]" />
      <span className="-ml-1.5 h-3.5 w-3.5 rounded-full bg-[#F79E1B] mix-blend-multiply" />
    </span>
  );
}

function AmexBadge() {
  return <span className="rounded bg-[#2E77BC] px-2 py-1 text-[10px] font-extrabold text-white">AMEX</span>;
}

function DemoBadge() {
  return (
    <span className="rounded bg-gray-100 px-2 py-1 text-[10px] font-extrabold tracking-wide text-black/50">DEMO</span>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 text-black/30" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 8h15" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M10 2.5 16 5v4.3c0 4-2.6 6.9-6 8.2-3.4-1.3-6-4.2-6-8.2V5l6-2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaymentMethodOption({ selected, onClick, label, badges }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-colors ${
        selected ? 'border-[#F5C400] bg-[#F5C400]/10' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <span className="flex items-center gap-3">
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? 'border-[#F5C400]' : 'border-gray-300'
          }`}
        >
          {selected ? <span className="h-2.5 w-2.5 rounded-full bg-[#F5C400]" /> : null}
        </span>
        <span className="text-sm font-bold text-black">{label}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">{badges}</span>
    </button>
  );
}

function formatCardNumberInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  return (digits.match(/.{1,4}/g) || []).join(' ');
}

function formatExpiryInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCvcInput(value) {
  return value.replace(/\D/g, '').slice(0, 4);
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
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <Field label="Card Number">
          <div
            className={`flex items-center justify-between rounded-lg border bg-white px-3 py-3 transition-shadow ${
              cardFocused ? 'border-[#F5C400] shadow-[0_0_0_3px_rgba(245,196,0,0.35)]' : 'border-gray-200'
            }`}
          >
            <div className="w-full">
              <CardElement
                options={CARD_ELEMENT_OPTIONS}
                onFocus={() => setCardFocused(true)}
                onBlur={() => setCardFocused(false)}
              />
            </div>
            <CardIcon />
          </div>
        </Field>

        <Field label="Cardholder Name">
          <input
            type="text"
            value={cardholderName}
            onChange={(event) => setCardholderName(event.target.value)}
            placeholder="Full name on card"
            className={inputClass}
          />
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

      <div className="mt-5 flex items-center gap-5 border-t border-gray-100 pt-5 text-xs text-black/40">
        <span className="flex items-center gap-1.5">
          <ShieldIcon /> SSL Encrypted Payment
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldIcon /> 256-bit Security
        </span>
      </div>

      <button
        type="submit"
        disabled={!stripe || paying}
        className="ui-yellow ui-yellow-hover mt-5 w-full rounded-xl py-3.5 text-sm font-bold text-black shadow-sm transition-all hover:scale-[1.01] active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {paying ? 'Processing…' : 'Pay Now'}
      </button>

      <p className="mt-3 text-center text-xs text-black/40">
        By completing payment you agree to our Terms of Service and Cancellation Policy.
      </p>
    </form>
  );
}

function SimulatedPaymentForm({ bookingId, quotationId, stage }) {
  const navigate = useNavigate();
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [zip, setZip] = useState('');
  const [cardFocused, setCardFocused] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setPayError('');
    setPaying(true);
    try {
      await api.post(`/bookings/${bookingId}/simulate-${stage}`, { cardNumber, expiry, cvc, zip });
      navigate(`/customer/quotations/${quotationId}/payment/success?stage=${stage}`);
    } catch (err) {
      setPayError(getErrorMessage(err, 'Simulated payment failed. Please check the card details and try again.'));
    } finally {
      setPaying(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <Field label="Card Details">
          <div
            className={`flex items-center rounded-lg border bg-white px-3 py-2.5 transition-shadow ${
              cardFocused ? 'border-[#F5C400] shadow-[0_0_0_3px_rgba(245,196,0,0.35)]' : 'border-gray-200'
            }`}
          >
            <input
              type="text"
              inputMode="numeric"
              value={cardNumber}
              onChange={(event) => setCardNumber(formatCardNumberInput(event.target.value))}
              onFocus={() => setCardFocused(true)}
              onBlur={() => setCardFocused(false)}
              placeholder="1234 5678 9012 3456"
              className="w-full min-w-0 flex-1 border-none p-0 text-sm text-black outline-none placeholder:text-black/30"
            />
            <span className="mx-2.5 h-5 w-px shrink-0 bg-gray-200" />
            <input
              type="text"
              inputMode="numeric"
              value={expiry}
              onChange={(event) => setExpiry(formatExpiryInput(event.target.value))}
              onFocus={() => setCardFocused(true)}
              onBlur={() => setCardFocused(false)}
              placeholder="MM/YY"
              className="w-14 shrink-0 border-none p-0 text-sm text-black outline-none placeholder:text-black/30"
            />
            <span className="mx-2.5 h-5 w-px shrink-0 bg-gray-200" />
            <input
              type="text"
              inputMode="numeric"
              value={cvc}
              onChange={(event) => setCvc(formatCvcInput(event.target.value))}
              onFocus={() => setCardFocused(true)}
              onBlur={() => setCardFocused(false)}
              placeholder="CVC"
              className="w-10 shrink-0 border-none p-0 text-sm text-black outline-none placeholder:text-black/30"
            />
            <span className="ml-2.5 shrink-0">
              <CardIcon />
            </span>
          </div>
        </Field>

        <Field label="Cardholder Name">
          <input
            type="text"
            value={cardholderName}
            onChange={(event) => setCardholderName(event.target.value)}
            placeholder="Full name on card"
            className={inputClass}
          />
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

      <div className="mt-5 flex items-center gap-5 border-t border-gray-100 pt-5 text-xs text-black/40">
        <span className="flex items-center gap-1.5">
          <ShieldIcon /> SSL Encrypted Payment
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldIcon /> 256-bit Security
        </span>
      </div>

      <button
        type="submit"
        disabled={paying}
        className="ui-yellow ui-yellow-hover mt-5 w-full rounded-xl py-3.5 text-sm font-bold text-black shadow-sm transition-all hover:scale-[1.01] active:scale-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {paying ? 'Processing…' : 'Pay Now'}
      </button>

      <p className="mt-3 text-center text-xs text-black/40">
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
  const [payMode, setPayMode] = useState('stripe');

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
  const chargesSubtotal = quotation.charges.reduce((sum, charge) => sum + Number(charge.chargePrice), 0);

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
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-black">Payment Method</h2>

            <div className="mt-4 space-y-3">
              <PaymentMethodOption
                selected={payMode === 'stripe'}
                onClick={() => setPayMode('stripe')}
                label="Credit / Debit Card"
                badges={
                  <>
                    <VisaBadge />
                    <MastercardBadge />
                    <AmexBadge />
                  </>
                }
              />
              <PaymentMethodOption
                selected={payMode === 'simulate'}
                onClick={() => setPayMode('simulate')}
                label="Simulated Card"
                badges={<DemoBadge />}
              />
            </div>

            <div className="mt-5 border-t border-gray-100 pt-5">
              {payMode === 'simulate' ? (
                <SimulatedPaymentForm bookingId={quotation.bookingId} quotationId={id} stage={stage} />
              ) : clientSecret ? (
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
              ) : intentLoading ? (
                <p className="text-sm text-black/45">Preparing secure payment…</p>
              ) : (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                  {intentError}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-black">Order Summary</h2>

            <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white text-sm font-semibold text-black">
                {quotation.vendor.logo ? (
                  <img src={quotation.vendor.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  initialsOf(quotation.vendor.name)
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-black">{quotation.vendor.name}</p>
                {quotation.vendor.category ? (
                  <span className="ui-yellow mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
                    {quotation.vendor.category}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-bold text-black">Event Details</h3>
              <div className="mt-3 space-y-3">
                <SummaryRow icon={<EventTypeIcon />} label="Event Type" value={quotation.event.eventType || 'Not specified'} />
                <SummaryRow icon={<CalendarIcon />} label="Date" value={formatEventDate(quotation.event.eventDate)} />
                <SummaryRow
                  icon={<ClockIcon />}
                  label="Time"
                  value={formatTimeRange(quotation.event.startTime, quotation.event.endTime)}
                />
                <SummaryRow icon={<PinIcon />} label="Location" value={quotation.event.location || 'Not specified'} />
              </div>
            </div>

            <div className="mt-5 border-t border-gray-100 pt-4">
              <h3 className="text-sm font-bold text-black">Price Breakdown</h3>

              <div className="mt-3 space-y-2">
                {quotation.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-black/60">{item.serviceName}</span>
                    <span className="shrink-0 font-semibold text-black">{formatMoney(item.totalPrice)}</span>
                  </div>
                ))}

                {quotation.charges.map((charge) => (
                  <div key={charge.id} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-black/60">{charge.chargeName}</span>
                    <span className="shrink-0 font-semibold text-black">{formatMoney(charge.chargePrice)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-sm">
                <span className="text-black/60">Subtotal</span>
                <span className="font-bold text-black">{formatMoney(itemsSubtotal + chargesSubtotal)}</span>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-base font-extrabold text-black">TOTAL</span>
                <span className="text-2xl font-extrabold text-green-600">{formatMoney(quotation.grandTotal)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#F5C400]/10 px-4 py-3.5">
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
