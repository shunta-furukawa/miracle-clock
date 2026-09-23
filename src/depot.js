export const depotThemes=[
 {color:'#628d4a',tag:'FOREST',reward:'受付カウンター',gift:'森の木でつくった、ぬくもりのある受付。',thanks:'森のみんなで、中央配送所のカウンターをつくったよ。'},
 {color:'#449ca8',tag:'HARBOR',reward:'荷物棚',gift:'港の船大工がつくった、たくさん並ぶ荷物棚。',thanks:'荷物が増えても安心ね。港から丈夫な棚を贈るわ。'},
 {color:'#9b7bbe',tag:'CRYSTAL',reward:'案内灯',gift:'夜の荷物にも道を教える、結晶の明かり。',thanks:'遠くからでも見えるように、結晶の案内灯を贈るよ。'},
 {color:'#bd7c3c',tag:'WORKSHOP',reward:'仕分け機',gift:'行き先ごとに荷物を分ける、真鍮の仕分け機。',thanks:'たくさんの荷物もおまかせ！ 工房特製の仕分け機だよ。'},
 {color:'#6c9dbc',tag:'CLOUDS',reward:'通信塔',gift:'島々の配送所と連絡を取る、空の通信塔。',thanks:'どの島からも声が届くよ。雲の通信塔を使ってね。'},
 {color:'#c48b76',tag:'GREENHOUSE',reward:'開所看板',gift:'花と葉で飾った、みんなを迎える開所看板。',thanks:'最後はぼくらの看板！ 花を飾って、中央配送所をひらこう！'}
];
export const chapterDeliveries=(record,id)=>Array.from({length:6},(_,i)=>id*6+i).filter(n=>record?.stages?.includes(n)).length;
export const earnedRewards=record=>depotThemes.map((_,i)=>i).filter(i=>chapterDeliveries(record,i)===6);
export const preparationStep=record=>{const earned=earnedRewards(record);let n=0;while(earned.includes(n))n++;return n;};
export const shopReputation=n=>['開店のしたく','はじめてのありがとう','常連さんができた','口コミでにぎやか','荷物が集まるお店','行列のできる配送所','島のみんなの配送所'][Math.min(6,Math.max(0,n))];
export const depotIcon=id=>`<span class="depot-icon" role="img" aria-label="${['森','港','結晶','工房','雲','砂丘の温室'][id]}の配送所" style="--depot-x:${id%3*50}%;--depot-y:${Math.floor(id/3)*100}%"></span>`;
export const centralArt=step=>`<div class="central-art" role="img" aria-label="中央配送所の準備 ${step} / 6" style="--central-x:${step%4/3*100}%;--central-y:${Math.floor(step/4)*100}%"></div>`;
