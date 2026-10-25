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
try{for(const width of [375,1440])for(const theme of ['dark','light']){const c=await browser.newContext({viewport:{width,height:width===375?812:900},colorScheme:theme,reducedMotion:'reduce',deviceScaleFactor:2});const p=await c.newPage();await p.addInitScript(t=>localStorage.setItem('workaround-theme',t),theme);await p.goto(base+'mockups/home.html');await p.screenshot({path:out+`/${width}-${theme}-mockup.png`,fullPage:true});const result={width,theme,mockup:{script:await p.locator('script').count(),banner:await p.locator('header.banner').textContent(),overflow:await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)}};
if(width===1440){await p.goto(base+'blog');await p.getByRole('button',{name:'환승 홀',exact:true}).click();await p.locator('.junction-map').waitFor();const b=await p.locator('.junction-map').boundingBox();await p.screenshot({path:out+`/1440-${theme}-spur-detail.png`,clip:{x:b.x+b.width*.64,y:b.y+b.height*.10,width:b.width*.34,height:b.height*.27}});result.geometry=await p.evaluate(()=>{const path=document.querySelector('.junction-branch[data-line-id="lab"][data-path-index="0"]'),m=path.getScreenCTM(),len=path.getTotalLength();return [...document.querySelectorAll('.junction-page-stop[data-path-index="2"] text')].map(t=>{const b=t.getBoundingClientRect(),hits=[];for(let d=0;d<=len;d++){const q=path.getPointAtLength(d),x=m.a*q.x+m.e,y=m.d*q.y+m.f;if(x>b.left&&x<b.right&&y>b.top&&y<b.bottom)hits.push({x,y});}return{label:t.textContent,intersections:hits.length,first:hits[0],last:hits.at(-1),opacity:getComputedStyle(t.parentElement).opacity,halo:getComputedStyle(t).stroke};});});}
results.push(result);await c.close();}
}finally{writeFileSync(out+'/supplement.json',JSON.stringify(results,null,2));await browser.close();await new Promise(r=>server.close(r));}console.log(JSON.stringify(results));})().catch(e=>{console.error(e);process.exitCode=1});
