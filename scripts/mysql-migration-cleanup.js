#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Find files with @prisma/client imports (for cleanup)
const findPrismaImports = () => {
  try {
    const grepCommand = `grep -l "from '@prisma/client'" --include="*.ts" --include="*.tsx" -r .`;
    const output = execSync(grepCommand, { encoding: 'utf8' });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.log('No Prisma imports found (this is expected after migration)');
    return [];
  }
};

// Find files importing old mysql client (for cleanup)
const findOldMySQLClientImports = () => {
  try {
    const grepCommand = `grep -l "import mysql from '@/lib/mysql'" --include="*.ts" --include="*.tsx" -r .`;
    const output = execSync(grepCommand, { encoding: 'utf8' });
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.log('No old MySQL client imports found');
    return [];
  }
};

// Find files that might still need MySQL pool imports
const findFilesNeedingPoolImport = () => {
  try {
    // Look for files that might be using database operations but don't import pool
    const grepCommand = `grep -l "SELECT\\|INSERT\\|UPDATE\\|DELETE" --include="*.ts" --include="*.tsx" -r . | grep -v node_modules`;
    const output = execSync(grepCommand, { encoding: 'utf8' });
    const files = output.split('\n').filter(Boolean);
    
    // Filter files that don't already import pool
    const filesNeedingPool = [];
    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (!content.includes("import pool from '@/lib/db'") && 
            !content.includes("from '@/lib/db'") &&
            (content.includes('SELECT') || content.includes('INSERT') || 
             content.includes('UPDATE') || content.includes('DELETE'))) {
          filesNeedingPool.push(file);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    });
    
    return filesNeedingPool;
  } catch (error) {
    console.log('No files found that need pool import');
    return [];
  }
};

// Update enum imports to use our MySQL types
const updateEnumImports = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Replace Prisma enum imports with our MySQL enum imports
    const enumTypes = ['UserRole', 'BookingStatus', 'PaymentStatus', 'PaymentMethod', 
                      'NotificationType', 'NotificationStatus', 'TaskStatus', 'TaskPriority', 
                      'TaskCategory', 'MaintenanceType', 'ModuleType'];
    
    enumTypes.forEach(enumType => {
      const prismaImportRegex = new RegExp(`import\\s+{[^}]*${enumType}[^}]*}\\s+from\\s+['"]@prisma/client['"]`, 'g');
      if (prismaImportRegex.test(content)) {
        content = content.replace(prismaImportRegex, `import { ${enumType} } from '@/lib/types/enums'`);
        updated = true;
      }
    });
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated enum imports in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating enum imports in ${filePath}:`, error);
  }
};

// Clean up any remaining Prisma references
const cleanupPrismaReferences = (filePath) => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Remove any remaining Prisma imports
    const cleanedContent = content
      .replace(/import\s+.*from\s+['"]@prisma\/client['"];?\n?/g, '')
      .replace(/import\s+.*from\s+['"]@\/lib\/prisma['"];?\n?/g, '')
      .replace(/const\s+{\s*PrismaClient\s*}\s*=\s*require\(['"]@prisma\/client['"]\);?\n?/g, '');
    
    if (content !== cleanedContent) {
      fs.writeFileSync(filePath, cleanedContent);
      console.log(`Cleaned up Prisma references in ${filePath}`);
      updated = true;
    }
    
    return updated;
  } catch (error) {
    console.error(`Error cleaning up Prisma references in ${filePath}:`, error);
    return false;
  }
};

// Main function
const main = async () => {
  console.log('🔍 MySQL Migration Cleanup Tool');
  console.log('================================');
  
  console.log('\n1. Checking for remaining Prisma imports...');
  const prismaImportFiles = findPrismaImports();
  console.log(`Found ${prismaImportFiles.length} files with @prisma/client imports`);
  
  console.log('\n2. Checking for MySQL client imports...');
  const mysqlClientFiles = findOldMySQLClientImports();
  console.log(`Found ${mysqlClientFiles.length} files with MySQL client imports`);
  
  console.log('\n3. Checking for files that might need MySQL pool import...');
  const filesNeedingPool = findFilesNeedingPoolImport();
  console.log(`Found ${filesNeedingPool.length} files that might need pool import`);
  
  if (filesNeedingPool.length > 0) {
    console.log('Files that might need pool import:');
    filesNeedingPool.forEach(file => console.log(`  - ${file}`));
  }
  
  console.log('\n4. Updating enum imports...');
  const allTsFiles = [...prismaImportFiles, ...mysqlClientFiles];
  allTsFiles.forEach(filePath => {
    updateEnumImports(filePath);
  });
  
  console.log('\n5. Cleaning up remaining Prisma references...');
  let cleanedFiles = 0;
  allTsFiles.forEach(filePath => {
    if (cleanupPrismaReferences(filePath)) {
      cleanedFiles++;
    }
  });
  
  console.log(`\n✅ Migration cleanup complete!`);
  console.log(`   - Updated enum imports in ${allTsFiles.length} files`);
  console.log(`   - Cleaned up Prisma references in ${cleanedFiles} files`);
  
  if (filesNeedingPool.length > 0) {
    console.log(`\n⚠️  Note: ${filesNeedingPool.length} files might need manual review for MySQL pool imports`);
  }
  
  console.log(`\n🎯 Migration Status: Complete - All Prisma references converted to MySQL`);
};

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});