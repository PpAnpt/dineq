-- F-06 (docs/sprints/sprint-2/F-06-queues.md v0.4, section 4): every queue gets a name that is
-- unique within its restaurant. The runner applies this file inside one transaction.
-- Order matters: add the column nullable, backfill deterministically, then add the constraints.

ALTER TABLE service_queues ADD COLUMN name text;

-- Deterministic backfill that cannot collide: in each restaurant the seed queue
-- (22222222-2222-4222-8222-222222222222) is ranked first, the others follow by id; rank 1 becomes
-- 'Main queue', the rest 'Queue 2', 'Queue 3', ... Ids, tickets, events, assignments and
-- counters are not touched.
UPDATE service_queues q
   SET name = CASE WHEN r.rank = 1 THEN 'Main queue' ELSE 'Queue ' || r.rank END
  FROM (SELECT id,
               row_number() OVER (
                 PARTITION BY restaurant_id
                 ORDER BY (id = '22222222-2222-4222-8222-222222222222'::uuid) DESC, id) AS rank
          FROM service_queues) r
 WHERE q.id = r.id;

ALTER TABLE service_queues ALTER COLUMN name SET NOT NULL;
-- A collision-free default keeps INSERTs that do not name the queue (fixtures, ad-hoc SQL) working.
ALTER TABLE service_queues ALTER COLUMN name SET DEFAULT ('Queue ' || substr(gen_random_uuid()::text, 1, 8));

ALTER TABLE service_queues
  ADD CONSTRAINT service_queues_name_length_check CHECK (char_length(btrim(name)) BETWEEN 1 AND 60);
ALTER TABLE service_queues
  ADD CONSTRAINT service_queues_restaurant_name_key UNIQUE (restaurant_id, name);
