import test from 'node:test';
import assert from 'node:assert/strict';
import {postStages,postStories,postQuestion,postCorrect,postTarget,postStars,postParts,postHourOf,postMinOf,postMs,postGiftCount} from '../src/post.js';
import {stages} from '../src/levels.js';
import {normalizeRecords,freshRecord} from '../src/save.js';

test('every one of the 36 stages has a puzzle and every depot six stories with distinct gifts',()=>{
 assert.equal(postStages.length,stages.length);assert.equal(postStories.length,6);
 for(const [c,list] of postStories.entries()){assert.equal(list.length,6);for(const s of list){assert.equal(s.length,6);assert.notEqual(s[2],c,'parcels go to another island');}}
 assert.equal(new Set(postStories.flat().map(s=>s[4])).size,postGiftCount());
});
test('set questions start off target, and the helper hands always solve them',()=>{
 for(const {cfg} of postStages)for(let i=0;i<200;i++){
  const q=postQuestion(cfg,false),pm=cfg.period?q.p:false;
  assert.equal(postCorrect(q,q.start,pm,cfg),false,`starts unsolved ${JSON.stringify(cfg)}`);
  assert.equal(postCorrect(q,postTarget(q,q.start),pm,cfg),true,`helper solves ${JSON.stringify(q)}`);
  if(cfg.period)assert.equal(postCorrect(q,postTarget(q,q.start),!pm,cfg),false,'morning and afternoon differ');
  if(cfg.pool&&q.m!==null)assert.ok(cfg.pool.includes(q.m));
 }
});
test('read questions offer three distinct envelopes including the one the dial shows',()=>{
 for(const {cfg} of postStages)for(let i=0;i<200;i++){
  const q=postQuestion(cfg,true),keys=q.options.map(o=>o.key);
  assert.equal(keys.length,3,JSON.stringify(q));assert.equal(new Set(keys).size,3);assert.ok(keys.includes(q.answer));
  if(q.mode==='hm'){assert.equal(postHourOf(q.t),q.h);assert.equal(postMinOf(q.t),q.m);}
  if(q.mode==='rel')assert.equal(postMs(q.t-q.now),q.d);
 }
});
test('time words for the dial: rooms, half past, morning/afternoon and 24-hour',()=>{
 assert.deepEqual(postParts(3,0,false,false,{}),{hour:'3時',minute:'ちょうど'});
 assert.deepEqual(postParts(3,30,false,true,{}),{hour:'3時',minute:'半'});
 assert.deepEqual(postParts(12,0,false,false,{period:true}),{hour:'午前0時',minute:''});
 assert.deepEqual(postParts(12,0,true,false,{period:true}),{hour:'午後0時',minute:''});
 assert.deepEqual(postParts(6,5,true,false,{period:'24'}),{hour:'18時',minute:'5分'});
 assert.deepEqual(postParts(12,0,false,false,{period:'24'}),{hour:'0時',minute:''});
});
test('stars count first tries: no slips for three, up to two for two',()=>{
 assert.equal(postStars(0,0),3);assert.equal(postStars(1,1),2);assert.equal(postStars(2,1),1);
});
test('gifts collected in a diary survive saving and ignore junk',()=>{
 assert.deepEqual(freshRecord().gifts,[]);
 const data=normalizeRecords({version:2,slots:[{cleared:[],gifts:['🐚','🐚','💎',3,'',{}]},{cleared:[]},null]});
 assert.deepEqual(data.slots[0].gifts,['🐚','💎']);assert.deepEqual(data.slots[1].gifts,[]);
});
