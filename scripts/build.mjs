import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.mjs', 'events.mjs', 'assets']) {
  await cp(file, `dist/${file}`, { recursive: true });
}
// The source also works on any static host. Vercel supplies the canonical hostname
// during a build so social previews receive the absolute image URL they expect.
const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
if (host && /^[a-z\d.-]+$/i.test(host)) {
  const index = await readFile('dist/index.html', 'utf8');
  await writeFile('dist/index.html', index.replace('content="/assets/social-card.png"',
    `content="https://${host}/assets/social-card.png"`));
}
console.log('Built static invitation into dist/. No runtime dependencies.');
