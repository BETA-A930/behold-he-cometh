import { existsSync, readFileSync } from 'fs';
const path = new URL('../install-output.txt', import.meta.url);
if (!existsSync(path)) {
  console.log('NO_LOG');
  process.exit(0);
}
const buf = readFileSync(path);
console.log('length', buf.length);
console.log('firstBytes', buf.slice(0, 18).toString('hex'));
const utf8 = buf.toString('utf8');
const utf16 = buf.toString('utf16le');
console.log('==UTF8==');
console.log(utf8.slice(0, 4000));
console.log('==UTF16==');
console.log(utf16.slice(0, 4000));
