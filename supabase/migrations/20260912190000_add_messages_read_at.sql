-- Lets a participant mark the other side's messages as read. No read-receipts
-- UI yet (out of scope) — this only backs the "mark as read" API.
alter table public.messages
  add column read_at timestamptz;
