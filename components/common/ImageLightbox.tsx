'use client';

import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

interface ImageLightboxProps {
  images: string[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  startIndex?: number;
  title?: string;
}

export default function ImageLightbox({ 
  images, 
  isOpen, 
  setIsOpen, 
  startIndex = 0,
  title = ''
}: ImageLightboxProps) {
  // Transform images into the format expected by the lightbox
  const slides = images.map((image, index) => ({
    src: image,
    title: title ? `${title} - Image ${index + 1}` : `Image ${index + 1}`,
  }));

  return (
    <Lightbox
      styles={{ container: { backgroundColor: 'rgba(0, 0, 0, 0.9)' } }}
      open={isOpen}
      close={() => setIsOpen(false)}
      slides={slides}
      index={startIndex}
      plugins={[Captions, Zoom, Thumbnails]}
      captions={{ showToggle: true }}
      zoom={{ maxZoomPixelRatio: 3 }}
      thumbnails={{ position: 'bottom' }}
    />
  );
}