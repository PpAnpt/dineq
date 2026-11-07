import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const m=JSON.parse(await fs.readFile('.local/p8-manifest.json','utf8'));
const {loadConfig}=await import(pathToFileURL(path.join(m.clonePath,'server/src/config.js')));
const {createPool}=await import(pathToFileURL(path.join(m.clonePath,'server/src/db/pool.js')));
const config=loadConfig();assert.equal(decodeURIComponent(new URL(config.databaseUrl).pathname.slice(1)),m.devDatabase);
const pool=createPool(config.databaseUrl);const lines=[];const log=s=>{lines.push(s);console.log(s);};
const npm=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
let api,client;
const run=(args,cwd=m.clonePath)=>{const child=spawn(process.execPath,args,{cwd,env:{...process.env},stdio:['ignore','pipe','pipe']});child.stdout.on('data',b=>log(b.toString().trimEnd()));child.stderr.on('data',b=>log(b.toString().trimEnd()));return child;};
async function healthy(url){for(let n=0;n<100;n++){try{const r=await fetch(url);if(r.status===200)return;}catch{}await new Promise(r=>setTimeout(r,100));}throw new Error('Server did not become healthy: '+url);}
async function stop(child){if(!child||child.exitCode!==null)return;const closed=once(child,'exit');child.kill('SIGTERM');await closed;}
async function call(name,route,{cookie,body,method='GET'}={}){const r=await fetch('http://localhost:3000/api'+route,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const payload=await r.json();if(name==='login')log(`POST ${route}: ${r.status} role=${payload.data?.role} (credentials and Cookie omitted)`);else log(`${method} ${route}: ${r.status} ${JSON.stringify(payload)}`);assert.ok(r.ok,`${route} must succeed`);return {data:payload.data,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
try{
log('Command: node .local/p8-restart-probe.mjs');log('Commit: '+execFileSync('git',['rev-parse','HEAD'],{cwd:m.clonePath,encoding:'utf8'}).trim());log('Date: '+new Date().toISOString());log('Node: '+process.version);log('Mode: automated real-process restart + HTTP + SQL, fresh cloned application and fresh dev database');
log('Start API: node server/src/server.js (npm start entry point)');api=run(['server/src/server.js']);await healthy('http://localhost:3000/api/health');const oldPid=api.pid;
log('Start client: npm run dev:client');client=run([path.join(m.clonePath,'node_modules/vite/bin/vite.js')],path.join(m.clonePath,'client'));await healthy('http://localhost:5173/api/health');const html=await fetch('http://localhost:5173/login');assert.match(await html.text(),/src\/main.jsx/);log('PASS: fresh clone API health, Vite proxy health and /login HTML = 200');
const customer=await call('login','/auth/login',{method:'POST',body:{email:'customer01@dineq.test',password:process.env.SEED_DEMO_PASSWORD}});
const host=await call('login','/auth/login',{method:'POST',body:{email:'host1@dineq.test',password:process.env.SEED_DEMO_PASSWORD}});
const queues=await call('queues','/queues',{cookie:customer.cookie});const queue=queues.data[0];assert.ok(queue);const active=await pool.query("SELECT 1 FROM queue_entries WHERE queue_id=$1 AND status IN ('WAITING','CALLED')",[queue.id]);assert.equal(active.rowCount,0,'Fresh reproduction queue must have no active entries');
const joined=await call('join',`/queues/${queue.id}/entries`,{method:'POST',cookie:customer.cookie,body:{partySize:4}});assert.equal(joined.data.status,'WAITING');
const called=await call('call-next',`/queues/${queue.id}/call-next`,{method:'POST',cookie:host.cookie});assert.equal(called.data.id,joined.data.id);assert.equal(called.data.status,'CALLED');
const completed=await call('complete',`/entries/${joined.data.id}/complete`,{method:'POST',cookie:host.cookie});assert.equal(completed.data.status,'COMPLETED');
const selectEvents=()=>pool.query('SELECT id, event_type, from_status, to_status, occurred_at FROM queue_events WHERE entry_id=$1 ORDER BY occurred_at,id',[joined.data.id]);
const beforeEvents=(await selectEvents()).rows;assert.deepEqual(beforeEvents.map(e=>e.event_type),['JOINED','CALLED','COMPLETED']);log('SQL events before restart: '+JSON.stringify(beforeEvents));
await stop(api);log(`Stopped API PID ${oldPid}; starting a new process on the same database`);api=run(['server/src/server.js']);await healthy('http://localhost:3000/api/health');assert.notEqual(api.pid,oldPid);log(`Restarted API PID ${api.pid}`);
const retrieved=await call('retrieve after restart',`/entries/${joined.data.id}`,{cookie:customer.cookie});assert.deepEqual(retrieved.data,completed.data);
const afterEvents=(await selectEvents()).rows;assert.deepEqual(afterEvents,beforeEvents);log('SQL events after restart: '+JSON.stringify(afterEvents));log('PASS: identical ticket ID, ticketNo, partySize=4, COMPLETED and timestamps; all three event rows identical after a real API process restart.');log('Result: PASS; no database reset between process instances. Session cookie remained usable and was not logged.');
}catch(e){log('FAIL: '+e.message);process.exitCode=1;}finally{await stop(api);await stop(client);await pool.end();await fs.writeFile('.local/p8-restart-persistence.txt',lines.join('\n')+'\n');}
