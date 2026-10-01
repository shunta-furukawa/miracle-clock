import {forestEpisodes,forestQuestion,forestTimeLabel} from './forest-mail.js';
import {harborEpisodes,harborQuestion} from './harbor-mail.js';
export const mailEpisodes=[...forestEpisodes.map(ep=>({...ep,chapter:'森',destination:'港'})),...harborEpisodes];
export const mailEpisodeIds=mailEpisodes.map(ep=>ep.id);
export const mailEpisode=stageId=>Number.isInteger(stageId)?mailEpisodes[stageId]||null:null;
export const mailQuestion=(stageId,index)=>stageId<6?forestQuestion(stageId,index):harborQuestion(stageId,index);
export const mailTimeLabel=(stageId,r)=>stageId<6?forestTimeLabel(stageId,r):`${r.period}${r.h}時${r.m?r.m+'分':'ちょうど'}`;
