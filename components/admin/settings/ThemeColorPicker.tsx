'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ThemeColorPicker({ color, onChange, className }: ThemeColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(color);
  const pickerRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(color);
  }, [color]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Validate if it's a valid color value
    if (/^#([0-9A-F]{3}){1,2}$/i.test(value) || /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.test(value)) {
      onChange(value);
    }
  };

  const handleColorClick = (selectedColor: string) => {
    onChange(selectedColor);
    setInputValue(selectedColor);
    setIsOpen(false);
  };

  const handleSwatchClick = () => {
    if (!isOpen) {
      setIsOpen(true);
    } else {
      colorInputRef.current?.click();
    }
  };

  const predefinedColors = [
    // Blue colors
    '#1e40af', '#3b82f6', '#93c5fd', '#dbeafe',
    // Red colors 
    '#dc2626', '#f87171', '#fca5a5', '#fee2e2',
    // Green colors
    '#16a34a', '#4ade80', '#86efac', '#dcfce7',
    // Yellow/Amber colors
    '#d97706', '#fbbf24', '#fcd34d', '#fef3c7',
    // Purple colors
    '#7e22ce', '#a855f7', '#d8b4fe', '#f3e8ff',
    // Gray colors
    '#111827', '#4b5563', '#9ca3af', '#f3f4f6',
  ];

  return (
    <div className={cn("relative", className)} ref={pickerRef}>
      <div className="flex">
        <div
          className="h-13 w-12 cursor-pointer rounded-l-md border border-r-0 border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800"
          style={{ backgroundColor: color }}
          onClick={handleSwatchClick}
        />
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          className="rounded-l-none"
        />
        <input
          ref={colorInputRef}
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only" // Hidden visually but still functional
        />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-4 gap-2">
            {predefinedColors.map((predefinedColor) => (
              <button
                key={predefinedColor}
                type="button"
                className={cn(
                  "h-6 w-6 rounded-md border",
                  color === predefinedColor ? "ring-2 ring-offset-2" : "border-gray-300 dark:border-gray-600"
                )}
                style={{ backgroundColor: predefinedColor }}
                onClick={() => handleColorClick(predefinedColor)}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Click to choose a color
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => colorInputRef.current?.click()}
              className="h-6 text-xs"
            >
              Custom
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}