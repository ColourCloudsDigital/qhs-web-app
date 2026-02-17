import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentsDir = path.join(__dirname, '..', 'components', 'ui');
const requiredComponents = [
  'input.tsx',
  'button.tsx',
  'checkbox.tsx',
  'label.tsx',
  'textarea.tsx',
  'select.tsx',
  'card.tsx',
];

console.log('Verifying UI components...\n');
console.log(`Components directory: ${componentsDir}\n`);

let allExist = true;

requiredComponents.forEach(component => {
  const componentPath = path.join(componentsDir, component);
  const exists = fs.existsSync(componentPath);
  
  if (exists) {
    const stats = fs.statSync(componentPath);
    console.log(`✓ ${component} (${stats.size} bytes)`);
  } else {
    console.log(`✗ ${component} - MISSING!`);
    allExist = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allExist) {
  console.log('✓ All required components exist!');
  process.exit(0);
} else {
  console.log('✗ Some components are missing!');
  process.exit(1);
}
