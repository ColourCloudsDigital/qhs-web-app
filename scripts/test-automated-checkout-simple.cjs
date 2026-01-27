#!/usr/bin/env node

/**
 * Simple Test Script for Automated Checkout System
 * 
 * This script tests the automated checkout API endpoints directly
 * without importing internal modules.
 * 
 * Usage: node scripts/test-automated-checkout-simple.js
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
require('dotenv').config();

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

// Simple fetch implementation using Node.js built-in modules
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testAutomatedCheckoutAPI() {
  console.log('🚀 Testing Automated Checkout API Endpoints\n');
  
  try {
    // Test 1: Get expired bookings stats
    console.log('1. Testing GET /api/bookings/automated-checkout...');
    const statsResponse = await makeRequest(`${API_URL}/api/bookings/automated-checkout`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    if (statsResponse.ok) {
      console.log('   ✅ Stats endpoint working');
      console.log(`   📊 Found ${statsResponse.data.stats.expiredCount} expired bookings`);
      console.log(`   🏠 Room units to free: ${statsResponse.data.stats.roomUnitsToFree}`);
      
      if (statsResponse.data.stats.expiredCount > 0) {
        console.log('   📋 Expired bookings:');
        statsResponse.data.stats.expiredBookings.forEach((booking, index) => {
          console.log(`      ${index + 1}. ${booking.firstName} ${booking.lastName} - ${booking.hotelName} (${booking.checkOutDate})`);
        });
      }
    } else {
      console.log(`   ❌ Stats endpoint failed: ${statsResponse.status}`);
      console.log(`   Error: ${JSON.stringify(statsResponse.data)}`);
    }

    // Test 2: Process expired bookings (only if there are any)
    if (statsResponse.ok && statsResponse.data.stats.expiredCount > 0) {
      console.log('\n2. Testing POST /api/bookings/automated-checkout...');
      
      const processResponse = await makeRequest(`${API_URL}/api/bookings/automated-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CRON_SECRET}`,
          'Content-Type': 'application/json',
        },
      });

      if (processResponse.ok) {
        console.log('   ✅ Processing endpoint working');
        console.log(`   📝 Processed bookings: ${processResponse.data.result.processedBookings}`);
        console.log(`   🔓 Freed room units: ${processResponse.data.result.freedRoomUnits}`);
        console.log(`   ⚠️  Errors: ${processResponse.data.result.errors.length}`);
        
        if (processResponse.data.result.errors.length > 0) {
          console.log('   Error details:');
          processResponse.data.result.errors.forEach((error, index) => {
            console.log(`      ${index + 1}. ${error}`);
          });
        }
      } else {
        console.log(`   ❌ Processing endpoint failed: ${processResponse.status}`);
        console.log(`   Error: ${JSON.stringify(processResponse.data)}`);
      }
    } else {
      console.log('\n2. Skipping processing test (no expired bookings found)');
    }

    // Test 3: Check stats again to verify processing
    if (statsResponse.ok && statsResponse.data.stats.expiredCount > 0) {
      console.log('\n3. Checking stats after processing...');
      const finalStatsResponse = await makeRequest(`${API_URL}/api/bookings/automated-checkout`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CRON_SECRET}`,
          'Content-Type': 'application/json',
        },
      });

      if (finalStatsResponse.ok) {
        console.log(`   📊 Expired bookings remaining: ${finalStatsResponse.data.stats.expiredCount}`);
        console.log(`   🏠 Room units still to free: ${finalStatsResponse.data.stats.roomUnitsToFree}`);
      }
    }

    console.log('\n🎉 API tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Test authentication
async function testAuthentication() {
  console.log('🔐 Testing API Authentication\n');
  
  try {
    // Test without auth header
    console.log('1. Testing without authentication...');
    const noAuthResponse = await makeRequest(`${API_URL}/api/bookings/automated-checkout`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (noAuthResponse.status === 401) {
      console.log('   ✅ Correctly rejected unauthorized request');
    } else {
      console.log(`   ⚠️  Unexpected response: ${noAuthResponse.status}`);
    }

    // Test with wrong auth header
    console.log('2. Testing with wrong authentication...');
    const wrongAuthResponse = await makeRequest(`${API_URL}/api/bookings/automated-checkout`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer wrong-secret',
        'Content-Type': 'application/json',
      },
    });
    
    if (wrongAuthResponse.status === 401) {
      console.log('   ✅ Correctly rejected wrong credentials');
    } else {
      console.log(`   ⚠️  Unexpected response: ${wrongAuthResponse.status}`);
    }

    // Test with correct auth header
    console.log('3. Testing with correct authentication...');
    const correctAuthResponse = await makeRequest(`${API_URL}/api/bookings/automated-checkout`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (correctAuthResponse.ok) {
      console.log('   ✅ Correctly accepted valid credentials');
    } else {
      console.log(`   ❌ Failed with valid credentials: ${correctAuthResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Automated Checkout System - API Tests\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`CRON_SECRET: ${CRON_SECRET.substring(0, 8)}...`);
  console.log('=' * 50);
  
  await testAuthentication();
  console.log('\n' + '=' * 50);
  await testAutomatedCheckoutAPI();
}

// Run the tests
runTests();