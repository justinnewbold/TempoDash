import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LEVELS } from '../src/levels';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;

export default function LevelSelect() {
  const insets = useSafeAreaInsets();

  const handleLevelSelect = (levelId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/game/${levelId}`);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleEndless = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/game/endless');
  };

  return (
    <LinearGradient colors={['#0a0a1a', '#1a1a2e', '#16213e']} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SELECT LEVEL</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Campaign Levels */}
        <Text style={styles.sectionTitle}>CAMPAIGN</Text>
        <View style={styles.levelsGrid}>
          {LEVELS.map((level, index) => (
            <TouchableOpacity
              key={level.id}
              style={styles.levelCard}
              onPress={() => handleLevelSelect(level.id)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[level.backgroundColor, '#1a1a2e']}
                style={styles.levelCardGradient}
              >
                <View style={styles.levelNumber}>
                  <Text style={styles.levelNumberText}>{level.id}</Text>
                </View>
                <Text style={styles.levelName}>{level.name}</Text>
                <View style={styles.levelInfo}>
                  <Ionicons name="star" size={14} color="#ffd700" />
                  <Text style={styles.levelInfoText}>
                    {level.coins.length} coins
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Endless Mode */}
        <Text style={styles.sectionTitle}>ENDLESS</Text>
        <TouchableOpacity
          style={styles.endlessCard}
          onPress={handleEndless}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#ff6b6b', '#ee5a5a', '#c44']}
            style={styles.endlessCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="infinite" size={40} color="#fff" />
            <View style={styles.endlessInfo}>
              <Text style={styles.endlessTitle}>Endless Mode</Text>
              <Text style={styles.endlessSubtitle}>How far can you go?</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.6)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Spacer for bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 16,
  },
  levelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  levelCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
  },
  levelCardGradient: {
    padding: 16,
    minHeight: 140,
  },
  levelNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  levelNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  levelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelInfoText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  endlessCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  endlessCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  endlessInfo: {
    flex: 1,
  },
  endlessTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  endlessSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
});
