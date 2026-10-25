const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFile, stat } = require('node:fs/promises');
const { writeFileSync } = require('node:fs');
const { extname, join } = require('node:path');
const publicBase='/workaround.co.kr-platform/';
const distRoot=join(__dirname,'frontend/dist');
const out='/Users/imjeonghan/newProject/workaround.co.kr-platform/docs/reviews/UX-TKT-172-r1-assets';
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
  let content=await readFile(filePath);if(extname(filePath)==='.js' && request.headers.referer?.includes('arrived-settlement=1'))content=Buffer.from(content.toString().replace('status:"boarding"','status:"arrived"'));response.end(content)
}





(async()=>{const server=createServer(serveStaticBuild);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}${publicBase}`;const browser=await chromium.launch({headless:true});const results=[];
try{for(const width of [375,1440])for(const theme of ['dark','light']){const c=await browser.newContext({viewport:{width,height:width===375?812:900},timezoneId:'Asia/Seoul',reducedMotion:'reduce'});const p=await c.newPage();await p.clock.setFixedTime(new Date('2026-10-05T02:30:00+09:00'));await p.addInitScript(t=>localStorage.setItem('workaround-theme',t),theme);await p.goto(base+'voyage');await p.locator('.route-record').waitFor();await p.locator('.route-record').scrollIntoViewIfNeeded();await p.screenshot({path:out+`/${width}-${theme}-original-end.png`});const r={width,theme,originalEnd:{settlement:await p.locator('.route-settlement').count(),lastElement:await p.locator('.voyage-route-map').evaluate(e=>e.lastElementChild.className)}};
await p.goto(base+'voyage?arrived-settlement=1');await p.getByRole('button',{name:/중부유럽 순환선/}).click();await p.locator('.route-settlement > header').scrollIntoViewIfNeeded();await p.locator('.route-settlement > header').evaluate(e=>e.scrollIntoView({block:'start'}));await p.screenshot({path:out+`/${width}-${theme}-total-viewport.png`});r.arrived=await p.locator('.route-settlement').evaluate(e=>{const b=e.getBoundingClientRect();return{viewportTop:b.top,background:getComputedStyle(e).backgroundColor,buttons:e.querySelectorAll('button,a,input').length,categoryRows:[...e.querySelectorAll('.route-settlement__table--category tbody tr')].map(x=>({label:x.querySelector('th').textContent,value:x.querySelector('td').textContent})),regionRows:[...e.querySelectorAll('.route-settlement__table--region tbody tr')].map(x=>({label:x.querySelector('th').textContent,value:x.querySelector('td').textContent})),sum: [...e.querySelectorAll('.route-settlement__summary dd')].map(x=>x.textContent)}});results.push(r);await c.close();}
}finally{writeFileSync(out+'/supplement.json',JSON.stringify(results,null,2));await browser.close();await new Promise(r=>server.close(r));}console.log(JSON.stringify(results.map(r=>({width:r.width,theme:r.theme,originalEnd:r.originalEnd,arrived:r.arrived.background}))));})().catch(e=>{console.error(e);process.exitCode=1});
