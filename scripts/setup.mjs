// Runs migrate, then seed, with no shell involved (platform pre-deploy commands
// may not support `&&`). Both scripts are idempotent, so running this on every
// deploy is safe. Usage: node scripts/setup.mjs
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

for (const script of ['migrate.mjs', 'seed.mjs']) {
  console.log('setup: running ' + script);
  execFileSync(process.execPath, [join(here, script)], { stdio: 'inherit' });
}
console.log('setup: done');
