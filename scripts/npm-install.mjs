import { existsSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { spawnSync } from 'child_process';

const projectDir = resolve(process.cwd());
const nodeExe = 'C:/Program Files/nodejs/node.exe';
const npmCli = 'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js';
const stdoutPath = resolve(projectDir, 'install-out.txt');
const stderrPath = resolve(projectDir, 'install-err.txt');

if (existsSync(resolve(projectDir, 'node_modules'))) {
  console.log('Removing existing node_modules...');
  rmSync(resolve(projectDir, 'node_modules'), { recursive: true, force: true });
}

console.log('Running npm install...');
const result = spawnSync(nodeExe, [npmCli, 'install', '--force', '--legacy-peer-deps', '--verbose'], {
  cwd: projectDir,
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
});

writeFileSync(stdoutPath, result.stdout ?? '', 'utf8');
writeFileSync(stderrPath, result.stderr ?? '', 'utf8');
console.log('exitCode', result.status);
console.log('stdout written to', stdoutPath);
console.log('stderr written to', stderrPath);
if (result.error) {
  console.error('spawn error', result.error);
  process.exit(1);
}
process.exit(result.status ?? 0);
