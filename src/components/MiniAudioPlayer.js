import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../context/PlayerContext';
import defaultCover from '../assets/default_cover.png';

const MiniAudioPlayer = ({ onPress, onNext, onPrevious, hasNext, hasPrevious }) => {
  const { currentMedia, isPlaying, currentTime, duration, playPause } = usePlayer();

  const handlePlayPause = () => {
    playPause();
  };

  const formatTime = (seconds) => {
    if (!seconds || typeof seconds !== 'number' || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.leftSection} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Image
          source={currentMedia?.thumbnail_path ? { uri: currentMedia.thumbnail_path } : currentMedia?.cover ? { uri: currentMedia.cover } : defaultCover}
          style={styles.albumArt}
          resizeMode="cover"
        />
        <View style={styles.trackInfo}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {currentMedia ? (currentMedia.title || currentMedia.filename) : 'Áudio'}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.rightSection}>
        {/* Botão Anterior */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={onPrevious}
          disabled={!hasPrevious}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="play-skip-back" 
            size={20} 
            color={hasPrevious ? "#333" : "#ccc"} 
          />
        </TouchableOpacity>

        {/* Botão Play/Pause */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={handlePlayPause}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>

        {/* Botão Próximo */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={onNext}
          disabled={!hasNext}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="play-skip-forward" 
            size={20} 
            color={hasNext ? "#333" : "#ccc"} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MiniAudioPlayer;
