-- F-05: tables/history only. Status/event checks belong to F-04 migration 003.
-- The migration runner provides the transaction. Create keys before nullable circular FKs.
ALTER TABLE queue_entries ADD CONSTRAINT queue_entries_id_queue_key UNIQUE (id, queue_id);

CREATE TABLE dining_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES service_queues(id) ON DELETE RESTRICT,
  label text NOT NULL CHECK (char_length(btrim(label)) BETWEEN 1 AND 60),
  capacity integer NOT NULL CHECK (capacity BETWEEN 1 AND 10),
  status text NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED')),
  occupied_entry_id uuid,
  CONSTRAINT dining_tables_queue_label_key UNIQUE (queue_id, label),
  CONSTRAINT dining_tables_occupied_entry_key UNIQUE (occupied_entry_id),
  CONSTRAINT dining_tables_id_queue_key UNIQUE (id, queue_id),
  CONSTRAINT dining_tables_occupancy_check CHECK (
    (status = 'AVAILABLE' AND occupied_entry_id IS NULL)
    OR (status = 'OCCUPIED' AND occupied_entry_id IS NOT NULL)
  )
);

ALTER TABLE queue_entries ADD COLUMN table_id uuid;
ALTER TABLE queue_entries ADD CONSTRAINT queue_entries_table_status_check
  CHECK (table_id IS NULL OR status = 'COMPLETED');
ALTER TABLE dining_tables ADD CONSTRAINT dining_tables_occupied_entry_queue_fkey
  FOREIGN KEY (occupied_entry_id, queue_id) REFERENCES queue_entries(id, queue_id) ON DELETE RESTRICT;
ALTER TABLE queue_entries ADD CONSTRAINT queue_entries_table_queue_fkey
  FOREIGN KEY (table_id, queue_id) REFERENCES dining_tables(id, queue_id) ON DELETE RESTRICT;
