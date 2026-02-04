'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Profile, PortfolioItem, Project } from '@/lib/types';

interface SetupTask {
  id: string;
  title: string;
  description: string;
  buttonLabel: string;
  action: () => void;
  isComplete: boolean;
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

  // Define all tasks with group info for subtle dividers
  const tasks: (SetupTask & { group: number })[] = [
    // Group 1: Profile basics
    {
      id: 'avatar',
      title: 'Add your avatar',
      description: 'Upload a profile photo that represents you.',
      buttonLabel: 'Upload Avatar',
      isComplete: !!profile?.profile_picture,
      group: 1,
      action: () => {
        setIsOpen(false);
        setTimeout(() => router.push('/settings'), 200);
      },
    },
    {
      id: 'banner',
      title: 'Customize your banner',
      description: 'Add a banner image to make your profile stand out.',
      buttonLabel: 'Upload Banner',
      isComplete: !!profile?.banner_image,
      group: 1,
      action: () => {
        setIsOpen(false);
        setTimeout(() => router.push('/settings'), 200);
      },
    },
    // Group 2: About you
    {
      id: 'story',
      title: 'Tell your story',
      description: 'Share who you are in a few sentences.',
      buttonLabel: 'Write Story',
      isComplete: (profile?.about?.length || 0) > 10,
      group: 2,
      action: () => {
        setIsOpen(false);
        setTimeout(() => {
          onNavigateTab('about');
          setTimeout(() => onActivateCustomize(), 100);
        }, 200);
      },
    },
    {
      id: 'experience',
      title: 'Add your experience',
      description: 'Showcase your journey and career milestones.',
      buttonLabel: 'Add Experience',
      isComplete: experiences > 0,
      group: 2,
      action: () => {
        setIsOpen(false);
        setTimeout(() => {
          onNavigateTab('about');
          setTimeout(() => onActivateCustomize(), 100);
        }, 200);
      },
    },
    {
      id: 'skills',
      title: 'Highlight your skills',
      description: 'Add your top skills so others know what you bring.',
      buttonLabel: 'Add Skills',
      isComplete: skills >= 3,
      group: 2,
      action: () => {
        setIsOpen(false);
        setTimeout(() => {
          onNavigateTab('about');
          setTimeout(() => onActivateCustomize(), 100);
        }, 200);
      },
    },
    {
      id: 'socials',
      title: 'Link your socials',
      description: 'Connect your social profiles.',
      buttonLabel: 'Add Socials',
      isComplete: socialLinks >= 2,
      group: 2,
      action: () => {
        setIsOpen(false);
        setTimeout(() => {
          onNavigateTab('about');
          setTimeout(() => onActivateCustomize(), 100);
        }, 200);
      },
    },
    // Group 3: Content
    {
      id: 'posts',
      title: 'Share your work',
      description: `Upload your best pieces. ${portfolioItems.length}/5 posts.`,
      buttonLabel: 'Add Posts',
      isComplete: portfolioItems.length >= 5,
      group: 3,
      action: () => {
        setIsOpen(false);
        setTimeout(() => {
          onNavigateTab('portfolio');
          setTimeout(() => onActivateCustomize(), 100);
        }, 200);
      },
    },
    {
      id: 'project',
      title: 'Create a project',
      description: 'Group related work into a project.',
      buttonLabel: 'Create Project',
      isComplete: projects.length >= 1,
      group: 3,
      action: () => {
        setIsOpen(false);
        setTimeout(() => {
          onNavigateTab('projects');
          setTimeout(() => onActivateCustomize(), 100);
        }, 200);
      },
    },
    // Group 4: Growth
    {
      id: 'quiz',
      title: 'Discover your strengths',
      description: 'Take a quick quiz to define your brand.',
      buttonLabel: 'Take Quiz',
      isComplete: quizResults.length >= 1,
      group: 4,
      action: () => {
        setIsOpen(false);
        setTimeout(() => router.push('/analytics'), 200);
      },
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

  // Calculate SVG circle properties for progress ring
  const size = 52;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <>
      {/* Trigger Button - Circular with progress ring border */}
      <button
        onClick={openModal}
        className="transition-all active:scale-[0.94]"
        style={{
          position: 'fixed',
          bottom: '100px',
          left: '20px',
          zIndex: 998,
          width: `${size}px`,
          height: `${size}px`,
          padding: 0,
          background: 'rgba(20, 20, 24, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Progress ring SVG */}
        <svg
          width={size}
          height={size}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: 'rotate(-90deg)',
          }}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#00C2FF"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* Percentage text */}
        <span
          style={{
            fontSize: '13px',
            fontWeight: '700',
            color: '#fff',
            letterSpacing: '-0.3px',
            zIndex: 1,
          }}
        >
          {progress}%
        </span>
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
              maxHeight: '75vh',
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>

              {/* Title */}
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#fff', letterSpacing: '-0.2px' }}>
                Profile Setup
              </span>

              {/* Progress badge */}
              <span
                style={{
                  position: 'absolute',
                  right: '16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#00C2FF',
                }}
              >
                {completedCount}/{totalTasks}
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ padding: '16px 20px 8px' }}>
              <div
                style={{
                  height: '5px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: '#00C2FF',
                    borderRadius: '3px',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            {/* Tasks list - Flat with subtle group dividers */}
            <div style={{ padding: '8px 16px 40px', overflowY: 'auto', maxHeight: 'calc(75vh - 100px)' }}>
              <div>
                {tasks.map((task, index) => {
                  const prevTask = index > 0 ? tasks[index - 1] : null;
                  const isNewGroup = prevTask && prevTask.group !== task.group;
                  
                  return (
                  <div
                    key={task.id}
                    style={{
                      borderTop: isNewGroup ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                      marginTop: isNewGroup ? '8px' : 0,
                      paddingTop: isNewGroup ? '8px' : 0,
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
                      {/* Checkbox indicator */}
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: task.isComplete ? '#34C759' : 'transparent',
                          border: task.isComplete ? 'none' : '2px solid rgba(255, 255, 255, 0.25)',
                          flexShrink: 0,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {task.isComplete && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
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
                          width="14"
                          height="14"
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
                          padding: '0 16px 14px 48px',
                          animation: 'fadeIn 0.2s ease',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '13px',
                            color: 'rgba(255, 255, 255, 0.45)',
                            lineHeight: 1.4,
                            margin: '0 0 12px 0',
                          }}
                        >
                          {task.description}
                        </p>
                        <button
                          onClick={task.action}
                          className="transition-all active:scale-[0.98]"
                          style={{
                            height: '32px',
                            padding: '0 16px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#00C2FF',
                            border: 'none',
                            borderRadius: '7px',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                          }}
                        >
                          {task.buttonLabel}
                        </button>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
