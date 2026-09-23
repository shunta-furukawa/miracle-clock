export const SAVE_KEY='miracle-clock.records.v2';
export const LEGACY_KEY='miracle-clock.progress.v1';
export const freshRecord=()=>({cleared:[],stages:[],stars:{},endless:{best:0,total:0},introSeen:false,shopEmblem:0,updated:Date.now()});
export const freshRecords=()=>({version:2,revision:0,active:0,slots:[null,null,null],migrated:false});
export function normalizeRecords(value){
 if(!value||value.version!==2||!Array.isArray(value.slots))return null;
 const data=freshRecords();
 data.revision=Number.isSafeInteger(value.revision)&&value.revision>=0?value.revision:0;
 data.active=Number.isInteger(value.active)&&value.active>=0&&value.active<3?value.active:0;
 data.migrated=value.migrated===true;
 data.slots=data.slots.map((_,i)=>{
 const s=value.slots[i];if(!s||!Array.isArray(s.cleared))return null;
 const cleared=[...new Set(s.cleared.filter(n=>Number.isInteger(n)&&n>=0&&n<6))];
 const stageIds=Array.isArray(s.stages)?[...new Set(s.stages.filter(n=>Number.isInteger(n)&&n>=0&&n<36))]:cleared.flatMap(c=>Array.from({length:6},(_,n)=>c*6+n));
 const stars={};for(const id of stageIds){const r=s.stars?.[id];if(r&&Number.isInteger(r.stars)&&r.stars>=1&&r.stars<=3&&Number.isFinite(r.time)&&r.time>=0&&Number.isInteger(r.mistakes)&&r.mistakes>=0)stars[id]={stars:r.stars,time:r.time,mistakes:r.mistakes};}
 const nonnegative=n=>Number.isSafeInteger(n)&&n>=0?n:0;
 return {cleared,stages:stageIds,stars,shopEmblem:Number.isInteger(s.shopEmblem)&&s.shopEmblem>=0&&s.shopEmblem<3?s.shopEmblem:0,endless:{best:nonnegative(s.endless?.best),total:nonnegative(s.endless?.total)},introSeen:s.introSeen===true,updated:Number.isFinite(s.updated)&&s.updated>=0?s.updated:0};});
 return data;
}
export function loadRecords(storage){
 try{
  if(!storage)throw new Error('storage');
  const raw=storage.getItem(SAVE_KEY);
  if(raw!==null){const data=normalizeRecords(JSON.parse(raw));if(!data)throw new Error('invalid');return {data,error:''};}
  const data=freshRecords(),old=JSON.parse(storage.getItem(LEGACY_KEY)||'{}');
  const cleared=Array.from({length:6},(_,i)=>i).filter(i=>old&&typeof old==='object'&&!Array.isArray(old)&&old[i]===true);
  if(cleared.length){data.slots[0]={...freshRecord(),cleared,stages:cleared.flatMap(c=>Array.from({length:6},(_,n)=>c*6+n)),introSeen:true};data.migrated=true;}
  return {data,error:''};
 }catch{return {data:freshRecords(),error:'記録を読み込めませんでした。元のデータは変更せず、この画面の間だけ遊べます。'};}
}
export function saveRecords(data,storage){
 try{
  if(!storage)return false;
  const raw=storage.getItem(SAVE_KEY);
  if(raw!==null){const latest=normalizeRecords(JSON.parse(raw));if(!latest||latest.revision!==data.revision)return false;}
  else if(data.revision!==0)return false;
  const next={...data,revision:data.revision+1};storage.setItem(SAVE_KEY,JSON.stringify(next));data.revision=next.revision;return true;
 }catch{return false;}
}
