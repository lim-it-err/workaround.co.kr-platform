(function(root, factory) { const api=factory(); if(typeof module==='object') module.exports=api; else root.ADAS=api; })(typeof globalThis!=='undefined'?globalThis:this, function() {
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
 function beginLaneChange(t,direction,options={}) {
  if(!['left','right'].includes(direction)) throw new Error('차선 변경 방향이 올바르지 않습니다.');
  if(![t.x,t.z,t.headingRad,t.speedMps].every(Number.isFinite)) throw new Error('위치 데이터가 없습니다.');
  if(t.speedMps<30/3.6 || t.speedMps>110/3.6) throw new Error('차선 변경 실험 속도는 30~110km/h입니다.');
  const width=clamp(options.widthM||3.6,3,4.2), duration=clamp(options.durationS||7,5,10);
  return {x0:t.x,z0:t.z,h0:t.headingRad,target:(direction==='left'?1:-1)*width,
   duration,elapsed:0,lastSteer:0,status:'changing',lateralM:0,errorM:0};
 }
 function laneChangeStep(t,memory,dt) {
  const m={...memory}; dt=clamp(dt,.001,.1); m.elapsed+=dt;
  const dx=t.x-m.x0,dz=t.z-m.z0;
  const lateral=-dx*Math.cos(m.h0)+dz*Math.sin(m.h0);
  const yaw=wrap(t.headingRad-m.h0), u=clamp(m.elapsed/m.duration,0,1);
  const shape=10*u**3-15*u**4+6*u**5;
  const dy=m.target*(30*u*u-60*u**3+30*u**4)/m.duration;
  const ddy=m.target*(60*u-180*u*u+120*u**3)/(m.duration*m.duration);
  const reference=m.target*shape, error=reference-lateral;
  const targetYaw=clamp(Math.atan2(dy+.55*error,Math.max(8,t.speedMps)),-.11,.11);
  const feedForward=ddy*5.2/(Math.max(8,t.speedMps)**2*.65);
  const raw=clamp(1.5*wrap(targetYaw-yaw)+feedForward,-.22,.22);
  let steering=clamp(raw,m.lastSteer-.4*dt,m.lastSteer+.4*dt);
  m.lateralM=lateral; m.errorM=m.target-lateral;
  if(![lateral,yaw,t.speedMps].every(Number.isFinite) || Math.abs(yaw)>.23 || Math.abs(lateral)>Math.abs(m.target)+2 || t.speedMps<8 || m.elapsed>m.duration+6) {
   m.status='aborted'; steering=0;
  } else if(m.elapsed>=m.duration && Math.abs(m.target-lateral)<.25 && Math.abs(yaw)<.02) {
   m.status='complete';steering=0;
  }
  m.lastSteer=steering;
  return {steering,memory:m,status:m.status,referenceM:reference,lateralM:lateral};
 }
 function laneChangeAllowed(o,targetLane) {
  if(!o.perceptionValid) return {ok:false,reason:'차선·주변 차량 데이터 없음'};
  if(targetLane<0||targetLane>1) return {ok:false,reason:'도로 바깥 차로'};
  if(o.route && o.route.exitDistanceM<400 && targetLane!==o.route.preferredLane) return {ok:false,reason:'출구 접근 · 경로 차로 유지'};
  for(const car of o.traffic.filter(c=>c.lane===targetLane)) {
   const gap=car.s-o.s;
   if(gap>=0 && gap<8+o.speedMps*2.2) return {ok:false,reason:'옆 차로 앞쪽 간격 부족'};
   const closing=Math.max(0,car.speedMps-o.speedMps);
   if(gap<0 && (-gap<12+car.speedMps*1.8 || closing>0 && -gap/closing<7)) return {ok:false,reason:'옆 차로 뒤 차량 접근'};
  }
  return {ok:true,reason:'앞뒤 간격 확보'};
 }
 function acc(o,targetKmh=90) {
  let acceleration=clamp((targetKmh/3.6-o.speedMps)*.55,-4,1.4), lead=null;
  const lanes=o.occupiedLanes||[o.lane];
  for(const car of o.traffic) if(lanes.includes(car.lane) && car.s>o.s && (!lead||car.s<lead.s)) lead=car;
  if(lead) {
   const gap=lead.s-o.s-12, desired=8+o.speedMps*2.2;
   acceleration=Math.min(acceleration,.16*(gap-desired)+.9*(lead.speedMps-o.speedMps));
   if(gap<5) acceleration=-6;
   return {acceleration:clamp(acceleration,-6,1.4),gapM:gap,desiredM:desired,leadSpeedKmh:lead.speedMps*3.6};
  }
  return {acceleration,gapM:null,desiredM:8+o.speedMps*2.2,leadSpeedKmh:null};
 }
 function keepLane(y,yaw,speedMps,targetY) {
  return clamp(1.5*(clamp(Math.atan2(.65*(targetY-y),Math.max(speedMps,8)),-.12,.12)-yaw),-.22,.22);
 }
 return {clamp,wrap,beginLaneChange,laneChangeStep,laneChangeAllowed,acc,keepLane};
});
