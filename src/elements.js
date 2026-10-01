// 0–9 retain the palette and emblems on Miracle Mine's original stones.webp.
export const elements = [
 {name:'原石',color:'#eee9dc',ink:'#21474c',mark:'M0 -5a5 5 0 1 0 0 10a5 5 0 1 0 0 -10',meaning:'一周して、また始まる'},
 {name:'水鉱石',color:'#1468c1',ink:'#ffffff',mark:'M0 -6Q-9 3 0 6Q9 3 0 -6',meaning:'流れをつなぐ水'},
 {name:'日光石',color:'#f1c84a',ink:'#483717',mark:'M0 -3a3 3 0 1 0 0 6a3 3 0 1 0 0 -6M0 -7v2M0 5v2M-7 0h2M5 0h2M-5 -5l2 2M3 3l2 2M5 -5l-2 2M-3 3l-2 2',meaning:'道を照らす日光'},
 {name:'火鉱石',color:'#c24627',ink:'#fff7db',mark:'M0 -6Q2 -1 4 -3Q9 6 0 6Q-8 5 -3 -2Q-3 2 0 -6',meaning:'力を生む炎'},
 {name:'森鉱石',color:'#087c61',ink:'#ffffff',mark:'M-5 5Q-8 -4 6 -6Q7 5 -5 5M-5 5L3 -3',meaning:'命を育む森'},
 {name:'樹脂石',color:'#b96a11',ink:'#ffffff',mark:'M-5 0L0 -5L5 0M-5 5L0 0L5 5',meaning:'木々が蓄えた力'},
 {name:'氷鉱石',color:'#9cdbeb',ink:'#234651',mark:'M0 -7V7M-6 -3.5L6 3.5M-6 3.5L6 -3.5M-3 -5L0 -3L3 -5M-3 5L0 3L3 5',meaning:'澄んだ氷の輝き'},
 {name:'月影石',color:'#343e89',ink:'#ffffff',mark:'M3 -6A7 7 0 1 0 3 6A6 6 0 0 1 3 -6',meaning:'夜を見守る月'},
 {name:'星鉱石',color:'#b64276',ink:'#ffffff',mark:'M0 -7L2 -2L7 0L2 2L0 7L-2 2L-7 0L-2 -2Z',meaning:'遠くへ導く星'},
 {name:'蒸気結晶',color:'#b3a1e6',ink:'#25294e',mark:'M-2 6L-3 -3L0 -7L3 -3L2 6ZM-4 6L-7 0L-5 -2M4 6L7 0L5 -2',meaning:'飛行機を動かす蒸気'},
 {name:'風鉱石',color:'#83cfb5',ink:'#164b49',mark:'M-7 -3H2Q7 -3 5 -6M-6 1H6M-5 5H1Q6 5 4 7',meaning:'空の道をひらく風'},
 {name:'雷鉱石',color:'#dc9656',ink:'#3d2945',mark:'M1 -7L-5 1H0L-1 7L6 -2H1Z',meaning:'刻印に命を灯す雷'}
];
export function elementMark(index){return `<path d="${elements[index].mark}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;}
// Socket centres measured in the 960 × 960 housing artwork, not an ideal circle.
const gemSockets = [[659,155],[807,299],[856,472],[806,641],[661,777],[480,833],[298,777],[151,641],[103,472],[152,299],[301,155],[480,103]];
export function elementalNumbers(){return Array.from({length:12},(_,n)=>{const hour=n+1,index=hour%12,e=elements[index],[sx,sy]=gemSockets[n],x=sx*300/960,y=sy*300/960;return `<g class="element-gem" data-element="${index}" transform="translate(${x} ${y})" style="--gem:${e.color};color:${e.ink}"><title>${hour}：${e.name}</title><image class="gem-art" href="assets/gems/${hour}.webp" x="-18.5" y="-18.5" width="37" height="37"/></g>`;}).join('');}
