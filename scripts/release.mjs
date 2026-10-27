// Stamps a new version into index.html before publishing:
//   node scripts/release.mjs
// Every script and stylesheet URL gets ?v=<version>, so browsers fetch the
// new files instead of reusing cached ones, and the app can tell it is outdated.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const version = `${now.getUTCFullYear()}.${pad(now.getUTCMonth() + 1)}.${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`;

const modules = [];
(function walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith('.js')) modules.push(`./${relative(root, path)}`);
  }
})(join(root, 'js'));

const importMap = JSON.stringify({ imports: Object.fromEntries(modules.map((m) => [m, `${m}?v=${version}`])) }, null, 2)
  .split('\n').map((l, i) => (i ? `  ${l}` : l)).join('\n');

const file = join(root, 'index.html');
let html = readFileSync(file, 'utf8');
html = html
  .replace(/<meta name="app-version" content="[^"]*">/, `<meta name="app-version" content="${version}">`)
  .replace(/(href="css\/styles\.css)(\?v=[^"]*)?"/, `$1?v=${version}"`)
  .replace(/(src="js\/app\.js)(\?v=[^"]*)?"/, `$1?v=${version}"`)
  .replace(/<script type="importmap">[\s\S]*?<\/script>/, `<script type="importmap">\n  ${importMap}\n  </script>`);
writeFileSync(file, html);
console.log(`index.html stamped with version ${version} (${modules.length} modules)`);
