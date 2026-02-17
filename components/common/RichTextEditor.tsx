'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Loader2 } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  minHeight?: number;
  disabled?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  height = 500,
  minHeight = 300,
  disabled = false,
}: RichTextEditorProps) {
  const editorRef = useRef<any>(null);
  const [isEditorLoaded, setIsEditorLoaded] = useState(false);

  // This effect sets up a cleanup function
  useEffect(() => {
    return () => {
      // Clean up the editor when the component unmounts
      if (editorRef.current) {
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative">
      {!isEditorLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      <Editor
        apiKey="t7tdk27us35qbe43isy9xdgx7ujezpllk7k3z209vthj8a7m"
        onInit={(evt: any, editor: any) => {
          editorRef.current = editor;
          setIsEditorLoaded(true);
        }}
        initialValue={value}
        value={value}
        onEditorChange={(newValue: any) => onChange(newValue)}
        init={{
          height,
          min_height: minHeight,
          menubar: true,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 16px; }',
          placeholder: placeholder,
          branding: false,
          promotion: false,
          resize: true,
          statusbar: true,
          readonly: disabled,
          skin: document.documentElement.classList.contains('dark') ? 'oxide-dark' : 'oxide',
          content_css: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
        }}
      />
    </div>
  );
}