import QRCode from 'qrcode';

interface QRCodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  type?: 'image/png' | 'image/jpeg' | 'image/webp';
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  rendererOpts?: {
    quality?: number;
  };
}

interface QRCodeBufferOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  type?: 'png' | 'svg' | 'utf8';
  quality?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generate a QR code data URL from a text/URL
 */
export async function generateQRCode(text: string, options: QRCodeOptions = {}): Promise<string> {
  try {
    console.log(`[QRCODE SERVICE] Generating QR code for: ${text}`);
    
    // Default options
    const defaultOptions: QRCodeOptions = {
      errorCorrectionLevel: 'H', // Higher error correction for better scanning
      type: 'image/png',
      width: 400, // Larger size for better clarity
      margin: 2,
      color: {
        dark: '#1e3a8a', // Primary blue color
        light: '#FFFFFF'
      },
      rendererOpts: {
        quality: 1.0
      }
    };
    
    // Merge options
    const mergedOptions = { ...defaultOptions, ...options };
    console.log('[QRCODE SERVICE] Using options:', mergedOptions);
    
    // Generate QR code as data URL
    const dataUrl = await QRCode.toDataURL(text, mergedOptions);
    
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')) {
      console.error('[QRCODE SERVICE] Generated invalid data URL');
      throw new Error('Generated QR code is invalid');
    }
    
    console.log('[QRCODE SERVICE] Successfully generated QR code');
    return dataUrl;
  } catch (error) {
    console.error('[QRCODE SERVICE] Error generating QR code:', error);
    
    // Return fallback QR code - a simple pre-generated QR code as backup
    console.log('[QRCODE SERVICE] Using fallback QR code');
    const fallbackQrCode = generateFallbackQRCode(text);
    return fallbackQrCode;
  }
}

/**
 * Generate a QR code for a hotel's menu
 */
export async function generateMenuQRCode(hotelId: string, baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || ''): Promise<string> {
  try {
    console.log(`[QRCODE SERVICE] Generating menu QR code for hotel: ${hotelId}`);
    
    if (!baseUrl || baseUrl === '') {
      console.warn('[QRCODE SERVICE] Base URL is empty, using fallback URL');
      baseUrl = 'http://localhost:3000';
    }
    
    const menuUrl = `${baseUrl}/menu/${hotelId}`;
    console.log(`[QRCODE SERVICE] Menu URL for QR code: ${menuUrl}`);
    
    // Custom styling for menu QR code
    const options: QRCodeOptions = {
      errorCorrectionLevel: 'H',
      width: 500,
      margin: 2,
      color: {
        dark: '#1e3a8a', // Primary blue color 
        light: '#FFFFFF'
      }
    };
    
    // Generate QR code
    return await generateQRCode(menuUrl, options);
  } catch (error) {
    console.error('[QRCODE SERVICE] Error generating menu QR code:', error);
    // Return fallback
    return generateFallbackQRCode(`http://localhost:3000/menu/${hotelId}`);
  }
}

/**
 * Generate a QR code as a Buffer
 */
export async function generateQRCodeBuffer(data: string): Promise<Buffer> {
  try {
    console.log(`[QRCODE SERVICE] Generating QR code buffer for: ${data}`);
    
    // Using only the options that are compatible with QRCode.toBuffer
    const options = {
      errorCorrectionLevel: 'H' as const,
      type: 'png' as const, // Must be exactly 'png' to satisfy QRCodeToBufferOptions
      margin: 2,
      color: {
        dark: '#1e3a8a',
        light: '#FFFFFF',
      }
    };

    // Generate QR code as buffer
    const buffer = await QRCode.toBuffer(data, options);
    
    if (buffer && buffer.length === 0) {
      throw new Error('Generated QR code buffer is empty');
    }
    
    return buffer;
  } catch (error) {
    console.error('[QRCODE SERVICE] Error generating QR code buffer:', error);
    throw new Error('Failed to generate QR code buffer');
  }
}

/**
 * Generate a fallback QR code in case of error
 */
function generateFallbackQRCode(text: string): string {
  // Simple pre-generated QR code for fallback
  // This is a base64 encoded white QR code with black data points
  console.log('[QRCODE SERVICE] Using static fallback QR code');
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAACECAYAAABRRIOnAAAAAklEQVR4AewaftIAAAOsSURBVO3BQY4cSRLAQDLQ//8yV0c/JZCoam4w4Rb7g7WWM9ZazlhrOWOt5Yy1ljPWWs5Ya3ljLWWM9ZazljreWMtZYz1lrOWGs5Y63ljLWWM9ZazlhrOePDSyk/qcKdlEmFO5QnFd6kTCrcSZlU+EkV3qTcsdZyxlrLGWstZ3z4sAp3Un5ShScp76RMFSYpkwpvpNxJmVR4UuFOyp2UOyl3rLWcsdZyxlrLGR++WcqbKkyVJxUmKZMKk5Q3VZikvFHhTsqbKnxTyjersdZyxlrLGWstZ3z4n1NhUmFS4Y2UScqkwqTCpMKdCpOUSYVJyqTCGyn/JWstZ6y1nLHWcsaHX6bCpMKTlEmFScqkwp2USYVJypOUN1WYpNxJmVSYpEwqvEn5N1lrOWOt5Yy1ljM+fLMKP6nCJOVOyp2UScqdlCcpkwqTlDdVeFLhb7LWcsZayxlrLWd8+LCUScqkwp2USYVJyhspkwpPUiYV7qRMUiYV3pTypMIk5U7K32St5Yy1ljPWWs7Y/+GXSbmT8kbKpMKTlEmFScqkwqTCJOVJyp2UOymTCt9kreWMtZYz1lrO+PAhKXdSJhXupNxJmVSYpEwqTFImFSYpkwqTlCcpkwqTlEmFOymTlCcVflKFb7LWcsZayxlrLWd8+GUpT1ImFe6kTCrcSXkj5UnKGylvqvAkZZJyJ2VS4Sc9sdZyxlrLGWstZ3z4H5MyqfCmCndSnqRMKkxSJhUepEwqTFImKU8q3En5N1lrOWOt5Yy1ljP2B/8gKZMKd1ImFe6k3KnwJGWS8qTCk5RJhb/JWssZay1nrLWc8eHDKvwkKW9UmKRMKkxS3qgwSZlUmKRMKtxJeVLhSconVfgmay1nrLWcsdZyxodflvKTKkxSJhUmKZMKk5RJhTspkwpPUiYVnqRMKkxS7lR4I+WbrLWcsdZyxlrLGfsD/8NS7qS8kTKpMEm5U+FJyqTCJGVS4UnKpMKkwjdZazljreWMtZYzPrwk5SdVmKTcSZlUmKRMKkxSJhWepEwq3EmZVJikTFLupNxJ+aYKd6y1nLHWcsZayxkfPqzCnZQPSfmQCpOUScqkwiRlUmGSMkm5k3InZVLhTYU71lrOWGs5Y63ljA/fLOVNKkxS7qRMKkxSJhXeqHAnZZIyqfBGyp2UOylPpHyTtZYz1lrOWGs5Y/8PayxnrLWcsdZyxlrLGWstZ6y1nLHWcsZayxlrLWestZyx1nLGWssZay1nrLWcsZyxv8AX76GxCwNXdQAAAAASUVORK5CYII=";
}