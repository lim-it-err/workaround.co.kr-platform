const test=require('node:test'),assert=require('node:assert/strict'),A=require('../controller.js');
function simulate(direction,speed=90,heading=0){
 const t={x:100,z:100,headingRad:heading,speedMps:speed/3.6};let m=A.beginLaneChange(t,direction),result;
 for(let i=0;i<750;i++){
  result=A.laneChangeStep(t,m,.02);m=result.memory;
  assert.ok(Math.abs(result.steering)<=.22+1e-8);
  t.headingRad+=t.speedMps/5.2*Math.tan(result.steering*.65)*.02;
  t.x-=Math.sin(t.headingRad)*t.speedMps*.02;t.z-=Math.cos(t.headingRad)*t.speedMps*.02;
  if(result.status!=='changing')break;
 }
 return result;
}
test('left/right changes converge at different speeds and compass headings',()=>{
 for(const direction of ['left','right'])for(const speed of [35,60,90,110])for(const heading of [0,1.3,3,5.9]){
  const r=simulate(direction,speed,heading);assert.equal(r.status,'complete',JSON.stringify({direction,speed,heading,result:r}));assert.ok(Math.abs(r.memory.errorM)<.25);
 }
});
test('cannot begin at standstill or with missing pose',()=>{assert.throws(()=>A.beginLaneChange({x:0,z:0,headingRad:0,speedMps:0},'left'));assert.throws(()=>A.beginLaneChange({},'left'));});
test('lead tracking slows down and keeps a positive bumper gap',()=>{
 let s=0,lead=110,v=25;let minGap=Infinity;
 for(let i=0;i<3000;i++){const r=A.acc({s,speedMps:v,lane:0,traffic:[{s:lead,speedMps:65/3.6,lane:0}]},110);v=Math.max(0,v+r.acceleration*.02);s+=v*.02;lead+=65/3.6*.02;minGap=Math.min(minGap,lead-s-12);}
 assert.ok(minGap>30);assert.ok(Math.abs(v*3.6-65)<1);
});
test('fast rear vehicle blocks lane change',()=>{const r=A.laneChangeAllowed({perceptionValid:true,s:0,speedMps:25,traffic:[{lane:1,s:-55,speedMps:35}]},1);assert.equal(r.ok,false);});
test('exit constraint and missing perception prevent blind automated changes',()=>{assert.equal(A.laneChangeAllowed({perceptionValid:false},1).ok,false);assert.equal(A.laneChangeAllowed({perceptionValid:true,s:0,speedMps:25,traffic:[],route:{exitDistanceM:300,preferredLane:0}},1).ok,false);});
test('while straddling lanes, ACC considers source and target traffic',()=>{const r=A.acc({s:0,speedMps:25,lane:1,occupiedLanes:[0,1],traffic:[{lane:0,s:55,speedMps:15}]},110);assert.ok(r.acceleration<0);});
test('lane keeping corrects an initial offset',()=>{let y=.8,yaw=.015,v=25;for(let i=0;i<1000;i++){const steer=A.keepLane(y,yaw,v,0);yaw+=v/5.2*Math.tan(steer*.65)*.02;y+=v*Math.sin(yaw)*.02;}assert.ok(Math.abs(y)<.02);});
