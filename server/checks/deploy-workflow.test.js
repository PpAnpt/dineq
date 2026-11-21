import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Static guard (no GCP contact): cloud mutations must be gated on a successful CI run
// of the same commit. A failed or skipped `test` job skips `deploy` because deploy lists it in `needs`.
const text = readFileSync(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8')
  .split('\r\n').join('\n');
const jobBlock = name => {
  const match = text.match(new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  \\w[\\w-]*:\\n|(?![\\s\\S]))`, 'm'));
  assert.ok(match, `job ${name} not found in deploy.yml`);
  return match[0];
};

test('deploy workflow calls the reusable CI workflow as a test job', () => {
  const testJob = jobBlock('test');
  assert.match(testJob, /^    uses: \.\/\.github\/workflows\/ci-docker\.yml$/m);
  assert.doesNotMatch(testJob, /google-github-actions|gcloud/);
});

test('deploy job needs the test job and keeps the main-only guard', () => {
  const deploy = jobBlock('deploy');
  assert.match(deploy, /^    needs: test$/m);
  assert.match(deploy, /^    if: github\.ref == 'refs\/heads\/main'$/m);
});

test('no Google Cloud authentication or mutation happens outside the gated deploy job', () => {
  const outside = text.replace(jobBlock('deploy'), '');
  assert.doesNotMatch(outside, /google-github-actions\/auth|gcloud /);
});

test('smoke test also checks the built UI root, read-only', () => {
  assert.match(jobBlock('deploy'), /curl -fsS "\$URL\/" \| grep -q 'id="root"'/);
});

test('production env vars are set by gcloud run deploy; the deployer cannot run services update', () => {
  const deploy = jobBlock('deploy');
  assert.doesNotMatch(deploy, /gcloud run services update/);
  assert.match(deploy, /gcloud run deploy [^\n]*--update-env-vars "COOKIE_SECURE=true,APP_ORIGIN=\$URL"/);
});


test('production origin uses the existing canonical service URL before deployment', () => {
  const deploy = jobBlock('deploy');
  const lookup = deploy.indexOf('URL="$(gcloud run services describe');
  const update = deploy.indexOf('gcloud run deploy ');
  assert.ok(lookup >= 0 && lookup < update, 'read actual status.url before deploying with APP_ORIGIN');
  assert.doesNotMatch(deploy, /URL="https:\/\/\$SERVICE_NAME-\$PROJECT_NUMBER/);
});
