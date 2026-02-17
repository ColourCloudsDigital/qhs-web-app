const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all .tsx and .ts files
const files = glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', '.next/**', 'scripts/**', 'store/**'],
  cwd: process.cwd()
});

let filesModified = 0;

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const originalContent = content;

  // Remove import { IRootState } from '@/store';
  if (content.includes("import { IRootState } from '@/store';")) {
    content = content.replace(/import\s+{\s*IRootState\s*}\s+from\s+['"]@\/store['"];?\s*\n?/g, '');
    modified = true;
  }

  // Remove import { useSelector } from 'react-redux';
  if (content.includes("import { useSelector } from 'react-redux';")) {
    content = content.replace(/import\s+{\s*useSelector\s*}\s+from\s+['"]react-redux['"];?\s*\n?/g, '');
    modified = true;
  }

  // Remove useSelector calls that reference IRootState
  // Pattern: const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl';
  const useSelectorRtlPattern = /const\s+isRtl\s*=\s*useSelector\(\(state:\s*IRootState\)\s*=>\s*state\.themeConfig\.rtlClass\)\s*===\s*['"]rtl['"];?\s*\n?/g;
  if (useSelectorRtlPattern.test(content)) {
    content = content.replace(useSelectorRtlPattern, '');
    modified = true;
  }

  // Pattern: const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);
  const useSelectorDarkPattern = /const\s+isDark\s*=\s*useSelector\(\(state:\s*IRootState\)\s*=>\s*state\.themeConfig\.theme\s*===\s*['"]dark['"]\s*\|\|\s*state\.themeConfig\.isDarkMode\);?\s*\n?/g;
  if (useSelectorDarkPattern.test(content)) {
    content = content.replace(useSelectorDarkPattern, '');
    modified = true;
  }

  // Pattern: const themeConfig = useSelector((state: IRootState) => state.themeConfig);
  const useSelectorThemeConfigPattern = /const\s+themeConfig\s*=\s*useSelector\(\(state:\s*IRootState\)\s*=>\s*state\.themeConfig\);?\s*\n?/g;
  if (useSelectorThemeConfigPattern.test(content)) {
    content = content.replace(useSelectorThemeConfigPattern, '');
    modified = true;
  }

  // Remove any remaining useSelector references with IRootState
  const anyUseSelectorPattern = /useSelector\(\(state:\s*IRootState\)\s*=>\s*[^)]+\)/g;
  if (anyUseSelectorPattern.test(content)) {
    content = content.replace(anyUseSelectorPattern, '');
    modified = true;
  }

  if (modified && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesModified++;
    console.log(`✓ Modified: ${file}`);
  }
});

console.log(`\n✅ Cleanup complete!`);
console.log(`   Files modified: ${filesModified}`);
