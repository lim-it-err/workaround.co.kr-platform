import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const frontendRoot = resolve(scriptDir, '..')
const sourceRoot = resolve(frontendRoot, '../services/ets2-adas')
const targetRoot = resolve(frontendRoot, 'public/ets2-sim')

const [sourceController, sourceApp, sourceIndex] = await Promise.all([
  readFile(resolve(sourceRoot, 'controller.js'), 'utf8'),
  readFile(resolve(sourceRoot, 'app.js'), 'utf8'),
  readFile(resolve(sourceRoot, 'index.html'), 'utf8')
])

for (const marker of ['function resetSim()', 'function observation()', 'function simChange(direction)', 'function step(dt)', "$('sim-left').onclick"]) {
  if (!sourceApp.includes(marker)) throw new Error(`PoC 시뮬레이터 표식 누락: ${marker}`)
}
if (!sourceIndex.includes('02 시뮬레이션')) throw new Error('PoC 시뮬레이션 탭을 찾지 못했습니다.')
if (!sourceController.includes('laneChangeAllowed')) throw new Error('PoC 제어기를 찾지 못했습니다.')

const indexHtml = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>유로트럭 정적 주행 시험</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main>
    <header><div><p>02 시뮬레이션</p><h1>반복 가능한 주행 시험</h1></div><span>게임 명령 없음</span></header>
    <section class="metrics" aria-label="시뮬레이션 주행 정보">
      <div><small>속도</small><strong id="speed">90.0 km/h</strong></div>
      <div><small>앞차 간격</small><strong id="gap">—</strong></div>
      <div><small>차선 중심 오차</small><strong id="offset">0.00 m</strong></div>
      <div><small>진행 시간</small><strong id="time">0.0초</strong></div>
    </section>
    <div class="workspace">
      <section><canvas id="road" width="920" height="590" aria-label="2차로 시험 도로">2차로 시험 도로</canvas></section>
      <aside>
        <label>상황<select id="scenario"><option value="follow">느린 앞차 추종</option><option value="keep">차선 중심 복귀</option><option value="clear">차선 변경 · 옆 차로 비어 있음</option><option value="rear">차선 변경 · 빠른 뒤 차량</option><option value="exit">출구 접근 · 추월 차로 진입 제한</option></select></label>
        <label>목표 속도 <span id="target-value">90 km/h</span><input id="target-speed" type="range" min="60" max="110" step="5" value="90"></label>
        <div class="buttons"><button id="play" class="primary">시작</button><button id="reset">초기화</button><button id="fast">1×</button></div>
        <div class="buttons"><button id="sim-left">← 왼쪽 변경</button><button id="sim-right">오른쪽 변경 →</button></div>
        <p id="decision" class="decision">앞차와의 간격에 따라 감속합니다.</p>
        <p id="gap-detail" class="hint">앞차 없음 · 목표 속도와 차선 중심을 유지합니다.</p>
        <h2>실험 기록</h2><ol id="events"><li>아직 기록이 없습니다.</li></ol>
      </aside>
    </div>
    <footer>정적 시뮬레이터 · 네트워크와 게임 제어를 사용하지 않습니다.</footer>
  </main>
  <script src="controller.js"></script><script src="app.js"></script>
</body>
</html>
`

const stylesCss = `:root{color-scheme:dark;--bg:#11181d;--surface:#1a242b;--line:#30414b;--text:#e7eeef;--muted:#a1b3bc;--accent:#80dfbe;--amber:#efc47d}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.55 system-ui,"Malgun Gothic",sans-serif}main{max-width:1180px;margin:auto;padding:22px}header,.buttons,footer{display:flex;align-items:center;gap:10px}header{justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:14px}header p{margin:0;color:var(--accent);font-size:11px;font-weight:800}header h1{margin:3px 0 0;font-size:25px}header span,footer,.hint{color:var(--muted);font-size:12px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--line);margin-bottom:18px}.metrics div{padding:12px 10px 12px 0}.metrics div+div{padding-left:12px;border-left:1px solid var(--line)}.metrics small{display:block;color:var(--muted)}.metrics strong{font-size:18px}.workspace{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px}canvas{display:block;width:100%;height:auto;background:#152127}aside{padding:16px;border:1px solid var(--line);background:var(--surface)}label{display:grid;gap:7px;margin:0 0 16px;font-size:12px;font-weight:700}select,input,button{font:inherit}select{min-height:40px;padding:7px;background:var(--bg);border:1px solid var(--line);color:var(--text)}input{accent-color:var(--accent)}input[type="range"]{min-height:40px}button{min-height:40px;padding:8px 12px;border:1px solid var(--line);border-radius:5px;background:var(--bg);color:var(--text);cursor:pointer}.buttons{flex-wrap:wrap;margin:10px 0}.buttons button{flex:1}.primary{border-color:var(--accent);background:#80dfbe20}.decision{color:var(--amber);font-weight:700}h2{font-size:14px;border-top:1px solid var(--line);padding-top:16px}ol{max-height:150px;overflow:auto;list-style:none;padding:0}li{font-size:11px;color:var(--muted);border-bottom:1px solid var(--line);padding:6px 0}footer{border-top:1px solid var(--line);margin-top:20px;padding-top:12px}@media(max-width:760px){.metrics{grid-template-columns:repeat(2,1fr)}.metrics div:nth-child(3){padding-left:0;border-left:0;border-top:1px solid var(--line)}.metrics div:nth-child(4){border-top:1px solid var(--line)}.workspace{grid-template-columns:1fr}header{align-items:flex-start}.workspace aside{padding:13px}}
`

const appJs = `'use strict';
const $=id=>document.getElementById(id),canvas=$('road'),ctx=canvas.getContext('2d');
let sim,playing=false,rate=1,last=0,accumulator=0,events=[];
function log(message){events.unshift({time:new Date(),message});events=events.slice(0,20);$('events').replaceChildren(...events.map(event=>{const li=document.createElement('li');li.textContent=event.time.toLocaleTimeString('ko-KR',{hour12:false})+' · '+event.message;return li;}));}
function observation(){return {s:sim.s,speedMps:sim.speedMps,lane:sim.lane,traffic:sim.traffic,perceptionValid:true,occupiedLanes:sim.memory?[0,1]:[sim.lane],route:{exitDistanceM:sim.scenario==='exit'?Math.max(0,320-sim.s):99999,preferredLane:0}};}
function reset(){const scenario=$('scenario').value;sim={time:0,s:0,y:scenario==='keep'?.8:0,yaw:scenario==='keep'?.015:0,speedMps:90/3.6,lane:0,memory:null,traffic:[],scenario,acc:null,reason:'차선 유지 · 설정 속도 주행'};if(scenario==='follow')sim.traffic=[{lane:0,s:110,speedMps:65/3.6}];if(scenario==='clear')sim.traffic=[{lane:0,s:150,speedMps:70/3.6}];if(scenario==='rear')sim.traffic=[{lane:1,s:-55,speedMps:125/3.6},{lane:0,s:150,speedMps:70/3.6}];sim.acc=ADAS.acc(observation(),Number($('target-speed').value));sim.reason=scenario==='follow'?'앞차 간격에 맞춰 속도를 조절합니다.':scenario==='exit'?'출구 접근 · 오른쪽 차로 유지':scenario==='rear'?'왼쪽 차로의 빠른 뒤 차량을 확인하세요.':'차선 유지 · 설정 속도 주행';events=[];playing=false;$('play').textContent='시작';log('시나리오 초기화');update();draw();}
function change(direction){if(sim.memory){log('진행 중인 차선 변경을 먼저 완료하세요.');return;}const target=sim.lane+(direction==='left'?1:-1),allowed=ADAS.laneChangeAllowed(observation(),target);sim.reason=allowed.reason;if(!allowed.ok){log('변경 보류: '+allowed.reason);update();return;}sim.memory=ADAS.beginLaneChange({x:-sim.y,z:-sim.s,headingRad:sim.yaw,speedMps:sim.speedMps},direction);sim.destination=target;sim.reason=(direction==='left'?'왼쪽':'오른쪽')+' 차선 변경';log(sim.reason);playing=true;$('play').textContent='일시정지';}
function step(dt){sim.time+=dt;sim.acc=ADAS.acc(observation(),Number($('target-speed').value));sim.speedMps=Math.max(0,sim.speedMps+sim.acc.acceleration*dt);let steering;if(sim.memory){const result=ADAS.laneChangeStep({x:-sim.y,z:-sim.s,headingRad:sim.yaw,speedMps:sim.speedMps},sim.memory,dt);sim.memory=result.memory;steering=result.steering;if(result.status!=='changing'){sim.lane=result.status==='complete'?sim.destination:Math.round(sim.y/3.6);sim.memory=null;sim.reason=result.status==='complete'?'차선 변경 완료 · 차선 유지':'변경 중단';log(sim.reason);}}else steering=ADAS.keepLane(sim.y,sim.yaw,sim.speedMps,sim.lane*3.6);sim.yaw+=sim.speedMps/5.2*Math.tan(steering*.65)*dt;sim.y+=sim.speedMps*Math.sin(sim.yaw)*dt;sim.s+=sim.speedMps*Math.cos(sim.yaw)*dt;sim.traffic.forEach(car=>car.s+=car.speedMps*dt);}
function update(){$('speed').textContent=(sim.speedMps*3.6).toFixed(1)+' km/h';$('gap').textContent=sim.acc?.gapM!=null?sim.acc.gapM.toFixed(1)+' m':'—';$('offset').textContent=(sim.y-sim.lane*3.6).toFixed(2)+' m';$('time').textContent=sim.time.toFixed(1)+'초';$('decision').textContent=sim.reason;$('gap-detail').textContent=sim.acc?.gapM!=null?'현재 간격 '+sim.acc.gapM.toFixed(1)+' m · 목표 '+sim.acc.desiredM.toFixed(1)+' m':'앞차 없음 · 목표 속도와 차선 중심을 유지합니다.';}
function truck(x,y,color,label,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(-angle);ctx.fillStyle=color;ctx.fillRect(-13,-24,26,48);ctx.fillStyle='#19333c';ctx.fillRect(-10,-21,20,8);ctx.restore();ctx.fillStyle='#d2e0e6';ctx.font='12px system-ui';ctx.textAlign='center';ctx.fillText(label,x,y+42);}
function draw(){const w=canvas.width,h=canvas.height,roadLeft=w/2-165,roadRight=w/2+165,center=w/2,truckY=h*.69,laneScale=165/3.6,egoX=center+82.5-sim.y*laneScale;ctx.clearRect(0,0,w,h);ctx.fillStyle='#152127';ctx.fillRect(0,0,w,h);ctx.fillStyle='#202e35';ctx.fillRect(roadLeft,0,roadRight-roadLeft,h);ctx.strokeStyle='#71838b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(roadLeft,0);ctx.lineTo(roadLeft,h);ctx.moveTo(roadRight,0);ctx.lineTo(roadRight,h);ctx.stroke();ctx.strokeStyle='#b1bbc0';ctx.setLineDash([22,22]);ctx.lineDashOffset=-sim.s*2%44;ctx.beginPath();ctx.moveTo(center,0);ctx.lineTo(center,h);ctx.stroke();ctx.setLineDash([]);for(const car of sim.traffic){const y=truckY-(car.s-sim.s)*2.3;if(y>-60&&y<h+60)truck(center+82.5-car.lane*165,y,'#b0bbc4',(car.speedMps*3.6).toFixed(0)+' km/h');}if(sim.memory){ctx.strokeStyle='#efc47d';ctx.lineWidth=2;ctx.setLineDash([7,6]);ctx.beginPath();const finalY=sim.destination*3.6;for(let i=0;i<=50;i++){const u=i/50,shape=10*u**3-15*u**4+6*u**5,x=egoX-(finalY-sim.y)*shape*laneScale,y=truckY-u*210;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.setLineDash([]);}truck(egoX,truckY,'#80dfbe','내 트럭',sim.yaw);ctx.fillStyle='#a2b8c2';ctx.font='13px system-ui';ctx.textAlign='center';ctx.fillText('왼쪽 차로',center-82.5,28);ctx.fillText('오른쪽 차로',center+82.5,28);}
$('scenario').onchange=reset;$('reset').onclick=reset;$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'일시정지':'시작';};$('fast').onclick=()=>{rate=rate===1?2:1;$('fast').textContent=rate+'×';};$('target-speed').oninput=()=>{$('target-value').textContent=$('target-speed').value+' km/h';update();};$('sim-left').onclick=()=>change('left');$('sim-right').onclick=()=>change('right');
function frame(now){const delta=last?Math.min((now-last)/1000,.1):0;last=now;if(playing){accumulator+=delta*rate;while(accumulator>=.02){step(.02);accumulator-=.02;}update();}else accumulator=0;draw();requestAnimationFrame(frame);}reset();requestAnimationFrame(frame);
`

await mkdir(targetRoot, { recursive: true })
await Promise.all([
  writeFile(resolve(targetRoot, 'controller.js'), sourceController),
  writeFile(resolve(targetRoot, 'index.html'), indexHtml),
  writeFile(resolve(targetRoot, 'styles.css'), stylesCss),
  writeFile(resolve(targetRoot, 'app.js'), appJs)
])

console.log(`ETS2 정적 시뮬레이터 동기화 완료: ${targetRoot}`)
