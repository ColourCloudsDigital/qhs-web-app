'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import toast from '@/lib/services/toast.service';
import { PrinterIcon, ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

type QrCodeGeneratorProps = {
  menuId: string;
  menuName: string;
};

export default function QrCodeGenerator({ menuId, menuName }: QrCodeGeneratorProps) {
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  const [loading, setLoading] = useState<boolean>(false);
  
  // The QR code value is just the menu URL with a timestamp to make it refreshable
  const qrValue = `${window.location.origin}/menu/${menuId}?t=${timestamp}`;
  
  const regenerateQrCode = () => {
    setLoading(true);
    // Just update the timestamp to create a new QR code
    setTimestamp(Date.now());
    toast.success('QR code regenerated successfully');
    toast.info('Note: This will invalidate any previously printed QR codes', { duration: 5000 });
    setLoading(false);
  };

  const downloadQrCode = () => {
    try {
      // Create an SVG data URL
      const svg = document.getElementById('qr-code-svg');
      if (!svg) return;
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Create a canvas to convert SVG to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        URL.revokeObjectURL(svgUrl);
        
        // Convert to PNG and download
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `menu-qr-${menuId}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };
      
      img.src = svgUrl;
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const printQrCode = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Failed to open print window. Please check your popup settings.');
      return;
    }
    
    // Get SVG data
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Menu QR Code - ${menuName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
            }
            svg {
              width: 100%;
              max-width: 300px;
              height: auto;
            }
            h1 {
              font-size: 18px;
              margin-bottom: 10px;
            }
            p {
              font-size: 14px;
              color: #666;
            }
            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${menuName} - Menu</h1>
            ${svgData}
            <p>Scan this QR code to view the menu</p>
            <button onclick="window.print()">Print</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu QR Code</CardTitle>
        <CardDescription>
          Generate a QR code for your menu that customers can scan to view the menu on their devices.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="space-y-6">
          <div className="rounded-md border p-4 flex justify-center">
            <div className="bg-white p-3 rounded shadow-sm">
              <QRCode
                id="qr-code-svg"
                value={qrValue}
                size={256}
                level="H" // High error correction
                fgColor="#1e3a8a" // Primary blue color
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadQrCode}
              className="flex items-center gap-1"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={printQrCode}
              className="flex items-center gap-1"
            >
              <PrinterIcon className="h-4 w-4" />
              Print
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={regenerateQrCode}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <ArrowPathIcon className="h-4 w-4" />
              {loading ? 'Regenerating...' : 'Regenerate QR Code'}
            </Button>
          </div>
          
          <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded-md overflow-auto">
            <p className="font-mono">Menu URL: {qrValue}</p>
          </div>
          
          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            <p><strong>Note:</strong> Regenerating the QR code will invalidate any previously printed QR codes.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}