import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const serverDirectory = fileURLToPath(new URL('../', import.meta.url));
const git = (...args) => execFileSync('git', args, { cwd: serverDirectory, encoding: 'utf8' }).trim();

async function main() {
  const [label, ...extra] = process.argv.slice(2);
  if (!label || extra.length || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(label)) {
    throw new Error('Usage: npm run test:record -- <label> (letters, numbers, _ and - only)');
  }
  const root = git('rev-parse', '--show-toplevel');
  const status = execFileSync('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all'],
    { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  const paths = [];
  for (let i = 0; i < status.length; i++) {
    const entry = status[i];
    paths.push(entry.slice(3));
    if (/[RC]/.test(entry.slice(0, 2))) paths.push(status[++i]);
  }
  if (paths.some(path => !path?.startsWith('docs/evidence/'))) {
    throw new Error('Refusing to record: commit all changes outside docs/evidence first');
  }
  const evidence = join(root, 'docs', 'evidence');
  const jsonPath = join(evidence, `${label}.json`);
  const textPath = join(evidence, `${label}.txt`);
  if (existsSync(jsonPath) || existsSync(textPath)) {
    throw new Error('Evidence label already exists; choose a new label');
  }
  mkdirSync(evidence, { recursive: true });
  const require = createRequire(import.meta.url);
  const vitest = join(dirname(require.resolve('vitest/package.json')), 'vitest.mjs');
  const args = [vitest, 'run', '--reporter=default', '--reporter=json', `--outputFile=${jsonPath}`];
  const command = `node "${relative(serverDirectory, vitest).split(sep).join('/')}" run --reporter=default --reporter=json --outputFile="${relative(serverDirectory, jsonPath).split(sep).join('/')}"`;
  const header = `Command: ${command}\nWorking directory: server\nCommit: ${git('rev-parse', 'HEAD')}\nDate: ${new Date().toISOString()}\nNode: ${process.version}\n\n`;
  let output = '';
  const child = spawn(process.execPath, args, {
    cwd: serverDirectory,
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (const stream of [child.stdout, child.stderr]) {
    stream.on('data', chunk => { output += chunk.toString(); process.stdout.write(chunk); });
  }
  const exitCode = await new Promise((resolveExit, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (signal) output += `\nTest process terminated by ${signal}\n`;
      resolveExit(code ?? 1);
    });
  });
  writeFileSync(textPath, `${header}${output}\nExit code: ${exitCode}\n`, 'utf8');
  process.exitCode = exitCode;
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
