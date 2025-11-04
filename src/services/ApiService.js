import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';

// URLs possíveis da API
// Em produção, usar a URL do Render
// Para desenvolvimento local, adicionar IPs locais
const POSSIBLE_API_URLS = [
  // Produção - URL do Render (URL real do serviço)
  'https://sistema-de-player.onrender.com',
  // Desenvolvimento local (fallback)
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
      // Verificar se o arquivo existe
      console.log('📋 Verificando arquivo:', fileUri);
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      if (!fileInfo.exists) {
        throw new Error(`Arquivo não encontrado: ${fileUri}`);
      }
      
      if (fileInfo.isDirectory) {
        throw new Error('O caminho especificado é um diretório, não um arquivo');
      }
      
      console.log('✅ Arquivo encontrado, tamanho:', fileInfo.size, 'bytes');
      
      const formData = new FormData();
      const filename = fileUri.split('/').pop();
      
      // Determinar tipo MIME correto baseado na extensão
      let mimeType = 'audio/mpeg';
      if (metadata.type === 'video') {
        mimeType = 'video/mp4';
      } else if (filename.toLowerCase().endsWith('.m4a')) {
        mimeType = 'audio/mp4';
      } else if (filename.toLowerCase().endsWith('.wav')) {
        mimeType = 'audio/wav';
      } else if (filename.toLowerCase().endsWith('.ogg')) {
        mimeType = 'audio/ogg';
      }
      
      // Adicionar arquivo
      console.log('📤 Adicionando arquivo ao FormData:', filename, 'Tipo:', mimeType);
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type: mimeType,
      } as any);

      // Adicionar thumbnail se existir
      if (metadata.thumbnail) {
        console.log('🖼️ Adicionando thumbnail ao FormData');
        const thumbnailInfo = await FileSystem.getInfoAsync(metadata.thumbnail);
        if (thumbnailInfo.exists && !thumbnailInfo.isDirectory) {
          const thumbnailFilename = metadata.thumbnail.split('/').pop();
          formData.append('thumbnail', {
            uri: metadata.thumbnail,
            name: thumbnailFilename,
            type: 'image/jpeg',
          } as any);
        } else {
          console.warn('⚠️ Thumbnail não encontrado, continuando sem thumbnail');
        }
      }

      // Adicionar metadata (opcional, backend não usa, mas pode ser útil)
      formData.append('title', metadata.title || filename);
      formData.append('type', metadata.type);
      
      console.log('🚀 Enviando upload para:', `${this.baseUrl}/media/upload`);
      
      const response = await axios.post(
        `${this.baseUrl}/media/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 minutos de timeout para arquivos grandes
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log(`📊 Upload progress: ${percentCompleted}%`);
            }
          },
        }
      );

      console.log('✅ Upload concluído com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao fazer upload:', error);
      
      // Melhorar mensagem de erro
      if (error.response) {
        // Erro da API
        const status = error.response.status;
        const data = error.response.data;
        throw new Error(`Erro do servidor (${status}): ${data?.detail || data?.message || 'Erro desconhecido'}`);
      } else if (error.request) {
        // Timeout ou erro de rede
        throw new Error('Erro de conexão: não foi possível conectar ao servidor. Verifique sua internet.');
      } else if (error.message) {
        // Erro local
        throw error;
      } else {
        throw new Error('Erro desconhecido ao fazer upload');
      }
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

