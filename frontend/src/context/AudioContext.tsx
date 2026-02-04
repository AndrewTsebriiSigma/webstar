'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface AudioTrack {
  id: number;
  title: string;
  url: string;
  thumbnail?: string;
  startTime?: number; // Resume position in seconds
}

interface AudioContextType {
  currentTrack: AudioTrack | null;
  isMuted: boolean;
  showPlayerUI: boolean;
  audioPositions: Record<number, number>;
  playTrack: (track: AudioTrack, showUI?: boolean) => void;
  stopTrack: () => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  updateShowPlayerUI: (show: boolean) => void;
  savePosition: (trackId: number, position: number) => void;
  getPosition: (trackId: number) => number;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isMuted, setIsMuted] = useState(true); // Default muted (red button)
  const [showPlayerUI, setShowPlayerUI] = useState(false);
  const [audioPositions, setAudioPositions] = useState<Record<number, number>>({});

  const playTrack = useCallback((track: AudioTrack, showUI: boolean = true) => {
    setCurrentTrack(track);
    setShowPlayerUI(showUI);
    // Don't automatically unmute - let user control it
  }, []);

  const stopTrack = useCallback(() => {
    setCurrentTrack(null);
    setShowPlayerUI(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted);
  }, []);

  const updateShowPlayerUI = useCallback((show: boolean) => {
    setShowPlayerUI(show);
  }, []);

  const savePosition = useCallback((trackId: number, position: number) => {
    setAudioPositions(prev => ({
      ...prev,
      [trackId]: position
    }));
  }, []);

  const getPosition = useCallback((trackId: number) => {
    return audioPositions[trackId] || 0;
  }, [audioPositions]);

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isMuted,
        showPlayerUI,
        audioPositions,
        playTrack,
        stopTrack,
        toggleMute,
        setMuted,
        updateShowPlayerUI: setShowPlayerUI,
        savePosition,
        getPosition
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
