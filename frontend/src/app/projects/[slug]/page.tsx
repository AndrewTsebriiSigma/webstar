'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon, PlayIcon, MusicalNoteIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Project, ProjectMedia } from '@/lib/types';
import { projectsAPI } from '@/lib/api';
import Link from 'next/link';

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { slug } = params;
  
  const [project, setProject] = useState<Project | null>(null);
  const [projectMedia, setProjectMedia] = useState<ProjectMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);

  // Decode slug to get project title (replace hyphens with spaces)
  const projectTitle = decodeURIComponent(slug).replace(/-/g, ' ');

  useEffect(() => {
    const loadProject = async () => {
      setLoading(true);
      try {
        // Get all projects and find by title match
        const response = await projectsAPI.getProjects();
        const projects = response.data || [];
        
        // Find project by slug match (title converted to slug)
        const foundProject = projects.find((p: Project) => {
          const projectSlug = p.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          const searchSlug = slug.toLowerCase();
          return projectSlug === searchSlug || p.id.toString() === slug;
        });

        if (foundProject) {
          setProject(foundProject);
          
          // Load project media
          const mediaResponse = await projectsAPI.getProjectMedia(foundProject.id);
          setProjectMedia(mediaResponse.data || []);
        } else {
          setError('Project not found');
        }
      } catch (err) {
        console.error('Failed to load project:', err);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [slug]);

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#111111' }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#00C2FF' }}></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: '#111111' }}
      >
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>📁</div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#FFF', marginBottom: '12px' }}>
          {error || 'Project Not Found'}
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginBottom: '24px' }}>
          This project may have been removed or doesn't exist.
        </p>
        <button
          onClick={handleBack}
          style={{
            padding: '12px 32px',
            borderRadius: '12px',
            background: '#00C2FF',
            color: '#000',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const getMediaUrl = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') 
      ? url 
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url}`;
  };

  return (
    <div className="min-h-screen" style={{ background: '#111111' }}>
      {/* Header */}
      <header 
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(17, 17, 17, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        <div style={{ height: '55px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={handleBack}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ArrowLeftIcon className="w-5 h-5" style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
          </button>
          <h1 style={{ fontSize: '17px', fontWeight: 600, color: '#FFF', flex: 1 }}>
            {project.title}
          </h1>
        </div>
      </header>

      {/* Content */}
      <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Cover Image */}
        {project.cover_image && (
          <div 
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: '16px',
              overflow: 'hidden',
              marginBottom: '20px',
              background: 'rgba(255, 255, 255, 0.03)'
            }}
          >
            <img
              src={getMediaUrl(project.cover_image)}
              alt={project.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        )}

        {/* Project Info */}
        <div style={{ marginBottom: '24px' }}>
          <div 
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: '8px',
              background: 'rgba(139, 92, 246, 0.15)',
              color: '#A78BFA',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              marginBottom: '12px'
            }}
          >
            PROJECT
          </div>
          
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#FFF', marginBottom: '12px' }}>
            {project.title}
          </h2>
          
          {project.description && (
            <p style={{ 
              fontSize: '15px', 
              color: 'rgba(255, 255, 255, 0.6)', 
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {project.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div 
          style={{
            display: 'flex',
            gap: '24px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            marginBottom: '24px'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>Items</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFF' }}>{projectMedia.length || project.media_count || 0}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '4px' }}>Created</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#FFF' }}>
              {new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Tags */}
        {project.tags && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.4)', marginBottom: '8px' }}>
              Tags
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {project.tags.split(',').map((tag, idx) => (
                <span 
                  key={idx}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '100px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Media Grid */}
        {projectMedia.length > 0 && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.4)', marginBottom: '12px' }}>
              Project Media
            </div>
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px'
              }}
            >
              {projectMedia.map((media, index) => (
                <div
                  key={media.id}
                  onClick={() => setSelectedMediaIndex(index)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.03)',
                    position: 'relative'
                  }}
                >
                  {media.media_type === 'video' ? (
                    <>
                      <video
                        src={getMediaUrl(media.media_url)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        muted
                      />
                      <div 
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        <PlayIcon className="w-8 h-8" style={{ color: '#FFF' }} />
                      </div>
                    </>
                  ) : media.media_type === 'audio' ? (
                    <div 
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.15), rgba(0, 194, 255, 0.1))'
                      }}
                    >
                      <MusicalNoteIcon className="w-8 h-8" style={{ color: '#0A84FF' }} />
                    </div>
                  ) : (
                    <img
                      src={getMediaUrl(media.thumbnail_url || media.media_url)}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Media Lightbox */}
      {selectedMediaIndex !== null && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.95)' }}
          onClick={() => setSelectedMediaIndex(null)}
        >
          <button
            onClick={() => setSelectedMediaIndex(null)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <XMarkIcon className="w-6 h-6" style={{ color: '#FFF' }} />
          </button>
          
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
          >
            {projectMedia[selectedMediaIndex].media_type === 'video' ? (
              <video
                src={getMediaUrl(projectMedia[selectedMediaIndex].media_url)}
                controls
                autoPlay
                style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px' }}
              />
            ) : projectMedia[selectedMediaIndex].media_type === 'audio' ? (
              <div 
                style={{
                  padding: '48px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  textAlign: 'center'
                }}
              >
                <MusicalNoteIcon className="w-16 h-16 mx-auto mb-4" style={{ color: '#0A84FF' }} />
                <audio
                  src={getMediaUrl(projectMedia[selectedMediaIndex].media_url)}
                  controls
                  autoPlay
                  style={{ width: '300px' }}
                />
              </div>
            ) : (
              <img
                src={getMediaUrl(projectMedia[selectedMediaIndex].media_url)}
                alt=""
                style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

