'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Edit, Trash2, Eye, Check, X, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { LegalDocumentEditor } from '@/components/admin/settings/LegalDocumentEditor';

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

export default function LegalDocumentsPage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<LegalDocument | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings/legal');
      
      if (!response.ok) {
        throw new Error('Failed to fetch legal documents');
      }
      
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching legal documents:', error);
      addToast({
        type: 'error',
        description: 'Failed to load legal documents'
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleCreateNew = () => {
    setCurrentDocument(null);
    setShowEditor(true);
  };
  
  const handleEdit = (document: LegalDocument) => {
    setCurrentDocument(document);
    setShowEditor(true);
  };
  
  const handleDelete = async (id: string) => {
    if (deleteConfirmId === id) {
      try {
        const response = await fetch(`/api/admin/settings/legal/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete document');
        }
        
        addToast({
          type: 'success',
          description: 'Document deleted successfully'
        });
        setDeleteConfirmId(null);
        fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        addToast({
          type: 'error',
          description: 'Failed to delete document'
        });
      }
    } else {
      setDeleteConfirmId(id);
      // Auto-clear confirmation after 5 seconds
      setTimeout(() => setDeleteConfirmId(null), 5000);
    }
  };
  
  const handleView = (id: string) => {
    window.open(`/legal/${id}`, '_blank');
  };
  
  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/settings/legal/${id}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update document status');
      }
      
      addToast({
        type: 'success',
        description: `Document ${currentStatus ? 'unpublished' : 'published'} successfully`
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error updating document status:', error);
      addToast({
        type: 'error',
        description: 'Failed to update document status'
      });
    }
  };
  
  const handleSave = async (document: LegalDocument) => {
    try {
      const isNew = !document.id;
      const url = isNew 
        ? '/api/admin/settings/legal' 
        : `/api/admin/settings/legal/${document.id}`;
      
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(document),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save document');
      }
      
      addToast({
        type: 'success',
        description: 'Document saved successfully'
      });
      setShowEditor(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      addToast({
        type: 'error',
        description: 'Failed to save document'
      });
    }
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setCurrentDocument(null);
  };

  if (showEditor) {
    return (
      <LegalDocumentEditor 
        document={currentDocument} 
        onSave={handleSave} 
        onCancel={handleEditorClose} 
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Legal Documents</h1>
          <p className="text-muted-foreground text-slate-800 dark:text-white">
            Manage your legal documents like Privacy Policy, Terms of Service, etc.
          </p>
        </div>
        <Button onClick={handleCreateNew} leftIcon={<PlusCircle className="mr-2 h-4 w-4" />}>
          Create New Document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Legal Documents</CardTitle>
          <CardDescription>
            Create and manage legal documents that will be displayed on your website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : documents.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No legal documents found. Click &quot;Create New Document&quot; to add one.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>v{doc.version}</TableCell>
                      <TableCell>{doc.updatedAt ? formatDate(doc.updatedAt) : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={doc.isPublished ? "success" : "warning"}>
                          {doc.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleTogglePublish(doc.id || '', doc.isPublished)}
                          >
                            {doc.isPublished ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(doc)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleView(doc.id || '')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(doc.id || '')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}