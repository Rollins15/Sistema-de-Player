import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lockAsync, OrientationLock } from 'expo-screen-orientation';
import ModernVideoPlayer from '../components/ModernVideoPlayer';
import MediaService from '../services/ApiOnlyMediaService';

const VideoPlayerScreen = ({ route, navigation }) => {
  const { media } = route.params;
  const [currentMedia, setCurrentMedia] = useState(media);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Removido navigation.setOptions já que não temos mais cabeçalho

  const handlePlaybackStatusUpdate = async (status) => {
    if (status.didJustFinish) {
      // Adicionar ao histórico quando terminar
      await MediaService.addToHistory(currentMedia.id, status.positionMillis / 1000);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const videoStyle = useMemo(() => 
    isFullscreen ? styles.fullscreenVideo : styles.video, 
    [isFullscreen]
  );

  // Restaurar orientação quando sair da tela
  useEffect(() => {
    return () => {
      lockAsync(OrientationLock.PORTRAIT);
    };
  }, []);

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenContainer]}>
      <ModernVideoPlayer
        source={{ uri: currentMedia.path }}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        style={videoStyle}
        isFullscreen={isFullscreen}
        onFullscreenChange={setIsFullscreen}
      />

      {/* Header sobreposto */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentMedia.title || currentMedia.filename}
        </Text>
        <View style={styles.headerRight} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50, // Para compensar a status bar
    backgroundColor: 'transparent',
    zIndex: 50, // Aumentado para ficar acima dos controles do vídeo
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: {
    width: 40, // Para manter o título centralizado
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  video: {
    flex: 1,
  },
  fullscreenVideo: {
    height: '100%',
  },
  headerButton: {
    padding: 8,
  },
});

export default VideoPlayerScreen;
