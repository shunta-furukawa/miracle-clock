import {stages,makeOrder,customerFor,patienceLimit} from './levels.js';
import {matchesTime} from './time.js';

// A delivery is a person; a combo is one successful stamp, even for a whole batch.
export function rushLevel(level){
 if(level.rush)return level;
 const number=level.number||1;
 return {...level,rush:true,count:level.endless?Infinity:[10,15,20,24,27,30][number-1],
  times:level.id===0&&number===2?[180,360,540]:level.id===0&&number===3?[180,240,300,360]:level.times,
  starPace:(level.starPace||24)/3};
}
export function rushOrder(level,index){
 const choices=[0,6,12,18,24,30],slot=index%6;
 // Each family has a repeatable order, so new arrivals can join an existing batch.
 const template=level.endless?makeOrder(stages[choices[slot]],0):makeOrder(level,index%level.times.length);
 const person=customerFor(level,index);
 return {...template,...person,orderId:index,origin:level.place,waited:0,attended:0};
}
export function rushSession(input,lives=3){
 const level=rushLevel(input),initial=level.endless?10:Math.min(level.count,level.number===1?10:9);
 return {level,queue:Array.from({length:initial},(_,i)=>rushOrder(level,i)),generated:initial,
  delivered:0,departed:0,processed:0,mistakes:0,elapsed:0,activeTime:0,status:'playing',
  capacity:level.endless?24:level.count,lives:level.endless?3:lives===6?6:3,maxLives:level.endless?3:lives===6?6:3,
  combo:0,maxCombo:0,maxBatch:0,points:0};
}
export const rushInterval=s=>s.level.endless?Math.max(1.8,6-Math.floor(s.delivered/24)*.4):s.level.number===1?0:Math.max(3,7-s.level.number*.5);
export const rushLimit=level=>level.id===0?120:patienceLimit(level);
export const rushKey=o=>`${o.period?'24':'12'}:${o.target%(o.period?1440:720)}`;
export function rushGroups(s){
 const groups=new Map();
 for(const order of s.queue){const key=rushKey(order);if(!groups.has(key))groups.set(key,{key,order,orders:[]});groups.get(key).orders.push(order);}
 return [...groups.values()];
}
export const rushMatches=(s,dial)=>s.queue.filter(o=>matchesTime(dial,o.target,o.period));
export const rushStep=s=>Math.min(...s.queue.map(o=>o.step),s.level.endless?1:60);
function rushArrive(s){
 const count=Math.min(3,s.level.count-s.generated,s.capacity-s.queue.length);
 for(let i=0;i<count;i++)s.queue.push(rushOrder(s.level,s.generated++));
 if(s.level.endless&&s.queue.length>=s.capacity)s.status='over';
}
function rushAdvance(s){
 if(!s.level.endless&&s.processed>=s.level.count){s.status='cleared';return;}
 // A clear desk immediately opens the next wave; never leave the player waiting.
 if(!s.queue.length){rushArrive(s);s.elapsed=0;}
}
export function rushTick(s,seconds){
 if(s.status!=='playing'||!Number.isFinite(seconds)||seconds<0)return;
 s.activeTime+=seconds;for(const o of s.queue)o.waited+=seconds;if(s.queue[0])s.queue[0].attended+=seconds;
 const interval=rushInterval(s);if(!interval)return;s.elapsed+=seconds;
 while(s.elapsed>=interval&&s.generated<s.level.count&&s.status==='playing'){s.elapsed-=interval;rushArrive(s);}
}
export function rushStamp(s,dial){
 if(s.status!=='playing')return [];
 const orders=rushMatches(s,dial);
 if(!orders.length){s.mistakes++;s.combo=0;return [];}
 const ids=new Set(orders.map(o=>o.orderId));s.queue=s.queue.filter(o=>!ids.has(o.orderId));
 s.delivered+=orders.length;s.processed+=orders.length;s.combo++;s.maxCombo=Math.max(s.maxCombo,s.combo);
 s.maxBatch=Math.max(s.maxBatch,orders.length);s.points+=Math.round(orders.length*100*(1+Math.min(s.combo-1,9)*.1));
 rushAdvance(s);return orders;
}
export function rushTimeout(s){
 if(s.status!=='playing'||!s.queue.length)return;
 s.queue.shift();s.mistakes++;s.departed++;s.processed++;s.combo=0;s.lives--;
 if(s.lives<=0){s.status='over';return;}rushAdvance(s);
}
