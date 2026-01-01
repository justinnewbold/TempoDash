import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MainMenu() {
  const titleAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate in
    Animated.sequence([
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(buttonsAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for play button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/levels');
  };

  const handleSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/settings');
  };

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e', '#16213e']} style={styles.container}>
      {/* Background decorative elements */}
      <View style={styles.bgDecoration}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.bgDot,
              {
                left: Math.random() * SCREEN_WIDTH,
                top: Math.random() * SCREEN_HEIGHT,
                opacity: 0.1 + Math.random() * 0.2,
                transform: [{ scale: 0.5 + Math.random() * 1 }],
              },
            ]}
          />
        ))}
      </View>

      {/* Title */}
      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: titleAnim,
            transform: [
              {
                translateY: titleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.title}>TEMPO</Text>
        <Text style={styles.titleAccent}>DASH</Text>
        <View style={styles.titleUnderline} />
      </Animated.View>

      {/* Subtitle */}
      <Animated.Text
        style={[
          styles.subtitle,
          {
            opacity: titleAnim,
          },
        ]}
      >
        Rhythm Platformer
      </Animated.Text>

      {/* Player icon preview */}
      <Animated.View
        style={[
          styles.playerPreview,
          {
            opacity: titleAnim,
          },
        ]}
      >
        <View style={styles.playerCube}>
          <View style={styles.playerEye} />
        </View>
      </Animated.View>

      {/* Buttons */}
      <Animated.View
        style={[
          styles.buttonsContainer,
          {
            opacity: buttonsAnim,
            transform: [
              {
                translateY: buttonsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Play Button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlay}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#00ffaa', '#00cc88']}
              style={styles.playButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="play" size={32} color="#0a0a1a" />
              <Text style={styles.playButtonText}>PLAY</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Settings Button */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSettings}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color="#fff" />
          <Text style={styles.secondaryButtonText}>Settings</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Version */}
      <Text style={styles.version}>v1.0.0</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgDecoration: {
    ...StyleSheet.absoluteFillObject,
  },
  bgDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00ffaa',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 56,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 8,
  },
  titleAccent: {
    fontSize: 56,
    fontWeight: '800',
    color: '#00ffaa',
    letterSpacing: 8,
    marginTop: -10,
  },
  titleUnderline: {
    width: 100,
    height: 4,
    backgroundColor: '#00ffaa',
    borderRadius: 2,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 4,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  playerPreview: {
    marginTop: 40,
    marginBottom: 60,
  },
  playerCube: {
    width: 60,
    height: 60,
    backgroundColor: '#00ffaa',
    borderRadius: 8,
    shadowColor: '#00ffaa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 8,
  },
  playerEye: {
    width: 14,
    height: 14,
    backgroundColor: '#ffffff',
    borderRadius: 7,
  },
  buttonsContainer: {
    alignItems: 'center',
    gap: 20,
  },
  playButton: {
    borderRadius: 30,
    shadowColor: '#00ffaa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  playButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    gap: 12,
  },
  playButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0a0a1a',
    letterSpacing: 4,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
  },
});
