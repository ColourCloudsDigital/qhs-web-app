import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Deployment Debug Information ===\n');

console.log('Current working directory:', process.cwd());
console.log('Script location:', __dirname);
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);

console.log('\n=== File System Check ===');

const filesToCheck = [
  'package.json',
  'next.config.cjs',
  'tsconfig.json',
  'tailwind.config.js',
  'server.js',
  'app',
  'components',
  'lib',
  'styles'
];

filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    const stats = fs.statSync(filePath);
    const type = stats.isDirectory() ? 'directory' : 'file';
    console.log(`✓ ${file} (${type})`);
  } else {
    console.log(`✗ ${file} - MISSING!`);
  }
});

console.log('\n=== Directory Contents ===');
try {
  const files = fs.readdirSync(process.cwd());
  console.log('Root directory contents:');
  files.forEach(file => {
    const stats = fs.statSync(file);
    const type = stats.isDirectory() ? 'DIR' : 'FILE';
    console.log(`  ${type}: ${file}`);
  });
} catch (error) {
  console.error('Error reading directory:', error.message);
}

console.log('\n=== Environment Variables ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('PWD:', process.env.PWD);

console.log('\n=== Package.json Check ===');
try {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageContent = fs.readFileSync(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent);
  console.log('✓ package.json is valid JSON');
  console.log('Project name:', packageJson.name);
  console.log('Version:', packageJson.version);
  console.log('Type:', packageJson.type);
  console.log('Scripts available:', Object.keys(packageJson.scripts || {}));
} catch (error) {
  console.error('✗ Error reading package.json:', error.message);
}