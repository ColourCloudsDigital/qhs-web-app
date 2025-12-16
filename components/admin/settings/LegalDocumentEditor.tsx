'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormSection, FormField, FormGroup, FormActions } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import dynamic from 'next/dynamic';

// Import the editor dynamically to avoid SSR issues
const RichTextEditor = dynamic(() => import('@/components/common/RichTextEditor'), { 
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded bg-gray-100 dark:bg-gray-800"></div>
});

interface LegalDocument {
  id?: string;
  type: string;
  title: string;
  slug: string;
  content: string;
  version: string;
  isPublished: boolean;
  effectiveDate: string;
  createdAt?: string;
  updatedAt?: string;
}

interface LegalDocumentEditorProps {
  document: LegalDocument | null;
  onSave: (document: LegalDocument) => void;
  onCancel: () => void;
}

export function LegalDocumentEditor({ document, onSave, onCancel }: LegalDocumentEditorProps) {
  const [formData, setFormData] = useState<LegalDocument>({
    type: 'PRIVACY_POLICY',
    title: '',
    slug: '',
    content: '',
    version: '1.0',
    isPublished: false,
    effectiveDate: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (document) {
      setFormData({
        ...document,
        effectiveDate: new Date(document.effectiveDate).toISOString().split('T')[0],
      });
    }
  }, [document]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked });
  };

  const handleContentChange = (content: string) => {
    setFormData({ ...formData, content });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    
    // Auto-generate slug from title if slug is empty or hasn't been manually edited
    if (!document || !document.slug || formData.slug === document.slug) {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')  // Remove special chars
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/-+/g, '-');      // Replace multiple hyphens with single hyphen
      
      setFormData({ 
        ...formData, 
        title, 
        slug 
      });
    } else {
      setFormData({ ...formData, title });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-4" 
            onClick={onCancel}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {document ? 'Edit' : 'Create'} Legal Document
          </h1>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <FormSection title="Document Details" description="Basic information about the document">
            <FormGroup cols={2}>
              <FormField
                label="Document Type"
                required
              >
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVACY_POLICY">Privacy Policy</SelectItem>
                    <SelectItem value="TERMS_OF_SERVICE">Terms of Service</SelectItem>
                    <SelectItem value="COOKIE_POLICY">Cookie Policy</SelectItem>
                    <SelectItem value="REFUND_POLICY">Refund Policy</SelectItem>
                    <SelectItem value="USER_AGREEMENT">User Agreement</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              
              <FormField
                label="Title"
                required
              >
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="e.g. Privacy Policy"
                />
              </FormField>
            </FormGroup>

            <FormGroup cols={2}>
              <FormField
                label="URL Slug"
                helperText="Will be used in the URL path (e.g., /legal/privacy-policy)"
                required
              >
                <Input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="e.g. privacy-policy"
                />
              </FormField>
              
              <FormField
                label="Version"
                required
              >
                <Input
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  placeholder="e.g. 1.0"
                />
              </FormField>
            </FormGroup>

            <FormGroup cols={2}>
              <FormField
                label="Effective Date"
                required
              >
                <Input
                  type="date"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleChange}
                />
              </FormField>
              
              <FormField
                label="Published"
                helperText="When enabled, this document will be visible to users"
              >
                <div className="flex items-center pt-2">
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => handleSwitchChange('isPublished', checked)}
                  />
                  <span className="ml-2">
                    {formData.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </FormField>
            </FormGroup>
          </FormSection>

          <FormSection title="Document Content" description="The content of your legal document">
            <FormField>
              <RichTextEditor
                value={formData.content}
                onChange={handleContentChange}
                placeholder="Enter your document content here..."
              />
            </FormField>
          </FormSection>

          <FormActions>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              isLoading={saving} 
              loadingText="Saving..."
              leftIcon={<Save className="mr-2 h-4 w-4" />}
            >
              Save Document
            </Button>
          </FormActions>
        </div>
      </Form>
    </div>
  );
}