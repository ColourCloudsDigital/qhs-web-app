import pool from '../lib/db.js';

async function createPlanFeaturesTable() {
  try {
    console.log('Creating plan_features table...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS plan_features (
        id INT AUTO_INCREMENT PRIMARY KEY,
        planId INT NOT NULL,
        moduleId VARCHAR(36) NOT NULL,
        isIncluded BOOLEAN DEFAULT true,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (planId) REFERENCES subscription_plans(id) ON DELETE CASCADE,
        FOREIGN KEY (moduleId) REFERENCES modules(id) ON DELETE CASCADE
      )
    `;
    
    await pool.query(createTableQuery);
    console.log('plan_features table created successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error creating table:', err);
    process.exit(1);
  }
}

createPlanFeaturesTable(); 