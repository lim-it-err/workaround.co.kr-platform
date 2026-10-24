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
 const server=createServer(serveStaticBuild);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}${publicBase}`;
 const browser=await chromium.launch({headless:true});const results=[];
 try {
 for(const width of [375,1440])for(const theme of ['dark','light'])for(const visit of ['first','return']){
  const context=await browser.newContext({viewport:{width,height:width===375?812:900},timezoneId:'Asia/Seoul',reducedMotion:'no-preference'});
  const page=await context.newPage();const result={width,theme,visit,errors:[],screenshots:[]};results.push(result);
  page.on('pageerror',e=>result.errors.push(e.message));
  await page.addInitScript(({theme,visit})=>{
   localStorage.setItem('workaround-theme',theme);if(visit==='return')localStorage.setItem('splash:seen',new Date(Date.now()-60000).toISOString());
   window.ux={start:null,leave:null,detach:null,phases:[],maxOverflow:0};
   const read=()=>{
    const now=performance.now(),stage=document.querySelector('.splash-stage'),u=window.ux;
    if(stage){
     if(u.start===null)u.start=now;
     const t=now-u.start;
     u.maxOverflow=Math.max(u.maxOverflow,document.documentElement.scrollWidth-innerWidth);
     if(stage.classList.contains('fade-leave-active')&&u.leave===null){u.leave=t;if(u.phases.length)u.phases.at(-1).end=t;}
     if(u.leave===null){
      const target=document.querySelector('.flap-values')?.getAttribute('aria-label');
      if(target&&u.phases.at(-1)?.phrase!==target){if(u.phases.length)u.phases.at(-1).end=t;u.phases.push({phrase:target,start:t,settled:null});}
      const top=[...document.querySelectorAll('.flap-static.flap-top b')].map(e=>e.textContent).join('').replace(/\s/g,' ').trim();
      const bottom=[...document.querySelectorAll('.flap-static.flap-bottom b')].map(e=>e.textContent).join('').replace(/\s/g,' ').trim();
      const board=document.querySelector('.flap-values');
      const running=board?.getAnimations({subtree:true}).filter(a=>a.playState==='running').length||0;
      if(u.phases.length&&top===target&&bottom===target&&!document.querySelector('.flap-cell.run')&&!running&&u.phases.at(-1).settled===null)u.phases.at(-1).settled=t;
     }
    }else if(u.start!==null&&u.detach===null){u.detach=now-u.start;if(u.leave===null){u.leave=u.detach;if(u.phases.length)u.phases.at(-1).end=u.leave;}return;}
    requestAnimationFrame(read);
   };requestAnimationFrame(read);
  },{theme,visit});
  await page.goto(base);await page.locator('.splash-stage').waitFor();
  const shot=async name=>{const filename=`${width}-${theme}-${visit}-${name}.png`;await page.screenshot({path:out+'/'+filename,animations:'allow'});result.screenshots.push(filename);};
  await page.waitForFunction(()=>!!document.querySelector('.flap-cell.run'));await shot('flipping');
  const phrases=visit==='first'?['WORKING AROUND','MIND THE GAP','DOORS OPENING']:['DOORS OPENING'];
  for(const [i,phrase]of phrases.entries()){
   await page.waitForFunction(phrase=>window.ux.phases.some(p=>p.phrase===phrase&&p.settled!==null),phrase,{polling:10,timeout:7000});
   await shot('settled-'+(i+1));
   if(i===0)result.geometry=await page.evaluate(()=>({buttons:[...document.querySelectorAll('.splash-stage button')].map(e=>({text:e.textContent.trim(),rect:e.getBoundingClientRect().toJSON()})),panelBackground:getComputedStyle(document.querySelector('.splash-panel')).backgroundColor,ticker:document.querySelector('.ticker-copy')?.textContent}));
  }
  await page.locator('.door-transition.opening').waitFor();await shot('door-opening');await page.waitForFunction(()=>window.ux.detach!==null,{},{timeout:7000});await page.locator('.door-transition').waitFor({state:'detached'});
  result.timing=await page.evaluate(()=>window.ux);
  result.timing.phases.forEach(p=>p.readingMs=p.settled===null?null:p.end-p.settled);
  await shot('home');
  console.log(JSON.stringify(result));await context.close();
 }
 }finally{writeFileSync(out+'/wall-clock.json',JSON.stringify(results,null,2)+'\n');await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
