import {clockAngles} from './time.js';

// Generated ink parts are independently rotated about their shared pin.
// Hand boxes use the original crop/pivot ratios, so every tip points to twelve at zero degrees.
export function parcelSeal(time){
 const angles=clockAngles(time);
 const hand=(name,angle,width,top,height)=>`<g class="stamp-${name}" transform="rotate(${angle} 50 50)"><image href="assets/stamp-${name}.webp" x="${50-width/2}" y="${top}" width="${width}" height="${height}" preserveAspectRatio="none"/></g>`;
 return `<svg class="stamp-clock" viewBox="0 0 100 100" aria-hidden="true"><image href="assets/stamp-frame.webp" width="100" height="100"/>${Array.from({length:12},(_,i)=>`<path d="M50 18v${i%3===0?3:1.8}" transform="rotate(${i*30} 50 50)"/>`).join('')}${hand('hour',angles.hour,13.5,24,855*26/774)}${hand('minute',angles.minute,7.5,20,1059*30/1005)}<circle cx="50" cy="50" r="1.8"/></svg>`;
}
