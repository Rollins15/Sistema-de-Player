import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../context/PlayerContext';

const ModernAudioPlayer = ({ onNext, onPrevious, hasNext, hasPrevious, style }) => {
  const { isPlaying, currentTime, duration, playPause, seekTo, stopMedia, repeatMode, shuffleMode, toggleRepeat, toggleShuffle } = usePlayer();
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);

  const handlePlayPause = () => {
    playPause();
  };

  const handleStop = () => {
    stopMedia();
  };

  const handleSeek = (value) => {
    if (!duration || duration === 0) {
      console.log('Duration não disponível');
      return;
    }
    
    console.log('Seek solicitado:', value, 'duration:', duration);
    setIsDragging(false);
    seekTo(value);
  };

  const handleSliderChange = (value) => {
    console.log('Slider mudou:', value, 'duration:', duration);
    setIsDragging(true);
    if (duration && duration > 0) {
      setDragPosition(value * duration);
    }
  };

  const handleSliderComplete = (value) => {
    console.log('Slider completo:', value);
    handleSeek(value);
  };

  const formatTime = (seconds) => {
    if (!seconds || typeof seconds !== 'number' || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentPosition = () => {
    // Se estiver arrastando, mostrar a posição do arraste
    if (isDragging) {
      return dragPosition || 0;
    }
    return currentTime || 0;
  };

  const getDurationValue = () => {
    return duration || 0;
  };

  const getProgress = () => {
    const position = getCurrentPosition();
    const durationValue = getDurationValue();
    if (durationValue === 0 || !durationValue) {
      return 0;
    }
    return position / durationValue;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Barra de progresso principal com tempos */}
      <View style={styles.progressBarContainer}>
        <View style={styles.timeRow}>
          <Text style={styles.timeCurrent}>
            {formatTime(getCurrentPosition())}
          </Text>
          <Text style={styles.timeTotal}>
            {formatTime(getDurationValue())}
          </Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={getProgress()}
          onValueChange={handleSliderChange}
          onSlidingComplete={handleSliderComplete}
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#e0e0e0"
          thumbStyle={styles.sliderThumb}
        />
      </View>

      {/* Controles principais */}
      <View style={styles.controlButtons}>
          {/* Botão Shuffle */}
          <TouchableOpacity
            style={styles.shuffleButton}
            onPress={toggleShuffle}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={shuffleMode ? "shuffle" : "shuffle-outline"} 
              size={24} 
              color={shuffleMode ? "#007AFF" : "#999"} 
            />
          </TouchableOpacity>

          {/* Botão Anterior */}
          <TouchableOpacity
            style={[styles.navButton, !hasPrevious && styles.navButtonDisabled]}
            onPress={onPrevious}
            disabled={!hasPrevious}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-back" size={24} color={hasPrevious ? "#333" : "#999"} />
          </TouchableOpacity>

          {/* Botão Play/Pause (maior, em destaque) */}
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayPause}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={36}
              color="#fff"
            />
          </TouchableOpacity>

          {/* Botão Próximo */}
          <TouchableOpacity
            style={[styles.navButton, !hasNext && styles.navButtonDisabled]}
            onPress={onNext}
            disabled={!hasNext}
            activeOpacity={0.7}
          >
            <Ionicons name="play-skip-forward" size={24} color={hasNext ? "#333" : "#999"} />
          </TouchableOpacity>

          {/* Botão Repeat */}
          <TouchableOpacity
            style={styles.repeatButton}
            onPress={toggleRepeat}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={
                repeatMode === 'one' ? 'repeat' : 
                repeatMode === 'all' ? 'repeat' : 
                'repeat-outline'
              } 
              size={24} 
              color={repeatMode === 'none' ? '#999' : '#007AFF'} 
            />
          </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginTop: 40,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#007AFF',
    width: 20,
    height: 20,
  },
  timeCurrent: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  timeTotal: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666',
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  navButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 22,
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#f8f8f8',
    opacity: 0.5,
  },
  repeatButton: {
    padding: 10,
    marginHorizontal: 8,
  },
  shuffleButton: {
    padding: 10,
    marginHorizontal: 8,
  },
  playButton: {
    backgroundColor: '#007AFF',
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
});

export default ModernAudioPlayer;

