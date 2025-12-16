'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { AlertTriangle } from 'lucide-react';

interface CameraStreamProps {
  url: string;
  cameraId: string;
  name: string;
}

export default function CameraStream({ url, cameraId, name }: CameraStreamProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Check if URL is empty
    if (!url) {
      setError('Stream URL is not available');
      setIsLoading(false);
      return;
    }

    // Determine what type of stream we're dealing with
    const isImage = url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png');
    const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg');
    const isHLS = url.includes('.m3u8');
    const isIframe = url.startsWith('http') && !isImage && !isVideo && !isHLS;

    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    // If it's an image with a timestamp param, refresh it periodically
    if (isImage) {
      const refreshInterval = setInterval(() => {
        if (imgRef.current) {
          imgRef.current.src = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
        }
      }, 1000); // Refresh every second

      return () => {
        clearInterval(refreshInterval);
        clearTimeout(timeout);
      };
    }

    // For other types, just stop the loading indicator after a timeout
    return () => {
      clearTimeout(timeout);
    };
  }, [url]);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-white bg-gray-900 p-6">
        <AlertTriangle className="h-10 w-10 text-yellow-500 mb-2" />
        <h3 className="text-xl font-medium mb-2">Cannot Display Stream</h3>
        <p className="text-gray-300 text-center">{error}</p>
      </div>
    );
  }

  // Determine the stream type and display appropriately
  if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png')) {
    // Handle image stream (Motion JPEG or snapshot)
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
        <img
          ref={imgRef}
          src={`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`}
          alt={`${name} stream`}
          className="w-full h-full object-contain"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError('Failed to load image stream');
            setIsLoading(false);
          }}
        />
      </div>
    );
  } else if (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg')) {
    // Handle direct video files
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
        <video
          ref={videoRef}
          src={url}
          autoPlay
          muted
          playsInline
          loop
          controls
          className="w-full h-full object-contain"
          onLoadedData={() => setIsLoading(false)}
          onError={() => {
            setError('Failed to load video stream');
            setIsLoading(false);
          }}
        ></video>
      </div>
    );
  } else if (url.includes('.m3u8')) {
    // Handle HLS streams - we need to use hls.js for most browsers
    // For simplicity, we'll use a video tag with src directly, but in a production app you'd implement HLS.js
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
        <video
          ref={videoRef}
          src={url}
          autoPlay
          muted
          playsInline
          controls
          className="w-full h-full object-contain"
          onLoadedData={() => setIsLoading(false)}
          onError={() => {
            setError('Failed to load HLS stream');
            setIsLoading(false);
          }}
        ></video>
      </div>
    );
  } else {
    // For other stream types or direct URLs, use an iframe
    // Note: This won't work for most RTSP streams without a proxy
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full border-0"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError('Failed to load stream');
            setIsLoading(false);
          }}
        ></iframe>
      </div>
    );
  }
}