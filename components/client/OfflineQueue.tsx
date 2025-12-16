'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface QueuedOperation {
  id: number;
  url: string;
  method: string;
  timestamp: number;
  type: string;
  headers: string;
  body: string;
}

export default function OfflineQueue() {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [pendingOperations, setPendingOperations] = useState<QueuedOperation[]>([]);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [showSyncSuccess, setShowSyncSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Check online status
    const handleOnline = () => {
      setIsOffline(false);
      // Auto-sync when coming back online
      syncOperations();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    // Initial check
    setIsOffline(!navigator.onLine);
    
    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Load pending operations on mount
    loadPendingOperations();
    
    // Poll for new operations every 5 seconds
    const intervalId = setInterval(loadPendingOperations, 5000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  // Load pending operations from IndexedDB
  const loadPendingOperations = async () => {
    if (!('indexedDB' in window)) return;
    
    try {
      const db = await openDatabase();
      const operations = await getAllOperations(db);
      
      // Categorize operations by type
      const categorizedOps = operations.map(op => {
        let type = 'Unknown';
        
        if (op.url.includes('/bookings')) {
          type = 'Booking';
        } else if (op.url.includes('/check-in')) {
          type = 'Check-in';
        } else if (op.url.includes('/check-out')) {
          type = 'Check-out';
        } else if (op.url.includes('/hotels')) {
          type = 'Hotel';
        }
        
        return {
          ...op,
          type
        };
      });
      
      setPendingOperations(categorizedOps);
    } catch (error) {
      console.error('Error loading pending operations:', error);
    }
  };

  // Sync operations with server
  const syncOperations = async () => {
    if (isOffline || syncing || pendingOperations.length === 0) return;
    
    setSyncing(true);
    
    try {
      const db = await openDatabase();
      let successCount = 0;
      
      for (const op of pendingOperations) {
        try {
          // Attempt to replay the operation
          const response = await fetch(op.url, {
            method: op.method,
            headers: JSON.parse(op.headers || '{}'),
            body: op.body,
          });
          
          if (response.ok) {
            // If successful, remove from queue
            await deleteOperation(db, op.id);
            successCount++;
          }
        } catch (error) {
          console.error('Failed to sync operation:', error);
        }
      }
      
      // Reload the pending operations
      await loadPendingOperations();
      
      if (successCount > 0) {
        setShowSyncSuccess(true);
        setTimeout(() => setShowSyncSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error syncing operations:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Helper function to open IndexedDB
  const openDatabase = () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('qaras-hotels-offline', 1);
      
      request.onerror = () => {
        reject('Failed to open IndexedDB');
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Operations store for sync queue
        if (!db.objectStoreNames.contains('operations')) {
          db.createObjectStore('operations', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  };

  // Helper function to get all operations
  const getAllOperations = (db: IDBDatabase) => {
    return new Promise<QueuedOperation[]>((resolve, reject) => {
      const transaction = db.transaction(['operations'], 'readonly');
      const store = transaction.objectStore('operations');
      const request = store.getAll();
      
      request.onerror = () => {
        reject('Failed to get operations');
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  };

  // Helper function to delete an operation
  const deleteOperation = (db: IDBDatabase, id: number) => {
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(['operations'], 'readwrite');
      const store = transaction.objectStore('operations');
      const request = store.delete(id);
      
      request.onerror = () => {
        reject('Failed to delete operation');
      };
      
      request.onsuccess = () => {
        resolve();
      };
    });
  };

  // If no pending operations, don't render anything
  if (pendingOperations.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-16 right-4 z-40 max-w-sm rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-lg dark:border-amber-900 dark:bg-amber-900/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Pending Offline Operations
          </h3>
        </div>
        {showSyncSuccess && (
          <div className="ml-2 flex items-center text-green-600 dark:text-green-400">
            <CheckCircle2 className="mr-1 h-4 w-4" />
            <span className="text-xs">Sync complete</span>
          </div>
        )}
      </div>
      
      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
        You have {pendingOperations.length} operation{pendingOperations.length !== 1 ? 's' : ''} waiting to be synchronized
      </p>
      
      {pendingOperations.length > 0 && (
        <div className="mt-2 max-h-40 overflow-y-auto rounded border border-amber-200 bg-white p-1 dark:border-amber-800 dark:bg-gray-800">
          <ul className="text-xs">
            {pendingOperations.map((op) => (
              <li key={op.id} className="mb-1 rounded py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex justify-between">
                  <span className="font-medium">{op.type}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {new Date(op.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-gray-600 dark:text-gray-300">
                  {op.method} {op.url.split('/').slice(-2).join('/')}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-3 flex justify-end">
        <button
          onClick={syncOperations}
          disabled={isOffline || syncing}
          className="flex items-center rounded bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          {syncing ? (
            <>
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-1 h-3 w-3" />
              Sync Now
            </>
          )}
        </button>
      </div>
    </div>
  );
} 