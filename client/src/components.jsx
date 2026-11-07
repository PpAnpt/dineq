import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

export function ErrorMessage({ error }) {
  if (!error) return null;
  return <div className="error" role="alert" data-testid="error-message">
    <strong>{error.status ? `${error.status} ` : ''}{error.code}</strong>: {error.message}
    {error.status === 401 && <p><a href="/login">Sign in again</a></p>}
  </div>;
}

export function useResource(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(n => n + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    api(path, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setState({ data, loading: false, error: null });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ data: null, loading: false, error });
    });
    return () => controller.abort();
  }, [path, revision]);
  return { ...state, refresh };
}

export function ResourceState({ resource, emptyMessage }) {
  if (resource.loading) return <p role="status" data-testid="loading">Loading…</p>;
  if (resource.error) return <ErrorMessage error={resource.error} />;
  if (resource.data.length === 0) return <p data-testid="empty-state">{emptyMessage}</p>;
  return null;
}

export function Ticket({ ticket, children }) {
  return <article className="ticket" data-testid="ticket" data-ticket-id={ticket.id}>
    <h3>Ticket #{ticket.ticketNo}</h3>
    <p>Party size: <span data-testid="ticket-party-size">{ticket.partySize}</span></p>
    <p>Status: <strong data-testid="ticket-status">{ticket.status}</strong></p>
    {children}
  </article>;
}
