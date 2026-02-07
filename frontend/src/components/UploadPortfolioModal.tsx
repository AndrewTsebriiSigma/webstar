'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { uploadsAPI, portfolioAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { PortfolioItem } from '@/lib/types';

interface UploadPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialContentType?: 'media' | 'audio' | 'pdf' | 'text' | null;
  defaultSaveAsDraft?: boolean; // When true, primary action is "Save as Draft" instead of "Publish"
  editingDraft?: PortfolioItem | null; // When provided, pre-fill modal with existing draft data
}

export default function UploadPortfolioModal({ isOpen, onClose, onSuccess, initialContentType, defaultSaveAsDraft = false, editingDraft = null }: UploadPortfolioModalProps) {
  // Type is always pre-selected from CreateContentModal or from editingDraft
  const [selectedContentType, setSelectedContentType] = useState<'media' | 'audio' | 'pdf' | 'text' | null>(initialContentType || null);
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isVideoPreview, setIsVideoPreview] = useState(false); // Track if preview is video
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [textContent, setTextContent] = useState(''); // For text posts
  
  // Attachment states
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<'audio' | 'pdf' | null>(null);
  const [attachmentSwipeX, setAttachmentSwipeX] = useState(0);
  const [attachmentStartX, setAttachmentStartX] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [attachmentFileName, setAttachmentFileName] = useState('');
  const [isRemovingAttachment, setIsRemovingAttachment] = useState(false);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<string>('');
  const [showPdfPopup, setShowPdfPopup] = useState(false);
  const [showFullScreenPreview, setShowFullScreenPreview] = useState(false);
  
  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);
  
  // Bottom slider animation states
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Memoized blob URLs to prevent recreation on re-render
  const [attachmentBlobUrl, setAttachmentBlobUrl] = useState<string>('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>(''); // For PDF file preview
  const [isPdfPreview, setIsPdfPreview] = useState(false); // Track if preview is PDF
  
  // Animated progress display with spring effect
  const [displayProgress, setDisplayProgress] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  
  // Spring animation for progress number
  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    const animateProgress = () => {
      setDisplayProgress(prev => {
        const diff = uploadProgress - prev;
        // Spring-like easing: faster when far, slower when close
        const step = diff * 0.15;
        if (Math.abs(diff) < 0.5) return uploadProgress;
        return prev + step;
      });
      animationFrameRef.current = requestAnimationFrame(animateProgress);
    };
    
    animationFrameRef.current = requestAnimationFrame(animateProgress);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [uploadProgress]);
  
  const attachmentNameRef = useRef<HTMLInputElement>(null);
  
  const [description, setDescription] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Scroll caption into view when focusing (so keyboard doesn't cover it)
  const handleDescriptionFocus = () => {
    if (textareaRef.current) {
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Swipe handlers for attachment
  const handleSwipeStart = (e: React.TouchEvent) => {
    setAttachmentStartX(e.touches[0].clientX);
  };

  const handleSwipeMove = (e: React.TouchEvent) => {
    const diff = attachmentStartX - e.touches[0].clientX;
    if (diff > 0) {
      // Swiping left - open delete
      setAttachmentSwipeX(Math.min(diff, 80));
    } else if (attachmentSwipeX > 0) {
      // Swiping right when delete is open - close it
      setAttachmentSwipeX(Math.max(0, 70 + diff));
    }
  };

  const handleSwipeEnd = () => {
    // Apple-style: first swipe shows delete button (stays open), tap to delete
    if (attachmentSwipeX > 30) {
      setAttachmentSwipeX(70); // Stay open showing delete
    } else {
      setAttachmentSwipeX(0); // Close
    }
  };
  
  // Tap delete button to remove
  const handleDeleteTap = () => {
    removeAttachment();
    setAttachmentSwipeX(0);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if leaving the actual drop zone
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (uploading) return;
    
    const droppedFile = e.dataTransfer.files[0];
    if (!droppedFile) return;
    
    // Validate based on selected content type
    if (selectedContentType === 'media') {
      if (!droppedFile.type.startsWith('image/') && !droppedFile.type.startsWith('video/')) {
        toast.error('Please drop an image or video file');
        return;
      }
    } else if (selectedContentType === 'audio' && !droppedFile.type.startsWith('audio/')) {
      toast.error('Please drop an audio file');
      return;
    } else if (selectedContentType === 'pdf' && droppedFile.type !== 'application/pdf') {
      toast.error('Please drop a PDF file');
      return;
    }
    
    // Check file size
    const isVideo = droppedFile.type.startsWith('video/');
    const isAudio = droppedFile.type.startsWith('audio/');
    const isPdf = droppedFile.type === 'application/pdf';
    
    const maxSize = isVideo ? 500 * 1024 * 1024 
                  : isAudio ? 50 * 1024 * 1024 
                  : isPdf ? 50 * 1024 * 1024
                  : 10 * 1024 * 1024;
    
    if (droppedFile.size > maxSize) {
      const sizeMB = isVideo ? '500MB' : isAudio ? '50MB' : isPdf ? '50MB' : '10MB';
      toast.error(`File must be less than ${sizeMB}`);
      return;
    }
    
    // Set file and create preview
    setFile(droppedFile);
    
    if (droppedFile.type.startsWith('image/') || droppedFile.type.startsWith('video/')) {
      const objectUrl = URL.createObjectURL(droppedFile);
      setPreview(objectUrl);
      setIsVideoPreview(droppedFile.type.startsWith('video/'));
      setIsPdfPreview(false);
      setPdfPreviewUrl('');
    } else if (droppedFile.type === 'application/pdf') {
      const objectUrl = URL.createObjectURL(droppedFile);
      setPdfPreviewUrl(objectUrl);
      setIsPdfPreview(true);
      setPreview('');
      setIsVideoPreview(false);
    } else {
      setPreview('');
      setIsVideoPreview(false);
      setIsPdfPreview(false);
      setPdfPreviewUrl('');
    }
    
    toast.success('File added!');
  };

  // Play/pause audio preview
  const toggleAudioPlay = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          // Ensure audio is loaded before playing
          if (audioRef.current.readyState < 2) {
            audioRef.current.load();
      }
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Audio playback failed:', error);
          toast.error('Failed to play audio');
          setIsPlaying(false);
        }
      }
    }
  };

  // Attachment availability logic:
  // - Audio post → PDF attachment allowed, audio disabled  
  // - PDF post → Audio attachment allowed, PDF disabled
  // - Memo (text) → All attachments allowed (audio, PDF, photo)
  // - Media (photo/video) → All attachments allowed
  const canAddAudioAttachment = selectedContentType === 'text' || selectedContentType === 'media' || selectedContentType === 'pdf';
  const canAddPdfAttachment = selectedContentType === 'text' || selectedContentType === 'media' || selectedContentType === 'audio';

  // Sync state when initialContentType changes
  useEffect(() => {
    if (initialContentType) {
      setSelectedContentType(initialContentType);
    }
  }, [initialContentType, isOpen]);

  // Pre-fill form when editing an existing draft
  useEffect(() => {
    if (editingDraft && isOpen) {
      setEditingDraftId(editingDraft.id);
      
      // Set content type based on draft's actual content type
      const draftContentType = editingDraft.content_type;
      if (draftContentType === 'photo' || draftContentType === 'video') {
        setSelectedContentType('media');
      } else if (draftContentType === 'audio') {
        setSelectedContentType('audio');
      } else if (draftContentType === 'pdf') {
        setSelectedContentType('pdf');
      } else if (draftContentType === 'text') {
        setSelectedContentType('text');
      }
      
      // Set description
      setDescription(editingDraft.description || '');
      
      // Set text content for text posts
      if (editingDraft.content_type === 'text') {
        setTextContent(editingDraft.text_content || '');
      }
      
      // Set preview for media
      if (editingDraft.content_url) {
        const mediaUrl = editingDraft.content_url.startsWith('http') 
          ? editingDraft.content_url 
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${editingDraft.content_url}`;
        setPreview(mediaUrl);
        // Check if it's a video based on content_type
        setIsVideoPreview(editingDraft.content_type === 'video');
      }
      
      // Set attachment info if present
      if (editingDraft.attachment_url && editingDraft.attachment_type) {
        setAttachmentType(editingDraft.attachment_type as 'audio' | 'pdf');
        setAttachmentFileName(editingDraft.attachment_url.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'attachment');
        // Store the full attachment URL for preview
        const attachUrl = editingDraft.attachment_url.startsWith('http') 
          ? editingDraft.attachment_url 
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${editingDraft.attachment_url}`;
        setExistingAttachmentUrl(attachUrl);
      }
    } else if (!editingDraft) {
      setEditingDraftId(null);
    }
  }, [editingDraft, isOpen]);

  // Memoize attachment blob URL to prevent audio issues on re-render
  useEffect(() => {
    if (attachmentFile) {
      const url = URL.createObjectURL(attachmentFile);
      setAttachmentBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setAttachmentBlobUrl('');
      };
    } else {
      setAttachmentBlobUrl('');
    }
  }, [attachmentFile]);

  // Lock body scroll when modal is open - Safari mobile fix
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';
      // Entrance animation
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      setIsClosing(false);
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    };
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleReset = () => {
    // Cleanup object URLs if any
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }
    // Note: attachmentBlobUrl is cleaned up by its useEffect
    setSelectedContentType(null);
    setEditingDraftId(null);
    setFile(null);
    setPreview('');
    setIsVideoPreview(false);
    setIsPdfPreview(false);
    setPdfPreviewUrl('');
    setTextContent('');
    setAttachmentFile(null);
    setAttachmentType(null);
    setAttachmentFileName('');
    setExistingAttachmentUrl('');
    setAttachmentBlobUrl('');
    setShowPdfPopup(false);
    setDescription('');
    setUploading(false);
    setUploadProgress(0);
    setIsPlaying(false);
  };

  const handleClose = () => {
    if (!uploading) {
      setIsClosing(true);
      setIsVisible(false);
      setTimeout(() => {
        handleReset();
        setIsClosing(false);
        onClose();
      }, 150);
    }
  };

  // Back = Close (no going back to CreateContentModal)
  const handleBack = handleClose;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate based on selected content type
    if (selectedContentType === 'media') {
      if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
        toast.error('Please select an image or video file');
        return;
      }
    } else if (selectedContentType === 'audio' && !selectedFile.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      return;
    } else if (selectedContentType === 'pdf' && selectedFile.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    // Check file size (increased limits)
    const isVideo = selectedFile.type.startsWith('video/');
    const isAudio = selectedFile.type.startsWith('audio/');
    const isPdf = selectedFile.type === 'application/pdf';
    
    const maxSize = isVideo ? 500 * 1024 * 1024 
                  : isAudio ? 50 * 1024 * 1024 
                  : isPdf ? 50 * 1024 * 1024
                  : 10 * 1024 * 1024; // photo
    
    if (selectedFile.size > maxSize) {
      const sizeMB = isVideo ? '500MB' 
                   : isAudio ? '50MB'
                   : isPdf ? '50MB'
                   : '10MB';
      toast.error(`File must be less than ${sizeMB}`);
      return;
    }

    setFile(selectedFile);
    
    // Cleanup previous object URLs if any
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    if (pdfPreviewUrl && pdfPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }
    
    // Create preview for images, videos, and PDFs
    if (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('video/')) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setIsVideoPreview(selectedFile.type.startsWith('video/'));
      setIsPdfPreview(false);
      setPdfPreviewUrl('');
    } else if (selectedFile.type === 'application/pdf') {
      // Create PDF preview URL
      const objectUrl = URL.createObjectURL(selectedFile);
      setPdfPreviewUrl(objectUrl);
      setIsPdfPreview(true);
      setPreview(''); // Clear image/video preview
      setIsVideoPreview(false);
    } else {
      setPreview('');
      setIsVideoPreview(false);
      setIsPdfPreview(false);
      setPdfPreviewUrl('');
    }
    
    // Reset input value to allow re-selecting the same file
    e.target.value = '';
  };

  const handleAudioAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('audio/')) {
      toast.error('Please select an audio file');
      e.target.value = ''; // Reset input
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('Audio file must be less than 50MB');
      e.target.value = ''; // Reset input
      return;
    }

    setAttachmentFile(selectedFile);
    setAttachmentType('audio');
    setAttachmentFileName(selectedFile.name.replace(/\.[^/.]+$/, ''));
    toast.success('Audio attachment added');
    
    // Reset input value to allow re-selecting the same file
    e.target.value = '';
  };

  const handlePdfAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      e.target.value = ''; // Reset input
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('PDF file must be less than 50MB');
      e.target.value = ''; // Reset input
      return;
    }

    setAttachmentFile(selectedFile);
    setAttachmentType('pdf');
    setAttachmentFileName(selectedFile.name.replace(/\.[^/.]+$/, ''));
    toast.success('PDF attachment added');
    
    // Reset input value to allow re-selecting the same file
    e.target.value = '';
  };


  const removeAttachment = () => {
    // Smooth fade + slide out animation
    setIsRemovingAttachment(true);
    setTimeout(() => {
      setAttachmentFile(null);
      setAttachmentType(null);
      setAttachmentFileName('');
      setExistingAttachmentUrl('');
      setIsRemovingAttachment(false);
      setAttachmentSwipeX(0);
    }, 250);
  };
  
  // Rich text editing features
  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      // Check if we're at the beginning of a line or after whitespace
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const linePrefix = value.substring(lineStart, start);
      
      // If line starts with "- " or just "-", convert to bullet point
      if (linePrefix.trim() === '-' || linePrefix.endsWith('- ')) {
        // Insert bullet point (• ) instead of tab
        const newValue = value.substring(0, lineStart) + '• ' + value.substring(start);
        setDescription(newValue);
        
        // Set cursor position after the bullet
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = lineStart + 2;
        }, 0);
      } else {
        // Regular tab behavior (indent)
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        setDescription(newValue);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }
    } else if (e.key === 'Enter' && selectedContentType === 'text') {
      // Auto-continue lists
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const value = textarea.value;
      
      // Get current line
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);
      
      // Check if current line starts with a bullet
      const bulletMatch = currentLine.match(/^(\s*)(•|\-|\*)\s/);
      if (bulletMatch) {
        e.preventDefault();
        const indent = bulletMatch[1];
        const bullet = bulletMatch[2];
        
        // If line only contains the bullet, remove it
        if (currentLine.trim() === bullet) {
          const newValue = value.substring(0, lineStart) + value.substring(start);
          setDescription(newValue);
          textarea.selectionStart = textarea.selectionEnd = lineStart;
        } else {
          // Continue the list
          const newValue = value.substring(0, start) + '\n' + indent + bullet + ' ' + value.substring(start);
          setDescription(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + indent.length + bullet.length + 3;
          }, 0);
        }
      }
    }
  };

  const handleSubmit = async () => {
    // Validation - when editing, we might not have a new file
    if (selectedContentType === 'text' && !textContent.trim()) {
      toast.error('Please enter some text');
      return;
    }
    
    // Only require file if not editing an existing draft with media
    if (selectedContentType !== 'text' && !file && !editingDraftId) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    
    // Smooth progress animation
    let progressInterval: NodeJS.Timeout | null = null;
    const startProgress = () => {
      let progress = 0;
      progressInterval = setInterval(() => {
        progress += Math.random() * 8 + 2; // Random increment between 2-10
        if (progress > 85) progress = 85; // Cap at 85% until complete
        setUploadProgress(Math.floor(progress));
      }, 150);
    };
    
    try {
      startProgress();

      if (selectedContentType === 'text') {
        // Text post flow - now with attachment support!
        
        // Handle attachment upload if present
        let attachmentUrl: string | null = existingAttachmentUrl || null;
        if (attachmentFile && attachmentType) {
          const attachmentResponse = await uploadsAPI.uploadMedia(attachmentFile, attachmentType);
          attachmentUrl = attachmentResponse.data.url;
        }
        
        if (editingDraftId) {
          // Update and publish existing draft
          await portfolioAPI.updateItem(editingDraftId, {
            text_content: textContent.trim(),
            description: description || null,
            is_draft: false,
            ...(attachmentUrl && { attachment_url: attachmentUrl, attachment_type: attachmentType }),
          });
          toast.success('Draft published! 🎉');
        } else {
        await portfolioAPI.createItem({
          content_type: 'text',
          content_url: null,
          text_content: textContent.trim(),
          description: description || null,
          aspect_ratio: '4:5',
            is_draft: false,
            attachment_url: attachmentUrl,
            attachment_type: attachmentType,
        });
          toast.success('Text post published! 🎉');
        }
        
        if (progressInterval) clearInterval(progressInterval);
        setUploadProgress(100);
      } else {
        // Media post flow
        if (!selectedContentType) {
          toast.error('Please select a content type');
          if (progressInterval) clearInterval(progressInterval);
          return;
        }
        
        let contentUrl = preview; // Use existing preview URL if editing
        let actualContentType: string = selectedContentType;
        
        // Only upload new file if one was selected
        if (file) {
          // Determine actual content type from file
        if (selectedContentType === 'media') {
          // Auto-detect based on file type
            if (file.type.startsWith('image/')) {
            actualContentType = 'photo';
            } else if (file.type.startsWith('video/')) {
            actualContentType = 'video';
          }
        }
        
        // Upload main file
          const uploadResponse = await uploadsAPI.uploadMedia(file, actualContentType);
          contentUrl = uploadResponse.data.url;
        }

        // Handle attachment upload if present
        let attachmentUrl = editingDraft?.attachment_url || null;
        if (attachmentFile && attachmentType) {
          const attachmentResponse = await uploadsAPI.uploadMedia(attachmentFile, attachmentType);
          attachmentUrl = attachmentResponse.data.url;
        }

        // Get file name as title for audio/pdf files
        const fileTitle = (actualContentType === 'audio' || actualContentType === 'pdf') && file 
          ? file.name.replace(/\.[^/.]+$/, '') // Remove extension
          : null;

        if (editingDraftId) {
          // Update and publish existing draft
          await portfolioAPI.updateItem(editingDraftId, {
            description: description || null,
            is_draft: false,
            ...(fileTitle && { title: fileTitle }),
            ...(file && { content_url: contentUrl, content_type: actualContentType }),
            ...(attachmentUrl && { attachment_url: attachmentUrl, attachment_type: attachmentType }),
          });
          toast.success('Draft published! 🎉');
        } else {
          // Create new portfolio item (published, not draft)
        await portfolioAPI.createItem({
          content_type: actualContentType,
          content_url: contentUrl,
            title: fileTitle,
          description: description || null,
          aspect_ratio: '1:1',
            is_draft: false,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
        });
          toast.success('Post published! 🎉');
        }

        if (progressInterval) clearInterval(progressInterval);
        setUploadProgress(100);
      }
      
      handleReset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Failed to publish');
      if (progressInterval) clearInterval(progressInterval);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSaveAsDraft = async () => {
    // Validation - when editing, we might not have a new file
    if (selectedContentType === 'text' && !textContent.trim()) {
      toast.error('Please enter some text');
      return;
    }
    
    // Only require file if not editing an existing draft with media
    if (selectedContentType !== 'text' && !file && !editingDraftId) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    
    // Smooth progress animation
    let progressInterval: NodeJS.Timeout | null = null;
    const startProgress = () => {
      let progress = 0;
      progressInterval = setInterval(() => {
        progress += Math.random() * 8 + 2; // Random increment between 2-10
        if (progress > 85) progress = 85; // Cap at 85% until complete
        setUploadProgress(Math.floor(progress));
      }, 150);
    };
    
    try {
      startProgress();

      if (selectedContentType === 'text') {
        // Text draft flow - now with attachment support!
        
        // Handle attachment upload if present
        let attachmentUrl: string | null = existingAttachmentUrl || null;
        if (attachmentFile && attachmentType) {
          const attachmentResponse = await uploadsAPI.uploadMedia(attachmentFile, attachmentType);
          attachmentUrl = attachmentResponse.data.url;
        }
        
        if (editingDraftId) {
          // Update existing draft
          await portfolioAPI.updateItem(editingDraftId, {
            text_content: textContent.trim(),
            description: description || null,
            is_draft: true,
            ...(attachmentUrl && { attachment_url: attachmentUrl, attachment_type: attachmentType }),
          });
          toast.success('Draft updated! 📝');
        } else {
          // Create new draft
        await portfolioAPI.createItem({
          content_type: 'text',
          content_url: null,
          text_content: textContent.trim(),
          description: description || null,
          aspect_ratio: '4:5',
          is_draft: true,
            attachment_url: attachmentUrl,
            attachment_type: attachmentType,
        });
          toast.success('Draft saved! 📝');
        }
        
        if (progressInterval) clearInterval(progressInterval);
        setUploadProgress(100);
      } else {
        // Media draft flow
        if (!selectedContentType) {
          toast.error('Please select a content type');
          if (progressInterval) clearInterval(progressInterval);
          return;
        }
        
        let contentUrl = preview; // Use existing preview URL if editing
        let actualContentType: string = selectedContentType;
        
        // Only upload new file if one was selected
        if (file) {
          // Determine actual content type from file
        if (selectedContentType === 'media') {
          // Auto-detect based on file type
            if (file.type.startsWith('image/')) {
            actualContentType = 'photo';
            } else if (file.type.startsWith('video/')) {
            actualContentType = 'video';
          }
        }
        
        // Upload main file
          const uploadResponse = await uploadsAPI.uploadMedia(file, actualContentType);
          contentUrl = uploadResponse.data.url;
        }

        // Handle attachment upload if present (only if new attachment file)
        let attachmentUrl = editingDraft?.attachment_url || null;
        if (attachmentFile && attachmentType) {
          const attachmentResponse = await uploadsAPI.uploadMedia(attachmentFile, attachmentType);
          attachmentUrl = attachmentResponse.data.url;
        }

        // Get file name as title for audio/pdf files
        const fileTitle = (actualContentType === 'audio' || actualContentType === 'pdf') && file 
          ? file.name.replace(/\.[^/.]+$/, '') // Remove extension
          : null;

        if (editingDraftId) {
          // Update existing draft
          await portfolioAPI.updateItem(editingDraftId, {
            description: description || null,
            is_draft: true,
            ...(fileTitle && { title: fileTitle }),
            ...(file && { content_url: contentUrl, content_type: actualContentType }),
            ...(attachmentUrl && { attachment_url: attachmentUrl, attachment_type: attachmentType }),
          });
          toast.success('Draft updated! 📝');
        } else {
          // Create new portfolio item as draft
        await portfolioAPI.createItem({
          content_type: actualContentType,
          content_url: contentUrl,
          title: fileTitle,
          description: description || null,
          aspect_ratio: '1:1',
          is_draft: true,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
        });
          toast.success('Draft saved! 📝');
        }

        if (progressInterval) clearInterval(progressInterval);
        setUploadProgress(100);
      }
      
      handleReset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Save draft error:', error);
      toast.error(error.response?.data?.detail || 'Failed to save draft');
      if (progressInterval) clearInterval(progressInterval);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      {/* Backdrop */}
    <div 
        className={`bottom-slider-backdrop ${isVisible ? 'entering' : 'exiting'}`}
      onClick={handleClose}
      />
      
      {/* Bottom Slider Content */}
      <div 
        ref={scrollContainerRef}
        className={`bottom-slider-content ${isVisible ? 'entering' : 'exiting'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Upload overlay - spinner with percentage */}
        {uploading && (
          <div 
            className="absolute inset-0 z-20 flex flex-col items-center justify-center"
            style={{
              background: 'rgba(20, 20, 20, 0.95)',
              borderRadius: '16px',
            }}
          >
            {/* Spinning spinner */}
            <div 
              className="animate-spin rounded-full border-4 border-transparent border-t-[#00C2FF]"
              style={{
                width: '48px', 
                height: '48px'
              }}
            />
            {/* Percentage display */}
            <div
              style={{
                marginTop: '16px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#00C2FF'
              }}
            >
              {Math.round(displayProgress)}%
            </div>
          </div>
        )}

        {/* Header - semi-transparent with subtle blur for glassy effect */}
        <div 
          className="flex items-center justify-between sticky top-0 z-10"
          style={{
            height: '55px',
            background: 'rgba(20, 20, 20, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            padding: '0 20px',
          }}
        >
              {/* Left: Close button + title - 20px gap (matches side padding) */}
              <div className="flex items-center">
                <button
                  onClick={handleBack}
                  disabled={uploading}
                  className="transition disabled:opacity-50"
                >
                  <svg className="w-[16px] h-[16px] text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2 style={{ marginLeft: '20px' }} className="text-[15px] font-semibold text-white">
                  {selectedContentType === 'media' ? 'Media Post' :
                   selectedContentType === 'audio' ? 'Audio Post' :
                   selectedContentType === 'pdf' ? 'PDF Post' :
                   selectedContentType === 'text' ? 'Text Post' : 'Post'}
                </h2>
              </div>
              {/* Right: Primary action button - Publish or Save as Draft depending on context */}
              {(() => {
                // Determine if button should be enabled
                // When editing an existing draft (editingDraftId), enable if there's a preview (existing content)
                // When creating new, enable if there's a file (for media) or text content (for text posts)
                const isEditing = !!editingDraftId;
                const hasExistingContent = !!preview || !!textContent.trim();
                const hasNewContent = selectedContentType === 'text' ? !!textContent.trim() : !!file;
                const isButtonEnabled = !uploading && (isEditing ? hasExistingContent : hasNewContent);
                
                return (
              <button
                    onClick={defaultSaveAsDraft ? handleSaveAsDraft : handleSubmit}
                    onTouchEnd={(e) => {
                      // Prevent double-firing on mobile
                      e.preventDefault();
                      if (isButtonEnabled) {
                        (defaultSaveAsDraft ? handleSaveAsDraft : handleSubmit)();
                      }
                    }}
                    disabled={!isButtonEnabled}
                className="text-[14px] font-semibold rounded-[8px] transition disabled:opacity-50 disabled:cursor-not-allowed publish-btn"
                style={{
                      background: !isButtonEnabled ? 'rgba(255, 255, 255, 0.2)' : '#00C2FF',
                  color: '#fff',
                  height: '32px',
                  padding: '0 32px',
                      touchAction: 'manipulation', // Prevent 300ms tap delay
                      WebkitTapHighlightColor: 'transparent', // Remove iOS tap highlight
                      userSelect: 'none', // Prevent text selection
                }}
              >
                    {uploading ? '...' : (defaultSaveAsDraft ? 'Save Draft' : 'Publish')}
              </button>
                );
              })()}
            </div>

            {/* Content area - scrollable, tap to close delete mode */}
            <div 
              className="flex-1 overflow-y-auto"
              style={{ 
                padding: '16px 10px',
                paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                justifyContent: 'flex-start', // Keep content at top, not spread out
              }}
              onClick={() => {
                if (attachmentSwipeX > 0) {
                  setAttachmentSwipeX(0);
                }
              }}
            >
              {selectedContentType !== 'text' ? (
                <>
                  {/* File Upload Area - Glass Card with Drag & Drop */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                      background: isDragging ? 'rgba(0, 194, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: isDragging ? '2px dashed rgba(0, 194, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => attachmentSwipeX > 0 && setAttachmentSwipeX(0)}
                  >
                    {preview || pdfPreviewUrl || file ? (
                      <div className="relative">
                        {preview && isVideoPreview ? (
                          /* Video Preview */
                          <video
                            src={preview}
                            className="w-full object-cover cursor-pointer"
                            style={{ maxHeight: '300px', borderRadius: '16px' }}
                            muted
                            loop
                            playsInline
                            autoPlay
                            onClick={() => setShowFullScreenPreview(true)}
                          />
                        ) : preview ? (
                          /* Image Preview */
                          <img
                            src={preview}
                            alt="Preview"
                            className="w-full object-cover cursor-pointer"
                            style={{ maxHeight: '300px', borderRadius: '16px' }}
                            onClick={() => setShowFullScreenPreview(true)}
                          />
                        ) : isPdfPreview && pdfPreviewUrl ? (
                          /* PDF Preview - Show first page */
                          <div 
                            className="w-full flex items-center justify-center relative"
                            style={{ height: '300px', background: 'rgba(0,0,0,0.2)' }}
                          >
                            <embed
                              src={`${pdfPreviewUrl}#page=1&view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                              type="application/pdf"
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '16px',
                                pointerEvents: 'none', // Prevent interaction, just preview
                              }}
                            />
                            {/* PDF overlay with file name */}
                            <div 
                              className="absolute bottom-0 left-0 right-0 px-3 py-2"
                              style={{
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                                borderBottomLeftRadius: '16px',
                                borderBottomRightRadius: '16px',
                              }}
                            >
                              <p className="text-white text-[12px] font-medium truncate flex items-center gap-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                {file?.name}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full flex items-center justify-center" style={{ height: '250px', background: 'linear-gradient(135deg, rgba(0,0,0,0.4), rgba(30,30,40,0.6))' }}>
                            <div className="text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>
                              {selectedContentType === 'audio' && file ? (
                                <div className="flex flex-col items-center">
                                  {/* Audio waveform visualization */}
                                  <div className="flex items-end gap-[3px] mb-4" style={{ height: '48px' }}>
                                    {[...Array(24)].map((_, i) => (
                                      <div
                                        key={i}
                                        style={{
                                          width: '4px',
                                          height: `${Math.random() * 100}%`,
                                          minHeight: '8px',
                                          background: 'linear-gradient(180deg, #00C2FF, #7B68EE)',
                                          borderRadius: '2px',
                                          opacity: 0.8,
                                        }}
                                      />
                                    ))}
                                  </div>
                                  {/* Play button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleAudioPlay();
                                    }}
                                    style={{
                                      width: '56px',
                                      height: '56px',
                                      borderRadius: '50%',
                                      background: 'linear-gradient(135deg, #00C2FF, #7B68EE)',
                                      border: 'none',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      boxShadow: '0 4px 20px rgba(0, 194, 255, 0.3)',
                                      marginBottom: '12px'
                                    }}
                                  >
                                    {isPlaying ? (
                                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                                  </svg>
                                    ) : (
                                      <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                  </svg>
                                    )}
                                  </button>
                                  <p className="text-[13px] font-medium">{file?.name?.replace(/\.[^/.]+$/, '')}</p>
                                  {/* Hidden audio element for preview */}
                                  {file && (
                                    <audio
                                      ref={audioRef}
                                      src={URL.createObjectURL(file)}
                                      onEnded={() => setIsPlaying(false)}
                                      style={{ display: 'none' }}
                                    />
                                  )}
                                </div>
                              ) : selectedContentType === 'pdf' && file ? (
                                <div className="flex flex-col items-center">
                                  {/* PDF icon with gradient */}
                                  <div 
                                    style={{
                                      width: '80px',
                                      height: '100px',
                                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))',
                                      border: '2px solid rgba(239, 68, 68, 0.4)',
                                      borderRadius: '8px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      marginBottom: '12px',
                                      position: 'relative'
                                    }}
                                  >
                                    <div 
                                      style={{
                                        position: 'absolute',
                                        top: '0',
                                        right: '0',
                                        width: '20px',
                                        height: '20px',
                                        background: 'rgba(239, 68, 68, 0.3)',
                                        borderBottomLeftRadius: '8px'
                                      }}
                                    />
                                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#EF4444' }}>PDF</span>
                                  </div>
                                  <p className="text-[13px] font-medium max-w-[200px] truncate">{file?.name?.replace(/\.[^/.]+$/, '')}</p>
                                  <p className="text-[11px] mt-1 opacity-60">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                                </div>
                              ) : (
                                <>
                                  <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-[13px]">Media File</p>
                                  <p className="text-[11px] mt-1 opacity-60">{file?.name}</p>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        {!uploading && (
                          <label
                            htmlFor="file-upload-edit"
                            className="absolute top-3 right-3 px-3 py-1.5 text-white text-[12px] font-medium rounded-[8px] cursor-pointer transition"
                            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
                          >
                            Change
                          </label>
                        )}
                        <input
                          type="file"
                          id="file-upload-edit"
                          accept={
                            selectedContentType === 'media' ? 'image/*,video/*' :
                            selectedContentType === 'audio' ? 'audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac,.caf,.aiff' :
                            selectedContentType === 'pdf' ? 'application/pdf,.pdf' :
                            'image/*,video/*'
                          }
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={uploading}
                        />
                      </div>
                    ) : (
                      <label
                        htmlFor="file-upload"
                        className="block w-full cursor-pointer transition"
                        style={{ height: '250px' }}
                      >
                        <div className="flex flex-col items-center justify-center h-full" style={{ color: isDragging ? 'rgba(0, 194, 255, 0.8)' : 'rgba(255,255,255,0.4)' }}>
                          <svg className="w-20 h-20 mb-3" fill="currentColor" viewBox="0 0 24 24" style={{ opacity: isDragging ? 1 : 0.6, transform: isDragging ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s ease' }}>
                            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                          </svg>
                          <p className="text-[14px] font-medium">
                            {isDragging ? 'Drop file here!' :
                             selectedContentType === 'media' ? 'Tap or drag photo/video' :
                             selectedContentType === 'audio' ? 'Tap or drag audio file' :
                             selectedContentType === 'pdf' ? 'Tap or drag PDF' :
                             'Tap or drag file here'}
                          </p>
                        </div>
                        <input
                          type="file"
                          id="file-upload"
                          accept={
                            selectedContentType === 'media' ? 'image/*,video/*' :
                            selectedContentType === 'audio' ? 'audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac,.caf,.aiff' :
                            selectedContentType === 'pdf' ? 'application/pdf,.pdf' :
                            'image/*,video/*'
                          }
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Caption Input - Glass style with focus states, tap closes delete */}
                  <div
                    className="caption-input-wrapper"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      position: 'relative',
                      transition: 'box-shadow 0s, border 0s',
                    }}
                    onClick={() => attachmentSwipeX > 0 && setAttachmentSwipeX(0)}
                  >
                    <textarea
                      ref={textareaRef}
                      placeholder="Add a caption..."
                      value={description}
                      onChange={(e) => {
                        if (e.target.value.length <= 170) {
                          setDescription(e.target.value);
                        }
                      }}
                      onClick={() => attachmentSwipeX > 0 && setAttachmentSwipeX(0)}
                      onFocus={(e) => {
                        handleDescriptionFocus();
                        e.currentTarget.parentElement!.style.boxShadow = '0 0 0 1px rgba(0, 194, 255, 0.3)';
                        e.currentTarget.parentElement!.style.border = '1px solid transparent';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.parentElement!.style.boxShadow = 'none';
                        e.currentTarget.parentElement!.style.border = '1px solid rgba(255, 255, 255, 0.06)';
                      }}
                      onKeyDown={handleTextareaKeyDown}
                      rows={2}
                      maxLength={170}
                      style={{ 
                        fontSize: '14px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                        WebkitAppearance: 'none',
                        width: '100%',
                        padding: '12px 14px',
                        paddingBottom: '24px',
                        color: '#FFFFFF',
                        resize: 'none',
                      }}
                      disabled={uploading}
                    />
                    <span 
                      style={{ 
                        position: 'absolute', 
                        bottom: '6px', 
                        right: '12px', 
                        fontSize: '11px', 
                        color: description.length > 161 ? '#FF453A' : description.length > 136 ? '#FF9F0A' : 'var(--text-tertiary, rgba(255,255,255,0.4))'
                      }}
                    >
                      {description.length}/170
                    </span>
                  </div>

                  {/* Attachment Display - Apple-like 8px spacing, 44px height, swipe to delete */}
                  {(attachmentFile || existingAttachmentUrl) && attachmentType && (
                    <div 
                      className="relative overflow-hidden group" 
                      style={{ 
                        marginTop: '8px', 
                        borderRadius: '10px',
                        // Removal animation - fade + slide + scale
                        opacity: isRemovingAttachment ? 0 : 1,
                        transform: isRemovingAttachment ? 'translateX(-100%) scale(0.95)' : 'translateX(0) scale(1)',
                        transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
                      }}
                    >
                      {/* Delete button - cross icon for photo and audio, absolute top-1 right-1, opacity-0 group-hover:opacity-100 */}
                      {attachmentType === 'audio' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAttachment();
                          }}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10,
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 69, 58, 0.9)';
                            e.currentTarget.style.borderColor = 'rgba(255, 69, 58, 1)';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <XMarkIcon className="w-4 h-4 text-white" />
                        </button>
                      )}
                      {/* Delete button - tappable, Apple physics */}
                      <button 
                        onClick={handleDeleteTap}
                        className="absolute inset-y-0 right-0 flex items-center justify-center"
                        style={{
                          width: '70px',
                          background: '#FF453A',
                          borderRadius: '0 10px 10px 0',
                          opacity: attachmentSwipeX > 0 ? 1 : 0,
                          pointerEvents: attachmentSwipeX > 0 ? 'auto' : 'none',
                          transition: 'opacity 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      
                      {/* Attachment content - swipeable, 50px height, Apple physics */}
                      <div 
                        className="flex items-center gap-3 relative"
                        style={{
                          height: '50px',
                          background: attachmentSwipeX > 0 ? 'rgba(40, 40, 40, 0.98)' : 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: attachmentSwipeX > 0 ? '10px 0 0 10px' : '10px',
                          padding: '0 12px',
                          transform: `translateX(-${attachmentSwipeX}px)`,
                          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), border-radius 0.2s ease-out, background 0.2s ease-out',
                        }}
                        onTouchStart={handleSwipeStart}
                        onTouchMove={handleSwipeMove}
                        onTouchEnd={handleSwipeEnd}
                        onClick={() => attachmentSwipeX > 0 && setAttachmentSwipeX(0)}
                      >
                        {/* Album art / icon - cleaner style */}
                        <div 
                          className="flex items-center justify-center flex-shrink-0"
                          style={{
                            width: '36px',
                            height: '36px',
                              background: 'linear-gradient(145deg, #2D2D2D 0%, #1A1A1A 100%)',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          {attachmentType === 'audio' ? (
                            <svg className="w-[18px] h-[18px]" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V4.5l-10.5 3v9.75M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                            </svg>
                          ) : (
                            <svg className="w-[18px] h-[18px]" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                          )}
                        </div>
                        
                        {/* File name - Apple focus glow on wrapper like caption */}
                        <div 
                          className="flex-1 min-w-0 flex items-center"
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            transition: 'box-shadow 0s, border 0s',
                          }}
                        >
                          <input
                            type="text"
                            value={attachmentFileName}
                            onChange={(e) => setAttachmentFileName(e.target.value)}
                            onFocus={(e) => {
                              e.currentTarget.parentElement!.style.boxShadow = '0 0 0 1px rgba(0, 194, 255, 0.3)';
                              e.currentTarget.parentElement!.style.border = '1px solid transparent';
                            }}
                            onBlur={(e) => {
                              e.currentTarget.parentElement!.style.boxShadow = 'none';
                              e.currentTarget.parentElement!.style.border = '1px solid rgba(255, 255, 255, 0.06)';
                            }}
                            className="text-[11px] font-normal bg-transparent outline-none w-full"
                            style={{ 
                              padding: '4px 6px',
                              border: 'none',
                              borderRadius: '4px',
                              background: 'transparent',
                              color: 'rgba(255, 255, 255, 0.7)',
                              height: '28px',
                              caretColor: '#00C2FF',
                            }}
                          />
                        </div>
                        
                        {/* Play button for audio - centered, 35px circle */}
                        {attachmentType === 'audio' && (
                          <>
                            <audio 
                              ref={audioRef} 
                              src={attachmentBlobUrl || existingAttachmentUrl}
                              preload="auto"
                              onEnded={() => setIsPlaying(false)}
                              onError={() => setIsPlaying(false)}
                              className="hidden"
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleAudioPlay(); }}
                              className="flex items-center justify-center"
                              style={{
                                width: '35px',
                                height: '35px',
                                minWidth: '35px',
                                minHeight: '35px',
                                maxWidth: '35px',
                                maxHeight: '35px',
                                background: 'rgba(255, 255, 255, 0.12)',
                                borderRadius: '50%',
                                flexShrink: 0,
                              }}
                            >
                              {isPlaying ? (
                                <svg style={{ width: '14px', height: '14px' }} fill="white" viewBox="0 0 24 24">
                                  <rect x="6" y="4" width="4" height="16" rx="1" />
                                  <rect x="14" y="4" width="4" height="16" rx="1" />
                                </svg>
                              ) : (
                                <svg style={{ width: '14px', height: '14px' }} fill="white" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              )}
                            </button>
                          </>
                        )}

                        {/* View button for PDF - opens in popup */}
                        {attachmentType === 'pdf' && (
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setShowPdfPopup(true);
                            }}
                            className="flex items-center justify-center"
                            style={{
                              width: '35px',
                              height: '35px',
                              minWidth: '35px',
                              minHeight: '35px',
                              maxWidth: '35px',
                              maxHeight: '35px',
                              background: 'rgba(255, 255, 255, 0.12)',
                              borderRadius: '50%',
                              flexShrink: 0,
                            }}
                          >
                            <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}

                      </div>
                    </div>
                  )}

                </>
              ) : (
                <>
                  {/* Text Post Interface - Glass style with focus states */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: '10px',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <textarea
                      ref={textareaRef}
                      placeholder="What's new?"
                      value={textContent}
                      onChange={(e) => {
                        if (e.target.value.length <= 170) {
                          setTextContent(e.target.value);
                        }
                      }}
                      onFocus={() => handleDescriptionFocus()}
                      onKeyDown={handleTextareaKeyDown}
                      rows={4}
                      maxLength={170}
                      style={{ 
                        fontSize: '14px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        width: '100%',
                        padding: '12px 14px',
                        paddingBottom: '24px',
                        color: '#FFFFFF',
                        resize: 'none',
                      }}
                      disabled={uploading}
                    />
                    <span 
                      style={{ 
                        position: 'absolute', 
                        bottom: '6px', 
                        right: '12px', 
                        fontSize: '11px', 
                        color: textContent.length > 161 ? '#FF453A' : textContent.length > 136 ? '#FF9F0A' : 'var(--text-tertiary, rgba(255,255,255,0.4))'
                      }}
                    >
                      {textContent.length}/170
                    </span>
                  </div>

                </>
              )}

              {/* Attachment toolbar - flows with content */}
            <div 
              className="relative"
              style={{
                background: 'transparent',
                  padding: '12px 6px',
                  marginTop: '8px',
              }}
            >
              
              <div 
                className="flex items-center justify-between" 
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                {/* FEATURE_DISABLED: SAVE_AS_DRAFT
                    Save as Draft button temporarily hidden for V1 release.
                    Functionality preserved - can be re-enabled by uncommenting.
                */}
                {/* Left: Secondary action - Publish when in draft mode, Save as draft otherwise
                <button
                  onClick={defaultSaveAsDraft ? handleSubmit : handleSaveAsDraft}
                  disabled={uploading || (selectedContentType === 'text' ? !textContent.trim() : !file)}
                  className="flex items-center gap-2 transition disabled:opacity-40"
                >
                  {defaultSaveAsDraft ? (
                    <>
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V6M5 12l7-7 7 7" />
                      </svg>
                      <span className="text-[14px] font-medium">Publish instead</span>
                    </>
                  ) : (
                    <>
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h11l5 5v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v5h8V3" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 14h10v7H7z" />
                  </svg>
                  <span className="text-[14px] font-medium">Save as draft</span>
                    </>
                  )}
                </button>
                END FEATURE_DISABLED: SAVE_AS_DRAFT */}
                
                {/* Right: Attachment icons (always visible, disabled when not applicable) */}
                  <div className="flex items-center" style={{ gap: '25px' }}>
                  {/* Audio attachment - only enabled for media posts */}
                    <input
                      type="file"
                      id="audio-attachment-sticky"
                    accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac,.caf,.aiff"
                      onChange={handleAudioAttachment}
                      className="hidden"
                      disabled={uploading || !canAddAudioAttachment || attachmentType === 'pdf'}
                    />
                    <label
                    htmlFor={canAddAudioAttachment && !attachmentType ? "audio-attachment-sticky" : undefined}
                    className="transition"
                    style={{ 
                      opacity: (!canAddAudioAttachment || attachmentType === 'pdf') ? 0.3 : 1,
                      cursor: (canAddAudioAttachment && attachmentType !== 'pdf') ? 'pointer' : 'default'
                    }}
                    >
                      <svg className="w-[18px] h-[18px]" fill="none" stroke={attachmentType === 'audio' ? '#00C2FF' : 'currentColor'} strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </label>

                  {/* PDF attachment - only enabled for media posts */}
                    <input
                      type="file"
                      id="pdf-attachment-sticky"
                      accept="application/pdf"
                      onChange={handlePdfAttachment}
                      className="hidden"
                      disabled={uploading || !canAddPdfAttachment || attachmentType === 'audio'}
                    />
                    <label
                    htmlFor={canAddPdfAttachment && !attachmentType ? "pdf-attachment-sticky" : undefined}
                    className="transition"
                    style={{ 
                      opacity: (!canAddPdfAttachment || attachmentType === 'audio') ? 0.3 : 1,
                      cursor: (canAddPdfAttachment && attachmentType !== 'audio') ? 'pointer' : 'default'
                    }}
                    >
                      <svg className="w-[18px] h-[18px]" fill="none" stroke={attachmentType === 'pdf' ? '#00C2FF' : 'currentColor'} strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </label>
                  </div>
              </div>
            </div>
      </div>
    </div>

      {/* PDF Preview Popup */}
      {showPdfPopup && attachmentType === 'pdf' && (attachmentFile || existingAttachmentUrl) && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            // Clicking backdrop closes PDF popup only, not parent modal
            setShowPdfPopup(false);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <h3 style={{ 
              color: '#fff', 
              fontSize: '17px', 
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <svg className="w-5 h-5" fill="none" stroke="#FF453A" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              {attachmentFileName || 'Document'}.pdf
            </h3>
            <button
              onClick={() => setShowPdfPopup(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              <svg className="w-5 h-5" fill="none" stroke="#fff" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* PDF Viewer */}
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ flex: 1, overflow: 'hidden', padding: '20px' }}
          >
            <iframe
              src={attachmentFile ? URL.createObjectURL(attachmentFile) : existingAttachmentUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '12px',
                background: '#fff',
              }}
              title="PDF Preview"
            />
          </div>
        </div>
      )}

      {/* Full-Screen Preview Modal */}
      {showFullScreenPreview && (preview || file) && (
        <div
          onClick={() => setShowFullScreenPreview(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setShowFullScreenPreview(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <XMarkIcon className="w-6 h-6 text-white" />
          </button>

          {/* Preview content */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isVideoPreview && preview ? (
              <video
                src={preview}
                controls
                autoPlay
                loop
                playsInline
                style={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  borderRadius: '12px',
                  background: '#000'
                }}
              />
            ) : preview ? (
              <img
                src={preview}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  borderRadius: '12px',
                  objectFit: 'contain'
                }}
              />
            ) : null}
          </div>
        </div>
      )}

    </>
  );
}
