// Test script to check password hash
import bcrypt from 'bcrypt';

async function checkPassword() {
  const storedHash = '$2b$10$rvQQmuz7QUFt/haqoSdRdeSGTAIVK9bsw8QQJqUcYUQQ3YCKnJv0a';
  const testPassword = 'passwords'; // The password you're trying
  
  try {
    const isMatch = await bcrypt.compare(testPassword, storedHash);
    console.log(`Password 'passwords' matches stored hash: ${isMatch}`);
    
    // Try a different password as well
    const isMatchWrong = await bcrypt.compare('password', storedHash);
    console.log(`Password 'password' matches stored hash: ${isMatchWrong}`);
  } catch (err) {
    console.error('Error comparing passwords:', err);
  }
}

checkPassword(); 