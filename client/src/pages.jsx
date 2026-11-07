import { useState } from 'react';
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
        <legend>Join {queue.restaurant.name}</legend>
        <label htmlFor={inputId}>Party size (1–8)</label>
        <input id={inputId} name="partySize" type="number" min="1" max="8" step="1" required
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
        <h2>{queue.restaurant.name}</h2>
        <p>Status: <strong data-testid="queue-status">{queue.status}</strong></p>
        {user.role === 'CUSTOMER' ? <JoinForm queue={queue} /> :
          queue.isAssigned && <a href={`/host/queues/${queue.id}`} data-testid="open-host-queue">Open Host queue</a>}
      </article>)}
    </div>
  </>;
}

export function MyQueuePage() {
  const resource = useResource('/me/entries');
  return <>
    <h1>My queue</h1>
    <p>Refresh to see the latest ticket status.</p>
    <button onClick={resource.refresh} disabled={resource.loading} data-testid="refresh-my-queue">Refresh</button>
    <ResourceState resource={resource} emptyMessage="You have no tickets yet. Join a restaurant queue to get started." />
    <div className="cards" data-testid="my-tickets">
      {resource.data?.map(ticket => <Ticket key={ticket.id} ticket={ticket} />)}
    </div>
  </>;
}

export function HostPage({ queueId }) {
  const resource = useResource(`/queues/${encodeURIComponent(queueId)}/entries`);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState('');
  const called = resource.data?.find(ticket => ticket.status === 'CALLED');
  // The API supplies ticket_no order; no timestamps or customer identities needed.
  const waiting = resource.data?.filter(ticket => ticket.status === 'WAITING') || [];
  async function act(path, verb) {
    setPending(true);
    setError(null);
    setNotice('');
    try {
      const ticket = await api(path, { method: 'POST' });
      setNotice(`Ticket #${ticket.ticketNo}: ${ticket.status}.`);
      resource.refresh();
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }
  const unavailable = pending || resource.loading || Boolean(resource.error);
  return <>
    <h1>Host queue</h1>
    <div className="actions">
      <button onClick={() => { setError(null); setNotice(''); resource.refresh(); }}
        disabled={pending || resource.loading} data-testid="refresh-host-queue">Refresh</button>
      <button onClick={() => act(`/queues/${encodeURIComponent(queueId)}/call-next`, 'Call Next')}
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
            onClick={() => act(`/entries/${called.id}/complete`, 'Complete')}>Complete</button>
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
