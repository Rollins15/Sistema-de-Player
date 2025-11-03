import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MediaService from '../services/ApiOnlyMediaService';
import defaultCover from '../assets/default_cover.png';

const MediaLibraryScreen = ({ navigation }) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    MediaService.init().then(() => loadMedia());
  }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const mediaData = await MediaService.getAllMedia();
      setMedia(mediaData);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar mídias');
      console.error('Erro ao carregar mídias:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickMediaFile = async () => {
    try {
      setLoading(true);
      const newMedia = await MediaService.pickMediaFile();
      
      if (newMedia) {
        // Recarregar todas as mídias para garantir que está atualizado
        await loadMedia();
        Alert.alert('Sucesso', 'Mídia adicionada com sucesso!');
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao selecionar arquivo');
      console.error('Erro ao selecionar arquivo:', error);
    } finally {
      setLoading(false);
    }
  };

  const scanDeviceForMedia = async () => {
    try {
      setLoading(true);
      Alert.alert(
        'Escanear Dispositivo',
        'Isso vai procurar por todas as músicas e vídeos no seu dispositivo. Pode demorar alguns instantes.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Escanear',
            onPress: async () => {
              const result = await MediaService.scanDeviceForMedia();
              
              if (result.success) {
                await loadMedia();
                Alert.alert('Sucesso', result.message);
              } else {
                Alert.alert('Erro', result.message);
              }
              setLoading(false);
            }
          }
        ]
      );
      setLoading(false);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao escanear dispositivo');
      console.error('Erro ao escanear dispositivo:', error);
      setLoading(false);
    }
  };

  const handleMediaPress = (item) => {
    if (item.type === 'video') {
      navigation.navigate('VideoPlayer', { media: item });
    } else {
      navigation.navigate('AudioPlayer', { media: item });
    }
  };

  const handleDeleteMedia = async (item) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir "${item.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await MediaService.deleteMedia(item.id);
              await loadMedia(); // Recarregar lista completa
            } catch (error) {
              Alert.alert('Erro', 'Falha ao excluir mídia');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
        <Text style={styles.title}>Minha Biblioteca</Text>
        <TouchableOpacity style={styles.addButton} onPress={pickMediaFile}>
          <Ionicons name="add" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Carregando...</Text>
          </View>
        ) : media.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>Nenhuma mídia encontrada</Text>
            <Text style={styles.emptyText}>
              Adicione músicas e vídeos do seu dispositivo
            </Text>
            <TouchableOpacity style={styles.addMediaButton} onPress={pickMediaFile}>
              <Text style={styles.addMediaButtonText}>Adicionar Mídia</Text>
            </TouchableOpacity>
          </View>
        ) : (
          media.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={styles.trackItem}
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
                  {item.artist || (item.type === 'video' ? 'Vídeo' : 'Áudio')}
                </Text>
              </View>

              <View style={styles.trackRight}>
                <Text style={styles.trackDuration}>
                  {formatDuration(item.duration)}
                </Text>
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    Alert.alert(
                      'Opções',
                      'Deseja excluir esta mídia?',
                      [
                        {
                          text: 'Excluir',
                          style: 'destructive',
                          onPress: () => handleDeleteMedia(item),
                        },
                        { text: 'Cancelar', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#999" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
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
    paddingTop: 50, // Para compensar a status bar
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  title: {
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  addMediaButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addMediaButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  trackLeft: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
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
  mediaItem: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 5,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mediaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mediaDetails: {
    marginLeft: 15,
    flex: 1,
  },
  mediaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  mediaSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  mediaActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 5,
  },
  trackImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginBottom: 4,
  },
});

export default MediaLibraryScreen;