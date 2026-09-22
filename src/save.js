export const SAVE_KEY='miracle-clock.records.v2';
export const LEGACY_KEY='miracle-clock.progress.v1';
export const freshRecord=()=>({cleared:[],introSeen:false,updated:Date.now()});
export const freshRecords=()=>({version:2,revision:0,active:0,slots:[null,null,null],migrated:false});
export function normalizeRecords(value){
 if(!value||value.version!==2||!Array.isArray(value.slots))return null;
 const data=freshRecords();
 data.revision=Number.isSafeInteger(value.revision)&&value.revision>=0?value.revision:0;
 data.active=Number.isInteger(value.active)&&value.active>=0&&value.active<3?value.active:0;
 data.migrated=value.migrated===true;
 data.slots=data.slots.map((_,i)=>{const s=value.slots[i];if(!s||!Array.isArray(s.cleared))return null;return {cleared:[...new Set(s.cleared.filter(n=>Number.isInteger(n)&&n>=0&&n<6))],introSeen:s.introSeen===true,updated:Number.isFinite(s.updated)&&s.updated>=0?s.updated:0};});
 return data;
}
export function loadRecords(storage){
 try{
  if(!storage)throw new Error('storage');
  const raw=storage.getItem(SAVE_KEY);
  if(raw!==null){const data=normalizeRecords(JSON.parse(raw));if(!data)throw new Error('invalid');return {data,error:''};}
  const data=freshRecords(),old=JSON.parse(storage.getItem(LEGACY_KEY)||'{}');
  const cleared=Array.from({length:6},(_,i)=>i).filter(i=>old&&typeof old==='object'&&!Array.isArray(old)&&old[i]===true);
  if(cleared.length){data.slots[0]={...freshRecord(),cleared,introSeen:true};data.migrated=true;}
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
