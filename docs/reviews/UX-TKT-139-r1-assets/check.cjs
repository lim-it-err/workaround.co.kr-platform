const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert');const out='/Users/imjeonghan/newProject/workaround.co.kr-platform/docs/reviews/UX-TKT-139-r1-assets',base='http://127.0.0.1:4202/workaround.co.kr-platform/',results=[];
(async()=>{const b=await chromium.launch();for(const width of [375,1440])for(const theme of ['dark','light']){const c=await b.newContext({viewport:{width,height:width===375?812:900},reducedMotion:'reduce'});const p=await c.newPage();await p.addInitScript(t=>localStorage.setItem('workaround-theme',t),theme);await p.goto(base+'blog');await p.getByRole('button',{name:'환승 홀',exact:true}).click();await p.locator('.junction-overview').waitFor();await p.waitForTimeout(500);const targets=await p.locator('.junction-station.restricted,.junction-route-row.restricted').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {name:e.getAttribute('aria-label')||e.innerText,code:e.dataset.stationCode||null,width:r.width,height:r.height,x:r.x,y:r.y,role:e.getAttribute('role'),tag:e.tagName}}));const contrasts=await routeTextContrasts(p);const initial=p.url();const w=p.locator('[data-station-code="W"]');await w.locator('circle').click();await p.locator('.junction-access-toast').waitFor();await p.screenshot({path:`${out}/map-toast-${width}-${theme}.png`,fullPage:true});const toast=await p.locator('.junction-access-toast').evaluate(e=>{const r=e.getBoundingClientRect();return {text:e.innerText,width:r.width,height:r.height,x:r.x,y:r.y,role:e.getAttribute('role'),live:e.getAttribute('aria-live')}});assert.equal(p.url(),initial);await p.waitForTimeout(2600);assert.equal(await p.locator('.junction-access-toast').count(),0);results.push({width,theme,targets,contrasts,toast});await c.close()}await b.close();fs.writeFileSync(out+'/metrics.json',JSON.stringify(results,null,2));console.log(results.map(r=>({width:r.width,theme:r.theme,minDimmedContrast:Math.min(...r.contrasts.filter(c=>c.dimmed).map(c=>c.ratio)),svg:r.targets.filter(t=>t.code)})))} )().catch(e=>{console.error(e);process.exit(1)});

async function routeTextContrasts(page) {
  return page.locator([
    '.junction-line-name',
    '.junction-route-group > h3',
    '.junction-route-group.protected > p',
    '.junction-route-row .junction-route-badge',
    '.junction-route-row.restricted .junction-route-name',
    '.junction-route-row.restricted .junction-route-status',
    '.junction-station.restricted .junction-station-code',
    '.junction-station.restricted .junction-station-name',
    '.junction-map-line.protected .junction-page-stop text'
  ].join(',')).evaluateAll(elements => {
    const parse = value => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number)
    const luminance = ([red, green, blue]) => {
      const channels = [red, green, blue].map(channel => {
        const normalized = channel / 255
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
    }
    const background = getComputedStyle(document.querySelector('.app-shell')).backgroundColor
    const backgroundRgb = parse(background)
    const backgroundLuminance = luminance(backgroundRgb)
    return elements.map(element => {
      const style = getComputedStyle(element)
      const foreground = element instanceof SVGElement ? style.fill : style.color
      const foregroundRgb = parse(foreground)
      let opacity = 1
      let current = element
      while (current && !current.classList.contains('app-shell')) {
        opacity *= Number.parseFloat(getComputedStyle(current).opacity) || 1
        current = current.parentElement
      }
      const renderedRgb = foregroundRgb.map((channel, index) => (
        channel * opacity + backgroundRgb[index] * (1 - opacity)
      ))
      const foregroundLuminance = luminance(renderedRgb)
      const ratio = (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
        / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
      const dimmed = Boolean(element.closest('.restricted, .protected, .unavailable'))
      return { label: element.textContent.trim(), foreground, background, opacity, ratio, dimmed }
    })
  })
}
