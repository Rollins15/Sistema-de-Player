# Sistema de Leitor de Vídeo e Áudio

## 📱 Descrição do Projeto

Sistema completo de reprodução de mídia desenvolvido para a disciplina de **Programação Móvel**, utilizando:

- **Frontend**: React Native com Expo
- **Backend**: FastAPI (Python)
- **Banco de Dados**: SQLite
- **Plataforma**: Expo Go para dispositivos móveis

## 🏗️ Arquitetura do Sistema

### Frontend (React Native + Expo)
```
src/
├── components/          # Componentes reutilizáveis
│   ├── VideoPlayer.js  # Player de vídeo
│   ├── AudioPlayer.js  # Player de áudio
│   └── MediaList.js    # Lista de mídias
├── screens/            # Telas da aplicação
│   ├── HomeScreen.js   # Tela principal
│   ├── VideoPlayerScreen.js
│   └── AudioPlayerScreen.js
├── services/           # Serviços e APIs
│   └── MediaService.js
├── database/           # Configuração do banco
│   └── Database.js
└── utils/              # Utilitários
```

### Backend (FastAPI)
```
backend/
├── app/
│   └── main.py         # API principal
├── models/             # Modelos de dados
├── routers/            # Rotas da API
├── requirements.txt    # Dependências Python
└── run.py             # Script de execução
```

## 🚀 Funcionalidades

### ✅ Implementadas
- **Reprodução de Vídeo**: Player completo com controles
- **Reprodução de Áudio**: Player com barra de progresso
- **Gerenciamento de Mídia**: Lista, favoritos, exclusão
- **Banco de Dados SQLite**: Armazenamento local
- **API REST**: Backend com FastAPI
- **Navegação**: Stack Navigator
- **Interface Responsiva**: Design moderno

### 🔄 Em Desenvolvimento
- Upload de arquivos
- Playlists personalizadas
- Histórico de reprodução
- Compartilhamento de mídia
- Sincronização com servidor

## 📦 Dependências

### Frontend (React Native)
```json
{
  "expo": "~54.0.18",
  "expo-av": "~14.0.7",
  "expo-sqlite": "~14.0.6",
  "expo-file-system": "~17.0.1",
  "expo-media-library": "~16.0.4",
  "expo-camera": "~15.0.14",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/stack": "^6.3.20"
}
```

### Backend (Python)
```
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.0
pydantic==2.5.0
```

## 🛠️ Instalação e Execução

### 1. Frontend (React Native)
```bash
# Instalar dependências
npm install

# Executar no Expo Go
npm start
# ou
npx expo start

# Executar na web
npm run web
```

### 2. Backend (FastAPI)
```bash
# Navegar para o diretório backend
cd backend

# Instalar dependências Python
pip install -r requirements.txt

# Executar servidor
python run.py
# ou
uvicorn app.main:app --reload
```

## 📱 Como Usar

### 1. Instalar Expo Go
- **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

### 2. Executar o Projeto
1. Execute `npm start` no terminal
2. Escaneie o QR code com o Expo Go
3. O app será carregado no seu dispositivo

### 3. Funcionalidades do App
- **Navegação**: Use os botões de filtro (Todos, Vídeos, Áudios, Favoritos)
- **Reprodução**: Toque em uma mídia para reproduzir
- **Favoritos**: Toque no coração para marcar como favorito
- **Exclusão**: Toque na lixeira para excluir mídia

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- **media**: Informações das mídias
- **playlists**: Playlists personalizadas
- **playlist_media**: Relacionamento playlist-mídia
- **playback_history**: Histórico de reprodução

### Campos da Tabela Media
- `id`: Chave primária
- `filename`: Nome do arquivo
- `title`: Título da mídia
- `type`: Tipo (video/audio)
- `duration`: Duração em segundos
- `size`: Tamanho do arquivo
- `path`: Caminho do arquivo
- `is_favorite`: Se é favorito
- `created_at`: Data de criação
- `updated_at`: Data de atualização

## 🔧 Configuração do Ambiente

### Variáveis de Ambiente
```env
# Backend
DATABASE_URL=sqlite:///./media_player.db
UPLOAD_DIR=uploads
API_HOST=0.0.0.0
API_PORT=8000

# Frontend
API_BASE_URL=https://sistema-de-player.onrender.com
```

## 📊 API Endpoints

### Mídia
- `GET /media` - Listar todas as mídias
- `GET /media/{id}` - Obter mídia por ID
- `POST /media` - Criar nova mídia
- `PUT /media/{id}` - Atualizar mídia
- `DELETE /media/{id}` - Excluir mídia
- `GET /media/favorites` - Listar favoritos
- `POST /media/{id}/toggle-favorite` - Alternar favorito

### Playlists
- `GET /playlists` - Listar playlists
- `POST /playlists` - Criar playlist
- `POST /playlists/{id}/media/{media_id}` - Adicionar mídia à playlist

### Histórico
- `POST /history/{media_id}` - Adicionar ao histórico
- `GET /history` - Obter histórico

## 🎯 Objetivos do Projeto

Este projeto foi desenvolvido para demonstrar:

1. **Desenvolvimento Mobile**: React Native com Expo
2. **Banco de Dados**: SQLite para armazenamento local
3. **API REST**: FastAPI para backend
4. **Arquitetura**: Separação frontend/backend
5. **Funcionalidades**: Player de mídia completo

## 📚 Tecnologias Utilizadas

- **React Native**: Framework mobile
- **Expo**: Plataforma de desenvolvimento
- **SQLite**: Banco de dados local
- **FastAPI**: Framework web Python
- **SQLAlchemy**: ORM Python
- **React Navigation**: Navegação
- **Expo AV**: Reprodução de mídia

## 👨‍💻 Desenvolvido por

**Disciplina**: Programação Móvel  
**Tecnologias**: React Native, FastAPI, SQLite  
**Plataforma**: Expo Go

---

*Sistema desenvolvido para fins educacionais na disciplina de Programação Móvel.*
