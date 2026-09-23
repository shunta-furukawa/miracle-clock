// Follow the unsnapped pointer position, including across 12 and in reverse.
// One event per crossed mark; lingering on the same mark never chatters.
export class DialDetents{
 constructor(hand,start){this.step=hand==='hour'?60:5;this.previous=start;this.lastMark=null;}
 move(value){const from=this.previous;this.previous=value;if(value===from)return null;
  const forward=value>from,round=forward?Math.floor:Math.ceil;
  const index=round(value/this.step),before=round(from/this.step);
  if(index===before||index===this.lastMark)return null;
  this.lastMark=index;return ((index%12)+12)%12;
 }
}
