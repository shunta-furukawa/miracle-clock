import test from 'node:test';
import assert from 'node:assert/strict';
import {ledgerFields,ledgerKey,ledgerTurn} from '../src/ledger.js';
import {mailQuestion} from '../src/story-mail.js';
import {postStages} from '../src/post.js';
test('all 108 arrival records can be entered, including midnight and elapsed hours',()=>{
 for(let stage=0;stage<36;stage++)for(let i=3;i<6;i++){
  const q=mailQuestion(stage,i),cfg=postStages[stage].cfg,fields=ledgerFields(q,cfg);
  const entry=Object.fromEntries(fields.map(f=>[f.id,f.id==='h'&&cfg.period?q.h%12:q[f.id]]));
  assert.equal(ledgerKey(q,cfg,{}),null);
  assert.equal(ledgerKey(q,cfg,entry),q.answer,`stage ${stage} reply ${i}`);
  for(const f of fields){const wrong={...entry,[f.id]:ledgerTurn(f,entry[f.id],1)};assert.notEqual(ledgerKey(q,cfg,wrong),q.answer);}
 }
});
test('number wheels wrap both ways and ranges do not depend on the answer',()=>{
 const cfg=postStages[27].cfg,q=mailQuestion(27,3);
 for(const f of ledgerFields(q,cfg)){
  assert.equal(ledgerTurn(f,null,1),f.values[0]);
  assert.equal(ledgerTurn(f,null,-1),f.values.at(-1));
  assert.equal(ledgerTurn(f,f.values[0],-1),f.values.at(-1));
  assert.equal(ledgerTurn(f,f.values.at(-1),1),f.values[0]);
 }
 assert.deepEqual(ledgerFields(q,cfg),ledgerFields({...q,h:7,m:15,p:!q.p},cfg));
});
