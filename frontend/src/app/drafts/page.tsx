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
  MagnifyingGlassIcon,
  PlusIcon,
  FolderIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

type ContentType = 'all' | 'photo' | 'video' | 'audio' | 'pdf' | 'text' | 'project';
type SortType = 'recent' | 'timeline' | 'type';

export default function DraftsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<PortfolioItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<ContentType>('all');
  const [sortType, setSortType] = useState<SortType>('recent');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showProjectEditModal, setShowProjectEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<'media' | 'audio' | 'pdf' | 'text' | null>(null);
  
  // Editing draft state
  const [editingDraft, setEditingDraft] = useState<PortfolioItem | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);

  // Refs for dropdown
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

  // Prevent zoom during drag on mobile
  useEffect(() => {
    if (isDragging) {
      document.body.style.touchAction = 'none';
      document.body.style.overflow = 'hidden';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.touchAction = '';
      document.body.style.overflow = '';
      document.body.style.userSelect = '';
    }
    return () => {
      document.body.style.touchAction = '';
      document.body.style.overflow = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

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

  // Filter drafts based on selected type
  const getFilteredDrafts = useCallback(() => {
    let filtered = [...drafts];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(draft => {
        const matchesTitle = draft.title?.toLowerCase().includes(query);
        const matchesDesc = draft.description?.toLowerCase().includes(query);
        return matchesTitle || matchesDesc;
      });
    }
    
    // Type filter
    if (filterType !== 'all' && filterType !== 'project') {
      filtered = filtered.filter(draft => {
        if (filterType === 'text') {
          return draft.content_type === 'text';
        }
        return draft.content_type === filterType;
      });
    }
    
    return filtered;
  }, [drafts, searchQuery, filterType]);

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

  // Show projects when filter is 'all' or 'project'
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

  // Handle filter type change
  const handleFilterTypeChange = (type: ContentType) => {
    console.log('Filter changed to:', type);
    setFilterType(type);
  };

  // Handle sort type change
  const handleSortTypeChange = (sort: SortType) => {
    console.log('Sort changed to:', sort);
    setSortType(sort);
    setShowFilterMenu(false);
  };

  // Format relative time
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

  // Open draft for editing
  const handleDraftClick = (draft: PortfolioItem) => {
    if (isDragging) return;
    
    setEditingDraft(draft);
    
    // Determine content type for the modal
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

  // Open project for editing - convert project to draft-like format
  const handleProjectClick = (project: Project) => {
    if (isDragging) return;
    
    // Set the project for editing and open the project modal
    setEditingProject(project);
    setShowProjectEditModal(true);
  };

  // Swap drafts at two indices
  const swapDrafts = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newDrafts = [...drafts];
    // Find the actual indices in the full drafts array
    const fromDraft = sortedDrafts[fromIndex];
    const toDraft = sortedDrafts[toIndex];
    
    const fromActualIndex = newDrafts.findIndex(d => d.id === fromDraft.id);
    const toActualIndex = newDrafts.findIndex(d => d.id === toDraft.id);
    
    if (fromActualIndex !== -1 && toActualIndex !== -1) {
      // Swap the items
      [newDrafts[fromActualIndex], newDrafts[toActualIndex]] = [newDrafts[toActualIndex], newDrafts[fromActualIndex]];
      setDrafts(newDrafts);
    }
  };

  // Desktop drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setIsDragging(true);
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    
    // Create drag image
    const target = e.currentTarget as HTMLElement;
    dragNodeRef.current = target as HTMLDivElement;
    
    // Apply dragging style
    setTimeout(() => {
      if (target) {
        target.style.opacity = '0.5';
        target.style.transform = 'scale(0.95)';
      }
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== null && draggedIndex !== index && dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Check if we're leaving to outside the grid
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !gridRef.current?.contains(relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (target) {
      target.style.opacity = '1';
      target.style.transform = 'scale(1)';
    }
    
    // Perform swap if we have valid indices
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      swapDrafts(draggedIndex, dragOverIndex);
      toast.success('Draft position swapped');
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
    dragNodeRef.current = null;
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== index) {
      swapDrafts(draggedIndex, index);
      toast.success('Draft position swapped');
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  // Touch drag handlers for mobile
  const touchStartRef = useRef<{ x: number; y: number; index: number; startTime: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      index,
      startTime: Date.now()
    };
    touchMoveRef.current = { x: touch.clientX, y: touch.clientY };

    // Long press to initiate drag (400ms)
    longPressTimerRef.current = setTimeout(() => {
      if (touchStartRef.current) {
        setDraggedIndex(index);
        setIsDragging(true);
        
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }

        // Create ghost element
        const target = e.currentTarget as HTMLElement;
        if (target && !dragGhostRef.current) {
          const ghost = target.cloneNode(true) as HTMLDivElement;
          ghost.style.position = 'fixed';
          ghost.style.zIndex = '9999';
          ghost.style.pointerEvents = 'none';
          ghost.style.opacity = '0.8';
          ghost.style.transform = 'scale(1.05)';
          ghost.style.boxShadow = '0 10px 40px rgba(0, 194, 255, 0.4)';
          ghost.style.width = target.offsetWidth + 'px';
          ghost.style.height = target.offsetHeight + 'px';
          ghost.style.left = (touch.clientX - target.offsetWidth / 2) + 'px';
          ghost.style.top = (touch.clientY - target.offsetHeight / 2) + 'px';
          document.body.appendChild(ghost);
          dragGhostRef.current = ghost;
        }
      }
    }, 400);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchMoveRef.current = { x: touch.clientX, y: touch.clientY };

    // Check if we moved significantly before long press triggered
    if (!isDragging && touchStartRef.current && longPressTimerRef.current) {
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        // Cancel long press - user is scrolling
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        return;
      }
    }

    if (!isDragging || !touchStartRef.current) return;

    e.preventDefault();
    
    // Move ghost element
    if (dragGhostRef.current) {
      const target = e.currentTarget as HTMLElement;
      dragGhostRef.current.style.left = (touch.clientX - target.offsetWidth / 2) + 'px';
      dragGhostRef.current.style.top = (touch.clientY - target.offsetHeight / 2) + 'px';
    }
    
    // Find element under touch
    const elementsUnder = document.elementsFromPoint(touch.clientX, touch.clientY);
    
    for (const el of elementsUnder) {
      const draftCard = el.closest('[data-draft-index]');
      if (draftCard) {
        const index = parseInt(draftCard.getAttribute('data-draft-index') || '-1');
        if (index !== -1 && index !== touchStartRef.current.index && index !== dragOverIndex) {
          setDragOverIndex(index);
        }
        break;
      }
    }
  };

  const handleTouchEnd = () => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Remove ghost element
    if (dragGhostRef.current) {
      document.body.removeChild(dragGhostRef.current);
      dragGhostRef.current = null;
    }

    // Perform swap
    if (isDragging && touchStartRef.current !== null && dragOverIndex !== null) {
      const fromIndex = touchStartRef.current.index;
      if (fromIndex !== dragOverIndex) {
        swapDrafts(fromIndex, dragOverIndex);
        toast.success('Draft position swapped');
      }
    }
    
    touchStartRef.current = null;
    touchMoveRef.current = null;
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
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
    <div 
      className="min-h-screen" 
      style={{ 
        background: '#111111', 
        color: '#F5F5F5',
        touchAction: isDragging ? 'none' : 'auto'
      }}
    >
      {/* Header with Search */}
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
        <div style={{ padding: '12px 16px' }}>
          {/* Search Bar Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '10px 14px'
              }}
            >
              <MagnifyingGlassIcon className="w-5 h-5" style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
              <input
                type="text"
                placeholder="Search drafts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#F5F5F5',
                  fontSize: '15px',
                  fontWeight: 500
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <XMarkIcon className="w-4 h-4" style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                </button>
              )}
            </div>
            <button
              onClick={() => router.back()}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <XMarkIcon className="w-5 h-5" style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
            </button>
          </div>
        </div>

        {/* Navigation Bar */}
        <div style={{ padding: '8px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Draft Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFF' }}>
              Drafts
            </span>
            <span 
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.5)',
                background: 'rgba(255, 255, 255, 0.06)',
                padding: '2px 8px',
                borderRadius: '10px'
              }}
            >
              {totalItems}
            </span>
          </div>

          {/* Right: Make a Draft Button + Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Make a Draft Button */}
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
                cursor: 'pointer',
                transition: 'all 150ms'
              }}
            >
              <PlusIcon className="w-4 h-4" style={{ strokeWidth: 2.5 }} />
              <span>Make a Draft</span>
            </button>

            {/* Filter Button Container */}
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
                  background: showFilterMenu || filterType !== 'all' || sortType !== 'recent' 
                    ? 'rgba(0, 194, 255, 0.12)' 
                    : 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid ${showFilterMenu || filterType !== 'all' || sortType !== 'recent' 
                    ? 'rgba(0, 194, 255, 0.25)' 
                    : 'rgba(255, 255, 255, 0.08)'}`,
                  cursor: 'pointer',
                  transition: 'all 150ms'
                }}
              >
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: showFilterMenu || filterType !== 'all' || sortType !== 'recent' 
                    ? '#00C2FF' 
                    : 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'capitalize'
                }}>
                  {filterType === 'all' ? 'Filter' : filterType}
                </span>
                <svg 
                  width="12" 
                  height="12" 
                  viewBox="0 0 12 12" 
                  fill="none"
                  style={{ 
                    transform: showFilterMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 150ms'
                  }}
                >
                  <path 
                    d="M3 4.5L6 7.5L9 4.5" 
                    stroke={showFilterMenu || filterType !== 'all' || sortType !== 'recent' 
                      ? '#00C2FF' 
                      : 'rgba(255, 255, 255, 0.5)'} 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Filter Dropdown */}
              {showFilterMenu && (
                <div
                  style={{
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
                  }}
                >
                  {/* Type Section Label */}
                  <div style={{ 
                    fontSize: '10px', 
                    fontWeight: 700, 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    padding: '4px 8px 6px'
                  }}>
                    Type
                  </div>
                  
                  {/* Type Pills */}
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '4px',
                    padding: '0 4px 8px'
                  }}>
                    {(['all', 'photo', 'video', 'audio', 'pdf', 'text', 'project'] as ContentType[]).map((type) => (
                      <button
                        key={type}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleFilterTypeChange(type);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '100px',
                          background: filterType === type ? '#00C2FF' : 'rgba(255, 255, 255, 0.08)',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 600,
                          color: filterType === type ? '#000' : 'rgba(255, 255, 255, 0.7)',
                          cursor: 'pointer',
                          transition: 'all 100ms',
                          textTransform: 'capitalize'
                        }}
                      >
                        {type === 'text' ? 'Memo' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

                  {/* Sort Section Label */}
                  <div style={{ 
                    fontSize: '10px', 
                    fontWeight: 700, 
                    color: 'rgba(255, 255, 255, 0.4)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px',
                    padding: '6px 8px 4px'
                  }}>
                    Sort
                  </div>

                  {/* Sort Options */}
                  {(['recent', 'timeline', 'type'] as SortType[]).map((sort) => (
                    <button
                      key={sort}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSortTypeChange(sort);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 8px',
                        background: sortType === sort ? 'rgba(0, 194, 255, 0.12)' : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 100ms'
                      }}
                    >
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: 500, 
                        color: sortType === sort ? '#00C2FF' : 'rgba(255, 255, 255, 0.7)'
                      }}>
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

      {/* Content Area */}
      <div style={{ padding: '12px', maxWidth: '430px', margin: '0 auto' }}>
        {/* Active Filter Indicator */}
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
            <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
              Showing:
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#00C2FF', textTransform: 'capitalize' }}>
              {filterType === 'text' ? 'Memos' : `${filterType}s`}
            </span>
            <button
              onClick={() => setFilterType('all')}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <XMarkIcon className="w-4 h-4" style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
            </button>
          </div>
        )}

        {/* Projects Section - 2 Column Grid */}
        {filteredProjects.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px'
              }}
            >
              {filteredProjects.map((project) => (
                <div
                  key={`project-${project.id}`}
                  onClick={() => handleProjectClick(project)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 150ms'
                  }}
                >
                  <div style={{ aspectRatio: '4 / 3', position: 'relative', background: 'rgba(255, 255, 255, 0.02)' }}>
                    {project.cover_image ? (
                      <img
                        src={project.cover_image}
                        alt={project.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FolderIcon className="w-8 h-8" style={{ color: 'rgba(255, 255, 255, 0.12)' }} />
                      </div>
                    )}
                    {project.media_count > 0 && (
                      <div
                        style={{
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
                        }}
                      >
                        {project.media_count}
                      </div>
                    )}
                    {/* Project Badge */}
                    <div 
                      style={{
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
                      }}
                    >
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

        {/* Drafts Grid - 3 Column */}
        {sortedDrafts.length > 0 ? (
          <div 
            ref={gridRef}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '5px'
            }}
          >
            {sortedDrafts.map((draft, index) => (
              <div 
                key={draft.id}
                data-draft-index={index}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => handleDraftClick(draft)}
                style={{ 
                  position: 'relative',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  transition: draggedIndex === index ? 'none' : 'all 200ms cubic-bezier(0.2, 0, 0, 1)',
                  transform: dragOverIndex === index 
                    ? 'scale(1.08)' 
                    : draggedIndex === index 
                      ? 'scale(0.95)' 
                      : 'scale(1)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: dragOverIndex === index 
                    ? 'rgba(0, 194, 255, 0.15)' 
                    : 'rgba(255, 255, 255, 0.02)',
                  border: dragOverIndex === index 
                    ? '2px solid #00C2FF' 
                    : draggedIndex === index 
                      ? '2px dashed rgba(0, 194, 255, 0.5)' 
                      : '1px solid rgba(255, 255, 255, 0.04)',
                  opacity: draggedIndex === index ? 0.5 : 1,
                  boxShadow: dragOverIndex === index 
                    ? '0 8px 32px rgba(0, 194, 255, 0.3)' 
                    : 'none',
                  zIndex: dragOverIndex === index ? 10 : draggedIndex === index ? 5 : 1,
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
              >
                {/* Content Display Container */}
                <div style={{ aspectRatio: '1 / 1', position: 'relative' }}>
                  <ContentDisplay 
                    item={draft} 
                    isActive={false}
                    showAttachments={false}
                  />
                  
                  {/* Draft Badge */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: 'rgba(255, 193, 7, 0.9)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#000',
                      letterSpacing: '0.3px',
                      zIndex: 10
                    }}
                  >
                    DRAFT
                  </div>

                  {/* Drag Handle Indicator */}
                  {!isDragging && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '6px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '4px',
                        padding: '4px',
                        opacity: 0.6,
                        zIndex: 10
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <circle cx="9" cy="5" r="1" fill="white"/>
                        <circle cx="9" cy="12" r="1" fill="white"/>
                        <circle cx="9" cy="19" r="1" fill="white"/>
                        <circle cx="15" cy="5" r="1" fill="white"/>
                        <circle cx="15" cy="12" r="1" fill="white"/>
                        <circle cx="15" cy="19" r="1" fill="white"/>
                      </svg>
                    </div>
                  )}

                  {/* Drop indicator overlay */}
                  {dragOverIndex === index && draggedIndex !== index && (
                    <div 
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0, 194, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 20
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#00C2FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
                          <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with title and time - BELOW the image */}
                <div 
                  className="draft-card-desc"
                  style={{
                    padding: '6px 8px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px'
                  }}
                >
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#FFF',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {draft.title || draft.description || 'Untitled'}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    {formatRelativeTime(draft.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          /* Empty State */
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '60px 24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FFF', marginBottom: '8px' }}>
              {filterType !== 'all' ? `No ${filterType === 'text' ? 'memo' : filterType} drafts` : 'No Drafts Yet'}
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '24px' }}>
              {filterType !== 'all' 
                ? `You don't have any ${filterType === 'text' ? 'memo' : filterType} drafts saved`
                : 'Drafts you save will appear here'}
            </p>
            {filterType !== 'all' ? (
              <button
                onClick={() => setFilterType('all')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#FFF',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Show All Drafts
              </button>
            ) : (
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#00C2FF',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#000',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <PlusIcon className="w-5 h-5" />
                Create Draft
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* CreateContentModal */}
      <CreateContentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSelectPost={handleSelectPost}
        onSelectProject={handleSelectProject}
      />

      {/* Upload Modal - default to save as draft when opened from /drafts */}
      <UploadPortfolioModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedPostType(null);
          setEditingDraft(null);
        }}
        onSuccess={loadDrafts}
        initialContentType={selectedPostType}
        defaultSaveAsDraft={true}
        editingDraft={editingDraft}
      />

      {/* Project Create Modal */}
      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSuccess={loadDrafts}
      />

      {/* Project Edit Modal - using CreateProjectModal with editing state */}
      {editingProject && (
        <ProjectEditModal
          isOpen={showProjectEditModal}
          project={editingProject}
          onClose={() => {
            setShowProjectEditModal(false);
            setEditingProject(null);
          }}
          onSuccess={loadDrafts}
        />
      )}
    </div>
  );
}

// Project Edit Modal Component
function ProjectEditModal({ 
  isOpen, 
  project, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  project: Project; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
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
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  if (!isOpen && !isClosing) return null;

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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ 
        paddingTop: '5vh',
        paddingBottom: '35vh',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.15s ease-out'
      }}
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-md relative"
        style={{
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
          transition: 'transform 0.15s ease-out, opacity 0.15s ease-out',
          transformOrigin: 'top center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between flex-shrink-0"
          style={{ 
            height: '55px',
            padding: '0 20px',
            background: '#0D0D0D',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div className="flex items-center" style={{ gap: '20px' }}>
            <button
              onClick={handleClose}
              className="flex items-center justify-center transition-opacity"
              style={{ width: '32px', height: '32px' }}
            >
              <XMarkIcon className="w-6 h-6" style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
            </button>
            <h2 className="font-semibold text-white" style={{ fontSize: '17px' }}>
              Project Details
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '16px' }}>
          {/* Cover Image */}
          {project.cover_image && (
            <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
              <img
                src={project.cover_image}
                alt={project.title}
                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* Project Info */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'inline-block',
              background: 'rgba(139, 92, 246, 0.2)',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#A78BFA',
              letterSpacing: '0.5px',
              marginBottom: '12px'
            }}>
              PROJECT
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFF', marginBottom: '8px' }}>
              {project.title}
            </h3>
            {project.description && (
              <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1.5 }}>
                {project.description}
              </p>
            )}
          </div>

          {/* Meta Info */}
          <div style={{ 
            display: 'flex', 
            gap: '16px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '10px',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>
                Created
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFF' }}>
                {project.created_at ? formatRelativeTime(project.created_at) : 'Unknown'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>
                Items
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFF' }}>
                {project.media_count || 0}
              </div>
            </div>
          </div>

          {/* Tags */}
          {project.tags && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '8px' }}>
                Tags
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {project.tags.split(',').map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    style={{
                      padding: '4px 10px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '100px',
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
