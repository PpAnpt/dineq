import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { ErrorMessage, ResourceState, Ticket, useResource } from './components.jsx';

export function LoginPage({ signedIn, initialError }) {
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      await api('/auth/login', { method: 'POST', body: {
        email: form.get('email'), password: form.get('password'),
      } });
      // Trust the session identity returned by /me, never an input or local storage.
      const user = await api('/auth/me');
      let destination = '/queues';
      if (user.role === 'HOST') {
        const queues = await api('/queues');
        const assigned = queues.find(queue => queue.isAssigned);
        if (assigned) destination = `/host/queues/${assigned.id}`;
      }
      window.location.assign(destination);
    } catch (failure) {
      setError(failure);
      setPending(false);
    }
  }
  return <section className="login">
    <h1>Sign in to DineQ</h1>
    <p>Use your Customer or Host account.</p>
    <p data-testid="release-label">Lab 5 release: deployed through the staging to main pipeline.</p>
    {signedIn && <p>You are already signed in. <a href="/queues">Continue to queues</a></p>}
    <ErrorMessage error={error} />
    <form onSubmit={submit} aria-busy={pending}>
      <fieldset disabled={pending}>
        <legend>Account details</legend>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" data-testid="login-email" />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" data-testid="login-password" />
        <button type="submit" data-testid="login-submit">{pending ? 'Signing in…' : 'Sign in'}</button>
      </fieldset>
    </form>
    {pending && <p role="status">Signing in…</p>}
  </section>;
}

function JoinForm({ queue }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  async function join(event) {
    event.preventDefault();
    const partySize = Number(new FormData(event.currentTarget).get('partySize'));
    setPending(true);
    setError(null);
    try {
      await api(`/queues/${queue.id}/entries`, { method: 'POST', body: { partySize } });
      window.location.assign('/my-queue');
    } catch (failure) {
      setError(failure);
      setPending(false);
    }
  }
  const inputId = `party-size-${queue.id}`;
  return <>
    <ErrorMessage error={error} />
    <form onSubmit={join} aria-busy={pending}>
      <fieldset disabled={pending || queue.status !== 'OPEN'}>
        <legend>Join {queue.restaurant.name} ({queue.name})</legend>
        <label htmlFor={inputId}>Party size (1–{queue.maxPartySize})</label>
        <input id={inputId} name="partySize" type="number" min="1" max={queue.maxPartySize} step="1" required
          defaultValue="1" data-testid="party-size" />
        <button type="submit" data-testid="join-queue">{pending ? 'Joining…' : 'Join queue'}</button>
      </fieldset>
    </form>
    {pending && <p role="status">Joining queue…</p>}
  </>;
}

export function QueuesPage({ user }) {
  const resource = useResource('/queues');
  const queues = resource.data || [];
  return <>
    <h1>{user.role === 'HOST' ? 'Assigned queues' : 'Restaurant queues'}</h1>
    <button onClick={resource.refresh} disabled={resource.loading} data-testid="refresh-queues">Refresh</button>
    <ResourceState resource={resource} emptyMessage="No queues available." />
    {!resource.loading && !resource.error && user.role === 'HOST' && queues.length > 0 &&
      !queues.some(queue => queue.isAssigned) && <p data-testid="unassigned-state">No queue is assigned to your Host account.</p>}
    <div className="cards" data-testid="queue-list">
      {queues.map(queue => <article key={queue.id} className="queue" data-testid="queue" data-queue-id={queue.id}>
        <h2>{queue.restaurant.name}: <span data-testid="queue-name">{queue.name}</span></h2>
        <p>Status: <strong data-testid="queue-status">{queue.status}</strong></p>
        {user.role === 'CUSTOMER' && queue.status === 'CLOSED' &&
          <p>This queue is closed. New tickets are unavailable.</p>}
        {user.role === 'CUSTOMER' ? <JoinForm queue={queue} /> :
          queue.isAssigned && <a href={`/host/queues/${queue.id}`} data-testid="open-host-queue">Open Host queue</a>}
      </article>)}
    </div>
  </>;
}

// F-04: the owner cancels a WAITING ticket after an explicit confirmation. The server decides
// whether the ticket is still cancellable; a 409 is shown as an error and the list is reloaded.
function CancelTicket({ ticket, onChanged }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const trigger = useRef(null);
  const keep = useRef(null);
  const returnFocus = useRef(false);
  useEffect(() => {
    if (confirming) keep.current?.focus();
    // The trigger is disabled while confirming, so focus returns after it is enabled again.
    else if (returnFocus.current) { returnFocus.current = false; trigger.current?.focus(); }
  }, [confirming]);
  function close() {
    returnFocus.current = true;
    setConfirming(false);
  }
  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await api(`/entries/${encodeURIComponent(ticket.id)}/cancel`, { method: 'POST' });
      setConfirming(false);
      onChanged();
    } catch (caught) {
      setError(caught);
      setConfirming(false);
      onChanged();
    } finally {
      setPending(false);
    }
  }
  return <div>
    <button type="button" ref={trigger} onClick={() => setConfirming(true)} disabled={pending || confirming}
      data-testid="cancel-ticket">Cancel queue</button>
    {confirming && <div role="alertdialog" aria-labelledby={`cancel-title-${ticket.id}`}
      onKeyDown={event => { if (event.key === 'Escape') close(); }} data-testid="cancel-confirm">
      <p id={`cancel-title-${ticket.id}`}>Cancel queue number {ticket.ticketNo}? You can join again later with a new number.</p>
      <button type="button" onClick={confirm} disabled={pending} data-testid="cancel-confirm-yes">
        {pending ? 'Cancelling…' : 'Yes, cancel my queue'}
      </button>
      <button type="button" ref={keep} onClick={close} disabled={pending} data-testid="cancel-confirm-no">Keep my place</button>
    </div>}
    {pending && <p role="status">Cancelling your queue…</p>}
    <ErrorMessage error={error} />
  </div>;
}

const TICKET_STATUSES = ['WAITING', 'CALLED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
const NO_FILTER = { status: '', from: '', to: '' };

// F-07a: the query string for GET /api/me/entries. Date-time inputs are local time; the server
// needs an ISO 8601 instant with a timezone, so they are converted here. An unreadable value is
// dropped so the server's 400 is not triggered by the browser's own formatting.
function historyQuery(filter) {
  const params = new URLSearchParams();
  if (filter.status) params.set('status', filter.status);
  for (const key of ['from', 'to']) {
    const time = filter[key] ? new Date(filter[key]) : null;
    if (time && !Number.isNaN(time.getTime())) params.set(key, time.toISOString());
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

export function MyQueuePage() {
  const [draft, setDraft] = useState(NO_FILTER);
  const [applied, setApplied] = useState(NO_FILTER);
  const filtered = Object.values(applied).some(Boolean);
  const resource = useResource(`/me/entries${historyQuery(applied)}`);
  // F-06: tickets can belong to different queues, so each ticket shows its queue's name.
  const queues = useResource('/queues');
  const queueName = id => queues.data?.find(queue => queue.id === id)?.name;
  return <>
    <h1>My queue</h1>
    <p>Refresh to see the latest ticket status.</p>
    <button onClick={resource.refresh} disabled={resource.loading} data-testid="refresh-my-queue">Refresh</button>
    <form onSubmit={event => { event.preventDefault(); setApplied(draft); }} aria-label="Filter my tickets"
      data-testid="history-filter">
      <label htmlFor="filter-status">Status</label>
      <select id="filter-status" value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })}>
        <option value="">All</option>
        {TICKET_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
      </select>
      <label htmlFor="filter-from">From</label>
      <input id="filter-from" type="datetime-local" value={draft.from}
        onChange={event => setDraft({ ...draft, from: event.target.value })} />
      <label htmlFor="filter-to">To</label>
      <input id="filter-to" type="datetime-local" value={draft.to}
        onChange={event => setDraft({ ...draft, to: event.target.value })} />
      <button type="submit" data-testid="apply-filter">Apply filter</button>
      <button type="button" data-testid="clear-filter"
        onClick={() => { setDraft(NO_FILTER); setApplied(NO_FILTER); }}>Clear filter</button>
    </form>
    <ResourceState resource={resource}
      emptyMessage={filtered ? 'No tickets match the filter.' : 'You have no tickets yet. Join a restaurant queue to get started.'} />
    <div className="cards" data-testid="my-tickets">
      {resource.data?.map(ticket => <Ticket key={ticket.id} ticket={ticket}>
        {ticket.status === 'WAITING' && <CancelTicket ticket={ticket} onChanged={resource.refresh} />}
        {ticket.status === 'CANCELLED' && <p data-testid="ticket-cancelled">
          This queue was cancelled. <a href="/queues">Join a queue again</a> to get a new number.</p>}
        {queueName(ticket.queueId) && <p>Queue: <span data-testid="ticket-queue-name">{queueName(ticket.queueId)}</span></p>}
      </Ticket>)}
    </div>
  </>;
}

// F-06: the assigned Host opens or closes the queue. Closing asks for a confirmation because new
// tickets are refused; waiting tickets can still be called. Reopening is immediate.
function QueueStatus({ queueId }) {
  const queues = useResource('/queues');
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const trigger = useRef(null);
  const keep = useRef(null);
  const returnFocus = useRef(false);
  const queue = queues.data?.find(item => item.id === queueId);
  useEffect(() => {
    if (confirming) keep.current?.focus();
    else if (returnFocus.current) { returnFocus.current = false; trigger.current?.focus(); }
  }, [confirming]);
  function dismiss() {
    returnFocus.current = true;
    setConfirming(false);
  }
  async function setStatus(status) {
    setPending(true);
    setError(null);
    try {
      await api(`/queues/${encodeURIComponent(queueId)}`, { method: 'PATCH', body: { status } });
      setConfirming(false);
      queues.refresh();
    } catch (caught) {
      setError(caught);
      setConfirming(false);
    } finally {
      setPending(false);
    }
  }
  if (queues.loading) return <p role="status" data-testid="loading">Loading queue…</p>;
  if (queues.error) return <ErrorMessage error={queues.error} />;
  if (!queue) return null;
  const closing = queue.status === 'OPEN';
  return <section data-testid="queue-status-panel">
    <p>Queue: <strong data-testid="host-queue-name">{queue.name}</strong> · Status:{' '}
      <strong data-testid="host-queue-status">{queue.status}</strong></p>
    <button type="button" ref={trigger} disabled={pending || confirming} data-testid="toggle-queue-status"
      onClick={() => (closing ? setConfirming(true) : setStatus('OPEN'))}>
      {closing ? 'Close queue' : 'Open queue'}
    </button>
    {confirming && <div role="alertdialog" aria-labelledby="close-title" data-testid="close-confirm"
      onKeyDown={event => { if (event.key === 'Escape') dismiss(); }}>
      <p id="close-title">Close this queue? New tickets will be refused, but waiting tickets can still be called.</p>
      <button type="button" disabled={pending} onClick={() => setStatus('CLOSED')} data-testid="close-confirm-yes">
        {pending ? 'Closing…' : 'Yes, close the queue'}
      </button>
      <button type="button" ref={keep} disabled={pending} onClick={dismiss} data-testid="close-confirm-no">Keep it open</button>
    </div>}
    {pending && !confirming && <p role="status">Saving…</p>}
    <ErrorMessage error={error} />
  </section>;
}

export function HostPage({ queueId }) {
  const resource = useResource(`/queues/${encodeURIComponent(queueId)}/entries`);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const called = resource.data?.find(ticket => ticket.status === 'CALLED');
  // The API supplies ticket_no order; no timestamps or customer identities needed.
  const waiting = resource.data?.filter(ticket => ticket.status === 'WAITING') || [];
  async function act(path) {
    setPending(true);
    setError(null);
    setNotice('');
    try {
      const ticket = await api(path, { method: 'POST' });
      setNotice(`Ticket #${ticket.ticketNo}: ${ticket.status}.`);
      resource.refresh();
    } catch (failure) {
      setError(failure);
      // Another Host may have changed the queue. Keep the conflict visible
      // while reloading the server's current list instead of leaving stale actions.
      if (failure.status === 409) resource.refresh();
    } finally {
      setPending(false);
    }
  }
  const unavailable = pending || resource.loading || Boolean(resource.error);
  return <>
    <h1>Host queue</h1>
    <QueueStatus queueId={queueId} />
    <div className="actions">
      <button onClick={() => { setError(null); setNotice(''); resource.refresh(); }}
        disabled={pending || resource.loading} data-testid="refresh-host-queue">Refresh</button>
      <button onClick={() => act(`/queues/${encodeURIComponent(queueId)}/call-next`)}
        disabled={unavailable} data-testid="call-next">Call Next</button>
    </div>
    <ErrorMessage error={error} />
    {pending && <p role="status">Saving…</p>}
    <p role="status" data-testid="host-notice">{notice}</p>
    <ResourceState resource={resource} emptyMessage="No active tickets in this queue." />
    {!resource.loading && !resource.error && <>
      <section data-testid="currently-called">
        <h2>Currently called</h2>
        {called ? <Ticket ticket={called}>
          <button disabled={unavailable} data-testid="complete-ticket"
            onClick={() => act(`/entries/${called.id}/complete`)}>Complete</button>
        </Ticket> : <p>No ticket is currently called.</p>}
      </section>
      <section data-testid="waiting-list">
        <h2>Waiting list (FIFO)</h2>
        {waiting.length === 0 ? <p>No waiting tickets.</p> :
          <ol>{waiting.map(ticket => <li key={ticket.id}><Ticket ticket={ticket} /></li>)}</ol>}
      </section>
    </>}
  </>;
}
