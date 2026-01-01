import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';

import { AudioManager } from '../src/systems/AudioManager';
import { SaveManager } from '../src/systems/SaveManager';

export default function RootLayout() {
  useEffect(() => {
    // Lock to portrait mode
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

    // Initialize audio and load save data
    AudioManager.initialize();
    AudioManager.loadSounds();
    SaveManager.load();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar hidden />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: '#0a0a1a' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="levels" />
        <Stack.Screen name="game/[levelId]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
});
