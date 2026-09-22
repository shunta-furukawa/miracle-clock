import {execFileSync} from 'node:child_process';
import {setTimeout} from 'node:timers/promises';

// Git integration owns publishing. Production must wait for this exact commit's CI.
if (process.env.VERCEL_ENV === 'production') {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (!/^[a-f0-9]{40}$/.test(sha ?? '')) throw new Error('Missing Vercel Git commit SHA; refusing production build.');
  const deadline = Date.now() + 15 * 60_000;
  let passed = false;
  while (Date.now() < deadline) {
    const url = `https://api.github.com/repos/shunta-furukawa/miracle-clock/actions/workflows/test.yml/runs?head_sha=${sha}&event=push&per_page=10`;
    const response = await fetch(url, {headers: {Accept: 'application/vnd.github+json'}, signal: AbortSignal.timeout(20_000)});
    if (!response.ok) throw new Error(`Cannot verify CI: GitHub HTTP ${response.status}`);
    const {workflow_runs} = await response.json();
    const run = workflow_runs.filter(r => r.head_sha === sha && r.head_branch === 'main' && r.event === 'push').sort((a,b) => b.id - a.id)[0];
    if (run?.status === 'completed') {
      if (run.conclusion !== 'success') throw new Error(`CI ${run.conclusion}: ${run.html_url}`);
      console.log(`CI passed for ${sha}: ${run.html_url}`);
      passed = true;
      break;
    }
    console.log(`Waiting for CI on ${sha} (${run?.status ?? 'not started'})`);
    await setTimeout(30_000);
  }
  if (!passed) throw new Error('CI did not succeed within 15 minutes. Refusing production build.');
}
execFileSync(process.execPath, ['scripts/build.mjs'], {stdio: 'inherit'});
