import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'card-opening.css', 'assets']) {
  await cp(file, `dist/${file}`, { recursive: true });
}
await build({ entryPoints: ['app.mjs'], bundle: true, splitting: true, format: 'esm',
  outdir: 'dist', outExtension: { '.js': '.mjs' }, chunkNames: 'chunks/[name]-[hash]',
  minify: true, target: ['es2020'], legalComments: 'linked' });
// The source also works on any static host. Vercel supplies the canonical hostname
// during a build so social previews receive the absolute image URL they expect.
const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
if (host && /^[a-z\d.-]+$/i.test(host)) {
  const index = await readFile('dist/index.html', 'utf8');
  await writeFile('dist/index.html', index.replace('content="/assets/social-card.png"',
    `content="https://${host}/assets/social-card.png"`));
}
console.log('Built invitation into dist/. Three.js and Lenis are loaded as separate chunks.');
