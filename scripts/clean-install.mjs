import { spawnSync } from 'child_process';
import { rmSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';

const projectDir = resolve(process.cwd());
const npmBinary = 'C:/Program Files/nodejs/npm.cmd';

function log(message) {
  console.log(message);
}

function runNpmInstall() {
  log('--- removing existing node_modules and lockfiles ---');
  if (existsSync(resolve(projectDir, 'node_modules'))) {
    rmSync(resolve(projectDir, 'node_modules'), { recursive: true, force: true });
  }
  if (existsSync(resolve(projectDir, 'package-lock.json'))) {
    rmSync(resolve(projectDir, 'package-lock.json'), { force: true });
  }
  if (existsSync(resolve(projectDir, 'npm-shrinkwrap.json'))) {
    rmSync(resolve(projectDir, 'npm-shrinkwrap.json'), { force: true });
  }

  log('--- running npm install ---');
  const install = spawnSync(npmBinary, ['install', '--no-audit', '--no-fund'], {
    cwd: projectDir,
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
    env: {
      ...process.env,
      PATH: `${process.env.PATH ?? ''};C:\\Program Files\\nodejs`,
    },
  });

  log(`status=${install.status}`);
  if (install.stdout) log(`stdout:\n${install.stdout}`);
  if (install.stderr) log(`stderr:\n${install.stderr}`);
  if (install.error) log(`error:\n${install.error.message}`);

  return install.status === 0;
}

function inspectBin() {
  log('--- inspecting node_modules/.bin ---');
  const binPath = resolve(projectDir, 'node_modules', '.bin');
  if (!existsSync(binPath)) {
    log('.bin directory missing');
    return;
  }
  const files = readdirSync(binPath);
  log(`.bin entries (${files.length}): ${files.join(', ')}`);
}

function inspectPackages() {
  log('--- inspecting installed root packages ---');
  const names = ['vite', 'typescript', 'tsx', 'concurrently'];
  for (const name of names) {
    const pkgPath = resolve(projectDir, 'node_modules', name);
    log(`${name}: ${existsSync(pkgPath) ? 'present' : 'missing'}`);
  }
}

const success = runNpmInstall();
inspectBin();
inspectPackages();
process.exit(success ? 0 : 1);
