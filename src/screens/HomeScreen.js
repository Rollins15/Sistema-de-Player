import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ScrollView, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MediaService from '../services/ApiOnlyMediaService';
import { usePlayer } from '../context/PlayerContext';
import defaultCover from '../assets/default_cover.png';

const HomeScreen = ({ navigation }) => {
  const { currentMedia, isPlaying, playMedia } = usePlayer();
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('audio'); // 'audio' ou 'video'

  useEffect(() => {
    MediaService.init().then(() => loadMedia()).catch((error) => {
      console.warn('Erro ao inicializar serviço:', error);
      loadMedia(); // Tentar carregar mesmo se houver erro na inicialização
    });
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadMedia();
    });
    return unsubscribe;
  }, [navigation]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const mediaData = await MediaService.getAllMedia();
      setMedia(mediaData);
    } catch (error) {
      console.warn('Erro ao carregar mídias:', error);
      setMedia([]); // Definir array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const handleMediaPress = async (item) => {
    if (item.type === 'audio') {
      const audioMedia = media.filter(m => m.type === 'audio');
      navigation.navigate('AudioPlayer', { 
        media: item,
        mediaList: audioMedia
      });
    } else {
      navigation.navigate('VideoPlayer', { media: item });
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDeleteMedia = async (item) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir "${item.title || item.filename}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await MediaService.deleteMedia(item.id);
              loadMedia();
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir mídia');
            }
          },
        },
      ]
    );
  };

  const getFilteredMedia = () => {
    if (activeTab === 'audio') {
      return media.filter(m => m.type === 'audio');
    } else {
      return media.filter(m => m.type === 'video');
    }
  };

  const filteredMedia = getFilteredMedia();

  const renderAudioItem = (item, index) => {
    const isCurrentlyPlaying = currentMedia && currentMedia.id === item.id;
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.trackItem, isCurrentlyPlaying && styles.currentTrack]}
        onPress={() => handleMediaPress(item)}
      >
        <View style={styles.trackLeft}>
          <Image 
            source={item.thumbnail_path ? { uri: item.thumbnail_path } : item.cover ? { uri: item.cover } : defaultCover}
            style={styles.trackImage}
            resizeMode="cover"
          />
          <Text style={styles.trackNumber}>
            {(index + 1).toString().padStart(2, '0')}
          </Text>
        </View>
        
        <View style={styles.trackCenter}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {item.title || item.filename}
          </Text>
          <Text style={styles.trackArtist}>
            {item.artist || 'Áudio'}
          </Text>
        </View>

        <View style={styles.trackRight}>
          <Text style={styles.trackDuration}>
            {formatDuration(item.duration)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderVideoGrid = () => {
    const rows = [];
    for (let i = 0; i < filteredMedia.length; i += 2) {
      const leftItem = filteredMedia[i];
      const rightItem = filteredMedia[i + 1];
      
      rows.push(
        <View key={i} style={styles.videoGridRow}>
          <TouchableOpacity
            style={styles.videoGridItem}
            onPress={() => handleMediaPress(leftItem)}
          >
            <Image 
              source={leftItem.thumbnail_path ? { uri: leftItem.thumbnail_path } : defaultCover}
              style={styles.videoThumbnail}
              resizeMode="cover"
            />
            <Text style={styles.videoTitle} numberOfLines={2}>
              {leftItem.title || leftItem.filename}
            </Text>
          </TouchableOpacity>

          {rightItem && (
            <TouchableOpacity
              style={styles.videoGridItem}
              onPress={() => handleMediaPress(rightItem)}
            >
              <Image 
                source={rightItem.thumbnail_path ? { uri: rightItem.thumbnail_path } : defaultCover}
                style={styles.videoThumbnail}
                resizeMode="cover"
              />
              <Text style={styles.videoTitle} numberOfLines={2}>
                {rightItem.title || rightItem.filename}
              </Text>
            </TouchableOpacity>
          )}
          {!rightItem && <View style={styles.videoGridItem} />}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Biblioteca</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('MediaLibrary')}
        >
          <Ionicons name="add" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Tabs de filtro */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'audio' && styles.activeTab]}
          onPress={() => setActiveTab('audio')}
        >
          <Ionicons 
            name="musical-notes" 
            size={20} 
            color={activeTab === 'audio' ? '#007AFF' : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'audio' && styles.activeTabText]}>
            Músicas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'video' && styles.activeTab]}
          onPress={() => setActiveTab('video')}
        >
          <Ionicons 
            name="videocam" 
            size={20} 
            color={activeTab === 'video' ? '#007AFF' : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'video' && styles.activeTabText]}>
            Vídeos
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Carregando...</Text>
          </View>
        ) : filteredMedia.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={activeTab === 'audio' ? 'musical-notes' : 'videocam'} 
              size={60} 
              color="#ccc" 
            />
            <Text style={styles.emptyText}>
              {activeTab === 'audio' ? 'Nenhuma música encontrada' : 'Nenhum vídeo encontrado'}
            </Text>
          </View>
        ) : activeTab === 'audio' ? (
          filteredMedia.map((item, index) => renderAudioItem(item, index))
        ) : (
          renderVideoGrid()
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 20,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  currentTrack: {
    backgroundColor: '#f5f5f5',
  },
  trackLeft: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginBottom: 4,
  },
  trackNumber: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  trackCenter: {
    flex: 1,
    marginLeft: 15,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 3,
  },
  trackArtist: {
    fontSize: 14,
    color: '#999',
  },
  trackRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trackDuration: {
    fontSize: 14,
    color: '#999',
  },
  moreButton: {
    padding: 8,
  },
  videoGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  videoGridItem: {
    width: '48%',
  },
  videoThumbnail: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginTop: 8,
    lineHeight: 18,
  },
  videoDuration: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

export default HomeScreen;
