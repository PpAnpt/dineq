CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('CUSTOMER', 'HOST')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE TABLE restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  -- Restaurant lifecycle values are not specified in Sprint 1; no new rule here.
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE service_queues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  status text NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
  next_ticket_no integer NOT NULL DEFAULT 1 CHECK (next_ticket_no >= 1)
);

CREATE TABLE queue_operator_assignments (
  queue_id uuid NOT NULL REFERENCES service_queues(id),
  host_user_id uuid NOT NULL REFERENCES users(id),
  PRIMARY KEY (queue_id, host_user_id)
);

CREATE TABLE queue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid NOT NULL REFERENCES service_queues(id),
  customer_id uuid NOT NULL REFERENCES users(id),
  ticket_no integer NOT NULL CHECK (ticket_no >= 1),
  party_size integer NOT NULL CHECK (party_size BETWEEN 1 AND 8),
  status text NOT NULL CHECK (status IN ('WAITING', 'CALLED', 'COMPLETED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  called_at timestamptz,
  completed_at timestamptz,
  UNIQUE (queue_id, ticket_no),
  CONSTRAINT queue_entries_status_timestamps_check CHECK (
    (status = 'WAITING' AND called_at IS NULL AND completed_at IS NULL)
    OR (status = 'CALLED' AND called_at IS NOT NULL AND completed_at IS NULL)
    OR (status = 'COMPLETED' AND called_at IS NOT NULL AND completed_at IS NOT NULL)
  ),
  CONSTRAINT queue_entries_timestamp_order_check CHECK (
    (called_at IS NULL OR called_at >= created_at)
    AND (completed_at IS NULL OR completed_at >= called_at)
  )
);

CREATE UNIQUE INDEX queue_entries_one_active_customer
  ON queue_entries (queue_id, customer_id)
  WHERE status IN ('WAITING', 'CALLED');

CREATE UNIQUE INDEX queue_entries_one_called
  ON queue_entries (queue_id)
  WHERE status = 'CALLED';

CREATE TABLE queue_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES queue_entries(id),
  actor_id uuid NOT NULL REFERENCES users(id),
  event_type text NOT NULL CHECK (event_type IN ('JOINED', 'CALLED', 'COMPLETED')),
  from_status text CHECK (from_status IN ('WAITING', 'CALLED', 'COMPLETED')),
  to_status text NOT NULL CHECK (to_status IN ('WAITING', 'CALLED', 'COMPLETED')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT queue_events_transition_check CHECK (
    (event_type = 'JOINED' AND from_status IS NULL AND to_status = 'WAITING')
    OR (event_type = 'CALLED' AND from_status IS NOT NULL AND from_status = 'WAITING' AND to_status = 'CALLED')
    OR (event_type = 'COMPLETED' AND from_status IS NOT NULL AND from_status = 'CALLED' AND to_status = 'COMPLETED')
  )
);
