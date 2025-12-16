import pool from '../lib/db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'password'; // Match the seed script

async function checkAndFixPasswords() {
  console.log('Starting password hash checker...');
  
  try {
    // 1. Get all users
    const [users] = await pool.query('SELECT id, email, password FROM users');
    console.log(`Found ${users.length} users in the database`);
    
    // Check each user's password
    for (const user of users) {
      console.log(`\nChecking user: ${user.email}`);
      
      // Check if password appears to be a bcrypt hash
      const isBcryptHash = user.password && user.password.startsWith('$2');
      console.log(`Password appears to be bcrypt hash: ${isBcryptHash}`);
      
      if (!isBcryptHash) {
        console.log(`Password for ${user.email} does not appear to be a valid bcrypt hash`);
        
        // Hash the default password
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
        console.log(`Generated new hash: ${hashedPassword.substring(0, 10)}...`);
        
        // Update the user's password
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
        console.log(`Updated password for ${user.email}`);
      } else {
        // Check if current password is 'password'
        try {
          const passwordMatch = await bcrypt.compare(DEFAULT_PASSWORD, user.password);
          console.log(`Current password matches default password: ${passwordMatch}`);
          
          if (!passwordMatch) {
            console.log(`Resetting password for ${user.email} to the default`);
            
            // Hash the default password
            const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
            console.log(`Generated new hash: ${hashedPassword.substring(0, 10)}...`);
            
            // Update the user's password
            await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
            console.log(`Updated password for ${user.email}`);
          }
        } catch (error) {
          console.error(`Error comparing password for ${user.email}:`, error);
          
          console.log(`Force resetting password for ${user.email} to the default`);
          
          // Hash the default password
          const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
          console.log(`Generated new hash: ${hashedPassword.substring(0, 10)}...`);
          
          // Update the user's password
          await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
          console.log(`Updated password for ${user.email}`);
        }
      }
    }
    
    console.log('\nPassword check and fix completed successfully');
  } catch (error) {
    console.error('Error checking passwords:', error);
  } finally {
    // Close the database connection
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the function
checkAndFixPasswords(); 