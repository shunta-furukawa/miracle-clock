import {forestEpisodes,forestQuestion,forestTimeLabel} from './forest-mail.js';
import {harborEpisodes,harborQuestion} from './harbor-mail.js';
import {journeyEpisodes,journeyQuestion,journeyClockLabel} from './journey-mail.js';
export const mailEpisodes=[...forestEpisodes.map(ep=>({...ep,chapter:'森',destination:'港'})),...harborEpisodes,...journeyEpisodes];
export const mailEpisodeIds=mailEpisodes.map(ep=>ep.id);
export const mailEpisode=stageId=>Number.isInteger(stageId)?mailEpisodes[stageId]||null:null;
export const mailQuestion=(stageId,index)=>stageId<6?forestQuestion(stageId,index):stageId<12?harborQuestion(stageId,index):journeyQuestion(stageId,index);
export const mailTimeLabel=(stageId,r)=>stageId<6?forestTimeLabel(stageId,r):stageId>=12?journeyClockLabel(r.received):`${r.period}${r.h}時${r.m?r.m+'分':'ちょうど'}`;
