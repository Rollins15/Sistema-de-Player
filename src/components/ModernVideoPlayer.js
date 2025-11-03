import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { getOrientationAsync, lockAsync, Orientation, OrientationLock } from 'expo-screen-orientation';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ModernVideoPlayer = ({ source, onPlaybackStatusUpdate, style, isFullscreen = false, onFullscreenChange }) => {
  const [showControls, setShowControls] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const hideControlsTimerRef = useRef(null);
  
  // Log quando showControls muda
  React.useEffect(() => {
    console.log('🎮 showControls mudou:', showControls);
  }, [showControls]);

  // Iniciar timer quando o vídeo começa a tocar
  React.useEffect(() => {
    if (player && player?.playing && showControls) {
      startHideTimer();
    }
  }, [player?.playing, showControls, startHideTimer]);

  // Limpar timer quando componente desmonta
  React.useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);
  
  // Log de montagem/desmontagem
  React.useEffect(() => {
    console.log('🔄 ModernVideoPlayer montado');
    return () => {
      console.log('🔄 ModernVideoPlayer desmontado');
    };
  }, []);

  // Log quando props mudam
  React.useEffect(() => {
    console.log('🔄 Props mudaram:', {
      uri: source.uri,
      isFullscreen,
      style: !!style
    });
  }, [source.uri, isFullscreen, style]);
  
  const player = useVideoPlayer(source.uri, (player) => {
    player.loop = false;
    player.muted = false;
    console.log('🎬 Player inicializado:', {
      uri: source.uri,
      duration: player.duration,
      status: player.status
    });
  });

  // Log quando o player muda - apenas mudanças importantes
  React.useEffect(() => {
    if (player?.status === 'readyToPlay' && player?.duration > 0) {
      console.log('✅ Player pronto:', {
        status: player.status,
        duration: player.duration,
        currentTime: player.currentTime
      });
    }
  }, [player.status, player.duration]);

  // Log quando currentTime muda
  React.useEffect(() => {
    if (currentTime > 0) {
      console.log('⏰ currentTime atualizado:', currentTime);
    }
  }, [currentTime]);

  // Timer otimizado para atualizar posição apenas quando necessário
  React.useEffect(() => {
    if (!player) return;
    
    const interval = setInterval(() => {
      if (player && player.currentTime !== undefined) {
        setCurrentTime(player.currentTime);
        console.log('⏰ Timer atualizou currentTime:', player.currentTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [player]); // Volta para depender do player inteiro

  const handlePlayPause = useCallback(() => {
    console.log('🎮 handlePlayPause chamado:', {
      isFullscreen,
      playerStatus: player?.status,
      playerPlaying: player?.playing,
      playerExists: !!player
    });
    
    try {
      if (player?.playing) {
        player.pause();
        console.log('⏸️ Vídeo pausado');
      } else {
        player?.play();
        console.log('▶️ Vídeo reproduzindo');
      }
    } catch (error) {
      console.log('❌ Erro ao controlar reprodução:', error);
    }
  }, [player, isFullscreen]);

  const handleSeek = useCallback((value) => {
    if (!player) {
      return;
    }
    
    const finalDuration = getDuration();
    
    if (finalDuration === 0) {
      console.log('❌ Duração não disponível para seek');
      return;
    }
    
    try {
      const newPosition = value * finalDuration;
      console.log('🎯 Seek para:', newPosition.toFixed(2), 'segundos');
      
      // Não pausar durante seek para evitar problemas
      player.currentTime = newPosition;
    } catch (error) {
      console.log('❌ Erro ao buscar posição:', error);
    }
  }, [player, duration]);

  const handleSliderChange = useCallback((value) => {
    setIsDragging(true);
    const finalDuration = getDuration();
    if (finalDuration > 0) {
      setDragPosition(value * finalDuration);
    }
  }, [duration]);

  const handleSliderComplete = useCallback((value) => {
    setIsDragging(false);
    handleSeek(value);
  }, [handleSeek]);

  const handleFullscreen = useCallback(() => {
    console.log('🖥️ Botão tela cheia clicado no ModernVideoPlayer');
    if (onFullscreenChange) {
      onFullscreenChange(!isFullscreen);
    }
  }, [isFullscreen, onFullscreenChange]);

  const handleOrientationChange = useCallback(async () => {
    console.log('📱 Botão orientação clicado no ModernVideoPlayer');
    try {
      const currentOrientation = await getOrientationAsync();
      if (currentOrientation === Orientation.PORTRAIT_UP) {
        await lockAsync(OrientationLock.LANDSCAPE);
        console.log('📱 Orientação alterada para landscape');
      } else {
        await lockAsync(OrientationLock.PORTRAIT);
        console.log('📱 Orientação alterada para portrait');
      }
    } catch (error) {
      console.log('❌ Erro ao alterar orientação:', error);
    }
  }, []);

  // Função para iniciar timer de auto-hide
  const startHideTimer = useCallback(() => {
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
      console.log('🕐 Controles escondidos automaticamente');
    }, 3000); // 3 segundos
  }, []);

  // Função para mostrar controles e reiniciar timer
  const showControlsAndStartTimer = useCallback(() => {
    setShowControls(true);
    startHideTimer();
    console.log('👁️ Controles mostrados');
  }, [startHideTimer]);

  // Função para toggle dos controles
  const toggleControls = useCallback(() => {
    if (showControls) {
      setShowControls(false);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
      console.log('👁️ Controles escondidos manualmente');
    } else {
      showControlsAndStartTimer();
    }
  }, [showControls, showControlsAndStartTimer]);

  const formatTime = (seconds) => {
    if (!seconds || typeof seconds !== 'number' || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60 >>> 0);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentPosition = useCallback(() => {
    // Se estiver arrastando, mostrar a posição do arraste
    if (isDragging) {
      return dragPosition || 0;
    }
    // Usar currentTime do estado local que é atualizado pelo timer
    return currentTime || 0;
  }, [isDragging, dragPosition, currentTime]);

  const getDuration = useCallback(() => {
    const playerDuration = player.duration || 0;
    const localDuration = duration || 0;
    return playerDuration > 0 ? playerDuration : localDuration;
  }, [player.duration, duration]);

  const getProgress = useCallback(() => {
    const position = getCurrentPosition();
    const duration = getDuration();
    return duration === 0 || !duration ? 0 : position / duration;
  }, [getCurrentPosition, getDuration]);

  return (
    <View style={[styles.container, style, isFullscreen && styles.fullscreenContainer]}>
      {/* TouchableOpacity para detectar cliques na tela */}
      <TouchableOpacity
        style={styles.touchableArea}
        onPress={toggleControls}
        activeOpacity={1}
      >
        <VideoView
          style={[styles.video, isFullscreen && styles.fullscreenVideo]}
          player={player}
          contentFit="contain"
          nativeControls={false}
        />
      </TouchableOpacity>

      {/* Controles customizados */}
      {showControls && (
        <View style={styles.controlsOverlay}>
          {console.log('🎮 Renderizando controles:', { showControls, isFullscreen, zIndex: 20 })}
          <View style={styles.controls}>
            {/* Botões auxiliares à esquerda */}
            <View style={styles.leftControls}>
              <TouchableOpacity
                style={styles.auxButton}
                onPress={() => {
                  handleFullscreen();
                  startHideTimer(); // Reiniciar timer após clique
                }}
              >
                <Ionicons 
                  name={isFullscreen ? "contract" : "expand"} 
                  size={24} 
                  color="#007AFF" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.auxButton}
                onPress={() => {
                  handleOrientationChange();
                  startHideTimer(); // Reiniciar timer após clique
                }}
              >
                <Ionicons name="phone-portrait" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            {/* Botão play centralizado */}
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => {
                console.log('🎯 Botão play clicado');
                handlePlayPause();
                startHideTimer(); // Reiniciar timer após clique
              }}
            >
              <Ionicons
                name={player?.playing ? 'pause' : 'play'}
                size={32}
                color="#fff"
              />
            </TouchableOpacity>
            
            {/* Espaço à direita para balancear */}
            <View style={styles.rightControls} />
          </View>

          {/* Barra de progresso */}
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>
              {formatTime(getCurrentPosition())}
            </Text>
            
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={getProgress()}
              onValueChange={handleSliderChange}
              onSlidingComplete={handleSliderComplete}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#fff"
              thumbStyle={styles.sliderThumb}
            />
            
            <Text style={styles.timeText}>
              {formatTime(getDuration())}
            </Text>
          </View>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchableArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: '100%',
    flex: 1,
  },
  fullscreenVideo: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    zIndex: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightControls: {
    width: 100, // Mesmo tamanho dos controles da esquerda para balancear
  },
  controlButton: {
    marginHorizontal: 16,
    padding: 8,
    zIndex: 30, // Aumentado para ficar acima de todos os outros controles
  },
  auxButton: {
    marginHorizontal: 8,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
    zIndex: 30,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20, // Menor que os botões de tela cheia/orientação
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 12,
  },
  sliderThumb: {
    backgroundColor: '#007AFF',
    width: 20,
    height: 20,
  },
  timeText: {
    fontSize: 14,
    color: '#fff',
    minWidth: 40,
    textAlign: 'center',
  },
});

export default ModernVideoPlayer;
