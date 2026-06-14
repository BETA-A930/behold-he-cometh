import { existsSync, readdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const projectDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const nodeModules = resolve(projectDir, 'node_modules');
const bin = resolve(nodeModules, '.bin');
const vitePkg = resolve(nodeModules, 'vite', 'package.json');
const tscJs = resolve(nodeModules, 'typescript', 'lib', 'tsc.js');
console.log('projectDir', projectDir);
console.log('nodeModules', existsSync(nodeModules));
if (existsSync(nodeModules)) {
  console.log('nodeModules items', readdirSync(nodeModules).length);
}
console.log('.bin exists', existsSync(bin));
if (existsSync(bin)) {
  const entries = readdirSync(bin);
  console.log('.bin entries', entries.length);
  console.log(entries.slice(0, 40).join('|'));
}
console.log('vite package.json exists', existsSync(vitePkg));
console.log('tsc.js exists', existsSync(tscJs));
if (existsSync(vitePkg)) {
  console.log('vite package contents');
  console.log(readFileSync(vitePkg, 'utf8').slice(0, 200));
}
