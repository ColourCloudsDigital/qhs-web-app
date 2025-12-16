'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, Trash, Download, X, Plus, FileImage, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { create } from 'zustand';

// Define document types
type DocumentType = 'ID_CARD' | 'PAYMENT_RECEIPT' | 'BOOKING_CONFIRMATION' | 'OTHER';

interface Document {
  id: string;
  bookingId: string;
  name: string;
  type: DocumentType;
  url: string;
  createdAt: string;
}

// Create a Zustand store for document state
interface DocumentStore {
  documents: Document[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  fetchDocuments: (bookingId: string) => Promise<void>;
  addDocument: (document: Document) => void;
  removeDocument: (documentId: string) => Promise<void>;
  setError: (error: string | null) => void;
}

const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  isLoading: false,
  isUploading: false,
  error: null,
  
  fetchDocuments: async (bookingId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}/documents`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      
      const data = await response.json();
      // Ensure documents is always an array
      const documents = Array.isArray(data) ? data : [];
      set({ documents });
    } catch (error) {
      console.error('Error fetching documents:', error);
      set({ error: 'Failed to load documents' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  addDocument: (document: Document) => {
    set(state => ({
      documents: [...state.documents, document]
    }));
  },
  
  removeDocument: async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      set(state => ({
        documents: state.documents.filter(doc => doc.id !== documentId)
      }));
    } catch (error) {
      console.error('Error deleting document:', error);
      set({ error: 'Failed to delete document' });
    }
  },
  
  setError: (error: string | null) => {
    set({ error });
  }
}));

interface BookingDocumentsProps {
  bookingId: string;
}

const getDocumentIcon = (type: string) => {
  switch (type) {
    case 'ID_CARD':
      return <FileImage className="h-5 w-5 text-blue-500" />;
    case 'PAYMENT_RECEIPT':
      return <File className="h-5 w-5 text-red-500" />;
    case 'BOOKING_CONFIRMATION':
      return <FileText className="h-5 w-5 text-green-500" />;
    default:
      return <File className="h-5 w-5 text-gray-500" />;
  }
};

export default function BookingDocuments({ bookingId }: BookingDocumentsProps) {
  const { documents, isLoading, isUploading, error, fetchDocuments, addDocument, removeDocument, setError } = useDocumentStore();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('OTHER');
  const [documentName, setDocumentName] = useState('');
  const { toast } = useToast();
  
  useEffect(() => {
    if (bookingId) {
      fetchDocuments(bookingId);
    }
  }, [bookingId, fetchDocuments]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Auto-set document name from file name if not specified
      if (!documentName) {
        setDocumentName(selectedFile.name.split('.')[0]);
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !documentType || !documentName) {
      toast({
        title: "Error",
        description: "Please complete all fields."
      });
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', documentType);
    formData.append('name', documentName);
    formData.append('bookingId', bookingId);
    
    try {
      useDocumentStore.setState({ isUploading: true, error: null });
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload document');
      }
      
      const newDocument = await response.json();
      addDocument(newDocument);
      
      // Reset form
      setFile(null);
      setDocumentType('OTHER');
      setDocumentName('');
      setUploadOpen(false);
      
      toast({
        title: "Success",
        description: "Document uploaded successfully."
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Failed to upload document."
      });
    } finally {
      useDocumentStore.setState({ isUploading: false });
    }
  };
  
  // Common upload button component
  const UploadButton = () => (
    <Button variant="default" size="sm" className="flex items-center" onClick={() => setUploadOpen(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Upload Document
    </Button>
  );
  
  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                {error}
              </h3>
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => fetchDocuments(bookingId)}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
          </div>
        )}
        
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Booking Documents
            </h3>
            
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <UploadButton />
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Document Type
                    </label>
                    <select 
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="ID_CARD">ID Card</option>
                      <option value="PAYMENT_RECEIPT">Payment Receipt</option>
                      <option value="BOOKING_CONFIRMATION">Booking Confirmation</option>
                      <option value="OTHER">Other</option>
                    </select>
      </div>
      
      <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Document Name
                    </label>
                    <input
                      type="text"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:border-gray-600"
                      placeholder="Enter document name"
                    />
          </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      File
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-gray-600">
                      <div className="space-y-1 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PDF, PNG, JPG up to 10MB</p>
                    </div>
                    </div>
                    {file && (
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Selected file: {file.name}
                      </p>
                  )}
                </div>
                
                  <div className="flex justify-end gap-3 pt-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button 
                      type="submit" 
                      disabled={isUploading || !file}
                      className="relative"
                    >
                      {isUploading ? (
                        <span className="flex items-center">
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></span>
                          Uploading...
                        </span>
                      ) : (
                        'Upload Document'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="rounded-md border border-gray-200 dark:border-gray-700">
            {!documents || documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500 dark:text-gray-400">
                <FileText className="h-12 w-12 mb-3 text-gray-400" />
                <p className="text-lg font-medium">No documents found</p>
                <p className="max-w-sm mt-1 mb-4">
                  Upload booking-related documents like ID cards, payment receipts, or booking confirmations.
                </p>
                <UploadButton />
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence>
                  {documents.map((document) => (
                    <motion.li
                      key={document.id}
                      className="flex items-center justify-between px-4 py-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center space-x-3">
                        {getDocumentIcon(document.type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {document.name}
                          </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(document.createdAt).toLocaleDateString()}
                  </p>
                        </div>
                </div>
                
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => window.open(document.url, '_blank')}
                    title="Download"
                  >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeDocument(document.id)}
                    title="Delete"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                          <Trash className="h-4 w-4" />
                        </Button>
                </div>
                    </motion.li>
            ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </>
        )}
    </div>
  );
}