import {timeText,durationText} from './time.js';

// One shop day. Times are minutes from the day's midnight and may pass 1440 into tomorrow.
// "Now" runs by itself; the player only chooses which flight time to stamp next.
// An order must be stamped before its time arrives, so waiting always has a cost.
export const routeLevels=[
 {id:'forest',title:'森の朝市',skill:'正時',open:420,close:1140,step:60,hourSeconds:10,lead:9,horizon:180,capacity:7,arrive:[2.4,3.4],kinds:['period','relative'],same:.4},
 {id:'harbor',title:'港のお昼どき',skill:'30分・半',open:540,close:1140,step:30,hourSeconds:12,lead:7,horizon:150,capacity:7,arrive:[2.1,3],kinds:['period','relative'],same:.4},
 {id:'cave',title:'洞窟の夕方便',skill:'15分・24時間表記',open:720,close:1260,step:15,hourSeconds:14,lead:7,horizon:150,capacity:8,arrive:[1.9,2.7],kinds:['period','24','relative'],same:.45},
 {id:'night',title:'真夜中の空便',skill:'5分・日付またぎ',open:1080,close:1560,step:5,hourSeconds:16,lead:8,horizon:120,capacity:8,arrive:[1.8,2.6],kinds:['period','24','relative'],same:.45}
];

// "Tomorrow" is relative to the day the order was taken, so an endless day can roll over.
export function routeLabel(kind,target,base,half=false){
 if(kind==='relative')return durationText(target-base);
 const text=timeText(target,kind==='24'?'24':'period');
 return (Math.floor(target/1440)>Math.floor(base/1440)?'あした':'')+(half?text.replace('30分','半'):text);
}
// Endless days speed up as deliveries grow; normal days keep one pace.
export function routePace(s){const up=s.level.speedUp;return up?Math.max(up.min,1-Math.floor(s.delivered/up.every)*up.step):1;}
export function routeSession(level,{rng=Math.random}={}){
 return {level,rng,now:level.open,queue:[],generated:0,delivered:0,missed:0,gaveUp:0,
  mistakes:0,combo:0,maxCombo:0,maxBatch:0,flights:0,points:0,activeTime:0,untilArrival:.6,status:'playing'};
}
const pick=(s,list)=>list[Math.min(list.length-1,Math.floor(s.rng()*list.length))];
const ceilTo=(v,step)=>Math.ceil(v/step-1e-9)*step;
// The earliest flight a new customer may ask for: at least `lead` real seconds away.
export const earliestSlot=s=>ceilTo(s.now+Math.max(s.level.step,s.level.lead*60/(s.level.hourSeconds*routePace(s))),s.level.step);
// The earliest time the dial may point at: strictly after now.
export const nextSlot=s=>ceilTo(s.now+1e-6,s.level.step);
// Orders favour the near future, and often repeat a waiting time in another notation.
export function routeOrder(s){
 const {step,close,horizon,kinds,same}=s.level,first=earliestSlot(s),last=Math.min(close,Math.floor((s.now+horizon)/step)*step);
 if(first>close)return null;
 const waiting=[...new Set(s.queue.map(o=>o.target))].filter(t=>t>=first);
 const slots=Math.max(1,(last-first)/step+1);
 const target=waiting.length&&s.rng()<same?pick(s,waiting):first+step*Math.floor(s.rng()**1.3*slots);
 const base=Math.floor(s.now/step)*step;
 const allowed=kinds.filter(k=>k!=='relative'||target-base<=horizon);
 const fresh=allowed.filter(k=>!s.queue.some(o=>o.target===target&&o.kind===k));
 const kind=pick(s,fresh.length?fresh:allowed);
 // `label` is how the customer says it; `card` is the one plain way the order ticket shows it.
 return {id:s.generated,target,kind,base,label:routeLabel(kind,target,base,s.generated%2===1),card:timeText(target,'12')};
}
function expire(s,events){
 const late=s.queue.filter(o=>o.target<=s.now+1e-9);
 if(!late.length)return;
 s.queue=s.queue.filter(o=>o.target>s.now+1e-9);s.missed+=late.length;s.combo=0;
 for(const order of late)events.push({type:'missed',order});
}
// Advances the day and returns what happened, so the page can animate arrivals and walk-outs.
export function routeTick(s,seconds){
 const events=[];
 if(s.status!=='playing'||!(seconds>=0))return events;
 let left=seconds;
 while(left>1e-9&&s.status==='playing'){
  const rate=60/(s.level.hourSeconds*routePace(s));
  const step=Math.min(left,Math.max(0,s.untilArrival),(s.level.close-s.now)/rate);
  s.now+=step*rate;s.activeTime+=step;s.untilArrival-=step;left-=step;
  expire(s,events);
  if(s.untilArrival<=1e-9){
   const [a,b]=s.level.arrive;s.untilArrival+=(a+(b-a)*s.rng())*routePace(s);
   const order=routeOrder(s);
   if(order){
    s.generated++;
    if(s.queue.length>=s.level.capacity){s.gaveUp++;s.combo=0;events.push({type:'gaveUp',order});}
    else{s.queue.push(order);events.push({type:'arrive',order});}
   }
  }
  // The shop closes at closing time, earlier once nobody can order and the line is empty,
  // or, on an endless day, once too many customers have gone without their parcel.
  if(s.now>=s.level.close-1e-9||earliestSlot(s)>s.level.close&&!s.queue.length||s.missed+s.gaveUp>=(s.level.maxLost??Infinity)){s.status='closed';events.push({type:'closed'});}
 }
 return events;
}
export function routePins(s){
 const pins=new Map();for(const o of s.queue){if(!pins.has(o.target))pins.set(o.target,{target:o.target,orders:[]});pins.get(o.target).orders.push(o);}
 return [...pins.values()].sort((a,b)=>a.target-b.target);
}
export const batchPoints=n=>100*n+50*n*(n-1);
// Stamping never moves time. An empty stamp only breaks the combo.
export function routeStamp(s,time){
 if(s.status!=='playing'||time<=s.now||time>s.level.close)return null;
 const served=s.queue.filter(o=>o.target===time);
 if(!served.length){s.mistakes++;s.combo=0;return {served,points:0};}
 s.queue=s.queue.filter(o=>o.target!==time);
 s.delivered+=served.length;s.flights++;s.combo++;s.maxCombo=Math.max(s.maxCombo,s.combo);s.maxBatch=Math.max(s.maxBatch,served.length);
 const points=Math.round(batchPoints(served.length)*(1+Math.min(s.combo-1,9)*.1));s.points+=points;
 return {served,points};
}
export const visitors=s=>s.delivered+s.missed+s.gaveUp+s.queue.length;
// Stars count the share of today's visitors who got their parcel off. Under half is not yet a clear.
export const starShares=[.5,.7,.9];
export function routeStars(s){const n=visitors(s),r=n?s.delivered/n:0;return starShares.filter(x=>r>=x-1e-9).length;}
