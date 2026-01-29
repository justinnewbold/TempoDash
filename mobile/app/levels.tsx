import React, { useEffect, useState } from 'react';
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
import { SaveManager } from '../src/systems/SaveManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;

export default function LevelSelect() {
  const insets = useSafeAreaInsets();
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [highScores, setHighScores] = useState<Record<number, number>>({});

  useEffect(() => {
    const loadData = async () => {
      const data = await SaveManager.load();
      setUnlockedLevels(data.unlockedLevels);
      setHighScores(data.highScores);
    };
    loadData();
  }, []);

  const handleLevelSelect = (levelId: number) => {
    if (!unlockedLevels.includes(levelId)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
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

  const getDifficultyColor = (difficulty?: string): string => {
    switch (difficulty) {
      case 'easy': return '#4caf50';
      case 'medium': return '#ff9800';
      case 'hard': return '#f44336';
      case 'extreme': return '#9c27b0';
      default: return '#4caf50';
    }
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
          {LEVELS.map((level) => {
            const isUnlocked = unlockedLevels.includes(level.id);
            const score = highScores[level.id];
            const isCompleted = score !== undefined && score > 0;

            return (
              <TouchableOpacity
                key={level.id}
                style={[styles.levelCard, !isUnlocked && styles.levelCardLocked]}
                onPress={() => handleLevelSelect(level.id)}
                activeOpacity={isUnlocked ? 0.8 : 1}
              >
                <LinearGradient
                  colors={isUnlocked
                    ? [level.backgroundColor, '#1a1a2e']
                    : ['#1a1a1a', '#111111']
                  }
                  style={styles.levelCardGradient}
                >
                  <View style={styles.levelHeader}>
                    <View style={[styles.levelNumber, !isUnlocked && styles.levelNumberLocked]}>
                      {isUnlocked ? (
                        <Text style={styles.levelNumberText}>{level.id}</Text>
                      ) : (
                        <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.3)" />
                      )}
                    </View>
                    {isCompleted && (
                      <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
                    )}
                  </View>

                  <Text style={[styles.levelName, !isUnlocked && styles.levelNameLocked]}>
                    {isUnlocked ? level.name : '???'}
                  </Text>

                  {level.difficulty && isUnlocked && (
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(level.difficulty) + '33' }]}>
                      <Text style={[styles.difficultyText, { color: getDifficultyColor(level.difficulty) }]}>
                        {level.difficulty.toUpperCase()}
                      </Text>
                    </View>
                  )}

                  <View style={styles.levelInfo}>
                    <Ionicons name="star" size={14} color={isUnlocked ? '#ffd700' : '#333'} />
                    <Text style={[styles.levelInfoText, !isUnlocked && { color: '#333' }]}>
                      {isUnlocked ? `${level.coins.length} coins` : 'Locked'}
                    </Text>
                  </View>

                  {score !== undefined && score > 0 && (
                    <Text style={styles.highScoreText}>
                      Best: {score}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
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
  levelCardLocked: {
    opacity: 0.6,
  },
  levelCardGradient: {
    padding: 16,
    minHeight: 150,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumberLocked: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
  levelNameLocked: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
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
  highScoreText: {
    fontSize: 11,
    color: '#00ffaa',
    marginTop: 4,
    fontWeight: '600',
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
