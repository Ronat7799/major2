const AppError = require('../utils/AppError');
const stripe = require('../config/stripe');
const paymentModel = require('../models/paymentModel');
const bookingModel = require('../models/bookingModel');
const quotationModel = require('../models/quotationModel');
const vendorModel = require('../models/vendorModel');
const { DEPOSIT_RATE, PLATFORM_COMMISSION_RATE } = require('../config/paymentConfig');

// Stripe expects the smallest currency unit (cents for USD).
function toCents(amount) {
  return Math.round(Number(amount) * 100);
}

function roundMoney(amount) {
  return Math.round(Number(amount) * 100) / 100;
}

function rowSummary(amount, row) {
  return {
    amount,
    status: row?.payment_status || null,
    paid: row?.payment_status === 'paid',
    paidAt: row?.paid_at || null,
    transactionId: row?.transaction_id || null,
  };
}

// Pure function: given a quotation's grand_total and every payment row a
// booking currently has (0, 1, or 2), derives the deposit/balance amounts
// and per-stage statuses used by both intent creation and the booking
// read/complete paths.
//
// Backward compatibility: a booking with a single legacy payment_type
// 'full' row (predates this feature) is treated as covering both stages
// at once — depositAmount/balanceAmount still split for display, but
// "paid" is driven entirely by that one row's own status. This is what
// makes an old fully-paid booking keep reading as fully paid with no
// data migration.
function buildPaymentSummary(grandTotal, payments) {
  const total = Number(grandTotal) || 0;
  const depositAmount = roundMoney(total * DEPOSIT_RATE);
  const balanceAmount = roundMoney(total - depositAmount);

  const fullRow = payments.find((payment) => payment.payment_type === 'full') || null;
  const depositRow = payments.find((payment) => payment.payment_type === 'deposit') || null;
  const balanceRow = payments.find((payment) => payment.payment_type === 'balance') || null;

  if (fullRow) {
    const paid = fullRow.payment_status === 'paid';
    return {
      depositAmount,
      balanceAmount,
      totalPaid: paid ? total : 0,
      totalDue: paid ? 0 : total,
      fullyPaid: paid,
      deposit: rowSummary(depositAmount, paid ? fullRow : null),
      balance: rowSummary(balanceAmount, paid ? fullRow : null),
    };
  }

  const depositPaid = depositRow?.payment_status === 'paid';
  const balancePaid = balanceRow?.payment_status === 'paid';
  const totalPaid = (depositPaid ? depositAmount : 0) + (balancePaid ? balanceAmount : 0);

  return {
    depositAmount,
    balanceAmount,
    totalPaid,
    totalDue: roundMoney(total - totalPaid),
    fullyPaid: balancePaid,
    deposit: rowSummary(depositAmount, depositRow),
    balance: rowSummary(balanceAmount, balanceRow),
  };
}

async function getPaymentSummaryForBooking(bookingId) {
  const booking = await bookingModel.findById(bookingId);
  const quotation = booking ? await quotationModel.findById(booking.quotation_id) : null;
  const payments = await paymentModel.findAllByBookingId(bookingId);
  return buildPaymentSummary(quotation ? quotation.grand_total : 0, payments);
}

// Creates (or reuses) a Stripe Payment Intent for one stage (deposit or
// balance) of a booking's payment, and mirrors it as a 'pending' row in
// the payments table. Always checks the intent's live Stripe status before
// reusing it — our own payment_status can lag behind Stripe's (e.g. a
// delayed webhook) — so a booking never gets handed a client secret for an
// intent that's already finished on Stripe's side.
async function createPaymentIntentForBooking(customerId, bookingId, paymentType) {
  const booking = await bookingModel.findByIdForUser(bookingId, customerId);
  if (!booking) {
    throw new AppError(404, 'Booking not found.');
  }

  const quotation = await quotationModel.findById(booking.quotation_id);
  if (!quotation) {
    throw new AppError(404, 'Quotation for this booking was not found.');
  }

  const vendorAccount = await vendorModel.findStripeAccountByVendorId(booking.vendor_id);
  if (!vendorAccount?.stripe_account_id || !vendorAccount.stripe_charges_enabled) {
    throw new AppError(
      409,
      'This vendor has not finished setting up payouts yet. Payment cannot be collected until they do.'
    );
  }

  const allPayments = await paymentModel.findAllByBookingId(bookingId);
  const summary = buildPaymentSummary(quotation.grand_total, allPayments);

  if (summary.fullyPaid) {
    throw new AppError(409, 'This booking has already been paid.');
  }

  if (paymentType === 'balance' && !summary.deposit.paid) {
    throw new AppError(409, 'The deposit must be paid before paying the balance.');
  }

  const amount = paymentType === 'deposit' ? summary.depositAmount : summary.balanceAmount;
  const applicationFeeAmount = toCents(roundMoney(amount * PLATFORM_COMMISSION_RATE));
  const existingPayment = allPayments.find((payment) => payment.payment_type === paymentType) || null;

  if (existingPayment?.payment_status === 'paid') {
    throw new AppError(409, `The ${paymentType} for this booking has already been paid.`);
  }

  if (existingPayment?.transaction_id) {
    const existingIntent = await stripe.paymentIntents.retrieve(existingPayment.transaction_id);

    // Our own row can lag behind Stripe's real state (e.g. a webhook that
    // hasn't arrived yet) — never hand back an intent that Stripe itself
    // already considers finished, since confirming it again always fails.
    if (existingIntent.status === 'succeeded') {
      await paymentModel.updateByTransactionId(existingIntent.id, {
        payment_status: 'paid',
        paid_at: new Date(existingIntent.created * 1000).toISOString(),
      });
      throw new AppError(409, `The ${paymentType} for this booking has already been paid.`);
    }

    if (existingIntent.status === 'requires_payment_method' || existingIntent.status === 'requires_confirmation') {
      return { clientSecret: existingIntent.client_secret, amount: existingPayment.amount, paymentType };
    }

    // Any other terminal state (canceled, etc.) — replace it in place with
    // a fresh intent rather than leaving a second row for the same stage.
    const freshIntent = await stripe.paymentIntents.create({
      amount: toCents(amount),
      currency: 'usd',
      metadata: { booking_id: bookingId, quotation_id: quotation.id, payment_type: paymentType },
      automatic_payment_methods: { enabled: true },
      application_fee_amount: applicationFeeAmount,
      transfer_data: { destination: vendorAccount.stripe_account_id },
    });

    await paymentModel.updateByTransactionId(existingPayment.transaction_id, {
      transaction_id: freshIntent.id,
      amount,
      payment_status: 'pending',
      paid_at: null,
    });

    return { clientSecret: freshIntent.client_secret, amount, paymentType };
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: toCents(amount),
    currency: 'usd',
    metadata: { booking_id: bookingId, quotation_id: quotation.id, payment_type: paymentType },
    automatic_payment_methods: { enabled: true },
    application_fee_amount: applicationFeeAmount,
    transfer_data: { destination: vendorAccount.stripe_account_id },
  });

  await paymentModel.createPayment({
    booking_id: bookingId,
    amount,
    payment_method: 'card',
    transaction_id: paymentIntent.id,
    payment_status: 'pending',
    payment_type: paymentType,
  });

  return { clientSecret: paymentIntent.client_secret, amount, paymentType };
}

// A vendor's net take-home for the current calendar month — the
// customer-paid amount minus the platform's commission, mirroring the split
// Stripe itself applies at charge time (see createPaymentIntentForBooking's
// application_fee_amount) — plus the percent change vs last calendar
// month's total, the same "vs last period" comparison Revenue Overview and
// Booking Status already show. Fixed to "this month" since this card has no
// period picker. Legacy pre-Connect 'full' rows never had a real commission
// split applied on Stripe's side, but are counted the same way here for a
// consistent, simple dashboard figure rather than tracking two different
// revenue definitions.
async function getVendorRevenue(vendorId) {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const bookings = await bookingModel.listByVendorId(vendorId);
  if (!bookings.length) {
    return { totalRevenue: 0, changePercent: 0 };
  }

  const payments = await paymentModel.findByBookingIds(bookings.map((booking) => booking.id));
  const paidPayments = payments
    .filter((payment) => payment.payment_status === 'paid' && payment.paid_at)
    .map((payment) => ({ paidAt: new Date(payment.paid_at), net: Number(payment.amount) * (1 - PLATFORM_COMMISSION_RATE) }));

  const sumInRange = (start, end) =>
    paidPayments.filter((payment) => payment.paidAt >= start && payment.paidAt < end).reduce((sum, payment) => sum + payment.net, 0);

  const totalRevenue = sumInRange(thisMonthStart, now);
  const previousRevenue = sumInRange(lastMonthStart, thisMonthStart);
  const changePercent =
    previousRevenue > 0
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 1000) / 10
      : totalRevenue > 0
        ? 100
        : 0;

  return { totalRevenue: roundMoney(totalRevenue), changePercent };
}

const REVENUE_SERIES_PERIODS = ['daily', 'week', 'month', 'year'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function formatHourLabel(hour) {
  const suffix = hour < 12 ? 'am' : 'pm';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}${suffix}`;
}

function formatDayLabel(date) {
  return `${MONTH_LABELS[date.getMonth()]} ${date.getDate()}`;
}

// Builds the current window's chart buckets plus a same-length "previous
// period" window for the %-change comparison, all as contiguous, real
// calendar ranges ending "now" — e.g. 'week' is the last 7 days (today
// included) vs. the 7 days before that, not calendar Mon-Sun.
function buildRevenueSeriesWindow(period, now) {
  const today = startOfDay(now);

  if (period === 'daily') {
    const bucketHours = 4;
    const buckets = [];
    for (let hour = 0; hour < 24; hour += bucketHours) {
      const start = new Date(today);
      start.setHours(hour, 0, 0, 0);
      const end = new Date(today);
      end.setHours(hour + bucketHours, 0, 0, 0);
      buckets.push({ start, end, label: formatHourLabel(hour) });
    }
    return {
      buckets,
      windowStart: today,
      windowEnd: addDays(today, 1),
      previousStart: addDays(today, -1),
      previousEnd: today,
    };
  }

  if (period === 'week') {
    const buckets = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const start = addDays(today, -offset);
      buckets.push({ start, end: addDays(start, 1), label: WEEKDAY_LABELS[start.getDay()] });
    }
    return {
      buckets,
      windowStart: addDays(today, -6),
      windowEnd: addDays(today, 1),
      previousStart: addDays(today, -13),
      previousEnd: addDays(today, -6),
    };
  }

  if (period === 'month') {
    const bucketDays = 5;
    const windowStart = addDays(today, -29);
    const buckets = [];
    for (let offset = 0; offset < 30; offset += bucketDays) {
      const start = addDays(windowStart, offset);
      buckets.push({ start, end: addDays(start, bucketDays), label: formatDayLabel(start) });
    }
    return {
      buckets,
      windowStart,
      windowEnd: addDays(today, 1),
      previousStart: addDays(windowStart, -30),
      previousEnd: windowStart,
    };
  }

  // 'year' — 12 calendar months ending with the current month.
  const startMonth = addMonths(new Date(today.getFullYear(), today.getMonth(), 1), -11);
  const buckets = [];
  for (let offset = 0; offset < 12; offset += 1) {
    const start = addMonths(startMonth, offset);
    buckets.push({ start, end: addMonths(startMonth, offset + 1), label: MONTH_LABELS[start.getMonth()] });
  }
  return {
    buckets,
    windowStart: startMonth,
    windowEnd: addMonths(new Date(today.getFullYear(), today.getMonth(), 1), 1),
    previousStart: addMonths(startMonth, -12),
    previousEnd: startMonth,
  };
}

// Same net-revenue definition as getVendorRevenue (amount minus platform
// commission), but bucketed into a time series for the Revenue Overview
// chart, plus a %-change vs. the immediately preceding equal-length window.
async function getVendorRevenueSeries(vendorId, period) {
  const safePeriod = REVENUE_SERIES_PERIODS.includes(period) ? period : 'month';
  const { buckets, windowStart, windowEnd, previousStart, previousEnd } = buildRevenueSeriesWindow(
    safePeriod,
    new Date()
  );

  const bookings = await bookingModel.listByVendorId(vendorId);
  if (!bookings.length) {
    return {
      period: safePeriod,
      totalRevenue: 0,
      changePercent: 0,
      points: buckets.map((bucket) => ({ label: bucket.label, value: 0 })),
    };
  }

  const payments = await paymentModel.findByBookingIds(bookings.map((booking) => booking.id));
  const paidPayments = payments
    .filter((payment) => payment.payment_status === 'paid' && payment.paid_at)
    .map((payment) => ({ paidAt: new Date(payment.paid_at), net: Number(payment.amount) * (1 - PLATFORM_COMMISSION_RATE) }));

  const sumInRange = (start, end) =>
    paidPayments
      .filter((payment) => payment.paidAt >= start && payment.paidAt < end)
      .reduce((sum, payment) => sum + payment.net, 0);

  const points = buckets.map((bucket) => ({
    label: bucket.label,
    value: roundMoney(sumInRange(bucket.start, bucket.end)),
  }));

  const totalRevenue = sumInRange(windowStart, windowEnd);
  const previousRevenue = sumInRange(previousStart, previousEnd);
  const changePercent =
    previousRevenue > 0
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 1000) / 10
      : totalRevenue > 0
        ? 100
        : 0;

  return {
    period: safePeriod,
    totalRevenue: roundMoney(totalRevenue),
    changePercent,
    points,
  };
}

// Paid deposit/balance payments across a vendor's own bookings — used by the
// vendor Recent Activity feed. Takes the booking list rather than a vendorId
// so the caller (which already needed the bookings for other event types)
// doesn't pay for that query twice.
async function listPaidPaymentsForBookings(bookings) {
  if (!bookings.length) {
    return [];
  }

  const payments = await paymentModel.findByBookingIds(bookings.map((booking) => booking.id));
  const bookingsById = new Map(bookings.map((booking) => [booking.id, booking]));

  return payments
    .filter((payment) => payment.payment_status === 'paid')
    .map((payment) => ({ ...payment, booking: bookingsById.get(payment.booking_id) }));
}

// Payments Stripe hasn't confirmed one way or the other yet — a customer
// started paying (a Payment Intent exists) but no payment_intent.succeeded/
// payment_failed webhook has landed. Used by the vendor dashboard's "needs
// your attention" summary.
async function countPendingPaymentsForVendor(vendorId) {
  const bookings = await bookingModel.listByVendorId(vendorId);
  if (!bookings.length) {
    return 0;
  }

  const payments = await paymentModel.findByBookingIds(bookings.map((booking) => booking.id));
  return payments.filter((payment) => payment.payment_status === 'pending').length;
}

// Applies a verified Stripe event to our own payment record — this is the
// only place payment_status ever moves out of 'pending', since it's the
// one source Stripe itself confirms (the client-side "succeeded" result
// alone isn't trustworthy enough to write to the database). Values here
// must match the DB's own check constraint: pending | paid | failed | refunded.
// Keyed purely off transaction_id (the Stripe PI id), which stays globally
// unique per intent regardless of payment_type — no stage-awareness needed.
async function handleWebhookEvent(event) {
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    await paymentModel.updateByTransactionId(paymentIntent.id, {
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
    });
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    await paymentModel.updateByTransactionId(paymentIntent.id, {
      payment_status: 'failed',
    });
  }
}

module.exports = {
  createPaymentIntentForBooking,
  handleWebhookEvent,
  buildPaymentSummary,
  getPaymentSummaryForBooking,
  getVendorRevenue,
  getVendorRevenueSeries,
  countPendingPaymentsForVendor,
  listPaidPaymentsForBookings,
};
