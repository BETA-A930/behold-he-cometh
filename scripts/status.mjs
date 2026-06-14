import { existsSync, readdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
const project = resolve(new URL(import.meta.url).pathname, '..', '..');
const nodeModules = resolve(project, 'node_modules');
const bin = resolve(nodeModules, '.bin');
const status = {
  project,
  node_modules_exists: existsSync(nodeModules),
  node_modules_count: existsSync(nodeModules) ? readdirSync(nodeModules).length : 0,
  bin_exists: existsSync(bin),
  bin_contents: existsSync(bin) ? readdirSync(bin) : [],
  vite_exists: existsSync(resolve(nodeModules, 'vite')),
  typescript_exists: existsSync(resolve(nodeModules, 'typescript')),
  vite_package_json_exists: existsSync(resolve(nodeModules, 'vite', 'package.json')),
  typescript_tsc_js_exists: existsSync(resolve(nodeModules, 'typescript', 'lib', 'tsc.js')),
};
writeFileSync(resolve(project, 'scripts', 'status-output.json'), JSON.stringify(status, null, 2));
console.log('wrote status-output.json');
