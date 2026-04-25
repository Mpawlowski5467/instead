#!/usr/bin/env node
// Link checker: HEADs every `website` and `repo` URL across the YAML content.
// Fails (exit 1) if any return >= 400. Pass --skip-link-check to no-op for local runs.

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

if (process.argv.includes('--skip-link-check')) {
  console.log('link check skipped via flag');
  process.exit(0);
}

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dirs = ['src/content/tools', 'src/content/alternatives'];

const TIMEOUT_MS = 12_000;
const CONCURRENCY = 8;
const UA = 'instead-link-check/1.0 (+https://github.com)';

async function collect() {
  const out = [];
  for (const dir of dirs) {
    const abs = join(root, dir);
    const files = await readdir(abs);
    for (const f of files) {
      if (!f.endsWith('.yml') && !f.endsWith('.yaml')) continue;
      const data = parseYaml(await readFile(join(abs, f), 'utf8'));
      if (data?.website) out.push({ url: data.website, file: `${dir}/${f}`, field: 'website' });
      if (data?.repo) out.push({ url: data.repo, file: `${dir}/${f}`, field: 'repo' });
    }
  }
  return out;
}

async function head(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': UA } });
    // some servers reject HEAD; retry as GET
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal, headers: { 'user-agent': UA } });
    }
    return res.status;
  } catch (err) {
    return `ERR:${err?.code ?? err?.name ?? 'fetch'}`;
  } finally {
    clearTimeout(timer);
  }
}

async function pool(items, n, fn) {
  const results = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const idx = i++;
        results[idx] = await fn(items[idx]);
      }
    }),
  );
  return results;
}

const items = await collect();
console.log(`checking ${items.length} URLs across ${dirs.join(', ')}`);

const results = await pool(items, CONCURRENCY, async (item) => {
  const status = await head(item.url);
  const bad = typeof status === 'string' || status >= 400;
  console.log(`${bad ? '✗' : '✓'} ${status}  ${item.url}  (${item.file}:${item.field})`);
  return { ...item, status, bad };
});

const failures = results.filter((r) => r.bad);
if (failures.length > 0) {
  console.error(`\n${failures.length} broken link(s):`);
  for (const f of failures) console.error(`  ${f.file} ${f.field}: ${f.url} -> ${f.status}`);
  process.exit(1);
}
console.log('\nall links ok');
