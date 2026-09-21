// Platform-wide deposit rate — not vendor-configurable. 30% of a
// quotation's grand_total is due up front; the remaining 70% ("balance")
// is due later, before a vendor can mark the booking completed.
const DEPOSIT_RATE = 0.3;

// Platform-wide commission on vendor payouts — applied independently to
// each stage's Payment Intent (deposit and balance), not once on the total.
const PLATFORM_COMMISSION_RATE = 0.15;

module.exports = { DEPOSIT_RATE, PLATFORM_COMMISSION_RATE };
