import test from 'node:test';
import assert from 'node:assert/strict';
import {DialDetents} from '../src/detent.js';
test('minute detents fire at five minute marks in both directions without chatter',()=>{
 const d=new DialDetents('minute',0);assert.equal(d.move(4.9),null);assert.equal(d.move(5.01),1);assert.equal(d.move(4.99),null);assert.equal(d.move(5.02),null);assert.equal(d.move(10),2);assert.equal(d.move(6),null);assert.equal(d.move(5),1);
});
test('hour detents follow numerals, preserve midnight and do not queue missed ticks',()=>{
 const h=new DialDetents('hour',1439);assert.equal(h.move(1440),0);assert.equal(h.move(1500),1);assert.equal(h.move(1800),6);
 const m=new DialDetents('minute',1);assert.equal(m.move(0),0);assert.equal(m.move(-5),11);assert.equal(m.move(-60),0);
});
