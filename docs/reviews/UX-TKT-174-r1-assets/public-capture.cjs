const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFile, stat } = require('node:fs/promises');
const { writeFileSync } = require('node:fs');
const { extname, join } = require('node:path');
const publicBase='/workaround.co.kr-platform/';
const distRoot=join(__dirname,'frontend/dist-pages');
const out='/Users/imjeonghan/newProject/workaround.co.kr-platform/docs/reviews/UX-TKT-174-r1-assets';
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


(async()=>{const server=createServer(serveStaticBuild);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}${publicBase}`;const browser=await chromium.launch({headless:true});let rows=[];
try{for(const width of [375,1440])for(const theme of ['dark','light']){const context=await browser.newContext({viewport:{width,height:width===375?812:900},timezoneId:'Asia/Seoul'});const page=await context.newPage();const requests=[];page.on('request',r=>{if(r.url().includes('/api/'))requests.push(r.url())});await page.route('**/api/**',r=>r.abort());await page.addInitScript(t=>localStorage.setItem('workaround-theme',t),theme);await page.goto(base+'ets2/dev');await page.locator('.ets2-dev-static-toast').waitFor();await page.screenshot({path:out+`/public-${width}-${theme}.png`,fullPage:true});const row={width,theme,requests,...await page.evaluate(()=>({inert:document.querySelector('.ets2-dev-content').inert,toast:document.querySelector('.ets2-dev-static-toast').getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}))};rows.push(row);await page.getByRole('button',{name:'환승 홀',exact:true}).click();if(width===1440){const stop=page.locator('.junction-page-stop').filter({hasText:/^유로트럭 개발자$/});row.stopBox=await stop.boundingBox();row.circleBox=await stop.locator('circle').boundingBox();try{await stop.locator('text').click({timeout:1500});row.textClick=true;}catch(e){row.textClick=false;await stop.focus();await page.keyboard.press('Enter');}row.homeUrl=page.url();row.homeText=await page.locator('body').innerText();await page.screenshot({path:out+`/public-home-${theme}.png`,fullPage:true});}await context.close();}}
finally{writeFileSync(out+'/public-metrics.json',JSON.stringify(rows,null,2)+'\n');await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1});