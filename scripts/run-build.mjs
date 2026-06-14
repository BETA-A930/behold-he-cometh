import { spawnSync } from 'child_process';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const nodeExe = 'C:\\Program Files\\nodejs\\node.exe';
const viteCli = resolve(projectDir, 'node_modules', 'vite', 'bin', 'vite.js');
const tscJs = resolve(projectDir, 'node_modules', 'typescript', 'lib', 'tsc.js');

function run(name, args) {
  console.log(`\n--- RUN ${name} ---`);
  const res = spawnSync(nodeExe, args, { cwd: projectDir, encoding: 'utf8' });
  console.log('status', res.status);
  if (res.stdout) console.log('stdout:\n', res.stdout);
  if (res.stderr) console.error('stderr:\n', res.stderr);
  if (res.error) console.error('error:', res.error);
  return res.status;
}

const status1 = run('VITE BUILD', [viteCli, 'build']);
const status2 = run('TSC', [tscJs, '-p', 'tsconfig.server.json']);
process.exit(status1 || status2);
