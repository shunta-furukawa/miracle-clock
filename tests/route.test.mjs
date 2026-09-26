import test from 'node:test';
import assert from 'node:assert/strict';
import {routeLevels,routeSession,routeTick,routeStamp,routePins,routeLabel,batchPoints} from '../src/route.js';

const seeded=(seed=7)=>()=>((seed=(seed*16807)%2147483647)-1)/2147483646;
const fixed=(level,orders)=>{const s=routeSession(level,{rng:seeded()});s.queue=orders.map((o,i)=>({id:i,kind:'period',base:level.open,label:'',...o}));s.generated=orders.length;return s;};
const forest=routeLevels[0];

test('shop opens empty at the opening time and customers walk in over time',()=>{
 const s=routeSession(forest,{rng:seeded()});assert.equal(s.floor,forest.open);assert.equal(s.queue.length,0);
 routeTick(s,.59);assert.equal(s.queue.length,0);routeTick(s,.02);assert.equal(s.queue.length,1);
});
test('every order is in the future, on the step and inside opening hours',()=>{
 for(const level of routeLevels)for(let seed=1;seed<40;seed++){
  const s=routeSession(level,{rng:seeded(seed)});
  for(let i=0;i<200&&s.status==='playing';i++){
   for(const e of routeTick(s,.7))if(e.type==='arrive'){const o=e.order;assert.ok(o.target>s.floor||o.target===level.close);assert.ok(o.target<=level.close);assert.equal((o.target-level.open)%level.step,0);if(o.kind==='relative')assert.equal(o.base,s.floor);}
   if(i%3===2&&s.queue.length)routeStamp(s,routePins(s)[0].target);
  }
 }
});
test('one stamp serves every notation of the same time together',()=>{
 const s=fixed(forest,[{target:600,kind:'period'},{target:600,kind:'relative'},{target:660}]);
 const r=routeStamp(s,600);assert.equal(r.served.length,2);assert.equal(s.floor,600);assert.deepEqual(s.queue.map(o=>o.target),[660]);
 assert.equal(r.points,batchPoints(2));assert.equal(s.maxBatch,2);
});
test('the dial never goes back: jumping ahead leaves earlier customers behind',()=>{
 const s=fixed(forest,[{target:540},{target:600},{target:660}]);
 const r=routeStamp(s,600);assert.deepEqual(r.missed.map(o=>o.target),[540]);assert.equal(s.hearts,2);assert.equal(s.missed,1);
 assert.equal(routeStamp(s,540),null,'earlier than now is refused');assert.equal(s.floor,600);
});
test('an empty stamp only breaks the combo and never moves the clock',()=>{
 const s=fixed(forest,[{target:600},{target:660}]);routeStamp(s,600);assert.equal(s.combo,1);
 const r=routeStamp(s,720);assert.equal(r.served.length,0);assert.equal(s.floor,600);assert.equal(s.combo,0);assert.equal(s.mistakes,1);assert.equal(s.hearts,3);
});
test('a full line turns new visitors away and costs a heart',()=>{
 const s=routeSession(forest,{rng:seeded()});routeTick(s,60);
 assert.equal(s.queue.length,forest.capacity);assert.equal(s.gaveUp,s.generated-forest.capacity);assert.equal(s.hearts,Math.max(0,3-s.gaveUp));
 assert.equal(s.status,s.hearts?'playing':'over');
});
test('brute force — always the earliest pin — clears every course',()=>{
 for(const level of routeLevels)for(let seed=1;seed<20;seed++){
  const s=routeSession(level,{rng:seeded(seed)});let n=0;
  while(s.status==='playing'&&n++<2000){routeTick(s,.5);if(s.queue.length)routeStamp(s,routePins(s)[0].target);}
  assert.equal(s.status,'cleared',`${level.id} seed ${seed}`);assert.equal(s.missed,0);assert.equal(s.hearts,3);
  assert.equal(s.delivered,level.count);
 }
});
test('at closing time late visitors crowd onto the last flight instead of being cancelled',()=>{
 const s=routeSession(forest,{rng:seeded()});s.floor=forest.close;routeTick(s,20);
 assert.ok(s.queue.length>1);for(const o of s.queue){assert.equal(o.target,forest.close);assert.notEqual(o.kind,'relative');}
 assert.equal(routeStamp(s,forest.close).served.length,s.delivered);
});
test('labels read the same time in every notation, including tomorrow',()=>{
 assert.equal(routeLabel('period',870,0),'午後2時30分');assert.equal(routeLabel('period',870,0,true),'午後2時半');
 assert.equal(routeLabel('24',870,0),'14時30分');assert.equal(routeLabel('relative',870,720),'2時間半後');
 assert.equal(routeLabel('period',1470,0),'あした午前0時30分');
});
