-- Lab 7 change request L7-CR-01 v0.4, AC-26b: activation of the main queue limit on existing data.
-- Updates the fixed seed queue whenever its current max_party_size is 8, including an explicitly configured
-- 8 (the default and a deliberate 8 cannot be told apart). Every non-8 value and every other queue is kept,
-- and nothing happens when the seed queue is absent. No schema change; the migration runner applies this
-- file inside one transaction. On a new database it runs before the seed, matches no row, and the seed
-- sets 10 itself. It ties data to the demo seed id on purpose (recorded as technical debt in the readiness
-- review); a full seed re-run on the deployed database was rejected because it also resets demo password hashes.
UPDATE service_queues
   SET max_party_size = 10
 WHERE id = '22222222-2222-4222-8222-222222222222'
   AND max_party_size = 8;
