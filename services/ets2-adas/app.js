'use strict';
const $=id=>document.getElementById(id), canvas=$('road'),ctx=canvas.getContext('2d');
let mode='live',live={telemetry:{connected:false}},token='',sim,playing=false,rate=1,last=0,accumulator=0;
let samples=[],simEvents=[],livePath=[],lastLivePosition=null;
let displayedFrame=0,loadingFrame=false;
const fmt=(v,n=0)=>Number.isFinite(v)?v.toFixed(n):'—';
function simEvent(message){simEvents.unshift({time:new Date().toISOString(),message});simEvents=simEvents.slice(0,30);}
function resetSim(){
 const scenario=$('scenario').value;
 sim={time:0,s:0,y:scenario==='keep'?.8:0,yaw:scenario==='keep'?.015:0,speedMps:90/3.6,lane:0,memory:null,traffic:[],scenario,acc:null,reason:'차선 유지 · 설정 속도 주행'};
 if(scenario==='follow')sim.traffic=[{id:'lead',lane:0,s:110,speedMps:65/3.6}];
 if(scenario==='clear')sim.traffic=[{id:'lead',lane:0,s:150,speedMps:70/3.6}];
 if(scenario==='rear')sim.traffic=[{id:'rear',lane:1,s:-55,speedMps:125/3.6},{id:'lead',lane:0,s:150,speedMps:70/3.6}];
 sim.acc=ADAS.acc(observation(),Number($('target-speed').value));
 sim.reason=scenario==='follow'?'앞차 간격에 맞춰 속도를 조절합니다.':scenario==='exit'?'출구 접근 · 오른쪽 차로 유지':scenario==='rear'?'왼쪽 차로의 빠른 뒤 차량을 확인하세요.':'차선 유지 · 설정 속도 주행';
 simEvents=[];samples=[];playing=false;$('play').textContent='시작';simEvent('시나리오 초기화');draw();update();
}
function observation(){return {s:sim.s,speedMps:sim.speedMps,lane:sim.lane,traffic:sim.traffic,perceptionValid:true,
 occupiedLanes:sim.memory?[0,1]:[sim.lane],route:{exitDistanceM:sim.scenario==='exit'?Math.max(0,320-sim.s):99999,preferredLane:0}};}
function simChange(direction){
 if(sim.memory){simEvent('진행 중인 차선 변경을 먼저 완료하세요.');return;}
 const target=sim.lane+(direction==='left'?1:-1),allowed=ADAS.laneChangeAllowed(observation(),target);
 sim.reason=allowed.reason;
 if(!allowed.ok){simEvent('변경 보류: '+allowed.reason);update();return;}
 sim.memory=ADAS.beginLaneChange({x:-sim.y,z:-sim.s,headingRad:sim.yaw,speedMps:sim.speedMps},direction);
 sim.destination=target;sim.reason=(direction==='left'?'왼쪽':'오른쪽')+' 차선 변경';simEvent(sim.reason);playing=true;$('play').textContent='일시정지';
}
function step(dt){
 sim.time+=dt;sim.acc=ADAS.acc(observation(),Number($('target-speed').value));
 sim.speedMps=Math.max(0,sim.speedMps+sim.acc.acceleration*dt);
 let steering;
 if(sim.memory){const r=ADAS.laneChangeStep({x:-sim.y,z:-sim.s,headingRad:sim.yaw,speedMps:sim.speedMps},sim.memory,dt);sim.memory=r.memory;steering=r.steering;
  if(r.status!=='changing'){sim.lane=r.status==='complete'?sim.destination:Math.round(sim.y/3.6);sim.memory=null;sim.reason=r.status==='complete'?'차선 변경 완료 · 차선 유지':'변경 중단';simEvent(sim.reason);}
 }else{steering=ADAS.keepLane(sim.y,sim.yaw,sim.speedMps,sim.lane*3.6);}
 sim.yaw+=sim.speedMps/5.2*Math.tan(steering*.65)*dt;
 sim.y+=sim.speedMps*Math.sin(sim.yaw)*dt;sim.s+=sim.speedMps*Math.cos(sim.yaw)*dt;
 sim.traffic.forEach(car=>car.s+=car.speedMps*dt);
 if(Math.floor(sim.time*10)!==Math.floor((sim.time-dt)*10))samples.push({source:'simulation',timeS:sim.time,ego:{speedMps:sim.speedMps,lateralM:sim.y,headingRad:sim.yaw},command:{steering,accelerationMps2:sim.acc.acceleration},gapM:sim.acc.gapM,state:sim.memory?'changing':'keeping'});
 if(samples.length>3000)samples.shift();
}
function setMode(next){mode=next;$('live-controls').hidden=next!=='live';$('sim-controls').hidden=next!=='sim';
 $('watch-panel').hidden=next!=='live';
 ['live','sim'].forEach(m=>{$(m+'-tab').classList.toggle('active',m===next);$(m+'-tab').setAttribute('aria-pressed',m===next);});
 if(next==='sim' && (live.armed||live.pendingArm))send('stop');
 $('view-title').textContent=next==='live'?'내 트럭 궤적':'2차로 시험 도로';
 $('view-caption').textContent=next==='live'?'실제 데이터 · 차선/주변 차량 인식 없음':'가상 차량 · 실제 게임에 명령을 보내지 않음';
 $('footer-mode').textContent=next==='live'?'LIVE ADAPTER / SCS SDK':'SIMULATION / SAME LANE-CHANGE CONTROLLER';
 $('metric2-label').textContent=next==='live'?'설정 크루즈':'앞차 간격';$('metric2-unit').textContent=next==='live'?'km/h':'m';
 $('metric3-label').textContent=next==='live'?'차선 변경 변위':'차선 중심 오차';
 $('metric4-label').textContent=next==='live'?'목적지까지':'목표 속도';$('metric4-unit').textContent=next==='live'?'km':'km/h';update();draw();}
function update(){
 const t=live.telemetry||{};
 const watch=live.monitor||{},capture=live.capture||{};
 $('stuck-seconds').textContent=watch.lowSpeedSeconds||0;$('stuck-progress').value=watch.lowSpeedSeconds||0;
 $('watch-status').textContent=watch.reason||'로컬 감시 프로그램 대기';
 $('monitor-start').disabled=!!watch.enabled;$('monitor-stop').disabled=!watch.enabled;
 $('recovery-now').disabled=!t.connected||Math.abs(t.speedMps)*3.6>=1||!live.recovery?.configured||!!live.recovery?.running;
 const uptime=live.uptimeSeconds||0;$('uptime').textContent=`서버 실행 ${Math.floor(uptime/3600)}시간 ${Math.floor(uptime%3600/60)}분 · 감시 ${watch.enabled?'켜짐':'꺼짐'}`;
 $('recovery-status').textContent=live.recovery?.running?'이동·수리 실행 중':live.recovery?.reason||'복구 상태 대기';
 $('recovery-status').classList.toggle('attention',!live.recovery?.configured);
 $('capture-status').textContent=capture.available?`1초 간격 · ${capture.width} × ${capture.height} · ${new Date(capture.at*1000).toLocaleTimeString('ko-KR',{hour12:false})}`:capture.reason||'화면 연결 대기';
 $('screen-empty').hidden=!!capture.available;$('screen-empty').textContent=capture.reason||'ETS2 화면을 기다리고 있습니다.';
 $('game-frame').hidden=!capture.available;
 if(capture.available&&capture.id!==displayedFrame&&!loadingFrame){loadingFrame=true;displayedFrame=capture.id;$('game-frame').src='/api/frame.jpg?id='+capture.id;}
 if(mode==='live'){
  $('speed').textContent=fmt(t.connected?t.speedMps*3.6:NaN,1);$('cruise').textContent=fmt(t.connected?t.cruiseMps*3.6:NaN);
  $('offset').textContent=fmt(live.maneuver?.lateralM,2);$('distance').textContent=fmt(t.connected?t.routeDistanceM/1000:NaN,1);
  $('connection').textContent=t.connected?(t.paused?'ETS2 연결 · 일시정지':'ETS2 실시간 연결'):'게임 연결 대기';
  $('connection').className='badge'+(t.connected?' connected':'');
  $('status').textContent=live.reason||'START.ps1 실행 후 ETS2를 켜세요. 시뮬레이션은 바로 사용할 수 있습니다.';
  $('time').textContent=t.connected?'SCS SDK · 25 Hz':'WAITING FOR ETS2';
  $('events').replaceChildren(...eventItems(live.events||[]));
 }else{
  $('speed').textContent=fmt(sim.speedMps*3.6,1);$('cruise').textContent=fmt(sim.acc?.gapM,1);
  $('offset').textContent=fmt(sim.y-sim.lane*3.6,2);$('distance').textContent=$('target-speed').value;
  $('connection').textContent='시뮬레이션';$('connection').className='badge connected';$('status').textContent=playing?'동일한 차선 변경 제어기를 가상 도로에서 실행 중':'시작을 누르거나 차선 변경을 요청하세요.';
  $('decision').textContent=sim.reason;$('gap-detail').textContent=sim.acc?.gapM!=null?`현재 간격 ${sim.acc.gapM.toFixed(1)} m · 목표 ${sim.acc.desiredM.toFixed(1)} m · 앞차 ${sim.acc.leadSpeedKmh.toFixed(0)} km/h`:'앞차 없음 · 목표 속도와 차선 중심을 유지합니다.';
  $('time').textContent=sim.time.toFixed(1)+' s';$('events').replaceChildren(...eventItems(simEvents));
 }
 $('arm').textContent=live.pendingArm?'게임 복귀 대기':live.armed?'명령 준비됨':'명령 준비';
 $('arm').disabled=!t.connected||!!live.armed||!!live.pendingArm;
 ['cruise-btn','plus','minus','lane-toggle','live-left','live-right'].forEach(id=>$(id).disabled=!(live.armed||live.pendingArm));
}
function eventItems(events){if(!events.length){const li=document.createElement('li');li.textContent='아직 기록이 없습니다.';return [li];}return events.slice(0,12).map(e=>{const li=document.createElement('li'),time=document.createElement('time');time.textContent=new Date(e.time).toLocaleTimeString('ko-KR',{hour12:false});li.append(time,document.createTextNode(e.message));return li;});}
function truck(x,y,color,label,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(-angle);ctx.fillStyle=color;ctx.fillRect(-13,-24,26,48);ctx.fillStyle='#19333c';ctx.fillRect(-10,-21,20,8);ctx.fillStyle='#ffffff22';ctx.fillRect(-10,-7,20,27);ctx.restore();if(label){ctx.fillStyle='#d2e0e6';ctx.font='12px Segoe UI';ctx.textAlign='center';ctx.fillText(label,x,y+42);}}
function draw(){
 const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#152127';ctx.fillRect(0,0,w,h);
 ctx.strokeStyle='#26404a';ctx.lineWidth=1;ctx.setLineDash([]);
 for(let x=40;x<w;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=30;y<h;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
 if(mode==='sim'){
  const roadLeft=w/2-165,roadRight=w/2+165,center=w/2,px=92/3.6,truckX=center+82.5-sim.y*px,truckY=h*.69;
  ctx.fillStyle='#202e35';ctx.fillRect(roadLeft,0,roadRight-roadLeft,h);
  ctx.strokeStyle='#71838b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(roadLeft,0);ctx.lineTo(roadLeft,h);ctx.moveTo(roadRight,0);ctx.lineTo(roadRight,h);ctx.stroke();
  ctx.strokeStyle='#b1bbc0';ctx.setLineDash([22,22]);ctx.lineDashOffset=-sim.s*2%44;ctx.beginPath();ctx.moveTo(center,0);ctx.lineTo(center,h);ctx.stroke();ctx.setLineDash([]);ctx.lineDashOffset=0;
  // Lane centres are separated by 165 px; use the same scale for every mark.
  const laneScale=165/3.6,egoX=center+82.5-sim.y*laneScale;
  for(const car of sim.traffic){const cy=truckY-(car.s-sim.s)*2.3;if(cy>-60&&cy<h+60)truck(center+82.5-car.lane*165,cy,'#b0bbc4',(car.speedMps*3.6).toFixed(0)+' km/h');}
  if(sim.memory){ctx.strokeStyle='#efc47d';ctx.lineWidth=2;ctx.setLineDash([7,6]);ctx.beginPath();const finalY=sim.destination*3.6;for(let i=0;i<=50;i++){const u=i/50,sh=10*u**3-15*u**4+6*u**5,x=egoX-(finalY-sim.y)*sh*laneScale,y=truckY-u*210;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.setLineDash([]);}
  truck(egoX,truckY,'#80dfbe','내 트럭',sim.yaw);ctx.fillStyle='#a2b8c2';ctx.font='13px Segoe UI';ctx.textAlign='center';ctx.fillText('왼쪽 차로',center-82.5,28);ctx.fillText('오른쪽 차로',center+82.5,28);
  if(sim.scenario==='exit'){ctx.fillStyle='#efc47d';ctx.textAlign='left';ctx.fillText('출구 '+Math.max(0,320-sim.s).toFixed(0)+' m',roadRight+20,100);}
 }else{
  const t=live.telemetry||{},cx=w/2,cy=h*.62,scale=3.4;
  if(!t.connected){ctx.fillStyle='#a1b3bc';ctx.textAlign='center';ctx.font='16px Segoe UI';ctx.fillText('ETS2 연결을 기다리고 있습니다',cx,h/2);ctx.font='12px Segoe UI';ctx.fillText('시뮬레이션 탭은 게임 없이도 사용할 수 있습니다',cx,h/2+28);return;}
  const project=(x,z)=>{const dx=x-t.x,dz=z-t.z,h=t.headingRad;return {x:cx+(dx*Math.cos(h)-dz*Math.sin(h))*scale,y:cy+(dx*Math.sin(h)+dz*Math.cos(h))*scale};};
  ctx.strokeStyle='#efc47d';ctx.lineWidth=2;ctx.beginPath();livePath.forEach((p,i)=>{const xy=project(p.x,p.z);i?ctx.lineTo(xy.x,xy.y):ctx.moveTo(xy.x,xy.y);});ctx.stroke();truck(cx,cy,'#80dfbe','내 트럭');
  ctx.fillStyle='#a1b3bc';ctx.textAlign='left';ctx.font='12px Segoe UI';ctx.fillText('차선 경계와 주변 차량은 표시하지 않습니다',24,30);ctx.fillText('실측 X '+fmt(t.x,1)+' / Z '+fmt(t.z,1),24,h-20);
 }
}
async function send(action,extra={}){try{const r=await fetch('/api/action',{method:'POST',headers:{'Content-Type':'application/json','X-Poc-Token':token},body:JSON.stringify({action,...extra})});const d=await r.json();if(!r.ok)throw new Error(d.error);await poll();}catch(e){$('status').textContent=e.message;}}
async function poll(){if(location.protocol==='file:')return;try{const r=await fetch('/api/state');if(!r.ok)return;live=await r.json();token=live.token;const t=live.telemetry;if(t?.connected&&Number.isFinite(t.x)){if(!lastLivePosition||Math.hypot(t.x-lastLivePosition.x,t.z-lastLivePosition.z)>.5){lastLivePosition={x:t.x,z:t.z};livePath.push(lastLivePosition);if(livePath.length>800)livePath.shift();}if(mode==='live'){samples.push({source:'ets2',at:new Date().toISOString(),telemetry:t,maneuver:live.maneuver,perception:{available:false,lanes:null,traffic:null}});if(samples.length>3000)samples.shift();}}update();}catch{live={telemetry:{connected:false},reason:'로컬 연결 프로그램 대기 · START.ps1을 실행하세요.'};update();}}
$('live-tab').onclick=()=>setMode('live');$('sim-tab').onclick=()=>setMode('sim');
$('scenario').onchange=resetSim;$('reset').onclick=resetSim;$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'일시정지':'시작';};
$('fast').onclick=()=>{rate=rate===1?2:1;$('fast').textContent=rate+'×';};$('target-speed').oninput=()=>{$('target-value').textContent=$('target-speed').value+' km/h';update();};
$('sim-left').onclick=()=>simChange('left');$('sim-right').onclick=()=>simChange('right');
[['arm','arm'],['stop','stop'],['cruise-btn','cruise'],['minus','minus'],['plus','plus'],['lane-toggle','laneToggle']].forEach(([id,action])=>$(id).onclick=()=>send(action));
$('monitor-start').onclick=()=>send('monitorStart');$('monitor-stop').onclick=()=>send('monitorStop');
$('recovery-now').onclick=()=>send('recoveryNow');
$('game-frame').onload=()=>{loadingFrame=false;};$('game-frame').onerror=()=>{loadingFrame=false;displayedFrame=0;$('game-frame').hidden=true;$('screen-empty').hidden=false;$('screen-empty').textContent='화면을 다시 연결하고 있습니다.';};
['left','right'].forEach(direction=>$('live-'+direction).onclick=()=>send('laneChange',{direction,clearRoad:$('clear-road').checked,laneAssistOff:$('lane-off').checked,widthM:Number($('lane-width').value)}));
$('export').onclick=()=>{const data={schemaVersion:1,mode,createdAt:new Date().toISOString(),nativeAssist:mode==='live',samples:samples.filter(s=>s.source===(mode==='live'?'ets2':'simulation')),events:mode==='live'?live.events:simEvents};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ets2-poc-'+mode+'-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
function frame(now){const delta=last?Math.min((now-last)/1000,.1):0;last=now;if(mode==='sim'&&playing){accumulator+=delta*rate;while(accumulator>=.02){step(.02);accumulator-=.02;}update();}else accumulator=0;draw();requestAnimationFrame(frame);}
setInterval(poll,700);
resetSim();setMode('live');poll();requestAnimationFrame(frame);
