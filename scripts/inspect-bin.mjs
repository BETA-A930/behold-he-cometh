import { existsSync, readdirSync } from 'fs';
import { resolve } from 'path';
const project = resolve(new URL(import.meta.url).pathname, '..', '..');
const nodeModules = resolve(project, 'node_modules');
const bin = resolve(nodeModules, '.bin');
console.log('project', project);
console.log('node_modules exists', existsSync(nodeModules));
console.log('.bin exists', existsSync(bin));
if (existsSync(nodeModules)) {
  console.log('node_modules count', readdirSync(nodeModules).length);
}
if (existsSync(bin)) {
  console.log('.bin contents', readdirSync(bin).slice(0, 80));
}
