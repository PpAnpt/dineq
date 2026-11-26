const { createRequire } = require('node:module');
const fs = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline');
const requireRepo = createRequire(path.resolve('package.json'));
const { chromium } = requireRepo('playwright');
const base = 'https://hairroot-368003298307.asia-southeast1.run.app';
const dir = __dirname;
let browser, context, page;
const log = [];
const actors = new Map();
const loc = q => q.label ? page.getByLabel(q.label, {exact:!!q.exact})
  : q.role ? page.getByRole(q.role, {name:q.name, exact:!!q.exact})
  : q.text ? page.getByText(q.text, {exact:!!q.exact})
  : page.locator(q.selector);
async function observe() {
  return {url:page.url(),title:await page.title(),text:await page.locator('body').innerText(),
    inputs:await page.locator('input,select,textarea,button').evaluateAll(els=>els.map(e=>({tag:e.tagName,type:e.type,name:e.name,id:e.id,label:e.getAttribute('aria-label'),text:e.tagName==='BUTTON'?e.innerText:undefined,options:e.tagName==='SELECT'?[...e.options].map(o=>({text:o.text,value:o.value})):undefined}))) };
}
async function run(c) {
  if(c.action==='new_actor'){
    if(!['C1','C2','S1','S2'].includes(c.actor)||actors.has(c.actor))throw new Error('Invalid or existing actor');
    context=await browser.newContext({viewport:{width:1280,height:820},locale:'en-US',timezoneId:'Asia/Bangkok'});
    page=await context.newPage();actors.set(c.actor,{context,page});
    await page.goto(base+'/login');
    const emails={C1:'customer.anan@hairroot.test',C2:'customer.mali@hairroot.test',S1:'specialist.somchai@hairroot.test',S2:'specialist.nida@hairroot.test'};
    await page.getByLabel('Email',{exact:true}).fill(emails[c.actor]);await page.bringToFront();return observe();
  }
  if(c.action==='switch_actor'){
    const selected=actors.get(c.actor);if(!selected)throw new Error('Actor not initialized');
    context=selected.context;page=selected.page;await page.bringToFront();return observe();
  }

  if (c.action==='goto') {
    const url=new URL(c.path,base);
    if(url.origin!==base)throw new Error('Only the agreed HairRoot origin is allowed');
    await page.goto(url.href); return observe();
  }
  if(c.action==='observe')return observe();
  if(c.action==='fill'){await loc(c.target).fill(c.value);return observe();}
  if(c.action==='click'){await loc(c.target).click();await page.waitForLoadState('domcontentloaded');return observe();}
  if(c.action==='select'){await loc(c.target).selectOption(c.value);return observe();}
  if(c.action==='reload'){await page.reload();return observe();}
  if(c.action==='back'){await page.goBack();return observe();}
  if(c.action==='capture'){
    if(!/^[A-Za-z0-9_-]+$/.test(c.id))throw new Error('Bad evidence id');
    if(await page.locator('input[type=password]').count() && await page.locator('input[type=password]').inputValue())throw new Error('Clear the password field before capture');
    const record={id:c.id,time:new Date().toISOString(),...c.meta,...await observe()};
    await page.screenshot({path:path.join(dir,c.id+'.png'),fullPage:true});
    await fs.writeFile(path.join(dir,c.id+'.json'),JSON.stringify(record,null,2));
    log.push(record); await fs.writeFile(path.join(dir,'fresh-c1-observations.json'),JSON.stringify(log,null,2));
    return {id:c.id,time:record.time,url:record.url,text:record.text,screenshot:path.join(dir,c.id+'.png')};
  }
  if(c.action==='stop'){await browser.close();return {stopped:true};}
  throw new Error('Unsupported action');
}
(async()=>{
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:false,args:['--window-size=1365,900']});
  context=await browser.newContext({viewport:{width:1280,height:820},locale:'en-US',timezoneId:'Asia/Bangkok'});
  page=await context.newPage();
  await page.goto(base+'/login');
  actors.set('C1',{context,page});
  await page.getByLabel('Email',{exact:true}).fill('customer.anan@hairroot.test');
  await page.bringToFront();
  console.log(JSON.stringify({ready:true,actor:'C1',...await observe()}));
  const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
  for await(const line of rl){
    if(!line.trim())continue;
    try{const c=JSON.parse(line);console.log(JSON.stringify({ok:true,result:await run(c)}));if(c.action==='stop')break;}
    catch(e){console.log(JSON.stringify({ok:false,error:e.message}));}
  }
})().catch(e=>{console.log(JSON.stringify({fatal:true,error:e.message}));process.exitCode=1;});
