'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { portfolioAPI, projectsAPI } from '@/lib/api';
import { PortfolioItem, Project } from '@/lib/types';
import toast from 'react-hot-toast';
import ContentDisplay from '@/components/ContentDisplay';
import UploadPortfolioModal from '@/components/UploadPortfolioModal';
import CreateProjectModal from '@/components/CreateProjectModal';
import CreateContentModal from '@/components/CreateContentModal';
import { 
  XMarkIcon, 
  PlusIcon,
  FolderIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

type ContentType = 'all' | 'photo' | 'video' | 'audio' | 'pdf' | 'text' | 'project';
type SortType = 'recent' | 'timeline' | 'type';

// ============================================================================
// iOS-STYLE DRAGGABLE GRID COMPONENT
// ============================================================================
interface DraggableGridProps {
  items: PortfolioItem[];
  onReorder: (newItems: PortfolioItem[]) => void;
  onItemClick: (item: PortfolioItem) => void;
  formatTime: (date: string) => string;
}

function DraggableGrid({ items, onReorder, onItemClick, formatTime }: DraggableGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dragIndex: number | null;
    overIndex: number | null;
    startPos: { x: number; y: number };
    currentPos: { x: number; y: number };
    itemRect: DOMRect | null;
  }>({
    isDragging: false,
    dragIndex: null,
    overIndex: null,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    itemRect: null
  });
  
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const hasMoved = useRef(false);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Lock body scroll when dragging
  useEffect(() => {
    if (dragState.isDragging) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      document.body.style.userSelect = 'none';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.style.userSelect = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.body.style.userSelect = '';
      document.documentElement.style.overflow = '';
    };
  }, [dragState.isDragging]);

  const getIndexAtPosition = useCallback((x: number, y: number): number | null => {
    if (!gridRef.current) return null;
    
    for (let i = 0; i < itemRefs.current.length; i++) {
      const el = itemRefs.current[i];
      if (el) {
        const rect = el.getBoundingClientRect();
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return i;
        }
      }
    }
    return null;
  }, []);

  const startDrag = useCallback((index: number, clientX: number, clientY: number) => {
    const el = itemRefs.current[index];
    if (!el) return;
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    
    const rect = el.getBoundingClientRect();
    setDragState({
      isDragging: true,
      dragIndex: index,
      overIndex: null,
      startPos: { x: clientX, y: clientY },
      currentPos: { x: clientX, y: clientY },
      itemRect: rect
    });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, index: number) => {
    if (e.button !== 0) return; // Only left click / primary touch
    
    hasMoved.current = false;
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    // Long press to start drag (300ms)
    longPressTimer.current = setTimeout(() => {
      if (!hasMoved.current) {
        startDrag(index, clientX, clientY);
      }
    }, 300);
  }, [startDrag]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Check if moved before long press
    if (longPressTimer.current && !dragState.isDragging) {
      const dx = Math.abs(e.clientX - dragState.startPos.x);
      const dy = Math.abs(e.clientY - dragState.startPos.y);
      if (dx > 8 || dy > 8) {
        hasMoved.current = true;
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      return;
    }

    if (!dragState.isDragging) return;
    
    e.preventDefault();
    
    const newOverIndex = getIndexAtPosition(e.clientX, e.clientY);
    
    setDragState(prev => ({
      ...prev,
      currentPos: { x: e.clientX, y: e.clientY },
      overIndex: newOverIndex !== prev.dragIndex ? newOverIndex : prev.overIndex
    }));
  }, [dragState.isDragging, dragState.startPos, getIndexAtPosition]);

  const handlePointerUp = useCallback(() => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!dragState.isDragging) return;

    const { dragIndex, overIndex } = dragState;
    
    // Perform swap if valid
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const newItems = [...items];
      [newItems[dragIndex], newItems[overIndex]] = [newItems[overIndex], newItems[dragIndex]];
      onReorder(newItems);
    }

    setDragState({
      isDragging: false,
      dragIndex: null,
      overIndex: null,
      startPos: { x: 0, y: 0 },
      currentPos: { x: 0, y: 0 },
      itemRect: null
    });
  }, [dragState, items, onReorder]);

  const handleItemClick = useCallback((item: PortfolioItem, index: number) => {
    // Only trigger click if not dragging and didn't move
    if (!dragState.isDragging && !hasMoved.current) {
      onItemClick(item);
    }
  }, [dragState.isDragging, onItemClick]);

  // Calculate drag offset
  const getDragOffset = () => {
    if (!dragState.isDragging || !dragState.itemRect) return { x: 0, y: 0 };
    return {
      x: dragState.currentPos.x - dragState.startPos.x,
      y: dragState.currentPos.y - dragState.startPos.y
    };
  };

  const dragOffset = getDragOffset();

  return (
    <div 
      ref={gridRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4px',
        touchAction: dragState.isDragging ? 'none' : 'auto'
      }}
    >
      {items.map((draft, index) => {
        const isDragging = dragState.dragIndex === index;
        const isOver = dragState.overIndex === index && dragState.dragIndex !== index;
        
        return (
          <div
            key={draft.id}
            ref={el => { itemRefs.current[index] = el; }}
            onPointerDown={(e) => handlePointerDown(e, index)}
            onClick={() => handleItemClick(draft, index)}
            style={{
              position: 'relative',
              borderRadius: '6px',
              overflow: 'hidden',
              background: isOver ? 'rgba(0, 194, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
              border: isOver 
                ? '2px solid #00C2FF' 
                : '1px solid rgba(255, 255, 255, 0.04)',
              cursor: dragState.isDragging ? 'grabbing' : 'pointer',
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              // Dragging item styles
              ...(isDragging ? {
                zIndex: 1000,
                transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(1.05)`,
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 2px #00C2FF',
                opacity: 0.95,
                transition: 'box-shadow 150ms, opacity 150ms'
              } : {
                zIndex: 1,
                transform: 'translate(0, 0) scale(1)',
                transition: isOver 
                  ? 'transform 200ms cubic-bezier(0.2, 0, 0, 1), background 150ms, border 150ms' 
                  : 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
                ...(isOver && { transform: 'scale(0.95)' })
              })
            }}
          >
            {/* Content */}
            <div style={{ aspectRatio: '1 / 1', position: 'relative' }}>
              <ContentDisplay 
                item={draft} 
                isActive={false}
                showAttachments={false}
              />
              
              {/* Draft Badge */}
              <div style={{
                position: 'absolute',
                top: '4px',
                left: '4px',
                background: 'rgba(255, 193, 7, 0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius: '4px',
                padding: '2px 5px',
                fontSize: '8px',
                fontWeight: 700,
                color: '#000',
                letterSpacing: '0.3px',
                zIndex: 10
              }}>
                DRAFT
              </div>

              {/* Swap Indicator */}
              {isOver && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 194, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#00C2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
                      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '5px 6px',
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1px'
            }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#FFF',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {draft.title || draft.description || (draft.content_type === 'audio' ? 'Audio' : draft.content_type === 'pdf' ? 'PDF' : 'Untitled')}
              </div>
              <div style={{
                fontSize: '9px',
                fontWeight: 500,
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                {formatTime(draft.created_at)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN DRAFTS PAGE COMPONENT
// ============================================================================
export default function DraftsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<PortfolioItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ContentType>('all');
  const [sortType, setSortType] = useState<SortType>('recent');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showProjectEditModal, setShowProjectEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<'media' | 'audio' | 'pdf' | 'text' | null>(null);
  
  // Editing states
  const [editingDraft, setEditingDraft] = useState<PortfolioItem | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Refs
  const filterMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadDrafts();
  }, [user]);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };

    if (showFilterMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterMenu]);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const [draftsResponse, projectsResponse] = await Promise.all([
        portfolioAPI.getDrafts(),
        projectsAPI.getProjects()
      ]);
      setDrafts(draftsResponse.data || []);
      setProjects(projectsResponse.data || []);
    } catch (error) {
      console.error('Failed to load drafts:', error);
      toast.error('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  // Filter drafts
  const getFilteredDrafts = useCallback(() => {
    let filtered = [...drafts];
    
    if (filterType !== 'all' && filterType !== 'project') {
      filtered = filtered.filter(draft => {
        if (filterType === 'text') return draft.content_type === 'text';
        return draft.content_type === filterType;
      });
    }
    
    return filtered;
  }, [drafts, filterType]);

  // Sort drafts
  const getSortedDrafts = useCallback(() => {
    const filtered = getFilteredDrafts();
    return [...filtered].sort((a, b) => {
      switch (sortType) {
        case 'recent':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'timeline':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'type':
          return (a.content_type || '').localeCompare(b.content_type || '');
        default:
          return 0;
      }
    });
  }, [getFilteredDrafts, sortType]);

  const sortedDrafts = getSortedDrafts();
  const filteredProjects = filterType === 'all' || filterType === 'project' ? projects : [];

  const handleSelectPost = (type?: 'media' | 'audio' | 'pdf' | 'text') => {
    setSelectedPostType(type || null);
    setEditingDraft(null);
    setShowCreateModal(false);
    setShowUploadModal(true);
  };

  const handleSelectProject = () => {
    setShowCreateModal(false);
    setEditingProject(null);
    setShowProjectModal(true);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDraftClick = (draft: PortfolioItem) => {
    setEditingDraft(draft);
    
    if (draft.content_type === 'photo' || draft.content_type === 'video') {
      setSelectedPostType('media');
    } else if (draft.content_type === 'audio') {
      setSelectedPostType('audio');
    } else if (draft.content_type === 'pdf') {
      setSelectedPostType('pdf');
    } else if (draft.content_type === 'text') {
      setSelectedPostType('text');
    }
    
    setShowUploadModal(true);
  };

  const handleProjectClick = (project: Project) => {
    setEditingProject(project);
    setShowProjectEditModal(true);
  };

  const handleReorder = (newItems: PortfolioItem[]) => {
    // Map back to full drafts array
    const idToIndex = new Map(newItems.map((item, idx) => [item.id, idx]));
    const reorderedDrafts = [...drafts].sort((a, b) => {
      const aIdx = idToIndex.get(a.id);
      const bIdx = idToIndex.get(b.id);
      if (aIdx === undefined && bIdx === undefined) return 0;
      if (aIdx === undefined) return 1;
      if (bIdx === undefined) return -1;
      return aIdx - bIdx;
    });
    setDrafts(reorderedDrafts);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const totalItems = sortedDrafts.length + filteredProjects.length;

  return (
    <div className="min-h-screen" style={{ background: '#111111', color: '#F5F5F5' }}>
      {/* Header */}
      <header 
        className="sticky top-0"
        style={{
          background: 'rgba(17, 17, 17, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          zIndex: 40
        }}
      >
        {/* Header with close button */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button
            onClick={() => router.back()}
            style={{
              width: '40px',
              height: '40px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none'
            }}
          >
            <XMarkIcon className="w-5 h-5" style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
          </button>
        </div>

        {/* Navigation Bar */}
        <div style={{ padding: '8px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFF' }}>Drafts</span>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.5)',
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '2px 8px',
              borderRadius: '10px'
            }}>
              {totalItems}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#00C2FF',
                borderRadius: '20px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#000',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <PlusIcon className="w-4 h-4" style={{ strokeWidth: 2.5 }} />
              <span>Make a Draft</span>
            </button>

            {/* Filter */}
            <div ref={filterMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '32px',
                  padding: '0 12px',
                  borderRadius: '16px',
                  background: showFilterMenu || filterType !== 'all' ? 'rgba(0, 194, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${showFilterMenu || filterType !== 'all' ? 'rgba(0, 194, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
                  cursor: 'pointer'
                }}
              >
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: showFilterMenu || filterType !== 'all' ? '#00C2FF' : 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'capitalize'
                }}>
                  {filterType === 'all' ? 'Filter' : filterType}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: showFilterMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}>
                  <path d="M3 4.5L6 7.5L9 4.5" stroke={showFilterMenu || filterType !== 'all' ? '#00C2FF' : 'rgba(255, 255, 255, 0.5)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {showFilterMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  background: 'rgba(28, 28, 30, 0.98)',
                  backdropFilter: 'blur(40px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '14px',
                  padding: '8px',
                  minWidth: '180px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                  zIndex: 1000
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 8px 6px' }}>Type</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '0 4px 8px' }}>
                    {(['all', 'photo', 'video', 'audio', 'pdf', 'text', 'project'] as ContentType[]).map((type) => (
                      <button
                        key={type}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFilterType(type); }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '100px',
                          background: filterType === type ? '#00C2FF' : 'rgba(255, 255, 255, 0.08)',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: filterType === type ? '#000' : 'rgba(255, 255, 255, 0.7)',
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {type === 'text' ? 'Memo' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '6px 8px 4px' }}>Sort</div>
                  {(['recent', 'timeline', 'type'] as SortType[]).map((sort) => (
                    <button
                      key={sort}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSortType(sort); setShowFilterMenu(false); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 8px',
                        background: sortType === sort ? 'rgba(0, 194, 255, 0.12)' : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 500, color: sortType === sort ? '#00C2FF' : 'rgba(255, 255, 255, 0.7)' }}>
                        {sort === 'recent' ? 'Recent' : sort === 'timeline' ? 'Timeline' : 'Type'}
                      </span>
                      {sortType === sort && <CheckIcon className="w-4 h-4" style={{ color: '#00C2FF' }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ padding: '12px', maxWidth: '430px', margin: '0 auto' }}>
        {/* Filter Indicator */}
        {filterType !== 'all' && (
          <div style={{ 
            marginBottom: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 12px',
            background: 'rgba(0, 194, 255, 0.08)',
            borderRadius: '10px',
            border: '1px solid rgba(0, 194, 255, 0.15)'
          }}>
            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>Showing:</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#00C2FF', textTransform: 'capitalize' }}>
              {filterType === 'text' ? 'Memos' : `${filterType}s`}
            </span>
            <button onClick={() => setFilterType('all')} style={{ marginLeft: 'auto', background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <XMarkIcon className="w-4 h-4" style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
            </button>
          </div>
        )}

        {/* Projects - 2 Column */}
        {filteredProjects.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {filteredProjects.map((project) => (
                <div
                  key={`project-${project.id}`}
                  onClick={() => handleProjectClick(project)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ aspectRatio: '4 / 3', position: 'relative', background: 'rgba(255, 255, 255, 0.02)' }}>
                    {project.cover_image ? (
                      <img src={project.cover_image} alt={project.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FolderIcon className="w-8 h-8" style={{ color: 'rgba(255, 255, 255, 0.12)' }} />
                      </div>
                    )}
                    {project.media_count > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '10px',
                        padding: '3px 7px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#FFF'
                      }}>
                        {project.media_count}
                      </div>
                    )}
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: 'rgba(139, 92, 246, 0.9)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#FFF',
                      letterSpacing: '0.3px'
                    }}>
                      PROJECT
                    </div>
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {project.title}
                    </div>
                    {project.created_at && (
                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '2px' }}>
                        {formatRelativeTime(project.created_at)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drafts Grid - iOS-style draggable */}
        {sortedDrafts.length > 0 ? (
          <DraggableGrid
            items={sortedDrafts}
            onReorder={handleReorder}
            onItemClick={handleDraftClick}
            formatTime={formatRelativeTime}
          />
        ) : filteredProjects.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFF', marginBottom: '8px' }}>
              {filterType !== 'all' ? `No ${filterType === 'text' ? 'memo' : filterType} drafts` : 'No Drafts Yet'}
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '24px' }}>
              {filterType !== 'all' ? `You don't have any ${filterType === 'text' ? 'memo' : filterType} drafts saved` : 'Drafts you save will appear here'}
            </p>
            {filterType !== 'all' ? (
              <button onClick={() => setFilterType('all')} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '12px 24px', fontSize: '15px', fontWeight: 600, color: '#FFF', border: 'none', cursor: 'pointer' }}>
                Show All Drafts
              </button>
            ) : (
              <button onClick={() => setShowCreateModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#00C2FF', borderRadius: '12px', padding: '12px 24px', fontSize: '15px', fontWeight: 600, color: '#000', border: 'none', cursor: 'pointer' }}>
                <PlusIcon className="w-5 h-5" />
                Create Draft
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Modals */}
      <CreateContentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSelectPost={handleSelectPost}
        onSelectProject={handleSelectProject}
      />

      <UploadPortfolioModal
        isOpen={showUploadModal}
        onClose={() => { setShowUploadModal(false); setSelectedPostType(null); setEditingDraft(null); }}
        onSuccess={loadDrafts}
        initialContentType={selectedPostType}
        defaultSaveAsDraft={true}
        editingDraft={editingDraft}
      />

      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSuccess={loadDrafts}
      />

      {editingProject && (
        <ProjectDetailModal
          isOpen={showProjectEditModal}
          project={editingProject}
          onClose={() => { setShowProjectEditModal(false); setEditingProject(null); }}
        />
      )}
    </div>
  );
}

// ============================================================================
// PROJECT DETAIL MODAL
// ============================================================================
function ProjectDetailModal({ isOpen, project, onClose }: { isOpen: boolean; project: Project; onClose: () => void; }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      setIsClosing(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => { setIsClosing(false); onClose(); }, 150);
  };

  if (!isOpen && !isClosing) return null;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: '5vh', background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(14px)', opacity: isVisible ? 1 : 0, transition: 'opacity 0.15s ease-out' }}
      onClick={handleClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: 'calc(100% - 24px)',
          maxHeight: '75vh',
          background: 'rgba(20, 20, 20, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.97) translateY(-10px)',
          opacity: isVisible ? 1 : 0,
          transition: 'transform 0.15s ease-out, opacity 0.15s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ height: '55px', padding: '0 20px', background: '#0D0D0D', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={handleClose} style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
            <XMarkIcon className="w-6 h-6" style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
          </button>
          <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#FFF' }}>Project Details</h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {project.cover_image && (
            <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
              <img src={project.cover_image} alt={project.title} style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }} />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'inline-block', background: 'rgba(139, 92, 246, 0.2)', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: '#A78BFA', letterSpacing: '0.5px', marginBottom: '12px' }}>PROJECT</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFF', marginBottom: '8px' }}>{project.title}</h3>
            {project.description && <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.5 }}>{project.description}</p>}
          </div>

          <div style={{ display: 'flex', gap: '16px', padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>Created</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFF' }}>{project.created_at ? formatTime(project.created_at) : 'Unknown'}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>Items</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFF' }}>{project.media_count || 0}</div>
            </div>
          </div>

          {project.tags && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '8px' }}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {project.tags.split(',').map((tag: string, idx: number) => (
                  <span key={idx} style={{ padding: '4px 10px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '100px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>{tag.trim()}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
