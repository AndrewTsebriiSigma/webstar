'use client';

import { useAudio } from '@/context/AudioContext';
import MiniPlayer from './MiniPlayer';

export default function GlobalAudioPlayer() {
  const { currentTrack, isMuted, showPlayerUI, savePosition, stopTrack, setMuted, getPosition } = useAudio();

  // Handle position changes from MiniPlayer
  const handlePositionChange = (trackId: number, position: number) => {
    savePosition(trackId, position);
  };

  // Handle closing the player
  const handleClose = () => {
    stopTrack();
  };

  // Handle thumbnail click - can be enhanced later to navigate to specific profile
  const handleThumbnailClick = () => {
    // This can be enhanced to navigate to the profile page with feed open
    // For now, we'll leave it empty or add navigation logic later
  };

  // Handle next/previous - simplified for now, can be enhanced with portfolio items context
  const handleNext = () => {
    // Can be enhanced to get portfolio items from context or props
  };

  const handlePrevious = () => {
    // Can be enhanced to get portfolio items from context or props
  };

  // Only render if there's a track
  if (!currentTrack) {
    return null;
  }

  return (
    <MiniPlayer
      track={currentTrack}
      onClose={handleClose}
      onPositionChange={handlePositionChange}
      onThumbnailClick={handleThumbnailClick}
      onNext={handleNext}
      onPrevious={handlePrevious}
      isMuted={isMuted}
      onMuteChange={setMuted}
      hidden={!showPlayerUI}
    />
  );
}
