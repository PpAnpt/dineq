-- F-04 (docs/sprints/sprint-2/F-04-cancel.md v0.2, section 4): CANCELLED and NO_SHOW statuses.
-- CANCELLED is used by Customer cancel (F-04). NO_SHOW is schema only here; F-05 provides the
-- behaviour, so it does not need to edit these constraints again.
-- Additive: existing WAITING/CALLED/COMPLETED rows and events satisfy the widened checks unchanged.
-- The migration runner applies this file inside one transaction.

ALTER TABLE queue_entries DROP CONSTRAINT queue_entries_status_check;
ALTER TABLE queue_entries ADD CONSTRAINT queue_entries_status_check
  CHECK (status IN ('WAITING', 'CALLED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'));

ALTER TABLE queue_entries DROP CONSTRAINT queue_entries_status_timestamps_check;
ALTER TABLE queue_entries ADD CONSTRAINT queue_entries_status_timestamps_check CHECK (
  (status = 'WAITING' AND called_at IS NULL AND completed_at IS NULL)
  OR (status = 'CALLED' AND called_at IS NOT NULL AND completed_at IS NULL)
  OR (status = 'COMPLETED' AND called_at IS NOT NULL AND completed_at IS NOT NULL)
  OR (status = 'CANCELLED' AND called_at IS NULL AND completed_at IS NULL)
  OR (status = 'NO_SHOW' AND called_at IS NOT NULL AND completed_at IS NULL)
);

ALTER TABLE queue_events DROP CONSTRAINT queue_events_event_type_check;
ALTER TABLE queue_events ADD CONSTRAINT queue_events_event_type_check
  CHECK (event_type IN ('JOINED', 'CALLED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'));

ALTER TABLE queue_events DROP CONSTRAINT queue_events_from_status_check;
ALTER TABLE queue_events ADD CONSTRAINT queue_events_from_status_check
  CHECK (from_status IN ('WAITING', 'CALLED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'));

ALTER TABLE queue_events DROP CONSTRAINT queue_events_to_status_check;
ALTER TABLE queue_events ADD CONSTRAINT queue_events_to_status_check
  CHECK (to_status IN ('WAITING', 'CALLED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'));

ALTER TABLE queue_events DROP CONSTRAINT queue_events_transition_check;
ALTER TABLE queue_events ADD CONSTRAINT queue_events_transition_check CHECK (
  (event_type = 'JOINED' AND from_status IS NULL AND to_status = 'WAITING')
  OR (event_type = 'CALLED' AND from_status IS NOT NULL AND from_status = 'WAITING' AND to_status = 'CALLED')
  OR (event_type = 'COMPLETED' AND from_status IS NOT NULL AND from_status = 'CALLED' AND to_status = 'COMPLETED')
  OR (event_type = 'CANCELLED' AND from_status = 'WAITING' AND to_status = 'CANCELLED')
  OR (event_type = 'NO_SHOW' AND from_status = 'CALLED' AND to_status = 'NO_SHOW')
);
