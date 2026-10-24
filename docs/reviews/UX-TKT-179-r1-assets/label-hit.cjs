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
try{for(const theme of ['dark','light']){const c=await browser.newContext({viewport:{width:1440,height:900},colorScheme:theme,reducedMotion:'reduce'});const p=await c.newPage();await p.addInitScript(t=>localStorage.setItem('workaround-theme',t),theme);await p.goto(base+'blog');await p.getByRole('button',{name:'환승 홀',exact:true}).click();await p.locator('.junction-map').waitFor();const hit=await p.evaluate(()=>{const a=document.querySelector('[data-stop-label="유로트럭"] text').getBoundingClientRect(),b=document.querySelector('[data-stop-label="엘리베이터"] circle').getBoundingClientRect(),x=b.x+b.width/2,y=b.y+b.height/2;return{x,y,insidePublicLabel:x>=a.left&&x<=a.right&&y>=a.top&&y<=a.bottom,owner:document.elementFromPoint(x,y)?.closest('[data-stop-label]')?.dataset.stopLabel};});await p.mouse.click(hit.x,hit.y);await p.locator('.junction-access-toast').waitFor();const result={theme,hit,toast:await p.locator('.junction-access-toast').innerText(),url:p.url()};await p.screenshot({path:out+`/1440-${theme}-label-misdirection.png`});results.push(result);await c.close();}
}finally{writeFileSync(out+'/label-hit.json',JSON.stringify(results,null,2));await browser.close();await new Promise(r=>server.close(r));}console.log(JSON.stringify(results));})().catch(e=>{console.error(e);process.exitCode=1});
