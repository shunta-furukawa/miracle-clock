import test from 'node:test';
import assert from 'node:assert/strict';
import {firstMailRequests,firstMailStep,firstMailQuestion} from '../src/first-mail.js';
import {postCorrect,postStages} from '../src/post.js';
import {freshRecords,freshRecord,normalizeRecords} from '../src/save.js';
test('a single flight collects three requests before its receipt desk opens',()=>{
 assert.deepEqual(Array.from({length:6},(_,i)=>firstMailStep(i).read),[false,false,false,true,true,true]);
 for(let i=0;i<3;i++){
  const r=firstMailRequests[i],send=firstMailQuestion(i),receipt=firstMailQuestion(i+3);
  assert.ok(r.received>=r.h*60&&r.received<(r.h+1)*60,'delivery actually occurs in the requested hour');
  assert.equal(receipt.t,r.received);assert.equal(receipt.h,send.h);
  assert.ok(postCorrect(send,r.received,false,postStages[0].cfg));
  assert.equal(postCorrect(send,(r.h+1)*60,false,postStages[0].cfg),false);
  assert.equal(receipt.options.filter(o=>o.key===receipt.answer).length,1);
  assert.equal(new Set(receipt.options.map(o=>o.key)).size,3);
 }
});
test('episode completion survives saving without inferring it from old stage clears',()=>{
 const r=freshRecords();r.slots[0]={...freshRecord(),stages:[0],gifts:['🐚'],episodes:['forest-first-mail','forest-first-mail','unknown']};
 const next=normalizeRecords(JSON.parse(JSON.stringify(r)));assert.deepEqual(next.slots[0].episodes,['forest-first-mail']);assert.deepEqual(next.slots[0].gifts,['🐚']);
 delete r.slots[0].episodes;assert.deepEqual(normalizeRecords(r).slots[0].episodes,[]);
});
