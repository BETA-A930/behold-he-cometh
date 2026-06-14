import { existsSync, rmSync } from 'fs';
import { dirname, resolve } from 'path';
import { spawn } from 'child_process';

const projectDir = resolve(dirname(new URL(import.meta.url).pathname), '..');
const nodeModules = resolve(projectDir, 'node_modules');
const npmCli = resolve('C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js');
const logFile = resolve(projectDir, 'install-output.txt');

if (existsSync(nodeModules)) {
  console.log('Removing existing node_modules...');
  rmSync(nodeModules, { recursive: true, force: true });
}

console.log('Running npm install...');
const npmProc = spawn(process.execPath, [npmCli, 'install', '--no-audit', '--no-fund', '--loglevel=info'], {
  cwd: projectDir,
  stdio: ['ignore', 'pipe', 'pipe'],
});

const outChunks = [];
const errChunks = [];

npmProc.stdout.on('data', (chunk) => outChunks.push(chunk));
npmProc.stderr.on('data', (chunk) => errChunks.push(chunk));

npmProc.on('close', (code) => {
  const output = Buffer.concat([...outChunks, ...errChunks]).toString('utf8');
  console.log(output);
  process.exit(code ?? 0);
});
