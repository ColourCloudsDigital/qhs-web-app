#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Find files with @prisma/client imports
const findPrismaImports = () => {
  try {
    const grepCommand = `grep -l "from '@prisma/client'" --include="*.ts" --include="*.tsx" -r .`;
    const output = execSync(grepCommand, { encoding: 'utf8' });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding prisma imports:', error);
    return [];
  }
};

// Find files importing prisma client directly
const findPrismaClientImports = () => {
  try {
    const grepCommand = `grep -l "import prisma from '@/lib/prisma'" --include="*.ts" --include="*.tsx" -r .`;
    const output = execSync(grepCommand, { encoding: 'utf8' });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding prisma client imports:', error);
    return [];
  }
};

// Update UserRole imports
const updateUserRoleImports = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace UserRole imports
    const updatedContent = content.replace(
      /import\s+{\s*UserRole\s*}\s+from\s+['"]@prisma\/client['"]/g,
      `import { UserRole } from '@/lib/types/enums'`
    );
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Updated UserRole import in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
};

// Update multiple type imports
const updateMultipleImports = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find imports from @prisma/client
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"]@prisma\/client['"]/g;
    let match;
    let updated = false;
    
    while ((match = importRegex.exec(content)) !== null) {
      const imports = match[1].split(',').map(i => i.trim());
      
      // Filter imports that should be moved to enums
      const enumImports = imports.filter(imp => 
        ['UserRole', 'BookingStatus', 'PaymentStatus', 'PaymentMethod', 
         'NotificationType', 'NotificationStatus', 'TaskStatus', 'TaskPriority', 
         'TaskCategory', 'MaintenanceType', 'ModuleType', 'KeycardType'].includes(imp)
      );
      
      if (enumImports.length > 0) {
        // Add import from enums
        content = content.replace(
          match[0],
          `import { ${enumImports.join(', ')} } from '@/lib/types/enums'${
            imports.length > enumImports.length ? 
            `\nimport { ${imports.filter(i => !enumImports.includes(i)).join(', ')} } from '@prisma/client'` : 
            ''
          }`
        );
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated multiple imports in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating multiple imports in ${filePath}:`, error);
  }
};

// Replace prisma client imports
const updatePrismaClientImports = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace prisma client imports
    const updatedContent = content.replace(
      /import\s+prisma\s+from\s+['"]@\/lib\/prisma['"]/g,
      `import pool from '@/lib/db'`
    );
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Updated prisma client import in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating prisma client import in ${filePath}:`, error);
  }
};

// Main function
const main = async () => {
  console.log('Finding files with @prisma/client imports...');
  const prismaImportFiles = findPrismaImports();
  console.log(`Found ${prismaImportFiles.length} files with @prisma/client imports`);
  
  console.log('Finding files with prisma client imports...');
  const prismaClientImportFiles = findPrismaClientImports();
  console.log(`Found ${prismaClientImportFiles.length} files with prisma client imports`);
  
  console.log('Updating imports...');
  
  // Update UserRole imports
  prismaImportFiles.forEach(filePath => {
    updateUserRoleImports(filePath);
    updateMultipleImports(filePath);
  });
  
  // Update prisma client imports
  prismaClientImportFiles.forEach(filePath => {
    updatePrismaClientImports(filePath);
  });
  
  console.log('Done updating imports.');
};

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
}); 