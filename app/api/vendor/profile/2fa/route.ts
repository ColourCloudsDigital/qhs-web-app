import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/lib/types/enums';
import pool from '@/lib/db';
import crypto from 'crypto';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';


// Base32 encoding/decoding for TOTP
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  
  return output;
}

function base32Decode(input: string): Buffer {
  input = input.toUpperCase().replace(/=+$/, '');
  let bits = 0;
  let value = 0;
  let index = 0;
  const output: number[] = [];
  
  for (let i = 0; i < input.length; i++) {
    value = (value << 5) | BASE32_ALPHABET.indexOf(input[i]);
    bits += 5;
    
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  
  return Buffer.from(output);
}

// Simple TOTP implementation (RFC 6238)
function generateTOTP(secret: string, timeStep: number = 30): string {
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeUInt32BE(time, 4);
  
  const secretBuffer = base32Decode(secret);
  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(timeBuffer);
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0xf;
  const code = ((hash[offset] & 0x7f) << 24) |
               ((hash[offset + 1] & 0xff) << 16) |
               ((hash[offset + 2] & 0xff) << 8) |
               (hash[offset + 3] & 0xff);
  
  return (code % 1000000).toString().padStart(6, '0');
}

function verifyTOTP(secret: string, token: string, window: number = 1): boolean {
  for (let i = -window; i <= window; i++) {
    const timeStep = Math.floor(Date.now() / 1000 / 30) + i;
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(timeStep, 4);
    
    const secretBuffer = base32Decode(secret);
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(timeBuffer);
    const hash = hmac.digest();
    
    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24) |
                 ((hash[offset + 1] & 0xff) << 16) |
                 ((hash[offset + 2] & 0xff) << 8) |
                 (hash[offset + 3] & 0xff);
    
    const totp = (code % 1000000).toString().padStart(6, '0');
    if (totp === token) {
      return true;
    }
  }
  return false;
}

function generateSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

// GET 2FA status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== UserRole.VENDOR) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const userId = session.user.id;
    
    // Check if user_two_factor table exists, if not return default
    const [rows] = await pool.query(`
      SELECT twoFactorEnabled, twoFactorSecret, backupCodes
      FROM user_two_factor
      WHERE userId = ?
    `, [userId]) as [any[], any];
    
    if (rows.length === 0) {
      return NextResponse.json({
        enabled: false,
        secret: null,
        qrCode: null,
        backupCodes: []
      });
    }
    
    const twoFactor = rows[0];
    
    return NextResponse.json({
      enabled: Boolean(twoFactor.twoFactorEnabled),
      secret: twoFactor.twoFactorSecret || null,
      qrCode: null, // Don't return QR code in GET, only during setup
      backupCodes: twoFactor.backupCodes ? JSON.parse(twoFactor.backupCodes) : []
    });
  } catch (error: any) {
    // If table doesn't exist, return default
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({
        enabled: false,
        secret: null,
        qrCode: null,
        backupCodes: []
      });
    }
    
    console.error('Error fetching 2FA status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch 2FA status' },
      { status: 500 }
    );
  }
}

// POST - Setup/Enable 2FA
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== UserRole.VENDOR) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const userId = session.user.id;
    const body = await req.json();
    const { action, token, password } = body;
    
    // Ensure user_two_factor table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_two_factor (
        id VARCHAR(36) PRIMARY KEY,
        userId VARCHAR(36) UNIQUE NOT NULL,
        twoFactorEnabled TINYINT(1) DEFAULT 0,
        twoFactorSecret VARCHAR(255),
        backupCodes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    if (action === 'setup') {
      // Generate new secret and QR code
      const secret = generateSecret();
      const serviceName = 'Qaras Hospitality Solutions';
      const accountName = session.user.email || session.user.name || 'User';
      const otpAuthUrl = `otpauth://totp/${encodeURIComponent(serviceName)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(serviceName)}`;
      
      // Generate QR code
      const qrCode = await QRCode.toDataURL(otpAuthUrl);
      
      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        crypto.randomBytes(4).toString('hex').toUpperCase()
      );
      
      // Store secret temporarily (not enabled yet)
      const [existing] = await pool.query(`
        SELECT id FROM user_two_factor WHERE userId = ?
      `, [userId]) as [any[], any];
      
      if (existing.length > 0) {
        await pool.query(`
          UPDATE user_two_factor
          SET twoFactorSecret = ?, backupCodes = ?, twoFactorEnabled = 0
          WHERE userId = ?
        `, [secret, JSON.stringify(backupCodes), userId]);
      } else {
        const id = crypto.randomUUID();
        await pool.query(`
          INSERT INTO user_two_factor (id, userId, twoFactorSecret, backupCodes, twoFactorEnabled)
          VALUES (?, ?, ?, ?, 0)
        `, [id, userId, secret, JSON.stringify(backupCodes)]);
      }
      
      return NextResponse.json({
        secret,
        qrCode,
        backupCodes,
        message: '2FA setup initiated. Please verify with a code to enable.'
      });
    }
    
    if (action === 'verify') {
      // Verify token and enable 2FA
      const [twoFactorRow] = await pool.query(`
        SELECT twoFactorSecret FROM user_two_factor WHERE userId = ?
      `, [userId]) as [any[], any];
      
      if (twoFactorRow.length === 0 || !twoFactorRow[0].twoFactorSecret) {
        return NextResponse.json(
          { error: '2FA setup not initiated. Please start setup first.' },
          { status: 400 }
        );
      }
      
      const secret = twoFactorRow[0].twoFactorSecret;
      
      if (!verifyTOTP(secret, token)) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        );
      }
      
      // Enable 2FA
      await pool.query(`
        UPDATE user_two_factor
        SET twoFactorEnabled = 1
        WHERE userId = ?
      `, [userId]);
      
      return NextResponse.json({
        message: '2FA enabled successfully',
        enabled: true
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}

// PUT - Disable 2FA
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== UserRole.VENDOR) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const userId = session.user.id;
    const body = await req.json();
    const { action, token, password } = body;
    
    if (action === 'disable') {
      // Verify token before disabling
      const [twoFactorRow] = await pool.query(`
        SELECT twoFactorSecret, twoFactorEnabled FROM user_two_factor WHERE userId = ?
      `, [userId]) as [any[], any];
      
      if (twoFactorRow.length === 0 || !twoFactorRow[0].twoFactorEnabled) {
        return NextResponse.json(
          { error: '2FA is not enabled' },
          { status: 400 }
        );
      }
      
      // Verify token or backup code
      const secret = twoFactorRow[0].twoFactorSecret;
      const [backupCodesRow] = await pool.query(`
        SELECT backupCodes FROM user_two_factor WHERE userId = ?
      `, [userId]) as [any[], any];
      
      const backupCodes = backupCodesRow[0]?.backupCodes 
        ? JSON.parse(backupCodesRow[0].backupCodes) 
        : [];
      
      const isValidToken = verifyTOTP(secret, token) || backupCodes.includes(token);
      
      if (!isValidToken) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        );
      }
      
      // Remove used backup code if it was a backup code
      if (backupCodes.includes(token)) {
        const updatedBackupCodes = backupCodes.filter((code: string) => code !== token);
        await pool.query(`
          UPDATE user_two_factor
          SET twoFactorEnabled = 0, backupCodes = ?
          WHERE userId = ?
        `, [JSON.stringify(updatedBackupCodes), userId]);
      } else {
        await pool.query(`
          UPDATE user_two_factor
          SET twoFactorEnabled = 0
          WHERE userId = ?
        `, [userId]);
      }
      
      return NextResponse.json({
        message: '2FA disabled successfully',
        enabled: false
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}

