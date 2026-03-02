#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all API route files
function findApiRoutes() {
  try {
    const grepCommand = `dir /s /b app\\api\\*.ts`;
    const output = execSync(grepCommand, { encoding: 'utf8', shell: 'cmd.exe' });
    return output.split('\n').filter(file => file.trim() && file.includes('route.ts'));
  } catch (error) {
    console.error('Error finding API routes:', error.message);
    return [];
  }
}

// Add dynamic export to route file
function addDynamicExport(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already has dynamic export
    if (content.includes("export const dynamic = 'force-dynamic'") || 
        content.includes('export const dynamic = "force-dynamic"')) {
      console.log(`✓ Already configured: ${path.basename(filePath)}`);
      return false;
    }
    
    // Add dynamic export at the top after imports
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find the last import statement
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('import{')) {
        insertIndex = i + 1;
      }
      // Stop at first non-import, non-comment, non-empty line
      if (lines[i].trim() && 
          !lines[i].trim().startsWith('import') && 
          !lines[i].trim().startsWith('//') && 
          !lines[i].trim().startsWith('/*') &&
          !lines[i].trim().startsWith('*')) {
        break;
      }
    }
    
    // Insert the dynamic export
    lines.splice(insertIndex, 0, '', "export const dynamic = 'force-dynamic';", '');
    
    const newContent = lines.join('\n');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✓ Fixed: ${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`✗ Error processing ${path.basename(filePath)}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('🔧 Fixing Dynamic API Routes');
  console.log('============================\n');
  
  const apiRoutes = findApiRoutes();
  console.log(`Found ${apiRoutes.length} API route files\n`);
  
  let fixed = 0;
  let skipped = 0;
  
  apiRoutes.forEach(route => {
    if (addDynamicExport(route)) {
      fixed++;
    } else {
      skipped++;
    }
  });
  
  console.log('\n============================');
  console.log(`✅ Complete!`);
  console.log(`   - Fixed: ${fixed} files`);
  console.log(`   - Skipped: ${skipped} files (already configured)`);
  console.log(`   - Total: ${apiRoutes.length} files`);
}

main();
