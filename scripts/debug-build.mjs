import { spawnSync } from 'child_process';
import { resolve } from 'path';

const projectDir = resolve(process.cwd());
const node = 'C:/Program Files/nodejs/node.exe';
const tsc = resolve(projectDir, 'node_modules', 'typescript', 'lib', 'tsc.js');
const vite = resolve(projectDir, 'node_modules', 'vite', 'bin', 'vite.js');

function run(description, args) {
  console.log(`--- ${description} ---`);
  const result = spawnSync(node, args, { cwd: projectDir, encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 });
  console.log('status', result.status);
  if (result.stdout) console.log('stdout:\n' + result.stdout);
  if (result.stderr) console.error('stderr:\n' + result.stderr);
  if (result.error) console.error('error:\n' + result.error);
}

run('TSC frontend', [tsc, '-p', 'tsconfig.json', '--noEmit']);
run('TSC server', [tsc, '-p', 'tsconfig.server.json', '--noEmit']);
run('Vite build', [vite, 'build']);
