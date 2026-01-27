// Simple test to verify customer search API
const testCustomerSearch = async () => {
  try {
    console.log('Testing customer search API...');
    
    // Test with a search term that should match existing customers
    const response = await fetch('http://localhost:3001/api/staff/customers?search=Fortune&limit=10', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // In a real test, you'd need proper session cookies
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Customer Search API Response:', JSON.stringify(data, null, 2));
      console.log('Number of customers found:', data.customers?.length || 0);
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
console.log('Customer search API test file created. Run with proper authentication to test.');