import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../api/client';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
      <path d="M5 12.5 10 17.5 19 7" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatMoney(value) {
  return `$${(Number(value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function DetailRow({ label, value, highlighted }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-black/50">{label}</span>
      <span className={`truncate text-sm font-bold ${highlighted ? 'text-green-600' : 'text-black'}`}>{value}</span>
    </div>
  );
}

export default function PaymentSuccessPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stage = searchParams.get('stage') === 'balance' ? 'balance' : 'deposit';

  const [phase, setPhase] = useState('processing');
  const [quotation, setQuotation] = useState(null);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/quotations/${id}`)
      .then((response) => {
        if (!cancelled) setQuotation(response.data.data.quotation);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!quotation?.bookingId) return undefined;
    let cancelled = false;
    api
      .get(`/bookings/${quotation.bookingId}`)
      .then((response) => {
        if (!cancelled) setBooking(response.data.data.booking);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [quotation?.bookingId]);

  useEffect(() => {
    const timer = setTimeout(() => setPhase('success'), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="page-fade-in flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
        {phase === 'processing' ? (
          <>
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[#F5C400]/15 animate-ping" />
              <span className="h-14 w-14 rounded-full border-4 border-black/10 border-t-[#F5C400] animate-spin" />
            </div>
            <h1 className="mt-6 text-xl font-extrabold text-black">Processing your payment...</h1>
            <p className="mt-2 text-sm text-black/45">Please wait while we confirm your booking.</p>
          </>
        ) : (
          <>
            <div className="success-pop mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckIcon />
            </div>
            <h1 className="mt-6 text-xl font-extrabold text-black">Payment Successful</h1>
            <p className="mt-2 text-sm text-black/45">
              {stage === 'deposit'
                ? 'Your deposit has been received — the remaining balance is due before your event.'
                : 'Your booking is fully paid.'}
            </p>

            {quotation ? (
              <div className="mt-6 divide-y divide-gray-100 rounded-xl bg-gray-50 px-4 text-left">
                <DetailRow label="Booking ID" value={quotation.quotationCode} />
                <DetailRow label="Event" value={quotation.event.eventType || 'Not specified'} />
                <DetailRow label="Vendor" value={quotation.vendor.name} />
                {stage === 'deposit' && booking?.payment ? (
                  <>
                    <DetailRow label="Deposit Paid" value={formatMoney(booking.payment.deposit.amount)} highlighted />
                    <DetailRow label="Balance Due" value={formatMoney(booking.payment.balance.amount)} />
                  </>
                ) : (
                  <DetailRow label="Total Amount" value={formatMoney(quotation.grandTotal)} highlighted />
                )}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() =>
                navigate(quotation.bookingId ? `/customer/bookings/${quotation.bookingId}` : `/customer/quotations/${id}`)
              }
              className="ui-yellow ui-yellow-hover mt-6 w-full rounded-full py-3.5 text-sm font-bold text-black shadow-sm transition-all hover:scale-[1.01] active:scale-100"
            >
              View Booking Details
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-3 w-full rounded-full border border-gray-200 py-3.5 text-sm font-semibold text-black transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
