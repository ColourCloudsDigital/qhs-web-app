'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, Share2, QrCode, Printer, AlertTriangle, RefreshCw } from 'lucide-react';
import { MenuSettings } from '@/lib/services/menu.service';
import confetti from 'canvas-confetti';
import QRCode from 'react-qr-code';

interface MenuQRCodeViewProps {
  hotelId: string;
  settings: MenuSettings | null;
}

export default function MenuQRCodeView({ hotelId, settings }: MenuQRCodeViewProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<{ qrCodeDataUrl: string; menuUrl: string } | null>(null);
  const [qrSize, setQrSize] = useState<string>('medium'); // small, medium, large
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
  const { toast } = useToast();
  const qrCodeRef = useRef<HTMLDivElement>(null);
  
  // Generate the menu URL directly
  const menuUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${hotelId}`;
  
  // Use direct QR code generation instead of API calls
  useEffect(() => {
    // Set the QR code data directly without API call
    setQrCodeData({
      qrCodeDataUrl: '', // We'll render the QR code directly
      menuUrl: menuUrl
    });
    setLoading(false);
  }, [hotelId, menuUrl]);

  const downloadQRCode = () => {
    if (!qrCodeRef.current) return;
    
    try {
      // Get SVG
      const svg = document.getElementById('qr-code-svg');
      if (!svg) return;
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      // Create canvas for conversion
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
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `menu-qrcode-${hotelId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setIsDownloaded(true);
        toast({
          title: 'QR Code downloaded',
          description: 'QR code has been downloaded successfully',
        });
      };
      
      img.src = svgUrl;
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download QR code'
      });
    }
  };

  const printQRCode = () => {
    if (!qrCodeRef.current) return;
    
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      toast({
        title: 'Printing failed',
        description: 'Unable to open print window. Please check your browser settings.'
      });
      return;
    }
    
    const hotelName = settings?.hotelId || 'Restaurant';
    
    // Get SVG data for printing
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Menu QR Code - ${hotelName}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
              padding: 2rem;
            }
            svg {
              max-width: 300px;
              height: auto;
              margin: 0 auto;
              display: block;
            }
            .qr-container {
              margin: 2rem auto;
              max-width: 300px;
            }
            .instructions {
              margin-top: 1rem;
              color: #555;
              font-size: 0.9rem;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>Menu QR Code</h1>
          <p>Scan to view our menu</p>
          <div class="qr-container">
            ${svgData}
          </div>
          <p class="instructions">Place this QR code on your table, at your entrance, or include it in printed materials.</p>
          <p class="no-print">
            <button onclick="window.print()">Print</button>
            <button onclick="window.close()">Close</button>
          </p>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
  };

  const shareQRCode = async () => {
    if (!menuUrl || !navigator.share) return;
    
    try {
      await navigator.share({
        title: 'Menu QR Code',
        text: 'Scan this QR code to view our menu',
        url: menuUrl,
      });
      
      toast({
        title: 'Shared successfully',
        description: 'QR code link has been shared',
      });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({
          title: 'Sharing failed',
          description: error.message || 'Unable to share QR code'
        });
      }
    }
  };

  const getQRSize = () => {
    switch (qrSize) {
      case 'small': return 'w-32 h-32';
      case 'large': return 'w-80 h-80';
      default: return 'w-56 h-56';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Generating QR code...</span>
      </div>
    );
  }

  if (error && !qrCodeData) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-12">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to generate QR code</h3>
        <p className="text-sm text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col items-center">
          <div 
            ref={qrCodeRef} 
            className={`relative bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center justify-center transition-all duration-300 ${getQRSize()}`}
          >
            <QRCode
              id="qr-code-svg"
              value={menuUrl}
              size={256}
              level="H" // High error correction
              fgColor="#1e3a8a" // Primary blue color
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>
          <Select
            value={qrSize}
            onValueChange={setQrSize}
            className="mt-4 w-full max-w-[200px]"
          >
            <SelectTrigger>
              <SelectValue placeholder="QR Code Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 space-y-4">
          <h3 className="text-lg font-medium">Menu QR Code</h3>
          <p className="text-sm text-gray-600">
            This QR code directs your customers to your digital menu. Place it on tables, at your entrance, or include it in your printed materials.
          </p>
          
          <Alert>
            <QrCode className="h-4 w-4 mr-2" />
            <AlertDescription>
              <span className="font-medium">Menu URL:</span>{' '}
              <a
                href={menuUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4"
              >
                {menuUrl}
              </a>
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={downloadQRCode} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button onClick={printQRCode} variant="outline" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button onClick={shareQRCode} variant="outline" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <Card className="p-4 bg-gray-50 border-gray-100">
        <h3 className="font-medium mb-2">Tips for using your QR Menu:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
          <li>Print and place the QR code on tables for easy customer access</li>
          <li>Include the QR code on posters or table tents at your establishment</li>
          <li>Add the QR code to your printed menus as a digital alternative</li>
          <li>Share the QR code on social media to reach more customers</li>
        </ul>
      </Card>
    </div>
  );
} 