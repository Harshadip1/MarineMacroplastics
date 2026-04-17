const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login endpoint...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@marineplastic.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Error:', error.response?.data || error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }
}

testLogin();
