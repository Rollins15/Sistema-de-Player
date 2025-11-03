import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

// Context
import { PlayerProvider } from './src/context/PlayerContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import AudioPlayerScreen from './src/screens/AudioPlayerScreen';
import MediaLibraryScreen from './src/screens/MediaLibraryScreen';

// Components
import MiniAudioPlayerScreen from './src/components/MiniAudioPlayerScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <PlayerProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        <View style={{ flex: 1 }}>
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
            />
            <Stack.Screen 
              name="VideoPlayer" 
              component={VideoPlayerScreen}
            />
            <Stack.Screen 
              name="AudioPlayer" 
              component={AudioPlayerScreen}
            />  
            <Stack.Screen 
              name="MediaLibrary" 
              component={MediaLibraryScreen}
            />
          </Stack.Navigator>
          <MiniAudioPlayerScreen />
        </View>
      </NavigationContainer>
    </PlayerProvider>
  );
}
