import { existsSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { spawnSync } from 'child_process';

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const nodeModules = resolve(projectDir, 'node_modules');
const npmCli = resolve('C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js');
const nodeExe = resolve('C:\\Program Files\\nodejs\\node.exe');

console.log('projectDir', projectDir);
console.log('nodeModules exists', existsSync(nodeModules));
if (existsSync(nodeModules)) {
  console.log('Removing node_modules...');
  rmSync(nodeModules, { recursive: true, force: true });
  console.log('Removed node_modules');
}
console.log('Running npm install...');
const result = spawnSync(nodeExe, [npmCli, 'install', '--no-audit', '--no-fund', '--loglevel=info'], {
  cwd: projectDir,
  shell: false,
  stdio: 'inherit',
});
console.log('npm exit code', result.status);
if (result.error) {
  console.error('npm error', result.error);
}
process.exit(result.status ?? 1);
