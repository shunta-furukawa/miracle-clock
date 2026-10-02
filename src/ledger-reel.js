import {ledgerTurn} from './ledger.js';

// A bounded flick advances up to four rows; slow drags follow the finger exactly.
export function reelRelease(offset,velocity,row){
 return Math.round(-(offset+Math.max(-row*4,Math.min(row*4,velocity*110)))/row);
}
export function bindLedgerReel(wheel,field,{get,set,enabled,reducedMotion}){
 const track=wheel.querySelector('.ledger-reel-track'),output=wheel.querySelector('output');
 let drag=null,animation=null;
 const label=v=>v===null?'―':field.id==='p'?(v?'午後':'午前'):String(v).padStart(field.id==='m'?2:1,'0');
 const turn=n=>{let v=get();for(let i=0;i<Math.abs(n);i++)v=ledgerTurn(field,v,Math.sign(n));set(v);};
 const paint=()=>{
  const v=get(),prev=ledgerTurn(field,v,-1),next=ledgerTurn(field,v,1);
  track.children[0].textContent=label(ledgerTurn(field,prev,-1));
  track.children[1].textContent=label(prev);output.textContent=label(v);
  track.children[3].textContent=label(next);track.children[4].textContent=label(ledgerTurn(field,next,1));
  wheel.setAttribute('aria-valuetext',v===null?'未記入':label(v));
  if(v===null)wheel.removeAttribute('aria-valuenow');else wheel.setAttribute('aria-valuenow',String(field.values.indexOf(v)));
 };
 const step=n=>{if(!enabled())return;animation?.cancel();turn(n);paint();if(!reducedMotion())animation=track.animate([{transform:`translateY(${Math.sign(n)*28}px)`},{transform:'translateY(0)'}],{duration:150,easing:'ease-out'});};
 wheel.querySelectorAll('[data-turn]').forEach(b=>b.onclick=e=>{if(e.detail===0)step(Number(b.dataset.turn));});
 wheel.onkeydown=e=>{const n=e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0;if(n){e.preventDefault();step(n);}};
 wheel.onpointerdown=e=>{
  if(!enabled()||drag||e.button!==0)return;
  animation?.cancel();wheel.focus({preventScroll:true});wheel.setPointerCapture(e.pointerId);
  drag={id:e.pointerId,start:e.clientY,last:e.clientY,time:e.timeStamp,offset:0,velocity:0,moved:false};
 };
 wheel.onpointermove=e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const dy=e.clientY-drag.last,dt=e.timeStamp-drag.time;
  drag.moved ||= Math.abs(e.clientY-drag.start)>4;
  if(drag.moved){e.preventDefault();drag.offset+=dy;drag.velocity=dt>0?dy/dt:0;
   while(drag.offset<=-28){turn(1);drag.offset+=28;}while(drag.offset>=28){turn(-1);drag.offset-=28;}
   paint();track.style.transform=`translateY(${drag.offset}px)`;
  }
  drag.last=e.clientY;drag.time=e.timeStamp;
 };
 const end=(e,cancel=false)=>{
  if(!drag||drag.id!==e.pointerId)return;
  const d=drag;drag=null;track.style.transform='';
  if(wheel.hasPointerCapture(e.pointerId))wheel.releasePointerCapture(e.pointerId);
  if(!enabled()){paint();return;}
  if(!d.moved&&!cancel){const y=e.clientY-wheel.getBoundingClientRect().top;step(y<28?-1:y>=56?1:get()===null?1:0);return;}
  const n=cancel?0:reelRelease(d.offset,e.timeStamp-d.time>90?0:d.velocity,28);
  if(n)turn(n);paint();
  if(!reducedMotion())animation=track.animate([{transform:`translateY(${n?Math.sign(n)*28:d.offset}px)`},{transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.2,.75,.3,1)'});
 };
 wheel.onpointerup=e=>end(e);wheel.onpointercancel=e=>end(e,true);
 wheel.onlostpointercapture=e=>{if(drag)end(e,true);};
 paint();
}
