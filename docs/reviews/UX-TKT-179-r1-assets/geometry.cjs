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





(async()=>{const server=createServer(serveStaticBuild);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}${publicBase}`;const browser=await chromium.launch({headless:true});const results=[];
try{for(const theme of ['dark','light']){const c=await browser.newContext({viewport:{width:1440,height:900},colorScheme:theme,reducedMotion:'reduce'});const p=await c.newPage();await p.addInitScript(t=>localStorage.setItem('workaround-theme',t),theme);await p.goto(base+'blog');await p.getByRole('button',{name:'환승 홀',exact:true}).click();await p.locator('.junction-map').waitFor();await p.locator('.junction-map').screenshot({path:out+`/1440-${theme}-geometry.png`});const m=await p.evaluate(()=>{const svg=document.querySelector('.junction-map');const ctm=svg.getScreenCTM();const screen=(x,y)=>({x:ctm.a*x+ctm.e,y:ctm.d*y+ctm.f});const pts=[];for(const name of ['유로트럭','유로트럭 개발자']){const g=document.querySelector(`[data-stop-label="${name}"]`);const b=g.getBoundingClientRect();const circ=g.querySelector('circle');const dot=screen(+circ.getAttribute('cx'),+circ.getAttribute('cy'));const targetAt=(x,y)=>document.elementFromPoint(x,y)?.closest('.junction-page-stop,.junction-station')?.getAttribute('data-stop-label')||document.elementFromPoint(x,y)?.tagName;pts.push({name,rect:{width:b.width,height:b.height},dot,dotOwner:targetAt(dot.x,dot.y),at12pxBelow:targetAt(dot.x,dot.y+12),fill:getComputedStyle(g.querySelector('text')).fill,opacity:getComputedStyle(g).opacity});}return pts});results.push({theme,m});await c.close();}
}finally{writeFileSync(out+'/geometry.json',JSON.stringify(results,null,2));await browser.close();await new Promise(r=>server.close(r));}console.log(JSON.stringify(results));})().catch(e=>{console.error(e);process.exitCode=1});
