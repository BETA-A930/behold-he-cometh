import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const logPath = resolve(process.cwd(), 'scripts', 'env-info.txt');
const node = 'C:/Program Files/nodejs/node.exe';
const npm = 'C:/Program Files/nodejs/npm.cmd';

let out = '';
function run(name, cmd, args) {
  out += `--- ${name} ---\n`;
  try {
    const result = execFileSync(cmd, args, { encoding: 'utf8', cwd: process.cwd(), env: { ...process.env, PATH: `${process.env.PATH ?? ''};C:\\Program Files\\nodejs` } });
    out += result + '\n';
  } catch (err) {
    out += `ERROR: ${err.message}\n`;
    if (err.stdout) out += `STDOUT:\n${err.stdout}\n`;
    if (err.stderr) out += `STDERR:\n${err.stderr}\n`;
  }
}
run('pwd', 'cmd.exe', ['/c', 'cd']);
run('node version', node, ['--version']);
run('npm version', npm, ['--version']);
run('where node', 'cmd.exe', ['/c', 'where node']);
run('where npm', 'cmd.exe', ['/c', 'where npm']);
run('npm config list --json', npm, ['config', 'list', '--json']);
run('npm config get bin-links', npm, ['config', 'get', 'bin-links']);
run('npm bin', npm, ['bin']);
writeFileSync(logPath, out, 'utf8');
console.log('wrote', logPath);
