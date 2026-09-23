import test from 'node:test';
import assert from 'node:assert/strict';
import {parcelSeal} from '../src/stamp.js';

test('ink clock uses continuously advancing hour hand and exact minute position',()=>{
 for(const [time,hour,minute] of [[0,0,0],[195,97.5,90],[390,195,180],[719,359.5,354],[735,7.5,90],[1439,359.5,354]]){
  const mark=parcelSeal(time);
  assert.ok(mark.includes(`class="stamp-hour" transform="rotate(${hour} 50 50)"`));
  assert.ok(mark.includes(`class="stamp-minute" transform="rotate(${minute} 50 50)"`));
  assert.equal((mark.match(/<image /g)||[]).length,3);
  assert.doesNotMatch(mark,/<text|<strong|時|分/);
 }
});
