#!/usr/bin/env node
// Lab 7 Part C metrics collector. READ-ONLY: it only runs `gh ... list` and reads local files.
// Usage:
//   node docs/labs/lab-07/collect-metrics.mjs --from 2026-11-22T00:00:00+07:00 --to 2026-11-29T12:00:00+07:00 \
//        --suite docs/evidence/release-full-run --defects docs/labs/lab-07/uat-defects.json \
//        [--repo PpAnpt/dineq] [--out docs/labs/lab-07/metrics.md]
// `--to` defaults to now. Every timestamp is printed in Asia/Bangkok and as UTC.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, token, index, all) => {
  if (token.startsWith('--')) acc.push([token.slice(2), all[index + 1]]);
  return acc;
}, []));
const repo = args.repo || 'PpAnpt/dineq';
const snapshot = new Date();
const from = new Date(args.from || '');
const to = new Date(args.to || snapshot.toISOString());
if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
  console.error('Provide --from (and optionally --to) as ISO 8601 with timezone, from < to.');
  process.exit(2);
}
const bkk = date => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Bangkok', dateStyle: 'short', timeStyle: 'medium',
}).format(new Date(date)) + ' +07';
const inWindow = value => value && new Date(value) >= from && new Date(value) < to;

const commands = [];
function gh(argv) {
  commands.push(`gh ${argv.map(a => (/[\s&]/.test(a) ? `"${a}"` : a)).join(' ')}`);
  return JSON.parse(execFileSync('gh', argv, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
}

// (1) Issues completed: closed with reason COMPLETED (duplicates / not planned are excluded).
const issues = gh(['issue', 'list', '--repo', repo, '--state', 'closed', '--limit', '1000',
  '--json', 'number,title,closedAt,stateReason']);
const completed = issues.filter(i => i.stateReason === 'COMPLETED' && inWindow(i.closedAt))
  .sort((a, b) => a.number - b.number);
const excluded = issues.filter(i => i.stateReason !== 'COMPLETED' && inWindow(i.closedAt))
  .sort((a, b) => a.number - b.number);

// (2) Merged PRs.
const prs = gh(['pr', 'list', '--repo', repo, '--state', 'merged', '--limit', '1000',
  '--json', 'number,title,mergedAt,baseRefName,headRefName']);
const merged = prs.filter(p => inWindow(p.mergedAt)).sort((a, b) => a.number - b.number);
const byBase = {};
for (const pr of merged) byBase[pr.baseRefName] = (byBase[pr.baseRefName] || 0) + 1;

// (3) One named test suite on one commit, read from a recorded evidence file pair (<label>.txt + .json).
let suite = null;
if (args.suite && existsSync(`${args.suite}.txt`) && existsSync(`${args.suite}.json`)) {
  const header = readFileSync(`${args.suite}.txt`, 'utf8').split(/\r?\n/).slice(0, 6);
  const pick = key => (header.find(line => line.startsWith(`${key}:`)) || '').slice(key.length + 1).trim();
  const json = JSON.parse(readFileSync(`${args.suite}.json`, 'utf8'));
  suite = {
    file: args.suite, command: pick('Command'), cwd: pick('Working directory'), commit: pick('Commit'),
    date: pick('Date'), passed: json.numPassedTests, failed: json.numFailedTests,
    pending: json.numPendingTests, total: json.numTotalTests,
    files: json.testResults.length,
  };
}

// (4) UAT defect status from a hand-maintained file (a defect is "resolved" only with fix commit + evidence).
let defects = null;
if (args.defects && existsSync(args.defects)) defects = JSON.parse(readFileSync(args.defects, 'utf8'));

// (5) CI runs by conclusion for the two workflows.
const workflows = ['CI & Docker Build', 'Deploy to Google Cloud'];
const runs = {};
for (const name of workflows) {
  const list = gh(['run', 'list', '--repo', repo, '--workflow', name, '--limit', '500',
    '--json', 'databaseId,conclusion,status,createdAt,headSha,headBranch,event']);
  runs[name] = list.filter(r => inWindow(r.createdAt)).sort((a, b) => a.databaseId - b.databaseId);
}
const tally = list => list.reduce((acc, r) => {
  const key = r.status === 'completed' ? r.conclusion : r.status;
  acc[key] = (acc[key] || 0) + 1; return acc;
}, {});

const out = [];
const w = line => out.push(line);
w('# Lab 7 Metrics');
w('');
w(`Repository: \`${repo}\``);
w(`Observation window: ${bkk(from)} (${from.toISOString()}) to ${bkk(to)} (${to.toISOString()}), start inclusive, end exclusive.`);
w(`Snapshot taken: ${bkk(snapshot)} (${snapshot.toISOString()}). Counts after this time are not included.`);
w('');
w('## M1 Issues completed');
w('Definition: issues closed with reason `COMPLETED` whose `closedAt` is in the window. Closed as not planned/duplicate are listed separately and not counted.');
w(`Value: **${completed.length}** completed; ${excluded.length} excluded.`);
w('');
w('| # | Closed (Bangkok) | Title |'); w('| :-- | :-- | :-- |');
for (const i of completed) w(`| #${i.number} | ${bkk(i.closedAt)} | ${i.title.replace(/\|/g, '/')} |`);
if (excluded.length) {
  w(''); w('Excluded:'); w('');
  for (const i of excluded) w(`- #${i.number} (${i.stateReason}) ${i.title.replace(/\|/g, '/')}`);
}
w('');
w('## M2 Pull requests merged');
w('Definition: pull requests with `mergedAt` in the window (any base branch).');
w(`Value: **${merged.length}** merged (${Object.entries(byBase).map(([b, n]) => `${n} into ${b}`).join(', ') || 'none'}).`);
w('');
w('| PR | Merged (Bangkok) | Base | Title |'); w('| :-- | :-- | :-- | :-- |');
for (const p of merged) w(`| #${p.number} | ${bkk(p.mergedAt)} | ${p.baseRefName} | ${p.title.replace(/\|/g, '/')} |`);
w('');
w('## M3 Automated test results (one suite, one commit)');
if (suite) {
  w(`Source: \`${suite.file}.txt/.json\`. Command: \`${suite.command}\` (working directory \`${suite.cwd}\`). Commit: \`${suite.commit}\`. Run date: ${suite.date}.`);
  w(`Value: **${suite.passed} passed, ${suite.failed} failed, ${suite.pending} skipped/pending of ${suite.total}** (${suite.files} test files). Pass rate ${suite.passed}/${suite.total}.`);
  w('This is the recorded run at that commit, not necessarily the current head; re-run and replace the evidence label before the final PDF.');
} else {
  w('NOT PROVIDED: pass `--suite docs/evidence/<label>` (needs the matching .txt and .json).');
}
w('');
w('## M4 UAT defect status (DineQ-owned findings)');
if (defects) {
  w(`Definition of resolved: ${defects.resolvedDefinition}`);
  const mine = defects.items.filter(d => d.owner === 'DineQ');
  const resolved = mine.filter(d => d.status === 'RESOLVED');
  w(`Value: **${resolved.length} of ${mine.length}** DineQ-owned findings resolved; ${defects.items.length - mine.length} listed finding(s) belong to another team and are not counted.`);
  w('');
  w('| ID | Title | Owner | Status | Evidence |'); w('| :-- | :-- | :-- | :-- | :-- |');
  for (const d of defects.items) w(`| ${d.id} | ${d.title} | ${d.owner} | ${d.status} | ${d.evidence || ''} |`);
} else {
  w('NOT PROVIDED: pass `--defects <json>`.');
}
w('');
w('## M5 CI runs by conclusion');
w('Definition: workflow runs created in the window, grouped by conclusion (`in_progress`/`queued` shown by status). Skipped or cancelled runs are not successes.');
for (const name of workflows) {
  const t = tally(runs[name]);
  const done = runs[name].filter(r => r.status === 'completed').length;
  const ok = runs[name].filter(r => r.conclusion === 'success').length;
  w('');
  w(`**${name}:** ${runs[name].length} runs (${Object.entries(t).map(([k, v]) => `${v} ${k}`).join(', ') || 'none'}); success ${ok}/${done} completed.`);
  w('');
  w('| Run ID | Created (Bangkok) | Event | Branch | Commit | Result |'); w('| :-- | :-- | :-- | :-- | :-- | :-- |');
  for (const r of runs[name]) w(`| ${r.databaseId} | ${bkk(r.createdAt)} | ${r.event} | ${r.headBranch} | ${r.headSha.slice(0, 7)} | ${r.status === 'completed' ? r.conclusion : r.status} |`);
}
w('');
w('## Commands used (read-only)');
w('');
for (const c of commands) w(`- \`${c}\``);
w(`- \`node docs/labs/lab-07/collect-metrics.mjs --from ${args.from} --to ${args.to || '<now>'} --suite ${args.suite || '-'} --defects ${args.defects || '-'}\``);
w('');
w('## Interpretation (max 100 words)');
w('');
w('TODO: written by the authors after the final snapshot; must name one concrete risk and one action with an owner and milestone.');

const text = out.join('\n') + '\n';
if (args.out) { writeFileSync(args.out, text, 'utf8'); console.log(`wrote ${args.out}`); } else process.stdout.write(text);
