#!/usr/bin/env node

/**
 * Automated Checkout Cron Job
 * 
 * This script can be run as a cron job to automatically process expired bookings
 * and free up room units.
 * 
 * Usage:
//  * - Add to crontab: 0 *\/2 * * * node /path/to/scripts/automated-checkout-cron.js
//  * - Run manually: node scripts/automated-checkout-cron.js
//  * 
//  * Environment Variables Required:
//  * - NEXT_PUBLIC_API_URL or API_URL: The base URL of your application
//  * - CRON_SECRET: Secret key for authenticating cron requests
//  */

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

async function runAutomatedCheckout() {
  try {
    console.log(`[${new Date().toISOString()}] Starting automated checkout process...`);
    
    // First, get stats about expired bookings
    const statsResponse = await makeRequest(`${API_URL}/api/bookings/automated-checkout`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    if (!statsResponse.ok) {
      throw new Error(`Failed to get stats: ${statsResponse.status}`);
    }

    console.log(`Found ${statsResponse.data.stats.expiredCount} expired bookings affecting ${statsResponse.data.stats.roomUnitsToFree} room units`);

    if (statsResponse.data.stats.expiredCount === 0) {
      console.log('No expired bookings to process. Exiting.');
      return;
    }

    // Process the expired bookings
    const checkoutResponse = await makeRequest(`${API_URL}/api/bookings/automated-checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    if (!checkoutResponse.ok) {
      throw new Error(`Failed to process checkout: ${checkoutResponse.status}`);
    }

    console.log(`[${new Date().toISOString()}] Automated checkout completed:`);
    console.log(`- Processed bookings: ${checkoutResponse.data.result.processedBookings}`);
    console.log(`- Freed room units: ${checkoutResponse.data.result.freedRoomUnits}`);
    
    if (checkoutResponse.data.result.errors.length > 0) {
      console.log(`- Errors encountered: ${checkoutResponse.data.result.errors.length}`);
      checkoutResponse.data.result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // Log success to a file (optional)
    if (process.env.LOG_FILE) {
      const fs = require('fs');
      const logEntry = `${new Date().toISOString()} - Processed: ${checkoutResponse.data.result.processedBookings}, Freed: ${checkoutResponse.data.result.freedRoomUnits}, Errors: ${checkoutResponse.data.result.errors.length}\n`;
      fs.appendFileSync(process.env.LOG_FILE, logEntry);
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in automated checkout:`, error.message);
    
    // Log error to a file (optional)
    if (process.env.ERROR_LOG_FILE) {
      const fs = require('fs');
      const errorEntry = `${new Date().toISOString()} - ERROR: ${error.message}\n`;
      fs.appendFileSync(process.env.ERROR_LOG_FILE, errorEntry);
    }
    
    process.exit(1);
  }
}

// Run the automated checkout
runAutomatedCheckout();