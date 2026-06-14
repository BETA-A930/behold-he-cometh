import { rmSync, existsSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { resolve } from 'path';

const projectDir = resolve(process.cwd());
const logPath = resolve(projectDir, 'scripts', 'install-safe.log');
const nodeBin = 'C:/Program Files/nodejs/node.exe';
const npmCmd = 'C:/Program Files/nodejs/npm.cmd';

function log(message) {
  writeFileSync(logPath, message + '\n', { flag: 'a', encoding: 'utf8' });
}

try {
  rmSync(resolve(projectDir, 'node_modules'), { recursive: true, force: true });
  log('removed node_modules');
} catch (err) {
  log('failed remove node_modules: ' + (err instanceof Error ? err.message : String(err)));
}
try {
  rmSync(resolve(projectDir, 'package-lock.json'), { force: true });
  log('removed package-lock.json');
} catch (err) {
  log('failed remove package-lock.json: ' + (err instanceof Error ? err.message : String(err)));
}
try {
  const result = execFileSync(npmCmd, ['install', '--no-audit', '--no-fund', '--legacy-peer-deps', '--verbose'], {
    cwd: projectDir,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${process.env.PATH ?? ''};C:\\Program Files\\nodejs` },
    maxBuffer: 200 * 1024 * 1024,
  });
  log('npm install succeeded');
  log(result);
} catch (err) {
  log('npm install failed: ' + (err instanceof Error ? err.message : String(err)));
  if (err.stdout) log('stdout:\n' + err.stdout);
  if (err.stderr) log('stderr:\n' + err.stderr);
  process.exit(1);
}
