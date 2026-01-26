import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Dimensions, View, Text } from 'react-native';
import {
  Canvas,
  useCanvasRef,
  Rect,
  RoundedRect,
  Circle,
  Group,
  LinearGradient,
  RadialGradient,
  vec,
  Shadow,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { EndlessGameEngine } from './EndlessGameState';
import { COLORS, PLAYER, GAME } from '../constants';
import { Platform } from '../entities/Platform';
import { Coin } from '../entities/Coin';
import { AudioManager } from '../systems/AudioManager';
import { perfMonitor } from '../utils/PerformanceMonitor';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EndlessCanvasProps {
  onGameOver: (score: number, distance: number, coins: number) => void;
}

export function EndlessCanvas({ onGameOver }: EndlessCanvasProps) {
  const canvasRef = useCanvasRef();
  const engineRef = useRef<EndlessGameEngine>(new EndlessGameEngine());
  const lastTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);
  const gameOverCalledRef = useRef(false);
  const lastUIUpdateRef = useRef<number>(0);
  const [distance, setDistance] = useState(0);
  const [coins, setCoins] = useState(0);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    console.log('🎮 EndlessCanvas: Component mounted');
    engineRef.current.start();
    lastTimeRef.current = Date.now();
    lastUIUpdateRef.current = Date.now();
    gameOverCalledRef.current = false;
    perfMonitor.reset();

    // Enable performance logging in development
    if (__DEV__) {
      console.log('🎮 DEV MODE ENABLED - Starting performance monitoring');
      const logInterval = perfMonitor.startPeriodicLogging(2000);
      return () => clearInterval(logInterval);
    } else {
      console.log('⚠️ NOT IN DEV MODE - Performance monitor disabled');
    }
  }, []);

  useEffect(() => {
    let isRunning = true;
    let frameCount = 0;
    let lastLogTime = Date.now();

    console.log('🎮 Game loop starting...');

    const gameLoop = () => {
      if (!isRunning) return;

      frameCount++;

      // Log every 60 frames (once per second at 60fps)
      if (frameCount % 60 === 0) {
        const now = Date.now();
        const actualFPS = 1000 / ((now - lastLogTime) / 60);
        console.log(`🎮 Frame ${frameCount} - FPS: ${actualFPS.toFixed(1)}`);
        lastLogTime = now;
      }

      // Performance monitoring - start frame
      perfMonitor.startFrame();
      const updateStartTime = Date.now();

      const now = Date.now();
      const deltaTime = Math.min(now - lastTimeRef.current, 32);
      lastTimeRef.current = now;

      const engine = engineRef.current;

      try {
        engine.update(deltaTime);
      } catch (error) {
        console.error('🚨 Error in engine.update:', error);
        return;
      }

      // Record update time
      perfMonitor.recordUpdateTime(Date.now() - updateStartTime);

      // Handle haptics and audio (non-blocking)
      if (engine.player.jumpEvent) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        AudioManager.playSound('jump');
      }
      if (engine.player.bounceEvent) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        AudioManager.playSound('bounce');
      }
      if (engine.player.landEvent) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        AudioManager.playSound('land');
      }
      if (engine.player.deathEvent) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        AudioManager.playSound('death');
      }
      if (engine.coinCollectedThisFrame) {
        AudioManager.playSound('coin');
      }

      // CRITICAL FIX: Throttle UI updates to every 100ms instead of every frame
      // This prevents blocking the JS thread with state updates
      const timeSinceLastUIUpdate = now - lastUIUpdateRef.current;
      if (timeSinceLastUIUpdate >= 100) {
        setDistance(engine.getDistance());
        setCoins(engine.state.coinsCollected);
        setFps(perfMonitor.getStats().fps);
        lastUIUpdateRef.current = now;
      }

      // Check game over
      if (engine.state.isDead && !gameOverCalledRef.current) {
        gameOverCalledRef.current = true;
        setTimeout(
          () => onGameOver(engine.state.score, engine.getDistance(), engine.state.coinsCollected),
          500
        );
      }

      frameCount++;
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      perfMonitor.disableLogging();
    };
  }, [onGameOver]);

  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => engineRef.current.onJumpStart())
    .onEnd(() => engineRef.current.onJumpEnd())
    .onFinalize(() => engineRef.current.onJumpEnd());

  const tapGesture = Gesture.Tap()
    .onBegin(() => engineRef.current.onJumpStart())
    .onEnd(() => engineRef.current.onJumpEnd());

  const gesture = Gesture.Race(tapGesture, panGesture);
  const engine = engineRef.current;

  // Dynamic background based on distance
  const bgColors = getBackgroundColors(distance);

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* HUD Overlay */}
      <View style={styles.hud}>
        <View style={styles.hudLeft}>
          <Text style={styles.distanceText}>{distance}m</Text>
          <Text style={styles.distanceLabel}>DISTANCE</Text>
          <Text style={styles.fpsText}>FPS: {fps}</Text>
        </View>
        <View style={styles.hudRight}>
          <View style={styles.coinContainer}>
            <View style={styles.coinIcon} />
            <Text style={styles.coinText}>{coins}</Text>
          </View>
        </View>
      </View>

      <GestureDetector gesture={gesture}>
        <Canvas ref={canvasRef} style={styles.canvas}>
          {/* Background */}
          <Rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, SCREEN_HEIGHT)}
              colors={bgColors}
            />
          </Rect>

          {/* Platforms */}
          {engine.getVisiblePlatforms().map((platform, index) => (
            <PlatformRenderer
              key={platform.getStableKey()}
              platform={platform}
              cameraY={engine.cameraY}
            />
          ))}

          {/* Coins */}
          {engine.getVisibleCoins().map((coin, index) => (
            <CoinRenderer
              key={coin.getStableKey()}
              coin={coin}
              cameraY={engine.cameraY}
            />
          ))}

          {/* Player trail */}
          {engine.player.getTrail().map((point, index) => {
            if (!point.active || point.alpha <= 0) return null;
            const screenPos = engine.worldToScreen(point.x, point.y);
            const size = PLAYER.SIZE * point.alpha * 0.8;
            return (
              <RoundedRect
                key={`trail-${index}`}
                x={screenPos.x - size / 2}
                y={screenPos.y - size / 2}
                width={size}
                height={size}
                r={4}
                color={`rgba(255, 100, 100, ${point.alpha * 0.3})`}
              />
            );
          })}

          {/* Player */}
          <PlayerRenderer
            player={engine.player}
            worldToScreen={engine.worldToScreen.bind(engine)}
          />
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

function getBackgroundColors(distance: number): string[] {
  // Cycle through different color schemes
  const schemes = [
    ['#1a0a2e', '#16213e', '#0a0a1a'], // Purple night
    ['#0d2137', '#1a3a5c', '#0a1929'], // Deep ocean
    ['#2d1b4e', '#1a1a2e', '#0a0a1a'], // Twilight
    ['#1a2a1a', '#0a1a0a', '#050f05'], // Dark forest
    ['#2e1a1a', '#1e0a0a', '#0f0505'], // Inferno
  ];

  const schemeIndex = Math.floor(distance / 50) % schemes.length;
  return schemes[schemeIndex];
}

function PlatformRenderer({ platform, cameraY }: { platform: Platform; cameraY: number }) {
  const bounds = platform.getBounds();
  const screenY = GAME.HEIGHT - (bounds.y + bounds.height - cameraY);

  if (screenY > SCREEN_HEIGHT + 50 || screenY + bounds.height < -50) {
    return null;
  }

  const opacity = platform.isPhased ? 0.2 : 1;
  const shake = platform.crumbleProgress > 0 ? (1 - platform.crumbleProgress) * 3 : 0;
  const shakeX = shake > 0 ? (Math.random() - 0.5) * shake : 0;
  const shakeY = shake > 0 ? (Math.random() - 0.5) * shake : 0;

  if (platform.type === 'spike') {
    const spikeCount = Math.max(1, Math.floor(bounds.width / bounds.height));
    const spikeWidth = bounds.width / spikeCount;

    return (
      <Group opacity={opacity}>
        {Array.from({ length: spikeCount }).map((_, i) => {
          const path = Skia.Path.Make();
          const x = bounds.x + i * spikeWidth + shakeX;
          const y = screenY + shakeY;
          path.moveTo(x, y + bounds.height);
          path.lineTo(x + spikeWidth / 2, y);
          path.lineTo(x + spikeWidth, y + bounds.height);
          path.close();
          return (
            <Path key={i} path={path} color="#ffffff" style="fill">
              <Shadow dx={0} dy={0} blur={10} color="#ff0000" />
            </Path>
          );
        })}
      </Group>
    );
  }

  const color = platform.getColor();
  const highlightColor = platform.getHighlightColor();

  return (
    <Group opacity={opacity * (1 - platform.crumbleProgress)}>
      <RoundedRect
        x={bounds.x + shakeX}
        y={screenY + shakeY}
        width={bounds.width}
        height={bounds.height}
        r={4}
      >
        <LinearGradient
          start={vec(bounds.x, screenY)}
          end={vec(bounds.x, screenY + bounds.height)}
          colors={[highlightColor, color]}
        />
      </RoundedRect>

      <Rect
        x={bounds.x + shakeX}
        y={screenY + shakeY}
        width={bounds.width}
        height={3}
        color="rgba(255, 255, 255, 0.2)"
      />

      {platform.type === 'bounce' && (
        <>
          {[0.25, 0.5, 0.75].map((pos) => {
            const arrowPath = Skia.Path.Make();
            const ax = bounds.x + bounds.width * pos;
            const ay = screenY + bounds.height / 2;
            arrowPath.moveTo(ax - 5, ay + 3);
            arrowPath.lineTo(ax, ay - 5);
            arrowPath.lineTo(ax + 5, ay + 3);
            return (
              <Path
                key={pos}
                path={arrowPath}
                color="rgba(255, 255, 255, 0.7)"
                style="stroke"
                strokeWidth={2}
              />
            );
          })}
        </>
      )}
    </Group>
  );
}

function CoinRenderer({ coin, cameraY }: { coin: Coin; cameraY: number }) {
  const screenY = GAME.HEIGHT - (coin.y - cameraY) + coin.getFloatOffset();

  if (screenY > SCREEN_HEIGHT + 50 || screenY < -50) {
    return null;
  }

  if (coin.collected && coin.collectAnimation >= 1) {
    return null;
  }

  const opacity = coin.collected ? 1 - coin.collectAnimation : 1;
  const scale = coin.collected ? 1 + coin.collectAnimation * 0.5 : 1;
  const offsetY = coin.collected ? -coin.collectAnimation * 30 : 0;

  return (
    <Group
      opacity={opacity}
      transform={[
        { translateX: coin.x },
        { translateY: screenY + offsetY },
        { rotate: coin.getRotation() },
        { scale },
        { translateX: -coin.x },
        { translateY: -(screenY + offsetY) },
      ]}
    >
      <Circle cx={coin.x} cy={screenY + offsetY} r={coin.size / 2 + 4}>
        <RadialGradient
          c={vec(coin.x, screenY + offsetY)}
          r={coin.size / 2 + 4}
          colors={['rgba(255, 215, 0, 0.4)', 'rgba(255, 215, 0, 0)']}
        />
      </Circle>

      <Circle cx={coin.x} cy={screenY + offsetY} r={coin.size / 2}>
        <RadialGradient
          c={vec(coin.x - 3, screenY + offsetY - 3)}
          r={coin.size / 2}
          colors={[COLORS.COIN.highlight, COLORS.COIN.primary, COLORS.COIN.border]}
        />
      </Circle>

      <Circle
        cx={coin.x - 4}
        cy={screenY + offsetY - 4}
        r={coin.size / 5}
        color="rgba(255, 255, 255, 0.5)"
      />
    </Group>
  );
}

function PlayerRenderer({
  player,
  worldToScreen,
}: {
  player: any;
  worldToScreen: (x: number, y: number) => { x: number; y: number };
}) {
  const screenPos = worldToScreen(
    player.x + player.width / 2,
    player.y + player.height / 2
  );
  const rotation = (player.getRotation() * Math.PI) / 180;
  const skin = player.getSkin();

  const size = PLAYER.SIZE;
  const halfSize = size / 2;

  // Endless mode uses red/orange player
  const primaryColor = '#ff6b6b';
  const secondaryColor = '#ee5a5a';
  const glowColor = '#ff4444';

  return (
    <Group
      transform={[
        { translateX: screenPos.x },
        { translateY: screenPos.y },
        { rotate: rotation },
      ]}
    >
      <RoundedRect
        x={-halfSize - 4}
        y={-halfSize - 4}
        width={size + 8}
        height={size + 8}
        r={6}
      >
        <Shadow dx={0} dy={0} blur={20} color={glowColor} />
      </RoundedRect>

      <RoundedRect x={-halfSize} y={-halfSize} width={size} height={size} r={4}>
        <LinearGradient
          start={vec(-halfSize, -halfSize)}
          end={vec(halfSize, halfSize)}
          colors={[primaryColor, secondaryColor]}
        />
      </RoundedRect>

      <RoundedRect
        x={-halfSize}
        y={-halfSize}
        width={size}
        height={size}
        r={4}
        color="transparent"
        style="stroke"
        strokeWidth={2}
      >
        <LinearGradient
          start={vec(-halfSize, -halfSize)}
          end={vec(halfSize, halfSize)}
          colors={[glowColor, primaryColor]}
        />
      </RoundedRect>

      <Rect
        x={-halfSize + 4}
        y={-halfSize + 4}
        width={size - 8}
        height={8}
        color="rgba(255, 255, 255, 0.3)"
      />

      <Circle cx={halfSize - 10} cy={-halfSize + 10} r={7} color="#ffffff" />
      <Circle cx={halfSize - 8} cy={-halfSize + 10} r={3.5} color="#000000" />
      <Circle cx={halfSize - 6.5} cy={-halfSize + 8} r={1.5} color="#ffffff" />
    </Group>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  canvas: {
    flex: 1,
  },
  hud: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  hudLeft: {
    alignItems: 'flex-start',
  },
  hudRight: {
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
  },
  distanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
  },
  fpsText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0, 255, 170, 0.8)',
    marginTop: 4,
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  coinIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffd700',
  },
  coinText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
});
