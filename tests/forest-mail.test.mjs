import test from 'node:test';
import assert from 'node:assert/strict';
import {forestEpisodes,forestEpisodeIds,forestQuestion} from '../src/forest-mail.js';
import {postCorrect,postTarget,postStages,postStories} from '../src/post.js';
import {freshRecords,freshRecord,normalizeRecords} from '../src/save.js';
test('all forest flights have achievable clock promises and return after delivery',()=>{
 for(const [stage,ep] of forestEpisodes.entries()){
  let previous=ep.earliest;
  assert.equal(ep.requests.length,3);
  for(let i=0;i<3;i++){
   const r=ep.requests[i],q=forestQuestion(stage,i),receipt=forestQuestion(stage,i+3),cfg=postStages[stage].cfg;
   const actual=(r.h%12)*60+(r.received%60)+(r.period==='午後'||r.period==='昼'?720:0);
   assert.ok(actual>=previous&&actual<ep.returnMinute,`${ep.id}: flight order`);previous=actual;
   assert.equal(q.read,false);assert.equal(receipt.read,true);
   assert.ok(postCorrect(q,postTarget(q,q.start),false,cfg));
   assert.equal(postCorrect(q,(q.h+1)*60,false,cfg),false);
   if(stage>=2)assert.equal(postCorrect(q,q.h*60+1,false,cfg),false);
   assert.equal(receipt.t,r.received);assert.equal(receipt.options.filter(o=>o.key===receipt.answer).length,1);
   assert.equal(new Set(receipt.options.map(o=>o.key)).size,3);
  }
 }
});
test('forest completion preserves all original gifts and six distinct saved letters',()=>{
 assert.deepEqual(new Set(forestEpisodes.flatMap(e=>e.gifts.map(g=>g.id))),new Set(postStories[0].map(r=>r[4])));
 const r=freshRecords();r.slots[0]={...freshRecord(),episodes:[...forestEpisodeIds,...forestEpisodeIds,'unknown']};
 assert.deepEqual(normalizeRecords(JSON.parse(JSON.stringify(r))).slots[0].episodes,forestEpisodeIds);
});
