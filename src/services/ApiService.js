import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';

// URLs possíveis da API
// Em produção, usar a URL do Render
// Para desenvolvimento local, adicionar IPs locais
const POSSIBLE_API_URLS = [
  // Produção - URL do Render (será preenchida após deploy)
  process.env.EXPO_PUBLIC_API_URL || 'https://sistema-video-api.onrender.com',
  // Desenvolvimento local
  'http://127.0.0.1:8000',
  'http://192.168.153.1:8000',
  'http://192.168.2.1:8000',
  'http://10.46.201.200:8000',
];

let activeApiUrl = null;

// Função para descobrir qual API está ativa
async function findActiveApi() {
  if (activeApiUrl) {
    return activeApiUrl;
  }

  for (const url of POSSIBLE_API_URLS) {
    try {
      console.log(`🔄 Tentando conectar em: ${url}`);
      const response = await axios.get(`${url}/health`, { timeout: 5000 });
      if (response.status === 200) {
        console.log(`✅ API encontrada em: ${url}`);
        activeApiUrl = url;
        return activeApiUrl;
      }
    } catch (error) {
      console.log(`❌ Falhou: ${url} - ${error.message}`);
      // Tenta próxima URL
      continue;
    }
  }

  console.log('⚠️ Nenhuma API encontrada, modo offline');
  return null;
}

class ApiService {
  constructor() {
    this.baseUrl = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    this.baseUrl = await findActiveApi();
    this.initialized = true;
  }

  isAvailable() {
    return this.baseUrl !== null;
  }

  // ===== ROTAS DE MÍDIA =====

  async getAllMedia() {
    await this.init();
    
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/media`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar mídias:', error);
      return [];
    }
  }

  async getMedia(id) {
    await this.init();
    
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/media/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar mídia:', error);
      return null;
    }
  }

  async uploadMedia(fileUri, metadata) {
    await this.init();
    
    if (!this.isAvailable()) {
      throw new Error('API não disponível');
    }

    try {
      const formData = new FormData();
      
      // Adicionar arquivo
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      const filename = fileUri.split('/').pop();
      
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type: metadata.type === 'video' ? 'video/mp4' : 'audio/mpeg',
      });

      // Adicionar thumbnail se existir
      if (metadata.thumbnail) {
        const thumbnailFilename = metadata.thumbnail.split('/').pop();
        formData.append('thumbnail', {
          uri: metadata.thumbnail,
          name: thumbnailFilename,
          type: 'image/jpeg',
        });
      }

      // Adicionar metadata
      formData.append('title', metadata.title || filename);
      formData.append('type', metadata.type);
      
      const response = await axios.post(
        `${this.baseUrl}/media/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }
  }

  async deleteMedia(id) {
    await this.init();
    
    if (!this.isAvailable()) {
      throw new Error('API não disponível');
    }

    try {
      await axios.delete(`${this.baseUrl}/media/${id}`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar mídia:', error);
      throw error;
    }
  }

  async toggleFavorite(id) {
    await this.init();
    
    if (!this.isAvailable()) {
      throw new Error('API não disponível');
    }

    try {
      const response = await axios.post(`${this.baseUrl}/media/${id}/toggle-favorite`);
      return response.data;
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      throw error;
    }
  }

  // ===== ROTAS DE PLAYLIST =====

  async getPlaylists() {
    await this.init();
    
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/playlists`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar playlists:', error);
      return [];
    }
  }

  async createPlaylist(name) {
    await this.init();
    
    if (!this.isAvailable()) {
      throw new Error('API não disponível');
    }

    try {
      const response = await axios.post(`${this.baseUrl}/playlists`, { name });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar playlist:', error);
      throw error;
    }
  }

  async addMediaToPlaylist(playlistId, mediaId) {
    await this.init();
    
    if (!this.isAvailable()) {
      throw new Error('API não disponível');
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/playlists/${playlistId}/media/${mediaId}`
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar mídia à playlist:', error);
      throw error;
    }
  }

  // ===== HISTÓRICO =====

  async addToHistory(mediaId, position = 0) {
    await this.init();
    
    if (!this.isAvailable()) {
      return;
    }

    try {
      await axios.post(`${this.baseUrl}/history/${mediaId}`, { position });
    } catch (error) {
      console.error('Erro ao adicionar ao histórico:', error);
    }
  }

  async getHistory() {
    await this.init();
    
    if (!this.isAvailable()) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/history`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
  }
}

const ApiServiceInstance = new ApiService();
export default ApiServiceInstance;

