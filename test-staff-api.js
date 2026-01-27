// Simple test to verify staff management API
const testStaffAPI = async () => {
  try {
    console.log('Testing staff management API...');
    
    // This would need proper authentication in a real test
    const response = await fetch('http://localhost:3000/api/staff/staff-management', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // In a real test, you'd need proper session cookies
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Staff API Response:', data);
    } else {
      console.log('API Response Status:', response.status);
      const errorData = await response.text();
      console.log('Error:', errorData);
    }
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Note: This test requires proper authentication to work
console.log('Staff management API test file created. Run with proper authentication to test.');