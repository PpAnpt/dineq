import { useEffect, useState } from 'react';
import { api } from './api.js';
import { ErrorMessage } from './components.jsx';
import { LoginPage, QueuesPage, MyQueuePage, HostPage } from './pages.jsx';

// Four fixed screens need no routing dependency. Links use normal browser
// navigation; Vite's SPA fallback supports direct URLs, reload and Back/Forward.
export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const [session, setSession] = useState({ loading: true, user: null, error: null });
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    api('/auth/me', { signal: controller.signal }).then(user => {
      if (!controller.signal.aborted) setSession({ loading: false, user, error: null });
    }).catch(error => {
      if (!controller.signal.aborted) setSession({ loading: false, user: null, error });
    });
    return () => controller.abort();
  }, []);

  async function logout() {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await api('/auth/logout', { method: 'POST' });
      window.location.assign('/login');
    } catch (error) {
      setLogoutError(error);
      setLoggingOut(false);
    }
  }

  const { user, loading, error } = session;
  const hostMatch = path.match(/^\/host\/queues\/([^/]+)$/);
  let page;
  if (loading) page = <p role="status" data-testid="loading">Checking session…</p>;
  else if (path === '/login' || (!user && error?.status === 401)) {
    page = <LoginPage signedIn={Boolean(user)} initialError={path === '/login' ? null : error} />;
  } else if (!user) {
    page = <><h1>Unable to check session</h1><ErrorMessage error={error} />
      <button onClick={() => window.location.reload()}>Retry</button></>;
  } else if (path === '/queues' || path === '/') page = <QueuesPage user={user} />;
  else if (path === '/my-queue' && user.role === 'CUSTOMER') page = <MyQueuePage />;
  else if (hostMatch && user.role === 'HOST') page = <HostPage queueId={hostMatch[1]} />;
  else if (path === '/my-queue' || hostMatch) {
    page = <><h1>Access denied</h1><ErrorMessage error={{ status: 403, code: 'FORBIDDEN',
      message: 'This page is not available for your role.' }} /></>;
  } else page = <><h1>Page not found</h1><a href="/queues">Go to queues</a></>;

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header>
      <a className="brand" href="/queues">DineQ</a>
      {user && <>
        <nav aria-label="Main navigation">
          <a href="/queues">{user.role === 'HOST' ? 'Assigned queues' : 'Queues'}</a>
          {user.role === 'CUSTOMER' && <a href="/my-queue">My queue</a>}
        </nav>
        <span>{user.email} · {user.role}</span>
        <button data-testid="logout" onClick={logout} disabled={loggingOut}>
          {loggingOut ? 'Signing out…' : 'Logout'}
        </button>
      </>}
    </header>
    <main id="main" tabIndex="-1"><ErrorMessage error={logoutError} />{page}</main>
  </>;
}
