"""Bounded DineQ UAT owner operations; run in authenticated Google Cloud Shell."""
import argparse
import base64
import datetime as dt
import json
from pathlib import Path
import re
import shlex
import subprocess
import time
import urllib.request

PROJECT = 'cpe-se-course-2026'
REGION = 'asia-southeast1'
SERVICE = 's21271a0d'
JOB = 's21271a0d-migrate'
QUEUE = '22222222-2222-4222-8222-222222222222'
COMMON = [f'--project={PROJECT}', f'--region={REGION}', '--quiet']


def gcloud(*args, regional=True):
    result = subprocess.run(['gcloud', *args, *(COMMON if regional else [f'--project={PROJECT}']),
                             '--format=json'], capture_output=True, text=True)
    if result.returncode:
        # Commands never contain credentials. gcloud error output is retained by
        # Cloud Shell, but no environment, secret values or full job spec is saved.
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout or '{}')


def current():
    service = gcloud('run', 'services', 'describe', SERVICE)
    traffic = [t for t in service['status']['traffic'] if t.get('percent', 0)]
    if len(traffic) != 1 or traffic[0]['percent'] != 100:
        raise RuntimeError('Expected one revision serving 100% traffic')
    name = traffic[0]['revisionName']
    revision = gcloud('run', 'revisions', 'describe', name)
    container = revision['spec']['containers'][0]
    image = revision['status'].get('imageDigest', container['image'])
    if not re.fullmatch(r'asia-southeast1-docker\.pkg\.dev/cpe-se-course-2026/s21271a0d/s21271a0d@sha256:[a-f0-9]{64}', image):
        raise RuntimeError('Current revision does not expose the expected immutable image digest')
    job = gcloud('run', 'jobs', 'describe', JOB)
    job_container = job['spec']['template']['spec']['template']['spec']['containers'][0]
    if job_container.get('command') != ['sh']:
        raise RuntimeError('Expected existing job command [sh]; persistent job was not changed')
    if job_container['image'] != image:
        # BuildKit pushes an OCI index containing the runnable linux/amd64
        # manifest and an attestation. Cloud Run reports the runnable digest,
        # so comparing it with the parent index digest would be a false mismatch.
        manifest_result = subprocess.run(['docker', 'manifest', 'inspect', job_container['image']],
                                         capture_output=True, text=True)
        if manifest_result.returncode:
            raise RuntimeError('Cannot inspect the existing job image manifest')
        manifest = json.loads(manifest_result.stdout)
        runnable = [m['digest'] for m in manifest.get('manifests', [])
                    if m.get('platform') == {'architecture': 'amd64', 'os': 'linux'}]
        if runnable != [image.split('@', 1)[1]]:
            raise RuntimeError('Database job image digest differs from the serving release')
    # Compare the existing DB bindings in memory; never output their value.
    def binding(c):
        values = [e for e in c.get('env', []) if e['name'] == 'DATABASE_URL']
        if len(values) != 1:
            raise RuntimeError('Expected exactly one existing DATABASE_URL binding')
        return values[0]
    if binding(container) != binding(job_container):
        raise RuntimeError('Service and job database bindings differ; stop for owner investigation')
    return {'checkedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
            'url': service['status']['url'], 'revision': name, 'image': image,
            'sourceImage': container['image'], 'trafficPercent': 100,
            'databaseBindingMatches': True}


def database(mode, baseline=None):
    payload = {'mode': mode, 'queueId': QUEUE}
    if baseline:
        if baseline['database']['queue']['status'] != 'OPEN':
            raise RuntimeError('Baseline must record original OPEN status')
        payload['expectedHash'] = baseline['database']['dataHash']
    source = Path(__file__).with_name('queue-owner-operation.mjs').read_bytes()
    encoded = base64.b64encode(source).decode()
    encoded_input = base64.b64encode(json.dumps(payload).encode()).decode()
    wrapper = ('const {Client}=require("pg");'
               'const c=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000});'
               f'import("data:text/javascript;base64,{encoded}")'
               f'.then(async m=>{{await c.connect();const r=await m.runOperation(c,JSON.parse(Buffer.from("{encoded_input}","base64")));'
               'console.log("LAB6_OWNER_RESULT="+JSON.stringify(r));})'
               '.catch(e=>{console.error("LAB6_OWNER_ERROR="+(e.code||e.message));process.exitCode=1;})'
               '.finally(()=>c.end());')
    shell_command = 'node -e ' + shlex.quote(wrapper)
    if '@@' in shell_command:
        raise RuntimeError('Unexpected argument delimiter')
    execution = gcloud('run', 'jobs', 'execute', JOB, '--tasks=1', '--task-timeout=60s',
                       '--wait', '--args=^@@^-c@@' + shell_command)
    name = execution['metadata']['name'].split('/')[-1]
    log_filter = ('resource.type="cloud_run_job" '
                  f'resource.labels.job_name="{JOB}" '
                  f'labels."run.googleapis.com/execution_name"="{name}" '
                  'textPayload:"LAB6_OWNER_RESULT="')
    for attempt in range(8):
        logs = gcloud('logging', 'read', log_filter, '--limit=20', regional=False)
        for line in logs:
            text = line.get('textPayload', '')
            if text.startswith('LAB6_OWNER_RESULT='):
                return {'execution': name, 'database': json.loads(text.split('=', 1)[1])}
        if attempt < 7:
            time.sleep(3)
    raise RuntimeError('Job finished but result log unavailable. Operation outcome needs inspection; restore OPEN before leaving a CLOSED window.')


def write_new(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('x', encoding='utf-8') as stream:
        json.dump(data, stream, indent=2)
    print(json.dumps(data, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['inspect', 'snapshot', 'close', 'restore', 'verify', 'restart'])
    parser.add_argument('--baseline', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--testers-ready', action='store_true')
    args = parser.parse_args()
    if args.output.exists():
        raise RuntimeError('Output exists; choose a new attempt filename')
    baseline = json.loads(args.baseline.read_text()) if args.baseline else None
    if args.mode in ('close', 'restore', 'verify', 'restart') and baseline is None:
        raise RuntimeError('--baseline is required')
    if args.mode in ('close', 'restart') and not args.testers_ready:
        raise RuntimeError('Independent testers need fresh before-data and a quiet window; add --testers-ready only when ready')
    if args.mode in ('close', 'restart'):
        age = dt.datetime.now(dt.timezone.utc) - dt.datetime.fromisoformat(baseline['database']['at'].replace('Z', '+00:00'))
        if age.total_seconds() < 0 or age.total_seconds() > 1800:
            raise RuntimeError('Baseline is older than 30 minutes; take a fresh snapshot')
    state = current()
    record = {'operation': args.mode, 'service': state}
    if args.mode == 'inspect':
        write_new(args.output, record)
        return
    # Recovery must still be possible if the service changed since closing.
    if baseline and args.mode != 'restore' and state['revision'] != baseline['service']['revision']:
        raise RuntimeError('Serving revision changed since baseline; take a new snapshot')
    if args.mode == 'restart':
        before = database('verify', baseline)
        if before['database']['queue']['status'] != 'OPEN':
            raise RuntimeError('Restore OPEN before restart')
        suffix = 'l6-' + dt.datetime.now(dt.timezone.utc).strftime('%m%d%H%M%S')
        command = ['run', 'deploy', SERVICE, f'--image={state["image"]}', f'--revision-suffix={suffix}']
        # No env/secret/DB/service-account/migration/reset options are supplied.
        gcloud(*command)
        after = current()
        if after['revision'] == state['revision'] or after['image'] != state['image']:
            raise RuntimeError('Expected a distinct revision of exactly the same image')
        health = {}
        for endpoint in ('/api/health', '/api/ready'):
            with urllib.request.urlopen(after['url'] + endpoint, timeout=30) as response:
                health[endpoint] = {'status': response.status, 'body': json.load(response)}
        record.update({'afterService': after, 'command': ['gcloud', *command, *COMMON],
                       'health': health, **database('verify', baseline)})
    else:
        record.update(database(args.mode, baseline))
        if args.mode == 'snapshot' and record['database']['queue']['status'] != 'OPEN':
            raise RuntimeError('Queue is not OPEN. Inspect/restore the existing operation before taking a new baseline')
    write_new(args.output, record)
    if not record['database']['unchanged']:
        raise RuntimeError('OPEN restored, but data changed during the window; retain evidence and investigate')


if __name__ == '__main__':
    main()
