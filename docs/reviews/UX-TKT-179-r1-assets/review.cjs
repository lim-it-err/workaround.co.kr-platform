const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFile, stat } = require('node:fs/promises');
const { writeFileSync } = require('node:fs');
const { extname, join } = require('node:path');
const publicBase='/workaround.co.kr-platform/';
const distRoot=join(__dirname,'frontend/dist');
const out='/Users/imjeonghan/newProject/workaround.co.kr-platform/docs/reviews/UX-TKT-179-r1-assets';
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
  const c=await browser.newContext({viewport:{width,height:width===375?812:900},timezoneId:'Asia/Seoul',locale:'ko-KR',reducedMotion:'reduce'});const page=await c.newPage();const r={width,theme,errors:[],external:[]};results.push(r);page.on('pageerror',e=>r.errors.push(e.message));await c.route('**/*',route=>{const u=new URL(route.request().url());if(['127.0.0.1','localhost'].includes(u.hostname))return route.continue();r.external.push(u.origin);return route.abort();});
  await page.addInitScript(theme=>localStorage.setItem('workaround-theme',theme),theme);
  async function home(){await page.goto(base+'blog');await page.getByRole('button',{name:'환승 홀',exact:true}).click();await page.locator('.junction-overview').waitFor();}
  await home();await page.screenshot({path:out+`/${width}-${theme}-home.png`,fullPage:true});
  r.metrics=await page.evaluate(()=>{
   const rect=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height}};
   const stops=[...document.querySelectorAll('.junction-page-stop')].filter(e=>e.getClientRects().length).map(e=>({label:e.dataset.stopLabel,...rect(e),circle:rect(e.querySelector('circle')),text:rect(e.querySelector('text')),opacity:getComputedStyle(e).opacity,fill:getComputedStyle(e.querySelector('text')).fill,hitCircle:!!e.querySelector('[pointer-events="all"]')}));
   const texts=[...document.querySelectorAll('.junction-map text')].filter(e=>e.getClientRects().length).map(e=>({label:e.textContent,...rect(e)}));const overlaps=[];for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){const a=texts[i],b=texts[j];if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1)overlaps.push([a.label,b.label]);}
   const spur=document.querySelector('.junction-branch[data-path-index="2"]');return{stops,overlaps,spurVisible:getComputedStyle(spur).display!=='none',overflow:document.documentElement.scrollWidth-innerWidth,bg:getComputedStyle(document.querySelector('.app-shell')).getPropertyValue('--bg'),sublinks:[...document.querySelectorAll('.junction-sublinks button')].filter(e=>e.textContent.includes('유로트럭')).map(e=>({label:e.textContent,...rect(e)}))};
  });
  const dev=width>=900?page.locator('.junction-page-stop[data-stop-label="유로트럭 개발자"]'):page.locator('.junction-sublinks button').filter({hasText:/^유로트럭 개발자$/});
  const pub=width>=900?page.locator('.junction-page-stop[data-stop-label="유로트럭"]'):page.getByRole('button',{name:'유로트럭',exact:true});
  if(width>=900){await page.locator('.junction-map').screenshot({path:out+`/${width}-${theme}-map.png`});await dev.locator('text').click();}else await dev.click();
  await page.getByRole('status').filter({hasText:'개발자 페이지 · 로컬 전용'}).waitFor();r.devClick={url:page.url(),toast:await page.locator('.junction-access-toast').innerText()};await page.screenshot({path:out+`/${width}-${theme}-dev-toast.png`});
  await dev.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await page.screenshot({path:out+`/${width}-${theme}-dev-focus.png`});await page.keyboard.press('Enter');r.devKeyboard={url:page.url(),toast:await page.locator('.junction-access-toast').innerText()};
  if(width>=900)await pub.locator('circle').click();else await pub.click();await page.waitForURL('**/ets2');r.publicClick=page.url();await page.screenshot({path:out+`/${width}-${theme}-ets2.png`});
  await home();const pub2=width>=900?page.locator('.junction-page-stop[data-stop-label="유로트럭"]'):page.getByRole('button',{name:'유로트럭',exact:true});await pub2.focus();await page.keyboard.press('Enter');await page.waitForURL('**/ets2');r.publicKeyboard=page.url();
  await page.emulateMedia({colorScheme:theme});await page.goto(base+'mockups/home.html');r.mockup={scripts:await page.locator('script').count(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),banner:await page.locator('header.banner').textContent().catch(()=>null)};await page.screenshot({path:out+`/${width}-${theme}-mockup.png`,fullPage:true});
  console.log(JSON.stringify(r));await c.close();
 }}finally{writeFileSync(out+'/metrics.json',JSON.stringify(results,null,2)+'\n');await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
