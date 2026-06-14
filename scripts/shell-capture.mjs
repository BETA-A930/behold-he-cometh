import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const outFile = resolve(process.cwd(), 'scripts', 'shell-capture.txt');
let output = '';
const cmds = [
  { name: 'pwd', cmd: 'cmd.exe', args: ['/c', 'cd'] },
  { name: 'dir', cmd: 'cmd.exe', args: ['/c', 'dir'] },
  { name: 'node-version', cmd: 'C:/Program Files/nodejs/node.exe', args: ['--version'] },
  { name: 'npm-version', cmd: 'C:/Program Files/nodejs/npm.cmd', args: ['--version'] },
  { name: 'where-node', cmd: 'cmd.exe', args: ['/c', 'where node'] },
  { name: 'where-npm', cmd: 'cmd.exe', args: ['/c', 'where npm'] },
  { name: 'npm-bin-links', cmd: 'C:/Program Files/nodejs/npm.cmd', args: ['config', 'get', 'bin-links'] },
  { name: 'npm-bin', cmd: 'C:/Program Files/nodejs/npm.cmd', args: ['bin'] },
];

for (const { name, cmd, args } of cmds) {
  output += `--- ${name} ---\n`;
  try {
    output += execFileSync(cmd, args, { encoding: 'utf8', cwd: process.cwd(), env: { ...process.env, PATH: `${process.env.PATH ?? ''};C:\\Program Files\\nodejs` } });
  } catch (err) {
    if (err.stdout) output += `STDOUT:\n${err.stdout}`;
    if (err.stderr) output += `STDERR:\n${err.stderr}`;
    output += `ERROR:\n${err.message}\n`;
  }
  output += '\n';
}
writeFileSync(outFile, output, 'utf8');
console.log('wrote', outFile);
