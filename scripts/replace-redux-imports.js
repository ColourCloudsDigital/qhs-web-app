const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript/TSX files that import from store
const files = execSync(
  `npx rg -l "from '@/store'" --type tsx --type ts`,
  { encoding: 'utf-8' }
).trim().split('\n').filter(f => f && !f.includes('node_modules'));

console.log(`Found ${files.length} files to update`);

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf-8');
    let modified = false;

    // Replace IRootState import
    if (content.includes("import { IRootState } from '@/store'")) {
      content = content.replace(
        /import { IRootState } from '@\/store';?\n?/g,
        ''
      );
      modified = true;
    }

    // Replace store/themeConfigSlice imports
    if (content.includes("from '@/store/themeConfigSlice'")) {
      content = content.replace(
        /import {[^}]+} from '@\/store\/themeConfigSlice';?\n?/g,
        ''
      );
      modified = true;
    }

    // Replace useSelector with useThemeConfig
    if (content.includes('useSelector')) {
      // Add import if not present
      if (!content.includes("from '@/contexts/ThemeConfigContext'")) {
        const importMatch = content.match(/^(import[^;]+;?\n)+/m);
        if (importMatch) {
          const lastImport = importMatch[0];
          content = content.replace(
            lastImport,
            lastImport + "import { useThemeConfig } from '@/contexts/ThemeConfigContext';\n"
          );
        }
      }

      // Replace useSelector patterns
      content = content.replace(
        /const isRtl = useSelector\(\(state: IRootState\) => state\.themeConfig\.rtlClass\) === 'rtl';?/g,
        "const { themeConfig } = useThemeConfig();\n    const isRtl = themeConfig.rtlClass === 'rtl';"
      );

      content = content.replace(
        /const themeConfig = useSelector\(\(state: IRootState\) => state\.themeConfig\);?/g,
        "const { themeConfig } = useThemeConfig();"
      );

      content = content.replace(
        /const semidark = useSelector\(\(state: IRootState\) => state\.themeConfig\.semidark\);?/g,
        "const { themeConfig } = useThemeConfig();\n    const semidark = themeConfig.semidark;"
      );

      modified = true;
    }

    // Replace useDispatch with useThemeConfig
    if (content.includes('useDispatch')) {
      content = content.replace(
        /const dispatch = useDispatch\(\);?/g,
        "const { toggleTheme, toggleMenu, toggleLayout, toggleRTL, toggleAnimation, toggleNavbar, toggleSemidark, toggleSidebar, resetToggleSidebar } = useThemeConfig();"
      );

      // Replace dispatch calls
      content = content.replace(/dispatch\(toggleTheme\(/g, 'toggleTheme(');
      content = content.replace(/dispatch\(toggleMenu\(/g, 'toggleMenu(');
      content = content.replace(/dispatch\(toggleLayout\(/g, 'toggleLayout(');
      content = content.replace(/dispatch\(toggleRTL\(/g, 'toggleRTL(');
      content = content.replace(/dispatch\(toggleAnimation\(/g, 'toggleAnimation(');
      content = content.replace(/dispatch\(toggleNavbar\(/g, 'toggleNavbar(');
      content = content.replace(/dispatch\(toggleSemidark\(/g, 'toggleSemidark(');
      content = content.replace(/dispatch\(toggleSidebar\(/g, 'toggleSidebar(');
      content = content.replace(/dispatch\(resetToggleSidebar\(/g, 'resetToggleSidebar(');

      modified = true;
    }

    // Remove redux imports
    content = content.replace(
      /import { useDispatch, useSelector } from 'react-redux';?\n?/g,
      ''
    );
    content = content.replace(
      /import { useSelector } from 'react-redux';?\n?/g,
      ''
    );
    content = content.replace(
      /import { useDispatch } from 'react-redux';?\n?/g,
      ''
    );

    if (modified) {
      fs.writeFileSync(file, content, 'utf-8');
      console.log(`✓ Updated: ${file}`);
    }
  } catch (error) {
    console.error(`✗ Error updating ${file}:`, error.message);
  }
});

console.log('\nDone!');
