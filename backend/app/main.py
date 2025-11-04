from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import os
import shutil
from pathlib import Path
from mutagen import File as MutagenFile
from PIL import Image
import io
import base64
import urllib.parse

# Fuso horário de Moçambique (UTC+2)
MOZAMBIQUE_TZ = timezone(timedelta(hours=2))

def get_mozambique_time():
    """Retorna o horário atual de Moçambique (UTC+2)"""
    return datetime.now(MOZAMBIQUE_TZ)

# Configuração do banco de dados
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./media_player.db")
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Configuração da URL base da API
# Remove barra final se existir para evitar duplo slash
_api_url = os.getenv("API_BASE_URL", "http://localhost:8000")
API_BASE_URL = _api_url.rstrip('/')

# Modelos do banco de dados
class Media(Base):
    __tablename__ = "media"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    title = Column(String)
    artist = Column(String)  # Nome do artista
    type = Column(String, nullable=False)  # 'video' ou 'audio'
    duration = Column(Float)
    size = Column(Integer)
    path = Column(String, nullable=False)
    thumbnail_path = Column(String)
    cover = Column(String)  # URL da capa da música
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: get_mozambique_time())
    updated_at = Column(DateTime, default=lambda: get_mozambique_time())

class Playlist(Base):
    __tablename__ = "playlists"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=lambda: get_mozambique_time())

class PlaylistMedia(Base):
    __tablename__ = "playlist_media"
    
    id = Column(Integer, primary_key=True, index=True)
    playlist_id = Column(Integer, nullable=False)
    media_id = Column(Integer, nullable=False)
    position = Column(Integer, default=0)

class PlaybackHistory(Base):
    __tablename__ = "playback_history"
    
    id = Column(Integer, primary_key=True, index=True)
    media_id = Column(Integer, nullable=False)
    position = Column(Float)
    played_at = Column(DateTime, default=lambda: get_mozambique_time())

# Criar tabelas
Base.metadata.create_all(bind=engine)

# Modelos Pydantic
class MediaBase(BaseModel):
    filename: str
    title: Optional[str] = None
    artist: Optional[str] = None
    type: str
    duration: Optional[float] = None
    size: Optional[int] = None
    path: str
    thumbnail_path: Optional[str] = None
    cover: Optional[str] = None
    is_favorite: bool = False

class MediaCreate(MediaBase):
    pass

class MediaUpdate(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    cover: Optional[str] = None
    is_favorite: Optional[bool] = None

class MediaResponse(MediaBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PlaylistBase(BaseModel):
    name: str
    description: Optional[str] = None

class PlaylistCreate(PlaylistBase):
    pass

class PlaylistResponse(PlaylistBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Inicializar FastAPI
app = FastAPI(title="Media Player API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especificar domínios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency para obter sessão do banco
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Diretório para uploads
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Função auxiliar para converter path em URL da API
def format_media_path(path: str, media_id: int = None) -> str:
    """Converte path relativo em URL da API"""
    if path and (path.startswith('uploads/') or not path.startswith('http')):
        # Path relativo, converter para URL da API
        if media_id:
            return f"{API_BASE_URL}/media/file/{media_id}"
    return path

def format_cover_path(cover_path: str) -> str:
    """Converte path de capa em URL da API"""
    if not cover_path:
        return None
    # Normalizar path (converter \ para /)
    normalized_path = Path(cover_path).as_posix()
    if normalized_path.startswith('uploads/covers/'):
        filename = Path(normalized_path).name
        # URL-encode o filename para lidar com caracteres especiais
        from urllib.parse import quote
        encoded_filename = quote(filename)
        return f"{API_BASE_URL}/uploads/covers/{encoded_filename}"
    return cover_path

def format_thumbnail_path(thumbnail_path: str) -> str:
    """Converte path de thumbnail em URL da API"""
    if not thumbnail_path:
        return None
    # Normalizar path (converter \ para /)
    normalized_path = Path(thumbnail_path).as_posix()
    if normalized_path.startswith('uploads/thumbnails/'):
        filename = Path(normalized_path).name
        # Codificar novamente para evitar que FastAPI decodifique
        from urllib.parse import quote
        encoded_filename = quote(filename, safe='')
        return f"{API_BASE_URL}/uploads/thumbnails/{encoded_filename}"
    return thumbnail_path

# Função para extrair metadados de arquivos de áudio
def extract_audio_metadata(file_path: Path) -> dict:
    """Extrai metadados (título, artista, duração, capa) de arquivo de áudio"""
    try:
        audio_file = MutagenFile(str(file_path))
        
        if not audio_file:
            return {}
        
        metadata = {}
        
        # Extrair título
        if 'TIT2' in audio_file or 'TITLE' in audio_file:
            title = audio_file.get('TIT2', audio_file.get('TITLE', [None]))[0]
            if title:
                metadata['title'] = title
        
        # Extrair artista
        if 'TPE1' in audio_file or 'ARTIST' in audio_file:
            artist = audio_file.get('TPE1', audio_file.get('ARTIST', [None]))[0]
            if artist:
                metadata['artist'] = artist
        
        # Extrair duração
        if hasattr(audio_file, 'info') and hasattr(audio_file.info, 'length'):
            metadata['duration'] = audio_file.info.length
        
        # Extrair capa (album art)
        if 'APIC:' in audio_file:
            apic = audio_file['APIC:'].data
            # Salvar capa como imagem
            cover_path = save_cover_image(apic, file_path)
            if cover_path:
                metadata['cover'] = cover_path
        
        return metadata
        
    except Exception as e:
        print(f"Erro ao extrair metadados: {e}")
        return {}

def save_cover_image(image_data: bytes, audio_file_path: Path) -> Optional[str]:
    """Salva a capa extraída como arquivo imagem"""
    try:
        # Criar diretório de capas se não existir
        covers_dir = Path("uploads/covers")
        covers_dir.mkdir(exist_ok=True, parents=True)
        
        # Nome do arquivo baseado no nome do áudio (decodificar se URL-encoded)
        base_name = audio_file_path.stem
        # Decodificar se estiver URL-encoded
        if '%' in base_name:
            base_name = urllib.parse.unquote(base_name)
        cover_path = covers_dir / f"{base_name}.jpg"
        
        # Salvar imagem
        with open(cover_path, 'wb') as f:
            f.write(image_data)
        
        # Retornar URL relativa
        return f"uploads/covers/{base_name}.jpg"
        
    except Exception as e:
        print(f"Erro ao salvar capa: {e}")
        return None

# Rotas da API
@app.get("/")
async def root():
    return {"message": "Media Player API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": get_mozambique_time()}

# Rotas para mídia
#

@app.get("/media", response_model=List[MediaResponse])
async def get_all_media(db: Session = Depends(get_db)):
    # Buscar todas as mídias ordenadas por título (alfabético)
    media = db.query(Media).order_by(Media.title).all()
    # Converter paths para URLs da API
    for m in media:
        if m.path:
            m.path = format_media_path(m.path, m.id)
        if m.cover:
            m.cover = format_cover_path(m.cover)
        if m.thumbnail_path:
            m.thumbnail_path = format_thumbnail_path(m.thumbnail_path)
    return media

@app.post("/media/upload")
async def upload_media(file: UploadFile = File(...), thumbnail: UploadFile = File(None), db: Session = Depends(get_db)):
    """Fazer upload de arquivo de mídia"""
    # Criar diretório de uploads
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    
    # Salvar arquivo
    file_path = upload_dir / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Salvar thumbnail se fornecido
    thumbnail_path_str = None
    if thumbnail:
        thumbnails_dir = upload_dir / "thumbnails"
        thumbnails_dir.mkdir(exist_ok=True)
        thumbnail_filename = f"{file_path.stem}.jpg"
        thumbnail_path = thumbnails_dir / thumbnail_filename
        with open(thumbnail_path, "wb") as buffer:
            shutil.copyfileobj(thumbnail.file, buffer)
        thumbnail_path_str = str(thumbnail_path)
        print(f"Thumbnail salva: {thumbnail_path_str}")
    
    # Determinar tipo
    media_type = 'video' if file.content_type.startswith('video') else 'audio'
    
    # Extrair metadados se for áudio
    metadata = {}
    if media_type == 'audio':
        metadata = extract_audio_metadata(file_path)
        print(f"Metadados extraídos: {metadata}")
    
    # Decodificar nome do arquivo se estiver URL-encoded
    decoded_filename = urllib.parse.unquote(file.filename)
    decoded_title = metadata.get('title') or decoded_filename.rsplit('.', 1)[0]
    
    # Criar registro no banco
    db_media = Media(
        filename=decoded_filename,
        title=decoded_title,
        artist=metadata.get('artist', None),
        type=media_type,
        duration=metadata.get('duration', 0),
        size=file_path.stat().st_size,
        path=str(file_path),
        thumbnail_path=thumbnail_path_str,
        cover=metadata.get('cover', None),
        is_favorite=False
    )
    db.add(db_media)
    db.commit()
    db.refresh(db_media)
    
    # Converter path para URL da API
    api_path = format_media_path(db_media.path, db_media.id)
    
    # Converter cover para URL se existir
    cover_url = None
    if db_media.cover:
        cover_url = format_cover_path(db_media.cover)
    
    # Converter thumbnail para URL se existir
    thumbnail_url = None
    if db_media.thumbnail_path:
        thumbnail_url = format_thumbnail_path(db_media.thumbnail_path)
    
    return {
        "id": db_media.id,
        "filename": db_media.filename,
        "title": db_media.title,
        "artist": db_media.artist,
        "type": db_media.type,
        "duration": db_media.duration,
        "size": db_media.size,
        "path": api_path,
        "thumbnail_path": thumbnail_url,
        "cover": cover_url,
        "is_favorite": db_media.is_favorite,
        "created_at": db_media.created_at,
        "updated_at": db_media.updated_at
    }

@app.post("/media", response_model=MediaResponse)
async def create_media(media: MediaCreate, db: Session = Depends(get_db)):
    """Criar mídia via URL externa"""
    db_media = Media(**media.dict())
    db.add(db_media)
    db.commit()
    db.refresh(db_media)
    return db_media

@app.get("/media/favorites", response_model=List[MediaResponse])
async def get_favorite_media(db: Session = Depends(get_db)):
    media = db.query(Media).filter(Media.is_favorite == True).order_by(Media.title).all()
    for m in media:
        if m.path:
            m.path = format_media_path(m.path, m.id)
        if m.cover:
            m.cover = format_cover_path(m.cover)
        if m.thumbnail_path:
            m.thumbnail_path = format_thumbnail_path(m.thumbnail_path)
    return media

@app.get("/media/search/{query}", response_model=List[MediaResponse])
async def search_media(query: str, db: Session = Depends(get_db)):
    media = db.query(Media).filter(
        Media.title.contains(query) | Media.filename.contains(query)
    ).order_by(Media.title).all()
    for m in media:
        if m.path:
            m.path = format_media_path(m.path, m.id)
        if m.cover:
            m.cover = format_cover_path(m.cover)
        if m.thumbnail_path:
            m.thumbnail_path = format_thumbnail_path(m.thumbnail_path)
    return media

@app.get("/media/type/{media_type}", response_model=List[MediaResponse])
async def get_media_by_type(media_type: str, db: Session = Depends(get_db)):
    if media_type not in ['video', 'audio']:
        raise HTTPException(status_code=400, detail="Tipo deve ser 'video' ou 'audio'")
    
    media = db.query(Media).filter(Media.type == media_type).order_by(Media.title).all()
    for m in media:
        if m.path:
            m.path = format_media_path(m.path, m.id)
        if m.cover:
            m.cover = format_cover_path(m.cover)
        if m.thumbnail_path:
            m.thumbnail_path = format_thumbnail_path(m.thumbnail_path)
    return media

@app.get("/media/file/{media_id}")
async def get_media_file(media_id: int, db: Session = Depends(get_db)):
    """Servir arquivo de mídia"""
    from fastapi.responses import FileResponse
    
    db_media = db.query(Media).filter(Media.id == media_id).first()
    if not db_media:
        raise HTTPException(status_code=404, detail="Mídia não encontrada")
    
    file_path = Path(db_media.path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    
    return FileResponse(file_path, media_type='application/octet-stream')

# Rotas com parâmetros genéricos DEVEM vir DEPOIS das rotas específicas
@app.get("/media/{media_id}", response_model=MediaResponse)
async def get_media(media_id: int, db: Session = Depends(get_db)):
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Mídia não encontrada")
    # Converter path para URL da API
    if media.path:
        media.path = format_media_path(media.path, media.id)
    if media.cover:
        media.cover = format_cover_path(media.cover)
    if media.thumbnail_path:
        media.thumbnail_path = format_thumbnail_path(media.thumbnail_path)
    return media

@app.put("/media/{media_id}", response_model=MediaResponse)
async def update_media(media_id: int, media_update: MediaUpdate, db: Session = Depends(get_db)):
    db_media = db.query(Media).filter(Media.id == media_id).first()
    if not db_media:
        raise HTTPException(status_code=404, detail="Mídia não encontrada")
    
    for field, value in media_update.dict(exclude_unset=True).items():
        setattr(db_media, field, value)
    
    db_media.updated_at = get_mozambique_time()
    db.commit()
    db.refresh(db_media)
    return db_media

@app.delete("/media/{media_id}")
async def delete_media(media_id: int, db: Session = Depends(get_db)):
    db_media = db.query(Media).filter(Media.id == media_id).first()
    if not db_media:
        raise HTTPException(status_code=404, detail="Mídia não encontrada")
    
    # Deletar arquivo físico da mídia
    media_path_str = db_media.path
    # Decodificar se estiver URL-encoded
    if '%' in media_path_str:
        media_path_str = urllib.parse.unquote(media_path_str)
    media_path = Path(media_path_str)
    if media_path.exists():
        try:
            media_path.unlink()
            print(f"Arquivo de mídia deletado: {media_path}")
        except Exception as e:
            print(f"Erro ao deletar arquivo de mídia {media_path}: {e}")
    
    # Deletar capa se existir
    if db_media.cover:
        cover_path_str = db_media.cover
        # Decodificar se estiver URL-encoded
        if '%' in cover_path_str:
            cover_path_str = urllib.parse.unquote(cover_path_str)
        cover_path = Path(cover_path_str)
        if cover_path.exists():
            try:
                cover_path.unlink()
                print(f"Capa deletada: {cover_path}")
            except Exception as e:
                print(f"Erro ao deletar capa {cover_path}: {e}")
    
    db.delete(db_media)
    db.commit()
    return {"message": "Mídia deletada com sucesso"}

@app.post("/media/{media_id}/toggle-favorite", response_model=MediaResponse)
async def toggle_favorite(media_id: int, db: Session = Depends(get_db)):
    db_media = db.query(Media).filter(Media.id == media_id).first()
    if not db_media:
        raise HTTPException(status_code=404, detail="Mídia não encontrada")
    
    db_media.is_favorite = not db_media.is_favorite
    db_media.updated_at = get_mozambique_time()
    db.commit()
    db.refresh(db_media)
    if db_media.path:
        db_media.path = format_media_path(db_media.path, db_media.id)
    if db_media.cover:
        db_media.cover = format_cover_path(db_media.cover)
    if db_media.thumbnail_path:
        db_media.thumbnail_path = format_thumbnail_path(db_media.thumbnail_path)
    return db_media

@app.get("/uploads/covers/{filename}")
async def get_cover_image(filename: str):
    """Servir imagem de capa"""
    from fastapi.responses import FileResponse
    
    # Decodificar filename se estiver URL-encoded
    decoded_filename = urllib.parse.unquote(filename)
    cover_path = Path("uploads/covers") / decoded_filename
    
    if not cover_path.exists():
        raise HTTPException(status_code=404, detail=f"Capa não encontrada: {decoded_filename}")
    
    return FileResponse(cover_path, media_type='image/jpeg')

@app.get("/uploads/thumbnails/{filename}")
async def get_thumbnail_image(filename: str):
    """Servir imagem de thumbnail"""
    from fastapi.responses import FileResponse
    
    # FastAPI já decodifica o filename, então usamos como vem
    thumbnail_path = Path("uploads/thumbnails") / filename
    
    if not thumbnail_path.exists():
        raise HTTPException(status_code=404, detail=f"Thumbnail não encontrada: {filename}")
    
    return FileResponse(thumbnail_path, media_type='image/jpeg')

# Rotas para playlists
@app.get("/playlists", response_model=List[PlaylistResponse])
async def get_playlists(db: Session = Depends(get_db)):
    playlists = db.query(Playlist).all()
    return playlists

@app.post("/playlists", response_model=PlaylistResponse)
async def create_playlist(playlist: PlaylistCreate, db: Session = Depends(get_db)):
    db_playlist = Playlist(**playlist.dict())
    db.add(db_playlist)
    db.commit()
    db.refresh(db_playlist)
    return db_playlist

@app.post("/playlists/{playlist_id}/media/{media_id}")
async def add_media_to_playlist(playlist_id: int, media_id: int, db: Session = Depends(get_db)):
    # Verificar se playlist existe
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist não encontrada")
    
    # Verificar se mídia existe
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Mídia não encontrada")
    
    # Adicionar à playlist
    playlist_media = PlaylistMedia(playlist_id=playlist_id, media_id=media_id)
    db.add(playlist_media)
    db.commit()
    
    return {"message": "Mídia adicionada à playlist com sucesso"}

# Rotas para histórico
@app.post("/history/{media_id}")
async def add_playback_history(media_id: int, position: float, db: Session = Depends(get_db)):
    history = PlaybackHistory(media_id=media_id, position=position)
    db.add(history)
    db.commit()
    return {"message": "Histórico adicionado com sucesso"}

@app.get("/history")
async def get_playback_history(db: Session = Depends(get_db)):
    history = db.query(PlaybackHistory).order_by(PlaybackHistory.played_at.desc()).limit(50).all()
    return history

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
