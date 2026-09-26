import {timeText,durationText} from './time.js';

// One shop day. Times are minutes from the day's midnight and may pass 1440 into tomorrow.
// The dial only moves forward: a successful stamp fixes "now" at that time.
export const routeLevels=[
 {id:'forest',title:'森の朝市',skill:'正時',open:420,close:1140,step:60,count:14,capacity:7,arrive:[2.6,3.8],kinds:['period','relative'],horizon:180,same:.4},
 {id:'harbor',title:'港のお昼どき',skill:'30分・半',open:540,close:1200,step:30,count:20,capacity:7,arrive:[2.2,3.2],kinds:['period','relative'],horizon:180,same:.4},
 {id:'cave',title:'洞窟の夕方便',skill:'15分・24時間表記',open:720,close:1260,step:15,count:24,capacity:8,arrive:[1.9,2.8],kinds:['period','24','relative'],horizon:180,same:.45},
 {id:'night',title:'真夜中の空便',skill:'5分・日付またぎ',open:1080,close:1560,step:5,count:28,capacity:8,arrive:[1.7,2.5],kinds:['period','24','relative'],horizon:150,same:.45}
];

export function routeLabel(kind,target,base,half=false){
 if(kind==='relative')return durationText(target-base);
 const text=timeText(target,kind==='24'?'24':'period');
 return (target>=1440?'あした':'')+(half?text.replace('30分','半'):text);
}
export function routeSession(level,{rng=Math.random,hearts=3}={}){
 return {level,rng,floor:level.open,queue:[],generated:0,delivered:0,missed:0,gaveUp:0,
  hearts,maxHearts:hearts,mistakes:0,combo:0,maxCombo:0,maxBatch:0,flights:0,points:0,activeTime:0,untilArrival:.6,status:'playing'};
}
const pick=(s,list)=>list[Math.min(list.length-1,Math.floor(s.rng()*list.length))];
// Orders favour the near future, and often repeat a waiting time in another notation.
// Nobody is turned away by the closing time: the last slots simply get crowded.
export function routeOrder(s){
 const {step,close,horizon,kinds,same}=s.level,room=Math.floor((close-s.floor)/step);
 const waiting=[...new Set(s.queue.map(o=>o.target))];
 const target=!room?close:waiting.length&&s.rng()<same?pick(s,waiting):s.floor+step*Math.max(1,Math.ceil(s.rng()**1.4*Math.min(room,Math.floor(horizon/step))));
 const allowed=kinds.filter(k=>k!=='relative'||target>s.floor&&target-s.floor<=horizon);
 const fresh=allowed.filter(k=>!s.queue.some(o=>o.target===target&&o.kind===k));
 const kind=pick(s,fresh.length?fresh:allowed);
 return {id:s.generated,target,kind,base:s.floor,label:routeLabel(kind,target,s.floor,s.generated%2===1)};
}
function loseHeart(s){s.hearts=Math.max(0,s.hearts-1);}
function settle(s){
 if(s.hearts<=0)s.status='over';
 else if(s.generated>=s.level.count&&!s.queue.length)s.status='cleared';
}
// Returns what happened this tick so the page can animate arrivals and walk-outs.
export function routeTick(s,seconds){
 const events=[];
 if(s.status!=='playing'||!(seconds>=0))return events;
 s.activeTime+=seconds;s.untilArrival-=seconds;
 while(s.status==='playing'&&s.untilArrival<=1e-9&&s.generated<s.level.count){
  const [a,b]=s.level.arrive;s.untilArrival+=a+(b-a)*s.rng();
  const order=routeOrder(s);s.generated++;
  if(s.queue.length>=s.level.capacity){s.gaveUp++;loseHeart(s);events.push({type:'gaveUp',order});settle(s);continue;}
  s.queue.push(order);events.push({type:'arrive',order});
 }
 settle(s);return events;
}
export function routePins(s){
 const pins=new Map();for(const o of s.queue){if(!pins.has(o.target))pins.set(o.target,{target:o.target,orders:[]});pins.get(o.target).orders.push(o);}
 return [...pins.values()].sort((a,b)=>a.target-b.target);
}
export const batchPoints=n=>100*n+50*n*(n-1);
// A stamp on an empty time costs nothing but the combo; a real flight moves "now" and leaves earlier orders behind.
export function routeStamp(s,time){
 if(s.status!=='playing'||time<s.floor||time>s.level.close)return null;
 const served=s.queue.filter(o=>o.target===time);
 if(!served.length){s.mistakes++;s.combo=0;return {served,missed:[],points:0};}
 const missed=s.queue.filter(o=>o.target<time);
 s.queue=s.queue.filter(o=>o.target>time);s.floor=time;
 s.delivered+=served.length;s.flights++;s.combo=missed.length?1:s.combo+1;s.maxCombo=Math.max(s.maxCombo,s.combo);
 s.maxBatch=Math.max(s.maxBatch,served.length);
 const points=Math.round(batchPoints(served.length)*(1+Math.min(s.combo-1,9)*.1));s.points+=points;
 s.missed+=missed.length;for(const _ of missed)loseHeart(s);
 settle(s);return {served,missed,points};
}
