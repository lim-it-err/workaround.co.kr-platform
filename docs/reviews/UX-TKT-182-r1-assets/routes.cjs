const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFile, stat } = require('node:fs/promises');
const { writeFileSync } = require('node:fs');
const { extname, join } = require('node:path');
const publicBase='/workaround.co.kr-platform/';
const distRoot=join(__dirname,'frontend/dist');
const out='/Users/imjeonghan/newProject/workaround.co.kr-platform/docs/reviews/UX-TKT-182-r1-assets';
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
 const server=createServer(serveStaticBuild);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}${publicBase}`;
 const browser=await chromium.launch({headless:true});const results=[];
 try{for(const width of [375,1440])for(const theme of ['dark','light']){
  const c=await browser.newContext({viewport:{width,height:width===375?812:900},timezoneId:'Asia/Seoul',reducedMotion:'no-preference'});const page=await c.newPage();const r={width,theme,errors:[],moves:[]};results.push(r);page.on('pageerror',e=>r.errors.push(e.message));
  await page.addInitScript(theme=>localStorage.setItem('workaround-theme',theme),theme);await page.goto(base+'pantry');await page.locator('.pantry-page').waitFor();
  for(let move=0;move<(width===375&&theme==='dark'?10:2);move++){
   await page.evaluate(()=>{window.uxMove={start:null,end:null,phases:[],maxPanels:0,maxOverflow:0};const sample=()=>{const u=window.uxMove,d=document.querySelector('.door-transition'),now=performance.now();u.maxOverflow=Math.max(u.maxOverflow,document.documentElement.scrollWidth-innerWidth);u.maxPanels=Math.max(u.maxPanels,document.querySelectorAll('.door-panel').length);if(d){if(u.start===null)u.start=now;const phase=d.dataset.phase;if(u.phases.at(-1)?.phase!==phase)u.phases.push({phase,ms:now-u.start});}else if(u.start!==null){u.end=now-u.start;u.heading=document.querySelector('.station-topbar h2')?.textContent;u.focus=document.activeElement===document.querySelector('.station-topbar h2');return;}requestAnimationFrame(sample)};requestAnimationFrame(sample);});
   if(move%2===0)await page.getByRole('button',{name:'환승 홀',exact:true}).click();else await page.locator('.junction-route-row').filter({hasText:'자취 밥상'}).click();
   if(move===0){
    await page.waitForTimeout(170);await page.screenshot({path:out+`/${width}-${theme}-route-closing.png`});
    await page.locator('.door-transition.closed').waitFor();await page.screenshot({path:out+`/${width}-${theme}-route-closed.png`});
    await page.locator('.door-transition.opening').waitFor();await page.waitForTimeout(80);await page.screenshot({path:out+`/${width}-${theme}-route-opening.png`});
   }
   await page.waitForFunction(()=>window.uxMove.end!==null);r.moves.push(await page.evaluate(()=>window.uxMove));
  }
  await page.screenshot({path:out+`/${width}-${theme}-route-complete.png`});
  await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'환승 홀',exact:true}).click();await page.locator('.junction-route-row').filter({hasText:'자취 밥상'}).waitFor();
  r.reduced={panels:await page.locator('.door-panel').count(),focus:await page.locator('.station-topbar h2').evaluate(e=>document.activeElement===e)};
  if(width===375&&theme==='dark'){await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(base+'mockups/splash.html');r.mockup={scripts:await page.locator('script').count(),banner:await page.locator('.mockup-banner').textContent()};await page.screenshot({path:out+'/mockup-375-initial.png'});await page.getByRole('link',{name:'환승 홀 →',exact:true}).click();await page.locator('.mockup-doors.closing').waitFor();await page.waitForTimeout(200);await page.screenshot({path:out+'/mockup-375-closing.png'});}console.log(JSON.stringify(r));await c.close();
 }}finally{writeFileSync(out+'/routes.json',JSON.stringify(results,null,2)+'\n');await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
