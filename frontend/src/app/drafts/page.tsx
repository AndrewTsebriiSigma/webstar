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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<'media' | 'audio' | 'pdf' | 'text' | null>(null);
  
  // Editing draft state
  const [editingDraft, setEditingDraft] = useState<PortfolioItem | null>(null);
  
  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<PortfolioItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [localDraftsOrder, setLocalDraftsOrder] = useState<PortfolioItem[]>([]);

  // Refs for dropdown
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
      const loadedDrafts = draftsResponse.data || [];
      setDrafts(loadedDrafts);
      setLocalDraftsOrder(loadedDrafts);
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
    let filtered = localDraftsOrder.length > 0 ? localDraftsOrder : drafts;
    
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
  }, [drafts, localDraftsOrder, searchQuery, filterType]);

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
    setShowProjectModal(true);
  };

  // Handle filter type change
  const handleFilterTypeChange = (type: ContentType) => {
    console.log('Filter changed to:', type); // Debug log
    setFilterType(type);
  };

  // Handle sort type change
  const handleSortTypeChange = (sort: SortType) => {
    console.log('Sort changed to:', sort); // Debug log
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, draft: PortfolioItem, index: number) => {
    setDraggedItem(draft);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    // Add visual feedback
    const target = e.currentTarget as HTMLElement;
    if (target) {
      setTimeout(() => {
        target.style.opacity = '0.4';
        target.style.transform = 'scale(0.95)';
      }, 0);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the drop zone entirely
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
      e.currentTarget.style.transform = 'scale(1)';
    }
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex !== dropIndex && draggedItem) {
      // Reorder locally using the sortedDrafts array
      const newDrafts = [...sortedDrafts];
      const [removed] = newDrafts.splice(dragIndex, 1);
      newDrafts.splice(dropIndex, 0, removed);
      
      // Update local order
      setLocalDraftsOrder(newDrafts);
      
      // Also update the main drafts array
      setDrafts(newDrafts);
      
      toast.success('Draft order updated');
    }
    
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  // Touch drag handlers for mobile
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent, draft: PortfolioItem, index: number) => {
    setTouchStartY(e.touches[0].clientY);
    setTouchDragIndex(index);
    setDraggedItem(draft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null || touchDragIndex === null) return;
    
    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    
    // Find the draft card under the touch point
    for (const el of elements) {
      const draftCard = el.closest('[data-draft-index]');
      if (draftCard) {
        const index = parseInt(draftCard.getAttribute('data-draft-index') || '-1');
        if (index !== -1 && index !== touchDragIndex) {
          setDragOverIndex(index);
        }
        break;
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchDragIndex !== null && dragOverIndex !== null && touchDragIndex !== dragOverIndex) {
      // Perform the reorder
      const newDrafts = [...sortedDrafts];
      const [removed] = newDrafts.splice(touchDragIndex, 1);
      newDrafts.splice(dragOverIndex, 0, removed);
      
      setLocalDraftsOrder(newDrafts);
      setDrafts(newDrafts);
      toast.success('Draft order updated');
    }
    
    setTouchStartY(null);
    setTouchDragIndex(null);
    setDraggedItem(null);
    setDragOverIndex(null);
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
                  </div>
                  <div style={{ padding: '8px 10px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {project.title}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drafts Grid - 3 Column */}
        {sortedDrafts.length > 0 ? (
          <div 
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
                onDragStart={(e) => handleDragStart(e, draft, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                onTouchStart={(e) => handleTouchStart(e, draft, index)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={() => handleDraftClick(draft)}
                style={{ 
                  position: 'relative',
                  cursor: 'grab',
                  transition: 'all 150ms ease-out',
                  transform: dragOverIndex === index ? 'scale(1.05)' : 'scale(1)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: dragOverIndex === index 
                    ? '2px solid #00C2FF' 
                    : draggedItem?.id === draft.id 
                      ? '2px dashed rgba(0, 194, 255, 0.5)' 
                      : '1px solid rgba(255, 255, 255, 0.04)',
                  opacity: draggedItem?.id === draft.id ? 0.5 : 1,
                  boxShadow: dragOverIndex === index ? '0 8px 24px rgba(0, 194, 255, 0.2)' : 'none'
                }}
              >
                {/* Content Display */}
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
                {draggedItem === null && (
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

                {/* Footer with title and time */}
                <div 
                  className="draft-card-desc"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.85))',
                    padding: '24px 8px 6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  {draft.title && (
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#FFF',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {draft.title}
                    </div>
                  )}
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

      {/* Project Modal */}
      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSuccess={loadDrafts}
      />
    </div>
  );
}
