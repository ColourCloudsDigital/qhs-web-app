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

  // Check if file uses isRtl, isDark, or themeConfig but doesn't declare them
  const usesIsRtl = content.includes('isRtl') && !content.match(/const\s+isRtl\s*=/);
  const usesIsDark = content.includes('isDark') && !content.match(/const\s+isDark\s*=/);
  const usesThemeConfig = content.includes('themeConfig') && !content.match(/const\s+themeConfig\s*=/);

  if (usesIsRtl || usesIsDark || usesThemeConfig) {
    // Find the component function declaration
    const componentMatch = content.match(/(const\s+\w+\s*=\s*\(\)\s*=>\s*{)/);
    
    if (componentMatch) {
      const insertPosition = componentMatch.index + componentMatch[0].length;
      let declarations = '\n';
      
      if (usesThemeConfig) {
        declarations += '    const themeConfig = { rtlClass: \'ltr\' }; // RTL support removed\n';
      }
      if (usesIsRtl) {
        declarations += '    const isRtl = false; // RTL support removed\n';
      }
      if (usesIsDark) {
        declarations += '    const isDark = false; // Dark mode detection removed\n';
      }
      
      content = content.slice(0, insertPosition) + declarations + content.slice(insertPosition);
      modified = true;
    }
  }

  if (modified && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesModified++;
    console.log(`✓ Fixed: ${file}`);
  }
});

console.log(`\n✅ Fix complete!`);
console.log(`   Files modified: ${filesModified}`);
