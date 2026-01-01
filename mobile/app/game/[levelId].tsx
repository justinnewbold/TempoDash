import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GameCanvas } from '../../src/game/GameCanvas';
import { EndlessCanvas } from '../../src/game/EndlessCanvas';
import { getLevel, LEVELS } from '../../src/levels';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GameScreen() {
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const insets = useSafeAreaInsets();

  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [distance, setDistance] = useState(0);
  const [key, setKey] = useState(0);

  const isEndless = levelId === 'endless';
  const level = isEndless ? null : getLevel(parseInt(levelId || '1', 10));

  const handlePause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPaused(false);
  }, []);

  const handleRestart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPaused(false);
    setIsGameOver(false);
    setIsComplete(false);
    setScore(0);
    setCoins(0);
    setDistance(0);
    setKey((k) => k + 1);
  }, []);

  const handleQuit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleNextLevel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const currentId = parseInt(levelId || '1', 10);
    const nextLevel = LEVELS.find((l) => l.id === currentId + 1);
    if (nextLevel) {
      setIsComplete(false);
      setScore(0);
      setCoins(0);
      setKey((k) => k + 1);
      router.replace(`/game/${nextLevel.id}`);
    } else {
      router.back();
    }
  }, [levelId]);

  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    setIsGameOver(true);
  }, []);

  const handleEndlessGameOver = useCallback(
    (finalScore: number, finalDistance: number, finalCoins: number) => {
      setScore(finalScore);
      setDistance(finalDistance);
      setCoins(finalCoins);
      setIsGameOver(true);
    },
    []
  );

  const handleLevelComplete = useCallback((finalScore: number, totalCoins: number) => {
    setScore(finalScore);
    setCoins(totalCoins);
    setIsComplete(true);
  }, []);

  if (!level && !isEndless) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Level not found</Text>
        <TouchableOpacity onPress={handleQuit}>
          <Text style={styles.errorLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Endless Mode
  if (isEndless) {
    return (
      <View style={styles.container}>
        <EndlessCanvas key={key} onGameOver={handleEndlessGameOver} />

        {/* Pause Button */}
        <TouchableOpacity
          style={[styles.pauseButton, { top: insets.top + 10, right: 20 }]}
          onPress={handlePause}
        >
          <Ionicons name="pause" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Pause Modal */}
        <Modal visible={isPaused} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>PAUSED</Text>

              <TouchableOpacity style={styles.modalButton} onPress={handleResume}>
                <Ionicons name="play" size={24} color="#0a0a1a" />
                <Text style={styles.modalButtonText}>Resume</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={handleRestart}
              >
                <Ionicons name="refresh" size={24} color="#fff" />
                <Text style={styles.modalButtonTextSecondary}>Restart</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={handleQuit}
              >
                <Ionicons name="exit-outline" size={24} color="#fff" />
                <Text style={styles.modalButtonTextSecondary}>Quit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Game Over Modal (Endless) */}
        <Modal visible={isGameOver} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons name="infinite" size={48} color="#ff6b6b" />
              <Text style={styles.modalTitle}>RUN OVER</Text>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="navigate" size={24} color="#ff6b6b" />
                  <Text style={styles.statValue}>{distance}m</Text>
                  <Text style={styles.statLabel}>Distance</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="star" size={24} color="#ffd700" />
                  <Text style={styles.statValue}>{coins}</Text>
                  <Text style={styles.statLabel}>Coins</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="medal" size={24} color="#00ffaa" />
                  <Text style={styles.statValue}>{score}</Text>
                  <Text style={styles.statLabel}>Score</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.modalButtonEndless} onPress={handleRestart}>
                <Ionicons name="refresh" size={24} color="#fff" />
                <Text style={styles.modalButtonTextSecondary}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={handleQuit}
              >
                <Ionicons name="exit-outline" size={24} color="#fff" />
                <Text style={styles.modalButtonTextSecondary}>Quit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Campaign Mode
  return (
    <View style={styles.container}>
      <GameCanvas
        key={key}
        level={level!}
        onGameOver={handleGameOver}
        onLevelComplete={handleLevelComplete}
        onPause={handlePause}
      />

      {/* Pause Button */}
      <TouchableOpacity
        style={[styles.pauseButton, { top: insets.top + 10, right: 20 }]}
        onPress={handlePause}
      >
        <Ionicons name="pause" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Pause Modal */}
      <Modal visible={isPaused} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>PAUSED</Text>

            <TouchableOpacity style={styles.modalButton} onPress={handleResume}>
              <Ionicons name="play" size={24} color="#0a0a1a" />
              <Text style={styles.modalButtonText}>Resume</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={handleRestart}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.modalButtonTextSecondary}>Restart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonDanger]}
              onPress={handleQuit}
            >
              <Ionicons name="exit-outline" size={24} color="#fff" />
              <Text style={styles.modalButtonTextSecondary}>Quit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Game Over Modal */}
      <Modal visible={isGameOver} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="skull" size={48} color="#ff4757" />
            <Text style={styles.modalTitle}>GAME OVER</Text>
            <Text style={styles.modalScore}>Score: {score}</Text>

            <TouchableOpacity style={styles.modalButton} onPress={handleRestart}>
              <Ionicons name="refresh" size={24} color="#0a0a1a" />
              <Text style={styles.modalButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={handleQuit}
            >
              <Ionicons name="exit-outline" size={24} color="#fff" />
              <Text style={styles.modalButtonTextSecondary}>Quit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Level Complete Modal */}
      <Modal visible={isComplete} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="trophy" size={48} color="#ffd700" />
            <Text style={styles.modalTitle}>LEVEL COMPLETE!</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={24} color="#ffd700" />
                <Text style={styles.statValue}>{coins}</Text>
                <Text style={styles.statLabel}>Coins</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="medal" size={24} color="#00ffaa" />
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Score</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={handleNextLevel}>
              <Ionicons name="arrow-forward" size={24} color="#0a0a1a" />
              <Text style={styles.modalButtonText}>Next Level</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={handleRestart}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.modalButtonTextSecondary}>Replay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={handleQuit}
            >
              <Ionicons name="exit-outline" size={24} color="#fff" />
              <Text style={styles.modalButtonTextSecondary}>Quit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
  },
  errorLink: {
    fontSize: 16,
    color: '#00ffaa',
  },
  pauseButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH - 60,
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
    marginTop: 16,
    marginBottom: 8,
  },
  modalScore: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 30,
    marginVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#00ffaa',
    marginTop: 12,
  },
  modalButtonEndless: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#ff6b6b',
    marginTop: 12,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0a0a1a',
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtonTextSecondary: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalButtonDanger: {
    backgroundColor: 'rgba(255, 71, 87, 0.3)',
  },
});
