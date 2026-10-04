const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFile, stat } = require('node:fs/promises');
const { writeFileSync } = require('node:fs');
const { extname, join } = require('node:path');
const publicBase='/workaround.co.kr-platform/';
const distRoot=join(__dirname,'frontend/dist');
const out='/Users/imjeonghan/newProject/workaround.co.kr-platform/docs/reviews/UX-TKT-168-r1-assets';
async function serveStaticBuild(request, response) {
  const url = new URL(request.url, 'http://127.0.0.1')
  const decodedPath = decodeURIComponent(url.pathname)
  const relativePath = decodedPath.startsWith(publicBase)
    ? decodedPath.slice(publicBase.length)
    : decodedPath.replace(/^\/+/, '')
  let filePath = join(distRoot, relativePath || 'index.html')
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html')
  } catch {
    filePath = join(distRoot, 'index.html')
  }
  const contentTypes = {
    '.css': 'text/css',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml'
  }
  response.writeHead(200, { 'content-type': contentTypes[extname(filePath)] || 'application/octet-stream' })
  response.end(await readFile(filePath))
}


(async()=>{
const server=createServer(serveStaticBuild);await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}${publicBase}`;
const browser=await chromium.launch({headless:true});const results=[];
try {
for(const width of [375,1440])for(const theme of ['dark','light']){
 const context=await browser.newContext({viewport:{width,height:width===375?812:900},timezoneId:'Asia/Seoul',reducedMotion:'reduce'});
 const page=await context.newPage(); const result={width,theme,errors:[]};results.push(result);
 page.on('pageerror',e=>result.errors.push(e.message));
 await page.addInitScript(theme=>{
 localStorage.setItem('workaround-theme',theme);const realNow=Date.now.bind(Date);window.uxOffset=0;Date.now=()=>realNow()+window.uxOffset;
 const NativeImage=window.Image; window.uxFail=false;window.Image=class extends NativeImage {set src(v){if(window.uxFail)queueMicrotask(()=>this.onerror?.(new Event('error')));else super.src=v;}get src(){return super.src;}};
 },theme);
 await page.goto(base+'ets2');await page.locator('.ets2-frame-shell img').waitFor();
 const shot=async name=>{await page.screenshot({path:out+`/ux-${width}-${theme}-${name}.png`,fullPage:true});};
 const metrics=async()=>page.evaluate(()=>({text:document.querySelector('.ets2-live-page').innerText,overflow:['html','body','.page-scroller','.ets2-live-page'].map(s=>{const e=document.querySelector(s);return {s,overflow:e?e.scrollWidth-e.clientWidth:0}}),frame:document.querySelector('.ets2-frame-shell').getBoundingClientRect().toJSON(),image:{complete:document.querySelector('.ets2-frame-shell img')?.complete,width:document.querySelector('.ets2-frame-shell img')?.naturalWidth},poll:document.querySelector('.ets2-live-page').dataset.pollMs,alert:document.querySelector('.ets2-frame-alert')?.textContent,controls:[...document.querySelectorAll('button')].filter(e=>e.getBoundingClientRect().width).map(e=>({text:e.textContent.trim(),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))}));
 result.live=await metrics();await shot('live');
 await page.evaluate(()=>{window.uxFrames={count:0,blank:0,sequences:[]};window.uxStop=false;const read=()=>{const e=document.querySelector('.ets2-frame-shell img');if(!window.uxStop){window.uxFrames.count++;if(!e||!e.complete||!e.naturalWidth)window.uxFrames.blank++;const s=document.querySelector('.ets2-live-page').dataset.frameSequence;if(!window.uxFrames.sequences.includes(s))window.uxFrames.sequences.push(s);requestAnimationFrame(read)}};requestAnimationFrame(read)});
 await page.waitForFunction(()=>document.querySelector('.ets2-live-page').dataset.frameSequence==='3');
 result.disconnected=await metrics();await shot('disconnected');
 result.frames=await page.evaluate(()=>{window.uxStop=true;return window.uxFrames});
 // Reload, then fail only later preloads so the last successful frame must remain.
 await page.reload();await page.locator('.ets2-frame-shell img').waitFor();await page.evaluate(()=>window.uxFail=true);
 await page.getByRole('alert').waitFor({timeout:9000});result.lost=await metrics();await shot('lost');
 await page.evaluate(()=>window.uxFail=false);await page.getByRole('alert').waitFor({state:'detached',timeout:4000});result.recovered=await metrics();await shot('recovered');
 await page.evaluate(()=>window.uxOffset=120000);await page.locator('.ets2-frame-shell.stale').waitFor();result.stale=await metrics();await shot('stale');
 await page.evaluate(()=>window.uxOffset=301000);await page.waitForFunction(()=>document.querySelector('.ets2-live-page').dataset.pollMs==='30000');result.old=await metrics();await shot('five-minutes');
 if(width===1440&&theme==='dark'){
 await page.getByRole('button',{name:'환승 홀',exact:true}).click();
 result.homeStops=await page.locator('.junction-page-stop').filter({hasText:'유로트럭'}).allTextContents();
 const publicStop=page.locator('.junction-page-stop').filter({hasText:/^유로트럭$/});result.exactPublicStop=await publicStop.count();await publicStop.click();await page.locator('.ets2-frame-shell img').waitFor();await page.reload();await page.locator('.ets2-frame-shell img').waitFor();result.directReload=page.url().endsWith('/ets2');
 }
 await context.close();console.log(JSON.stringify({width,theme,blank:result.frames,overflow:result.live.overflow}));
}
}finally{writeFileSync(out+'/metrics.json',JSON.stringify(results,null,2)+'\n');await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
