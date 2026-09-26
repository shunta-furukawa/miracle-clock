import test from 'node:test';
import assert from 'node:assert/strict';
import {routeLevels,routeSession,routeTick,routeStamp,routePins,routeLabel,routeStars,batchPoints,earliestSlot,nextSlot,visitors} from '../src/route.js';

const seeded=(seed=7)=>()=>((seed=(seed*16807)%2147483647)-1)/2147483646;
const fixed=(level,orders)=>{const s=routeSession(level,{rng:seeded()});s.untilArrival=Infinity;s.queue=orders.map((o,i)=>({id:i,kind:'period',base:level.open,label:'',...o}));s.generated=orders.length;return s;};
const forest=routeLevels[0];

test('the day starts at opening time and runs by itself',()=>{
 const s=routeSession(forest,{rng:seeded()});assert.equal(s.now,forest.open);assert.equal(s.queue.length,0);
 routeTick(s,.59);assert.equal(s.queue.length,0);routeTick(s,.02);assert.equal(s.queue.length,1);
 routeTick(s,forest.hourSeconds);assert.ok(Math.abs(s.now-forest.open-60-.61*6)<1e-6,'one hour per hourSeconds');
});
test('new orders leave enough real time, sit on the step and stay inside opening hours',()=>{
 for(const level of routeLevels)for(let seed=1;seed<30;seed++){
  const s=routeSession(level,{rng:seeded(seed)});
  while(s.status==='playing')for(const e of routeTick(s,.3))if(e.type==='arrive'){
   const o=e.order;assert.ok((o.target-s.now)*level.hourSeconds/60>=level.lead-.3-1e-6);assert.ok(o.target<=level.close);assert.equal(o.target%level.step,0);
   if(o.kind==='relative'){assert.equal(o.base%level.step,0);assert.ok(o.base<=s.now);}
  }
 }
});
test('one stamp serves every notation of the same time and never moves time',()=>{
 const s=fixed(forest,[{target:600,kind:'period'},{target:600,kind:'relative'},{target:660}]);
 const r=routeStamp(s,600);assert.equal(r.served.length,2);assert.equal(s.now,forest.open);assert.deepEqual(s.queue.map(o=>o.target),[660]);
 assert.equal(r.points,batchPoints(2));assert.equal(s.maxBatch,2);
 assert.equal(routeStamp(s,660).served.length,1,'going back or forward between flights is free');
});
test('an order is missed only when its time arrives unstamped',()=>{
 const s=fixed(forest,[{target:480},{target:540}]);
 const events=routeTick(s,forest.hourSeconds*.99);assert.equal(events.length,0);
 const late=routeTick(s,forest.hourSeconds*.02);assert.deepEqual(late.map(e=>[e.type,e.order.target]),[['missed',480]]);
 assert.equal(s.missed,1);assert.equal(s.combo,0);assert.equal(routeStamp(s,480),null,'past times cannot be stamped');
});
test('an empty stamp only breaks the combo',()=>{
 const s=fixed(forest,[{target:600},{target:660}]);routeStamp(s,600);assert.equal(s.combo,1);
 const r=routeStamp(s,720);assert.equal(r.served.length,0);assert.equal(s.combo,0);assert.equal(s.mistakes,1);assert.equal(s.queue.length,1);
});
test('a full line turns new visitors away without ending the day',()=>{
 const s=routeSession(forest,{rng:seeded()});const events=routeTick(s,40).filter(e=>e.type==='gaveUp');
 assert.ok(events.length>0);assert.equal(s.gaveUp,events.length);assert.equal(s.status,'playing');
});
test('the dial may point anywhere after now, and the next slot follows the clock',()=>{
 const s=routeSession(forest,{rng:seeded()});assert.equal(nextSlot(s),480);routeTick(s,forest.hourSeconds);assert.equal(nextSlot(s),540);
 assert.ok(earliestSlot(s)>=nextSlot(s));
});
test('fast play — stamping the earliest pin each second — delivers everyone',()=>{
 for(const level of routeLevels)for(let seed=1;seed<20;seed++){
  const s=routeSession(level,{rng:seeded(seed)});
  while(s.status==='playing'){routeTick(s,1);if(s.queue.length)routeStamp(s,routePins(s)[0].target);}
  assert.equal(s.status,'closed');assert.equal(s.missed+s.gaveUp,0,`${level.id} seed ${seed}`);assert.equal(routeStars(s),3);
  assert.ok(s.delivered>20);assert.equal(visitors(s),s.delivered);
 }
});
test('a day left alone ends at closing time with everyone missed or turned away',()=>{
 const s=routeSession(forest,{rng:seeded()});while(s.status==='playing')routeTick(s,.5);
 assert.equal(s.delivered,0);assert.ok(s.now>=forest.close-1e-6);assert.equal(s.queue.length,0);assert.equal(routeStars(s),0,'under half is not a clear');
 assert.ok(s.missed>0&&s.gaveUp>0);
});
test('every order carries one plain ticket time',()=>{
 for(const level of routeLevels){const s=routeSession(level,{rng:seeded(9)});routeTick(s,20);for(const o of s.queue)assert.match(o.card,/^\d{1,2}時(\d+分)?$/);}
});
test('labels read the same time in every notation, including tomorrow',()=>{
 assert.equal(routeLabel('period',870,0),'午後2時30分');assert.equal(routeLabel('period',870,0,true),'午後2時半');
 assert.equal(routeLabel('24',870,0),'14時30分');assert.equal(routeLabel('relative',870,720),'2時間半後');
 assert.equal(routeLabel('period',1470,0),'あした午前0時30分');
});
