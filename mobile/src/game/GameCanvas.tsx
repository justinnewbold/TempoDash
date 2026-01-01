import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
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

import { GameEngine } from './GameState';
import { LevelConfig } from '../types';
import { COLORS, PLAYER, GAME } from '../constants';
import { Platform } from '../entities/Platform';
import { Coin } from '../entities/Coin';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface GameCanvasProps {
  level: LevelConfig;
  onGameOver: (score: number) => void;
  onLevelComplete: (score: number, coins: number) => void;
  onPause?: () => void;
}

export function GameCanvas({
  level,
  onGameOver,
  onLevelComplete,
}: GameCanvasProps) {
  const canvasRef = useCanvasRef();
  const engineRef = useRef<GameEngine>(new GameEngine());
  const lastTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);
  const gameOverCalledRef = useRef(false);
  const completeCalledRef = useRef(false);
  const [tick, setTick] = useState(0);

  // Initialize level
  useEffect(() => {
    engineRef.current.loadLevel(level);
    lastTimeRef.current = Date.now();
    gameOverCalledRef.current = false;
    completeCalledRef.current = false;
  }, [level]);

  // Game loop using requestAnimationFrame
  useEffect(() => {
    let isRunning = true;

    const gameLoop = () => {
      if (!isRunning) return;

      const now = Date.now();
      const deltaTime = Math.min(now - lastTimeRef.current, 32);
      lastTimeRef.current = now;

      const engine = engineRef.current;
      engine.update(deltaTime);

      // Handle events for haptics
      if (engine.player.jumpEvent) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (engine.player.bounceEvent) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      if (engine.player.landEvent) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (engine.player.deathEvent) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      // Check game state
      if (engine.state.isDead && !gameOverCalledRef.current) {
        gameOverCalledRef.current = true;
        setTimeout(() => onGameOver(engine.state.score), 500);
      }
      if (engine.state.isComplete && !completeCalledRef.current) {
        completeCalledRef.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(
          () => onLevelComplete(engine.state.score, engine.state.coinsCollected),
          500
        );
      }

      // Force re-render
      setTick((t) => t + 1);

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onGameOver, onLevelComplete]);

  // Pan gesture to detect touch start/end anywhere
  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => {
      engineRef.current.onJumpStart();
    })
    .onEnd(() => {
      engineRef.current.onJumpEnd();
    })
    .onFinalize(() => {
      engineRef.current.onJumpEnd();
    });

  // Tap gesture for quick taps
  const tapGesture = Gesture.Tap()
    .onBegin(() => {
      engineRef.current.onJumpStart();
    })
    .onEnd(() => {
      engineRef.current.onJumpEnd();
    });

  const gesture = Gesture.Race(tapGesture, panGesture);

  const engine = engineRef.current;

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={gesture}>
        <Canvas ref={canvasRef} style={styles.canvas}>
          {/* Background */}
          <Rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, SCREEN_HEIGHT)}
              colors={[level.backgroundColor, '#1a1a2e', '#0a0a1a']}
            />
          </Rect>

          {/* Render platforms */}
          {engine.getVisiblePlatforms().map((platform, index) => (
            <PlatformRenderer
              key={`platform-${index}-${tick}`}
              platform={platform}
              cameraY={engine.cameraY}
            />
          ))}

          {/* Render coins */}
          {engine.getVisibleCoins().map((coin, index) => (
            <CoinRenderer
              key={`coin-${index}-${tick}`}
              coin={coin}
              cameraY={engine.cameraY}
            />
          ))}

          {/* Render player trail */}
          {engine.player.getTrail().map((point, index) => {
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
                color={`rgba(0, 255, 170, ${point.alpha * 0.3})`}
              />
            );
          })}

          {/* Render player */}
          <PlayerRenderer
            player={engine.player}
            worldToScreen={engine.worldToScreen.bind(engine)}
          />

          {/* HUD - Score */}
          <RoundedRect
            x={20}
            y={60}
            width={100}
            height={40}
            r={20}
            color="rgba(0, 0, 0, 0.5)"
          />
          <Circle cx={44} cy={80} r={10} color={COLORS.COIN.primary} />
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

// Platform renderer component
function PlatformRenderer({
  platform,
  cameraY,
}: {
  platform: Platform;
  cameraY: number;
}) {
  const bounds = platform.getBounds();
  const screenY = GAME.HEIGHT - (bounds.y + bounds.height - cameraY);

  // Skip if off screen
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

// Coin renderer component
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

// Player renderer component
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
        <Shadow dx={0} dy={0} blur={20} color={skin.glowColor} />
      </RoundedRect>

      <RoundedRect x={-halfSize} y={-halfSize} width={size} height={size} r={4}>
        <LinearGradient
          start={vec(-halfSize, -halfSize)}
          end={vec(halfSize, halfSize)}
          colors={[skin.primaryColor, skin.secondaryColor]}
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
          colors={[skin.glowColor, skin.primaryColor]}
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
    backgroundColor: COLORS.BACKGROUND,
  },
  canvas: {
    flex: 1,
  },
});
