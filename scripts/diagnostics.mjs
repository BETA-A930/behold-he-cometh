import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const projectDir = resolve(process.cwd());
const logPath = resolve(projectDir, 'scripts', 'diagnostics-output.txt');
const node = 'C:/Program Files/nodejs/node.exe';
const npm = 'C:/Program Files/nodejs/npm.cmd';
const tsc = resolve(projectDir, 'node_modules', 'typescript', 'lib', 'tsc.js');
const vite = resolve(projectDir, 'node_modules', 'vite', 'bin', 'vite.js');

function run(name, command, args, opts = {}) {
  try {
    const result = execFileSync(command, args, { cwd: projectDir, encoding: 'utf8', env: { ...process.env, PATH: `${process.env.PATH};C:\\Program Files\\nodejs` }, ...opts });
    writeFileSync(logPath, `--- ${name} ---\n${result}\n`, { flag: 'a' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stdout = err.stdout || '';
    const stderr = err.stderr || '';
    writeFileSync(logPath, `--- ${name} (ERROR) ---\n${msg}\nstdout:\n${stdout}\nstderr:\n${stderr}\n`, { flag: 'a' });
  }
}

writeFileSync(logPath, `Diagnostics run at ${new Date().toISOString()}\nPath=${process.env.PATH}\n\n`);
run('node version', node, ['--version']);
run('npm version', npm, ['--version']);
run('npm bin-links config', npm, ['config', 'get', 'bin-links']);
run('npm bin', npm, ['bin']);
run('where node', 'cmd.exe', ['/c', 'where node']);
run('where npm', 'cmd.exe', ['/c', 'where npm']);
run('npm list', npm, ['list', '--depth=0']);
run('ls .bin', 'cmd.exe', ['/c', 'dir', '/b', 'node_modules\\.bin']);
run('tsc frontend', node, [tsc, '-p', 'tsconfig.json', '--noEmit']);
run('tsc server', node, [tsc, '-p', 'tsconfig.server.json', '--noEmit']);
run('vite build', node, [vite, 'build']);
