-- Real quotation expiry (48 hours from creation) — the customer-facing
-- countdown previously shown on QuotationDetailPage/MyQuotationsPage was a
-- purely cosmetic hash-based simulation anchored to "now" (so it drifted
-- forward on every page load) with zero backend enforcement. This column is
-- the real deadline, set once when a quotation (or a revision of it) is
-- created and never recomputed afterward.
alter table public.quotation
  add column if not exists expires_at timestamptz;
