import ApiService from './ApiService';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';

class ApiOnlyMediaService {
  constructor() {
    this.apiService = ApiService;
  }

  async init() {
    try {
      await this.apiService.init();
      
      if (!this.apiService.isAvailable()) {
        console.warn('⚠️ API não disponível - o app continuará em modo offline');
        return; // Não lançar erro, apenas logar
      }
      
      console.log('✅ Serviço de Mídia API-Only inicializado');
    } catch (error) {
      console.warn('⚠️ Erro ao inicializar serviço de mídia:', error);
      // Não lançar erro, permitir que o app continue em modo offline
    }
  }

  // ===== GETTERS =====

  async getAllMedia() {
    if (!this.apiService.isAvailable()) {
      console.warn('⚠️ API não disponível, retornando array vazio');
      return []; // Retornar array vazio em vez de lançar erro
    }
    
    try {
      const media = await this.apiService.getAllMedia();
      console.log(`✅ ${media.length} mídias carregadas da API`);
      return media;
    } catch (error) {
      console.warn('⚠️ Erro ao carregar mídias:', error);
      return []; // Retornar array vazio em caso de erro
    }
  }

  async getMedia(id) {
    if (!this.apiService.isAvailable()) {
      throw new Error('API não disponível');
    }
    
    return await this.apiService.getMedia(id);
  }

  // ===== UPLOAD =====

  async pickMediaFile() {
    if (!this.apiService.isAvailable()) {
      throw new Error('API não disponível. Verifique sua conexão com a internet.');
    }

    try {
      // 1. Selecionar arquivo
      console.log('📂 Abrindo seletor de arquivos...');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'video/*'],
        copyToCacheDirectory: false,
      });

      // Se o usuário cancelou, retornar null sem erro
      if (result.canceled) {
        console.log('ℹ️ Seleção de arquivo cancelada pelo usuário');
        return null;
      }

      if (!result.assets || !result.assets[0]) {
        throw new Error('Nenhum arquivo selecionado');
      }

      const asset = result.assets[0];
      console.log('📄 Arquivo selecionado:', asset.name, 'Tipo:', asset.mimeType);
      
      const isVideo = asset.mimeType && asset.mimeType.startsWith('video');
      
      // 2. Copiar para diretório temporário
      const tempDir = `${FileSystem.cacheDirectory}temp/`;
      const dirInfo = await FileSystem.getInfoAsync(tempDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
      }
      
      const tempPath = `${tempDir}${asset.name}`;
      console.log('📁 Copiando arquivo para temp:', tempPath);
      
      try {
        await FileSystem.copyAsync({
          from: asset.uri,
          to: tempPath,
        });
        console.log('✅ Arquivo copiado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao copiar arquivo:', error);
        throw new Error(`Erro ao copiar arquivo: ${error.message}`);
      }
      
      // 3. Gerar thumbnail se for vídeo
      let thumbnailPath = null;
      if (isVideo) {
        try {
          console.log('🎬 Gerando thumbnail do vídeo...');
          const thumbnail = await VideoThumbnails.getThumbnailAsync(asset.uri, {
            time: 1000, // Capturar no segundo 1
            quality: 0.7,
          });
          thumbnailPath = thumbnail.uri;
          console.log('✅ Thumbnail gerada:', thumbnailPath);
        } catch (error) {
          console.log('⚠️ Erro ao gerar thumbnail (continuando sem thumbnail):', error);
          // Não lançar erro, apenas continuar sem thumbnail
        }
      }
      
      // 4. Fazer upload para API
      console.log('☁️ Fazendo upload para a API...');
      try {
        const apiResult = await this.apiService.uploadMedia(tempPath, {
          title: asset.name.replace(/\.[^/.]+$/, ''),
          type: isVideo ? 'video' : 'audio',
          thumbnail: thumbnailPath,
        });
        console.log('✅ Upload concluído com sucesso');
        
        // 5. Limpar arquivos temporários
        try {
          await FileSystem.deleteAsync(tempPath, { idempotent: true });
          if (thumbnailPath) {
            await FileSystem.deleteAsync(thumbnailPath, { idempotent: true });
          }
        } catch (error) {
          console.log('⚠️ Erro ao limpar arquivos temp (não crítico):', error);
        }
        
        return apiResult;
      } catch (error) {
        // Limpar arquivo temporário mesmo em caso de erro no upload
        try {
          await FileSystem.deleteAsync(tempPath, { idempotent: true });
        } catch (cleanupError) {
          console.log('⚠️ Erro ao limpar arquivo temp:', cleanupError);
        }
        
        // Lançar erro mais específico
        if (error.response) {
          throw new Error(`Erro no servidor: ${error.response.status} - ${error.response.data?.detail || error.message}`);
        } else if (error.message) {
          throw new Error(`Erro ao fazer upload: ${error.message}`);
        } else {
          throw new Error('Erro desconhecido ao fazer upload');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao selecionar arquivo:', error);
      // Se já é uma Error com mensagem, relançar
      if (error instanceof Error) {
        throw error;
      }
      // Caso contrário, criar nova Error
      throw new Error(`Erro ao processar arquivo: ${error.message || String(error)}`);
    }
  }

  // ===== DELETE =====

  async deleteMedia(id) {
    if (!this.apiService.isAvailable()) {
      throw new Error('API não disponível');
    }
    
    await this.apiService.deleteMedia(id);
    console.log('✅ Mídia deletada');
  }

  // ===== FAVORITES =====

  async toggleFavorite(id) {
    if (!this.apiService.isAvailable()) {
      throw new Error('API não disponível');
    }
    
    await this.apiService.toggleFavorite(id);
    console.log('✅ Favorito atualizado');
  }

  // ===== HISTORY =====

  async addToHistory(mediaId, position) {
    if (!this.apiService.isAvailable()) {
      return;
    }
    
    await this.apiService.addToHistory(mediaId, position);
  }

  // ===== PLAYLISTS (opcional) =====

  async getPlaylists() {
    if (!this.apiService.isAvailable()) {
      return [];
    }
    return await this.apiService.getPlaylists();
  }

  async createPlaylist(name) {
    if (!this.apiService.isAvailable()) {
      throw new Error('API não disponível para criar playlists');
    }
    return await this.apiService.createPlaylist(name);
  }

  async addMediaToPlaylist(playlistId, mediaId) {
    if (!this.apiService.isAvailable()) {
      throw new Error('API não disponível para adicionar à playlist');
    }
    return await this.apiService.addMediaToPlaylist(playlistId, mediaId);
  }

  // ===== METADADOS =====

  async updateMediaMetadata(id, metadata) {
    if (!this.apiService.isAvailable()) {
      throw new Error('API não disponível');
    }
    
    // Atualizar metadados (título, artista, capa)
    // Isso será implementado na API
    console.log('📝 Atualizando metadados da mídia:', id, metadata);
    // TODO: Implementar endpoint PUT /media/{id}/metadata
  }

  // Método de compatibilidade (não faz nada, mas não quebra código antigo)
  async scanDeviceForMedia() {
    return {
      success: false,
      message: 'Escaneamento automático desabilitado. Use o botão + para adicionar arquivos.',
      requiresBuild: false
    };
  }

  getDatabaseStatus() {
    return {
      type: 'api_only',
      available: this.apiService.isAvailable(),
      message: 'Usando apenas backend API'
    };
  }
}

const MediaService = new ApiOnlyMediaService();
export default MediaService;

