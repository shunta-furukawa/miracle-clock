// The ledger is blank until Luca turns its number wheels. Values are a full
// measurement range, never answer-dependent distractors or suggested answers.
export function ledgerFields(q,cfg){
 const hours=Array.from({length:12},(_,i)=>cfg.period?i:i+1);
 const field=(id,label,values)=>({id,label,values});
 if(q.mode==='room')return [field('h','時',hours)];
 if(q.mode==='rel')return [field('d','経過した分',Array.from({length:Math.max(180,...cfg.dur)/5+1},(_,i)=>i*5))];
 const fields=q.mode==='min'?[]:[...(cfg.period?[field('p','午前・午後',[false,true])]:[]),field('h','時',hours)];
 if(!cfg.exact)fields.push(field('m','分',Array.from({length:60/(cfg.step||1)},(_,i)=>i*(cfg.step||1))));
 return fields;
}
export function ledgerTurn(field,value,direction){
 const i=field.values.indexOf(value),n=field.values.length;
 return field.values[i<0?(direction>0?0:n-1):(i+direction+n)%n];
}
export function ledgerKey(q,cfg,entry){
 if(ledgerFields(q,cfg).some(f=>!f.values.includes(entry[f.id])))return null;
 if(q.mode==='room')return String(entry.h);
 if(q.mode==='min')return String(entry.m);
 if(q.mode==='rel')return String(entry.d);
 return `${entry.h===0?12:entry.h}:${cfg.exact?0:entry.m}:${cfg.period?entry.p:false}`;
}
