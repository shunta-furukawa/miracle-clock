import {access, cp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';

// Package the exact dist/ artifact that passed browser tests; never rebuild here.
await access('dist/index.html');
const settings = JSON.parse(await readFile('vercel.json', 'utf8'));
await rm('.vercel/output', {recursive: true, force: true});
await mkdir('.vercel/output', {recursive: true});
await cp('dist', '.vercel/output/static', {recursive: true});
const routes = (settings.headers ?? []).map(rule => ({
  src: rule.source,
  headers: Object.fromEntries(rule.headers.map(({key, value}) => [key, value])),
  continue: true,
}));
await writeFile('.vercel/output/config.json', JSON.stringify({version: 3, routes}, null, 2));
console.log('Prepared tested static files for Vercel.');
