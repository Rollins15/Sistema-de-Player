import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';

const PlayerContext = createContext();

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer deve ser usado dentro de um PlayerProvider');
  }
  return context;
};

export const PlayerProvider = ({ children }) => {
  const [currentMedia, setCurrentMedia] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeatMode, setRepeatMode] = useState('none'); // 'none', 'one', 'all'
  const [shuffleMode, setShuffleMode] = useState(false);
  
  const soundRef = useRef(null);
  const statusIntervalRef = useRef(null);

  // Carregar áudio
  const loadAudio = useCallback(async (uri) => {
    try {
      // Descarregar áudio anterior se existir
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
      soundRef.current = sound;

      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis / 1000);
      }
    } catch (error) {
      console.error('Erro ao carregar áudio:', error);
    }
  }, []);

  // Atualizar status periodicamente
  useEffect(() => {
    // Limpar intervalo anterior se existir
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }

    if (soundRef.current && isPlaying) {
      statusIntervalRef.current = setInterval(async () => {
        try {
          // Verificar se o sound ainda existe antes de usar
          if (soundRef.current) {
            const status = await soundRef.current.getStatusAsync();
            if (status.isLoaded) {
              setCurrentTime(status.positionMillis / 1000);
              setDuration(status.durationMillis / 1000);
              setIsPlaying(status.isPlaying);
            }
          }
        } catch (error) {
          console.log('Erro ao atualizar status:', error);
          // Se o sound não existir, limpar o intervalo
          if (statusIntervalRef.current) {
            clearInterval(statusIntervalRef.current);
          }
        }
      }, 100);
    } else {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }
    }

    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }
    };
  }, [isPlaying]);

  const playMedia = useCallback(async (media, list = [], autoPlay = false) => {
    // Se é a mesma mídia que já está tocando, não recarregar
    if (currentMedia && currentMedia.id === media.id && soundRef.current) {
      // Apenas atualizar a lista e o índice
      setMediaList(list);
      const index = list.findIndex(m => m.id === media.id);
      setCurrentIndex(index);
      setIsVisible(true);
      return;
    }
    
    const wasPlaying = isPlaying; // Guardar estado anterior
    setCurrentMedia(media);
    setMediaList(list);
    const index = list.findIndex(m => m.id === media.id);
    setCurrentIndex(index);
    setIsVisible(true);
    
    // Carregar o áudio apenas se for diferente
    await loadAudio(media.path);
    
    // Auto-play se solicitado ou se estava tocando antes
    if (autoPlay || wasPlaying) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    }
  }, [loadAudio, currentMedia, isPlaying]);

  const playPause = useCallback(async () => {
    try {
      if (!soundRef.current) return;
      
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Erro ao controlar reprodução:', error);
    }
  }, [isPlaying]);

  const stopMedia = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (error) {
        console.log('Erro ao parar áudio:', error);
      }
      soundRef.current = null;
    }
    setCurrentMedia(null);
    setMediaList([]);
    setCurrentIndex(-1);
    setIsVisible(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const seekTo = useCallback(async (value) => {
    console.log('seekTo chamado com value:', value, 'duration:', duration, 'soundRef:', soundRef.current ? 'exists' : 'null');
    if (!soundRef.current || !duration) {
      console.log('Seek cancelado: soundRef ou duration não disponível');
      return;
    }
    
    const wasPlaying = isPlaying; // Guardar estado de reprodução
    
    try {
      const newPositionMillis = (value * duration) * 1000;
      console.log('Posição calculada:', newPositionMillis, 'ms', newPositionMillis / 1000, 's');
      await soundRef.current.playFromPositionAsync(newPositionMillis);
      setCurrentTime(newPositionMillis / 1000);
      
      // Manter estado de reprodução após seek
      if (wasPlaying) {
        setIsPlaying(true);
      }
      
      console.log('Seek concluído');
    } catch (error) {
      console.log('Erro ao buscar posição:', error);
    }
  }, [duration, isPlaying]);

  const playNext = useCallback(async () => {
    if (currentIndex < mediaList.length - 1) {
      const nextMedia = mediaList[currentIndex + 1];
      setCurrentMedia(nextMedia);
      setCurrentIndex(currentIndex + 1);
      // Carregar o novo áudio
      await loadAudio(nextMedia.path);
      // Pequeno delay para garantir que o áudio está pronto
      await new Promise(resolve => setTimeout(resolve, 100));
      // Reproduzir automaticamente
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    }
  }, [currentIndex, mediaList, loadAudio]);

  const playPrevious = useCallback(async () => {
    if (currentIndex > 0) {
      const previousMedia = mediaList[currentIndex - 1];
      setCurrentMedia(previousMedia);
      setCurrentIndex(currentIndex - 1);
      // Carregar o novo áudio
      await loadAudio(previousMedia.path);
      // Pequeno delay para garantir que o áudio está pronto
      await new Promise(resolve => setTimeout(resolve, 100));
      // Reproduzir automaticamente
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    }
  }, [currentIndex, mediaList, loadAudio]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffleMode(prev => !prev);
  }, []);

  const value = {
    currentMedia,
    mediaList,
    currentIndex,
    isVisible,
    isPlaying,
    currentTime,
    duration,
    repeatMode,
    shuffleMode,
    playMedia,
    stopMedia,
    playPause,
    seekTo,
    playNext,
    playPrevious,
    toggleRepeat,
    toggleShuffle,
    hasNext: currentIndex < mediaList.length - 1,
    hasPrevious: currentIndex > 0,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

