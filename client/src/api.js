export async function api(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      signal,
      ...(body === undefined ? {} : {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw Object.assign(new Error('Unable to reach the server. Please try again.'), { code: 'NETWORK_ERROR' });
  }
  if (response.status === 204) return undefined;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw Object.assign(new Error(payload?.error?.message || 'The request failed.'), {
      status: response.status,
      code: payload?.error?.code || 'HTTP_ERROR',
    });
  }
  if (!payload || !Object.hasOwn(payload, 'data')) {
    throw Object.assign(new Error('The server returned an unreadable response.'), { code: 'RESPONSE_ERROR' });
  }
  return payload.data;
}
