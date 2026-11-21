import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp({ pool: {}, config: {
  nodeEnv: 'production', appOrigin: 'http://localhost:8080', sessionTtlSeconds: 3600,
} });
test('production image serves the built SPA and deep links', async () => {
  for (const path of ['/', '/login', '/queues', '/my-queue', '/host/queues/example']) {
    const r = await request(app).get(path);
    assert.equal(r.status, 200);
    assert.match(r.headers['content-type'], /text\/html/);
    assert.match(r.text, /id="root"/);
  }
  const html = await request(app).get('/');
  const asset = html.text.match(/src="([^"]+\.js)"/)[1];
  const r = await request(app).get(asset);
  assert.equal(r.status, 200);
  assert.match(r.headers['content-type'], /javascript/);
});
test('SPA fallback cannot hide unknown API routes or missing assets', async () => {
  const api = await request(app).get('/api/missing');
  assert.equal(api.status, 401);
  assert.match(api.headers['content-type'], /json/);
  const asset = await request(app).get('/assets/missing.js');
  assert.equal(asset.status, 404);
});
