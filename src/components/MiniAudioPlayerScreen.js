import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { usePlayer } from '../context/PlayerContext';
import MiniAudioPlayer from './MiniAudioPlayer';

const MiniAudioPlayerScreen = () => {
  const navigation = useNavigation();
  
  const { 
    currentMedia, 
    isVisible, 
    playNext, 
    playPrevious, 
    hasNext, 
    hasPrevious,
    isPlaying
  } = usePlayer();

  // Obter rota atual sem usar useRoute
  const getCurrentRouteName = () => {
    const state = navigation.getState();
    if (state && state.routes && state.index !== undefined) {
      return state.routes[state.index]?.name;
    }
    return null;
  };
  
  const currentRouteName = getCurrentRouteName();
  const isOnAudioPlayerScreen = currentRouteName === 'AudioPlayer';






  const isOnVideoPlayerScreen = currentRouteName === 'VideoPlayer';

  const handlePress = () => {
    if (currentMedia) {
      navigation.navigate('AudioPlayer', { 
        media: currentMedia,
        mediaList: []
      });
    }
  };

  // Não mostrar mini player se estiver na tela do player principal ou de vídeo
  if (!isVisible || !currentMedia || isOnAudioPlayerScreen || isOnVideoPlayerScreen) {
    return null;
  }

  return (
    <MiniAudioPlayer
      onPress={handlePress}
      onNext={playNext}
      onPrevious={playPrevious}
      hasNext={hasNext}
      hasPrevious={hasPrevious}
    />
  );
};

export default MiniAudioPlayerScreen;
