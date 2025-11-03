import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MediaService from '../services/ApiOnlyMediaService';
import { usePlayer } from '../context/PlayerContext';
import ModernAudioPlayer from '../components/ModernAudioPlayer';
import defaultCover from '../assets/default_cover.png';

const AudioPlayerScreen = ({ route, navigation }) => {
  const { media, mediaList } = route.params;
  const { playMedia, isPlaying, currentTime, duration, playPause } = usePlayer();
  const [currentMedia, setCurrentMedia] = useState(media);
  const [allMedia, setAllMedia] = useState(mediaList || []);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Atualizar o contexto quando a mídia muda
  useEffect(() => {
    playMedia(currentMedia, allMedia);
  }, [currentMedia, allMedia]);

  // Encontrar o índice atual
  useEffect(() => {
    const index = allMedia.findIndex(m => m.id === currentMedia.id);
    setCurrentIndex(index);
  }, [currentMedia, allMedia]);

  // Carregar lista de mídias se não foi fornecida
  useEffect(() => {
    const loadMedia = async () => {
      if (!allMedia || allMedia.length === 0) {
        const media = await MediaService.getAllMedia();
        const audioMedia = media.filter(m => m.type === 'audio');
        setAllMedia(audioMedia);
      }
    };
    loadMedia();
  }, []);

  const handlePrevious = () => {
    if (currentIndex > 0 && allMedia.length > 0) {
      const previousMedia = allMedia[currentIndex - 1];
      setCurrentMedia(previousMedia);
      navigation.setParams({ media: previousMedia });
    }
  };

  const handleNext = () => {
    if (currentIndex < allMedia.length - 1 && allMedia.length > 0) {
      const nextMedia = allMedia[currentIndex + 1];
      setCurrentMedia(nextMedia);
      navigation.setParams({ media: nextMedia });
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleFavorite = async () => {
    try {
      await MediaService.toggleFavorite(currentMedia.id);
      setCurrentMedia(prev => ({
        ...prev,
        is_favorite: !prev.is_favorite
      }));
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar favorito');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reproduzindo</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Album Art - Grande imagem central */}
        <View style={styles.albumArtContainer}>
          <Image
            source={currentMedia.thumbnail_path ? { uri: currentMedia.thumbnail_path } : currentMedia.cover ? { uri: currentMedia.cover } : defaultCover}
            style={styles.albumArt}
            resizeMode="cover"
          />
        </View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <View style={styles.trackInfoCenter}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentMedia.title || currentMedia.filename}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentMedia.artist || 'Artista Desconhecido'}
            </Text>
          </View>
        </View>

        {/* Modern Audio Player com todos os controles */}
        <ModernAudioPlayer
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasNext={currentIndex < allMedia.length - 1}
          hasPrevious={currentIndex > 0}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50, // Para compensar a status bar
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    width: 40, // Para manter o título centralizado
  },
  albumArtContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 30,
    maxHeight: 400,
  },
  albumArt: {
    width: '90%',
    maxWidth: 400,
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    overflow: 'hidden',
  },
  trackInfo: {
    marginTop: 25,
    paddingHorizontal: 30,
    paddingBottom: 20, 
    alignItems: 'center',
  },
  trackInfoCenter: {
    alignItems: 'center',
    width: '100%',
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

export default AudioPlayerScreen;
