-- Lab 7 change request L7-CR-01 (docs/labs/lab-07/): per-queue maximum party size.
-- Additive and safe for existing data: no ticket or event row is rewritten.
-- The migration runner applies this file inside one transaction.

-- Existing queues receive the previous fixed limit (8); the seed sets the main demo queue to 10.
ALTER TABLE service_queues
  ADD COLUMN max_party_size integer NOT NULL DEFAULT 8
  CONSTRAINT service_queues_max_party_size_check CHECK (max_party_size BETWEEN 1 AND 10);

-- Absolute ceiling widens from 1..8 to 1..10; every existing row (<= 8) still satisfies it.
-- The per-queue limit itself is enforced by the Join transaction under the queue lock.
ALTER TABLE queue_entries DROP CONSTRAINT queue_entries_party_size_check;
ALTER TABLE queue_entries
  ADD CONSTRAINT queue_entries_party_size_check CHECK (party_size BETWEEN 1 AND 10);
