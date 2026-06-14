import { spawnSync } from 'child_process';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const projectDir = resolve(process.cwd());
const logFile = resolve(projectDir, 'scripts', 'install-log-run.txt');
const nodeExe = 'C:/Program Files/nodejs/node.exe';
const npmCmd = 'C:/Program Files/nodejs/npm.cmd';

function run(name, command, args) {
  const res = spawnSync(command, args, {
    cwd: projectDir,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${process.env.PATH ?? ''};C:\\Program Files\\nodejs` },
    maxBuffer: 100 * 1024 * 1024,
  });
  const out = [];
  out.push(`--- ${name} ---`);
  out.push(`command: ${command} ${args.join(' ')}`);
  out.push(`status: ${res.status}`);
  if (res.stdout) out.push(`stdout:\n${res.stdout}`);
  if (res.stderr) out.push(`stderr:\n${res.stderr}`);
  if (res.error) out.push(`error: ${res.error.message}`);
  writeFileSync(logFile, out.join('\n\n') + '\n\n', { flag: 'a', encoding: 'utf8' });
  return res.status;
}

writeFileSync(logFile, `Install log run at ${new Date().toISOString()}\nPATH=${process.env.PATH}\n\n`, 'utf8');
run('node version', nodeExe, ['--version']);
run('npm version', npmCmd, ['--version']);
run('where node', 'cmd.exe', ['/c', 'where node']);
run('where npm', 'cmd.exe', ['/c', 'where npm']);
run('npm config get bin-links', npmCmd, ['config', 'get', 'bin-links']);
run('npm bin', npmCmd, ['bin']);
run('npm install', npmCmd, ['install', '--no-audit', '--no-fund', '--legacy-peer-deps', '--verbose']);
