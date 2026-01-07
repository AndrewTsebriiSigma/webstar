'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { portfolioAPI, projectsAPI } from '@/lib/api';
import { PortfolioItem, Project } from '@/lib/types';
import toast from 'react-hot-toast';
import ContentDisplay from '@/components/ContentDisplay';
import UploadPortfolioModal from '@/components/UploadPortfolioModal';
import CreateProjectModal from '@/components/CreateProjectModal';
import CreateContentModal from '@/components/CreateContentModal';
import FeedModal from '@/components/FeedModal';
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
  
  // Feed modal state
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [feedInitialPostId, setFeedInitialPostId] = useState<number | undefined>(undefined);

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
  const filteredDrafts = drafts.filter(draft => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = draft.title?.toLowerCase().includes(query);
      const matchesDesc = draft.description?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDesc) return false;
    }
    
    // Type filter
    if (filterType !== 'all' && filterType !== 'project') {
      if (filterType === 'text') {
        return draft.content_type === 'text';
      }
      return draft.content_type === filterType;
    }
    
    return true;
  });

  // Sort drafts
  const sortedDrafts = [...filteredDrafts].sort((a, b) => {
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

  // Show projects when filter is 'all' or 'project'
  const filteredProjects = filterType === 'all' || filterType === 'project' ? projects : [];

  const handleSelectPost = (type?: 'media' | 'audio' | 'pdf' | 'text') => {
    setSelectedPostType(type || null);
    setShowCreateModal(false);
    setShowUploadModal(true);
  };

  const handleSelectProject = () => {
    setShowCreateModal(false);
    setShowProjectModal(true);
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
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(17, 17, 17, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
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

            {/* Filter Button */}
            <div style={{ position: 'relative' }}>
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

              {/* Filter Dropdown - iOS style compact design */}
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
                    minWidth: '160px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                    zIndex: 100
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
                        onClick={() => setFilterType(type)}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '100px',
                          background: filterType === type ? '#00C2FF' : 'rgba(255, 255, 255, 0.06)',
                          border: 'none',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: filterType === type ? '#000' : 'rgba(255, 255, 255, 0.7)',
                          cursor: 'pointer',
                          transition: 'all 100ms',
                          textTransform: 'capitalize'
                        }}
                      >
                        {type === 'text' ? 'memo' : type}
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
                      onClick={() => {
                        setSortType(sort);
                        setShowFilterMenu(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px',
                        background: sortType === sort ? 'rgba(0, 194, 255, 0.12)' : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 100ms'
                      }}
                    >
                      <span style={{ 
                        fontSize: '13px', 
                        fontWeight: 500, 
                        color: sortType === sort ? '#00C2FF' : 'rgba(255, 255, 255, 0.7)', 
                        textTransform: 'capitalize' 
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

        {/* Drafts Grid - 3 Column (same as Portfolio) */}
        {sortedDrafts.length > 0 ? (
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '5px'
            }}
          >
            {sortedDrafts.map((draft) => (
              <div 
                key={draft.id}
                onClick={() => {
                  setFeedInitialPostId(draft.id);
                  setShowFeedModal(true);
                }}
                style={{ position: 'relative' }}
              >
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
              No Drafts Yet
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '24px' }}>
              Drafts you save will appear here
            </p>
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

      {/* Upload Modal */}
      <UploadPortfolioModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedPostType(null);
        }}
        onSuccess={loadDrafts}
        initialContentType={selectedPostType}
      />

      {/* Project Modal */}
      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSuccess={loadDrafts}
      />

      {/* Feed Modal for viewing draft details */}
      <FeedModal
        isOpen={showFeedModal}
        onClose={() => setShowFeedModal(false)}
        posts={sortedDrafts}
        initialPostId={feedInitialPostId}
      />

      {/* Click outside to close filter menu */}
      {showFilterMenu && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 50 }}
          onClick={() => setShowFilterMenu(false)}
        />
      )}
    </div>
  );
}
