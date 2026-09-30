// Sheet order matches postStories, including duplicate parcel symbols. Emoji keys are retained ONLY
// as legacy collection identifiers: saves from 0.8 remain valid; no emoji is rendered to the page.
import {postStories} from './post.js';
const stories=postStories.flat();
export function parcelArt(story){return itemArt(stories.findIndex(s=>s[1]===story.what),'parcels',story.what);}
export function giftArt(key){const i=stories.findIndex(s=>s[4]===key);return i<0?'':itemArt(i,'gifts',stories[i][5]);}
function itemArt(index,sheet,label){
 if(index<0)return '';
 return `<span class="item-art ${sheet}-art" role="img" aria-label="${label}" style="--item-x:${index%6*20}%;--item-y:${Math.floor(index/6)*20}%"></span>`;
}
