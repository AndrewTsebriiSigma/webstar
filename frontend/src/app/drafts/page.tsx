'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { portfolioAPI } from '@/lib/api';
import { PortfolioItem } from '@/lib/types';
import toast from 'react-hot-toast';
import ContentDisplay from '@/components/ContentDisplay';
import { XMarkIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function DraftsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrafts, setSelectedDrafts] = useState<Set<number>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadDrafts();
  }, [user]);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const response = await portfolioAPI.getDrafts();
      setDrafts(response.data);
    } catch (error) {
      console.error('Failed to load drafts:', error);
      toast.error('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDraft = (id: number) => {
    const newSelected = new Set(selectedDrafts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDrafts(newSelected);
  };

  const handlePublishSelected = async () => {
    if (selectedDrafts.size === 0) {
      toast.error('Please select drafts to publish');
      return;
    }

    try {
      setActionLoading(true);
      const promises = Array.from(selectedDrafts).map(id => 
        portfolioAPI.publishDraft(id)
      );
      await Promise.all(promises);
      toast.success(`${selectedDrafts.size} draft(s) published successfully!`);
      setSelectedDrafts(new Set());
      loadDrafts();
    } catch (error) {
      console.error('Failed to publish drafts:', error);
      toast.error('Failed to publish drafts');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDrafts.size === 0) {
      toast.error('Please select drafts to delete');
      return;
    }

    if (!confirm(`Delete ${selectedDrafts.size} draft(s)? This cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      const promises = Array.from(selectedDrafts).map(id => 
        portfolioAPI.deleteItem(id)
      );
      await Promise.all(promises);
      toast.success(`${selectedDrafts.size} draft(s) deleted successfully!`);
      setSelectedDrafts(new Set());
      loadDrafts();
    } catch (error) {
      console.error('Failed to delete drafts:', error);
      toast.error('Failed to delete drafts');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#111111' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-gray-800" style={{ background: 'rgba(17, 17, 17, 0.9)' }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-full transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">Drafts ({drafts.length})</h1>
          <div className="w-10"></div>
        </div>
      </header>

      {/* Action Bar - Shows when drafts are selected */}
      {selectedDrafts.size > 0 && (
        <div className="sticky top-[57px] z-40 bg-cyan-500 px-4 py-3 flex items-center justify-between">
          <span className="font-semibold">{selectedDrafts.size} selected</span>
          <div className="flex gap-2">
            <button
              onClick={handlePublishSelected}
              disabled={actionLoading}
              className="px-4 py-2 bg-white text-cyan-500 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50 flex items-center gap-2"
            >
              <CheckIcon className="w-5 h-5" />
              Publish
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-2"
            >
              <TrashIcon className="w-5 h-5" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-6">
        {drafts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold mb-2">No Drafts Yet</h2>
            <p className="text-gray-400 mb-6">
              Drafts you save will appear here
            </p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div style={{ maxWidth: '430px', margin: '0 auto', width: '100%' }}>
            <div className="grid grid-cols-3 gap-2" style={{ gap: '8px' }}>
              {drafts.map((draft) => (
                <div key={draft.id} className="relative group">
                  {/* Selection Overlay */}
                  <div
                    className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
                    onClick={() => handleSelectDraft(draft.id)}
                  >
                    {selectedDrafts.has(draft.id) ? (
                      <div className="w-full h-full bg-cyan-500 bg-opacity-80 flex items-center justify-center">
                        <CheckIcon className="w-12 h-12 text-white" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white rounded-full opacity-0 group-hover:opacity-100 transition"></div>
                      </div>
                    )}
                  </div>

                  {/* Draft Content */}
                  <div className="pointer-events-none">
                    <ContentDisplay 
                      item={draft} 
                      isActive={false}
                      showAttachments={false}
                    />
                  </div>

                  {/* Draft Badge */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded z-5">
                    DRAFT
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

