'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Profile, PortfolioItem, Project } from '@/lib/types';

interface SetupTask {
  id: string;
  title: string;
  description: string;
  category: 'profile' | 'portfolio' | 'projects' | 'about' | 'growth';
  categoryLabel: string;
  action: () => void;
  isComplete: boolean;
  icon: React.ReactNode;
}

interface SetupChecklistProps {
  profile: Profile | null;
  portfolioItems: PortfolioItem[];
  projects: Project[];
  quizResults: Array<{ id: number }>;
  onNavigateTab: (tab: string) => void;
  onActivateCustomize: () => void;
}

export default function SetupChecklist({
  profile,
  portfolioItems,
  projects,
  quizResults,
  onNavigateTab,
  onActivateCustomize,
}: SetupChecklistProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  // Parse social links
  const socialLinks = profile?.social_links ? Object.keys(JSON.parse(profile.social_links || '{}')).length : 0;
  
  // Parse skills
  const skills = profile?.skills ? (() => {
    try {
      const parsed = JSON.parse(profile.skills);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return profile.skills.split(',').filter(s => s.trim()).length;
    }
  })() : 0;

  // Parse experiences
  const experiences = profile?.experience ? (() => {
    try {
      const parsed = JSON.parse(profile.experience);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  })() : 0;

  // Define all tasks
  const tasks: SetupTask[] = [
    // Profile Category
    {
      id: 'avatar',
      title: 'Add your avatar',
      description: 'Upload a profile photo that represents you. First impressions matter — make yours memorable.',
      category: 'profile',
      categoryLabel: 'Profile',
      isComplete: !!profile?.profile_picture,
      action: () => {
        setIsOpen(false);
        setTimeout(() => router.push('/settings'), 200);
      },
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="5"/>
          <path d="M20 21a8 8 0 0 0-16 0"/>
        </svg>
      ),
    },
    {
      id: 'banner',
      title: 'Customize your banner',
      description: 'Add a banner image to make your profile stand out. Show your style at first glance.',
      category: 'profile',
      categoryLabel: 'Profile',
      isComplete: !!profile?.banner_image,
      action: () => {
        setIsOpen(false);
        setTimeout(() => router.push('/settings'), 200);
      },
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
      ),
    },
    // About Category
    {
      id: 'story',
      title: 'Tell your story',
      description: 'Share who you are in a few sentences. Let visitors connect with you on a personal level.',
      category: 'about',
      categoryLabel: 'About',
      isComplete: (profile?.about?.length || 0) > 10,
      action: () => {
        setIsOpen(false);
        setTimeout(() => {
          onNavigateTab('about');
          setTimeout(() => onActivateCustomize(), 100);
        }, 200);
      },
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      ),
    },
    {
      id: 'experience',
      title: 'Add your experience',
      description: 'Showcase your journey — jobs, projects, or milestones that shaped your career.',
      category: 'about',
      categoryLabel: 'About',
      isComplete: experiences > 0,
      action: () => {
        setIsOpen(false);
        setTimeout(() => {
          onNavigateTab('about');
          setTimeout(() => onActivateCustomize(), 100);
        }, 200);
      },
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
      ),
    },
    {
      id: 'skills',
      title: 'Highlight your skills',
      description: 'Add your top skills so others know what you bring to the table.',
      category: 'about',
      categoryLabel: 'About',
      isComplete: skills >= 3,
      action: () => {
        setIsOpen(false);
        setTimeout(() => {
          onNavigateTab('about');
          setTimeout(() => onActivateCustomize(), 100);
        }, 200);
      },
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
    },
    {
      id: 'socials',
      title: 'Link your socials',
      description: 'Connect your social profiles so people can find you everywhere.',
      category: 'about',
      categoryLabel: 'About',
      isComplete: socialLinks >= 2,
      action: () => {
        setIsOpen(false);
        setTimeout(() => {
          onNavigateTab('about');
          setTimeout(() => onActivateCustomize(), 100);
        }, 200);
      },
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      ),
    },
    // Portfolio Category
    {
      id: 'posts',
      title: 'Share your work',
      description: `Upload your best pieces — photos, videos, audio, or documents. You have ${portfolioItems.length}/5 posts.`,
      category: 'portfolio',
      categoryLabel: 'Portfolio',
      isComplete: portfolioItems.length >= 5,
      action: () => {
        setIsOpen(false);
        setTimeout(() => {
          onNavigateTab('portfolio');
          setTimeout(() => onActivateCustomize(), 100);
        }, 200);
      },
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M3 9h18"/>
          <path d="M9 21V9"/>
        </svg>
      ),
    },
    // Projects Category
    {
      id: 'project',
      title: 'Create a project',
      description: 'Group related work into a project. Tell the story behind your best work.',
      category: 'projects',
      categoryLabel: 'Projects',
      isComplete: projects.length >= 1,
      action: () => {
        setIsOpen(false);
        setTimeout(() => {
          onNavigateTab('projects');
          setTimeout(() => onActivateCustomize(), 100);
        }, 200);
      },
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    // Growth Category
    {
      id: 'quiz',
      title: 'Discover your strengths',
      description: 'Take a quick quiz to uncover hidden skills and define your personal brand.',
      category: 'growth',
      categoryLabel: 'Growth',
      isComplete: quizResults.length >= 1,
      action: () => {
        setIsOpen(false);
        setTimeout(() => router.push('/analytics'), 200);
      },
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="6"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      ),
    },
  ];

  const completedCount = tasks.filter(t => t.isComplete).length;
  const totalTasks = tasks.length;
  const progress = Math.round((completedCount / totalTasks) * 100);

  // Don't show if 100% complete
  if (progress === 100) return null;

  // Open modal with animation
  const openModal = () => {
    setIsOpen(true);
    setTimeout(() => setModalVisible(true), 10);
  };

  // Close modal with animation
  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => {
      setIsOpen(false);
      setExpandedTask(null);
    }, 200);
  };

  // Toggle task expansion (accordion)
  const toggleTask = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  // Group tasks by category
  const categories = ['profile', 'about', 'portfolio', 'projects', 'growth'];
  const categoryLabels: Record<string, string> = {
    profile: 'Profile',
    about: 'About You',
    portfolio: 'Portfolio',
    projects: 'Projects',
    growth: 'Growth',
  };

  return (
    <>
      {/* Trigger Button - Glassy pill, fixed bottom-left */}
      <button
        onClick={openModal}
        className="transition-all active:scale-[0.96]"
        style={{
          position: 'fixed',
          bottom: '100px',
          left: '20px',
          zIndex: 998,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: 'rgba(30, 30, 34, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          color: '#fff',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Progress ring */}
        <div style={{ position: 'relative', width: '24px', height: '24px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background circle */}
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="2.5"
            />
            {/* Progress circle */}
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="#00C2FF"
              strokeWidth="2.5"
              strokeDasharray={`${(progress / 100) * 62.83} 62.83`}
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span>{completedCount}/{totalTasks} Set up</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={closeModal}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 9998,
              opacity: modalVisible ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
          />

          {/* Bottom Sheet */}
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '80vh',
              background: '#111111',
              borderRadius: '20px 20px 0 0',
              zIndex: 9999,
              overflow: 'hidden',
              transform: modalVisible ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {/* Header */}
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                height: '55px',
                background: 'rgba(17, 17, 17, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Close button */}
              <button
                onClick={closeModal}
                style={{
                  position: 'absolute',
                  left: '16px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>

              {/* Title with progress badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#fff', letterSpacing: '-0.2px' }}>
                  Profile Setup
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#00C2FF',
                    background: 'rgba(0, 194, 255, 0.12)',
                    padding: '4px 10px',
                    borderRadius: '12px',
                  }}
                >
                  {progress}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ padding: '0 20px', marginTop: '16px' }}>
              <div
                style={{
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #00C2FF 0%, #00E5FF 100%)',
                    borderRadius: '2px',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '8px', textAlign: 'center' }}>
                {completedCount === 0 
                  ? "Let's get started! Complete these steps to build your profile."
                  : completedCount < totalTasks / 2
                  ? "Great progress! Keep going to unlock your full potential."
                  : completedCount < totalTasks
                  ? "Almost there! Just a few more steps to complete."
                  : "Amazing! Your profile is fully set up."}
              </p>
            </div>

            {/* Tasks list */}
            <div style={{ padding: '16px 16px 40px', overflowY: 'auto', maxHeight: 'calc(80vh - 140px)' }}>
              {categories.map((category) => {
                const categoryTasks = tasks.filter(t => t.category === category);
                const categoryCompleted = categoryTasks.filter(t => t.isComplete).length;
                
                return (
                  <div key={category} style={{ marginBottom: '16px' }}>
                    {/* Category header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 4px',
                        marginBottom: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: 'rgba(255, 255, 255, 0.35)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {categoryLabels[category]}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          color: categoryCompleted === categoryTasks.length ? '#00C2FF' : 'rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        {categoryCompleted}/{categoryTasks.length}
                      </span>
                    </div>

                    {/* Category tasks */}
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '14px',
                        overflow: 'hidden',
                      }}
                    >
                      {categoryTasks.map((task, index) => (
                        <div
                          key={task.id}
                          style={{
                            borderBottom: index < categoryTasks.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                          }}
                        >
                          {/* Task header (always visible) */}
                          <button
                            onClick={() => !task.isComplete && toggleTask(task.id)}
                            style={{
                              width: '100%',
                              padding: '14px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              background: 'transparent',
                              border: 'none',
                              cursor: task.isComplete ? 'default' : 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            {/* Status indicator */}
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: task.isComplete ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                border: task.isComplete ? '1px solid rgba(52, 199, 89, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                                color: task.isComplete ? '#34C759' : 'rgba(255, 255, 255, 0.5)',
                                flexShrink: 0,
                              }}
                            >
                              {task.isComplete ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              ) : (
                                task.icon
                              )}
                            </div>

                            {/* Title */}
                            <span
                              style={{
                                flex: 1,
                                fontSize: '14px',
                                fontWeight: '500',
                                color: task.isComplete ? 'rgba(255, 255, 255, 0.4)' : '#fff',
                                textDecoration: task.isComplete ? 'line-through' : 'none',
                              }}
                            >
                              {task.title}
                            </span>

                            {/* Chevron (only for incomplete tasks) */}
                            {!task.isComplete && (
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.3)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                  transform: expandedTask === task.id ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s ease',
                                }}
                              >
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            )}
                          </button>

                          {/* Expanded content */}
                          {expandedTask === task.id && !task.isComplete && (
                            <div
                              style={{
                                padding: '0 16px 16px',
                                animation: 'fadeIn 0.2s ease',
                              }}
                            >
                              <p
                                style={{
                                  fontSize: '13px',
                                  color: 'rgba(255, 255, 255, 0.5)',
                                  lineHeight: 1.5,
                                  margin: '0 0 14px 40px',
                                }}
                              >
                                {task.description}
                              </p>
                              <button
                                onClick={task.action}
                                className="transition-all active:scale-[0.98]"
                                style={{
                                  width: 'calc(100% - 40px)',
                                  marginLeft: '40px',
                                  height: '40px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  background: '#00C2FF',
                                  border: 'none',
                                  borderRadius: '10px',
                                  color: '#fff',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                }}
                              >
                                Get started
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="5" y1="12" x2="19" y2="12"/>
                                  <polyline points="12 5 19 12 12 19"/>
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
