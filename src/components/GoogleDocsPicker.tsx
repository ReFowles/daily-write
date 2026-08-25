'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { formatDistanceToNow } from '@/lib/date-utils';

interface GoogleDoc {
  id: string;
  name: string;
  modifiedTime: string;
  webViewLink: string;
  ownedByMe: boolean;
}

interface GoogleDocsPickerProps {
  onSelectDoc: (doc: GoogleDoc) => void;
  selectedDocId?: string;
}

export default function GoogleDocsPicker({
  onSelectDoc,
  selectedDocId,
}: GoogleDocsPickerProps) {
  const [docs, setDocs] = useState<GoogleDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/google-docs');
      
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocs(data.docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDocTitle.trim()) {
      setCreateError('Please enter a title for your document');
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);
      
      const response = await fetch('/api/google-docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create', title: newDocTitle.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create document');
      }

      const data = await response.json();
      
      // Add the new doc to the list and select it
      setDocs((prevDocs) => [data.doc, ...prevDocs]);
      setShowCreateForm(false);
      setNewDocTitle('');
      onSelectDoc(data.doc);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-600 dark:text-gray-400 strawberry:text-rose-600 cherry:text-rose-400 seafoam:text-cyan-600 ocean:text-cyan-400">
          Loading your Google Docs...
        </p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-center text-red-600 dark:text-red-400 mb-4 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-red-600 ocean:text-red-400">
          {error}
        </p>
        <Button onClick={fetchDocs} variant="secondary" className="mx-auto">
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create New Document Section */}
      {showCreateForm ? (
        <Card className="p-4">
          <form onSubmit={handleCreateDoc} className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white strawberry:text-rose-900 cherry:text-rose-100 seafoam:text-cyan-900 ocean:text-cyan-100">
              Create New Document
            </h3>
            <Input
              type="text"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="Enter document title..."
              disabled={creating}
              autoFocus
            />
            {createError && (
              <p className="text-sm text-red-600 dark:text-red-400 strawberry:text-rose-700 cherry:text-rose-400 seafoam:text-red-600 ocean:text-red-400">
                {createError}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Document'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewDocTitle('');
                  setCreateError(null);
                }}
                disabled={creating}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 text-center transition-colors hover:border-blue-500 hover:bg-blue-50 dark:hover:border-blue-400 dark:hover:bg-blue-950 strawberry:border-pink-300 strawberry:hover:border-rose-500 strawberry:hover:bg-rose-100 cherry:border-rose-800 cherry:hover:border-rose-500 cherry:hover:bg-rose-950 seafoam:border-cyan-300 seafoam:hover:border-cyan-500 seafoam:hover:bg-cyan-100 ocean:border-cyan-800 ocean:hover:border-cyan-500 ocean:hover:bg-cyan-950"
        >
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 strawberry:text-rose-600 cherry:text-rose-400 seafoam:text-cyan-600 ocean:text-cyan-400">
            + Create New Document
          </span>
        </button>
      )}

      {/* Document List */}
      {docs.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-gray-600 dark:text-gray-400 strawberry:text-rose-600 cherry:text-rose-400 seafoam:text-cyan-600 ocean:text-cyan-400">
            No Google Docs found. Create one above to get started!
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white strawberry:text-rose-900 cherry:text-rose-100 seafoam:text-cyan-900 ocean:text-cyan-100">
            Recent Documents
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {docs.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              const modifiedDate = new Date(doc.modifiedTime);
              
              return (
                <button
                  key={doc.id}
                  onClick={() => onSelectDoc(doc)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 strawberry:border-rose-500 strawberry:bg-rose-100 cherry:border-rose-500 cherry:bg-rose-950 seafoam:border-cyan-500 seafoam:bg-cyan-100 ocean:border-cyan-500 ocean:bg-cyan-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 strawberry:border-pink-200 strawberry:hover:border-pink-300 cherry:border-rose-900 cherry:hover:border-rose-800 seafoam:border-cyan-200 seafoam:hover:border-cyan-300 ocean:border-cyan-900 ocean:hover:border-cyan-800'
                  }`}
                >
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate strawberry:text-rose-900 cherry:text-rose-100 seafoam:text-cyan-900 ocean:text-cyan-100">
                    {doc.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 strawberry:text-rose-600 cherry:text-rose-400 seafoam:text-cyan-600 ocean:text-cyan-400">
                    {formatDistanceToNow(modifiedDate)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
