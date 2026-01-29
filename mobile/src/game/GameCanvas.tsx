import React, { useEffect, useRef, useState } from 'react';
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
  Line,
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
import { PowerUp } from '../entities/PowerUp';
import { AudioManager } from '../systems/AudioManager';

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
  const forceUpdateRef = useRef(0);
  const [, setForceUpdate] = useState(0);

  // Initialize level
  useEffect(() => {
    engineRef.current.loadLevel(level);
    lastTimeRef.current = Date.now();
    gameOverCalledRef.current = false;
    completeCalledRef.current = false;
  }, [level]);

  // Game loop
  useEffect(() => {
    let isRunning = true;

    const gameLoop = () => {
      if (!isRunning) return;

      const now = Date.now();
      const deltaTime = Math.min(now - lastTimeRef.current, 32);
      lastTimeRef.current = now;

      const engine = engineRef.current;

      try {
        engine.update(deltaTime);
      } catch (error) {
        console.error('Error in engine.update:', error);
        return;
      }

      // Handle events for haptics and audio
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
      if (engine.powerUpCollectedThisFrame) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Check game state
      if (engine.state.isDead && !gameOverCalledRef.current) {
        gameOverCalledRef.current = true;
        setTimeout(() => onGameOver(engine.state.score), 500);
      }
      if (engine.state.isComplete && !completeCalledRef.current) {
        completeCalledRef.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        AudioManager.playSound('complete');
        setTimeout(
          () => onLevelComplete(engine.state.score, engine.state.coinsCollected),
          500
        );
      }

      // Throttle re-renders
      forceUpdateRef.current++;
      if (forceUpdateRef.current % 9 === 0) {
        setForceUpdate((v) => v + 1);
      }

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

  // Gestures
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

          {/* Goal line indicator */}
          {engine.state.isPlaying && (
            <GoalLineRenderer
              goalY={level.goalY}
              cameraY={engine.cameraY}
              accentColor={level.accentColor}
            />
          )}

          {/* Render platforms */}
          {engine.getVisiblePlatforms().map((platform) => (
            <PlatformRenderer
              key={platform.getStableKey()}
              platform={platform}
              cameraY={engine.cameraY}
            />
          ))}

          {/* Render coins */}
          {engine.getVisibleCoins().map((coin) => (
            <CoinRenderer
              key={coin.getStableKey()}
              coin={coin}
              cameraY={engine.cameraY}
            />
          ))}

          {/* Render power-ups */}
          {engine.getVisiblePowerUps().map((powerUp) => (
            <PowerUpRenderer
              key={powerUp.getStableKey()}
              powerUp={powerUp}
              cameraY={engine.cameraY}
            />
          ))}

          {/* Render player trail */}
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
                color={`rgba(0, 255, 170, ${point.alpha * 0.3})`}
              />
            );
          })}

          {/* Render player */}
          <PlayerRenderer
            player={engine.player}
            worldToScreen={engine.worldToScreen.bind(engine)}
            hasShield={engine.state.hasShield}
          />

          {/* HUD - Score, Combo, PowerUp */}
          <HUDRenderer state={engine.state} />
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

// Goal line renderer
function GoalLineRenderer({
  goalY,
  cameraY,
  accentColor,
}: {
  goalY: number;
  cameraY: number;
  accentColor: string;
}) {
  const screenY = GAME.HEIGHT - (goalY - cameraY);
  if (screenY > SCREEN_HEIGHT + 50 || screenY < -50) return null;

  return (
    <Group>
      <Rect x={0} y={screenY - 2} width={SCREEN_WIDTH} height={4} color={accentColor} />
      <Rect x={0} y={screenY - 2} width={SCREEN_WIDTH} height={4}>
        <Shadow dx={0} dy={0} blur={10} color={accentColor} />
      </Rect>
    </Group>
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

  if (screenY > SCREEN_HEIGHT + 50 || screenY + bounds.height < -50) {
    return null;
  }

  const opacity = platform.isPhased ? 0.2 : platform.type === 'secret' && !platform.isRevealed ? 0.05 : 1;
  const shake = platform.crumbleProgress > 0 ? (1 - platform.crumbleProgress) * 3 : 0;
  const shakeX = shake > 0 ? (Math.random() - 0.5) * shake : 0;
  const shakeY = shake > 0 ? (Math.random() - 0.5) * shake : 0;

  // Spike platforms
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

  // Lava platforms
  if (platform.type === 'lava') {
    return (
      <Group opacity={opacity}>
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
            colors={['#ff8a65', '#ff5722', '#d84315']}
          />
        </RoundedRect>
        <RoundedRect
          x={bounds.x + shakeX}
          y={screenY + shakeY}
          width={bounds.width}
          height={bounds.height}
          r={4}
        >
          <Shadow dx={0} dy={0} blur={12} color={`rgba(255, 87, 34, ${platform.lavaPulse})`} />
        </RoundedRect>
      </Group>
    );
  }

  // Glass platforms
  if (platform.type === 'glass') {
    const glassOpacity = 0.3 + (1 - platform.glassHits / 3) * 0.5;
    return (
      <Group opacity={glassOpacity}>
        <RoundedRect
          x={bounds.x + shakeX}
          y={screenY + shakeY}
          width={bounds.width}
          height={bounds.height}
          r={4}
        >
          <LinearGradient
            start={vec(bounds.x, screenY)}
            end={vec(bounds.x + bounds.width, screenY + bounds.height)}
            colors={['rgba(255, 255, 255, 0.6)', 'rgba(200, 200, 255, 0.3)', 'rgba(255, 255, 255, 0.5)']}
          />
        </RoundedRect>
        <RoundedRect
          x={bounds.x + shakeX}
          y={screenY + shakeY}
          width={bounds.width}
          height={bounds.height}
          r={4}
          color="transparent"
          style="stroke"
          strokeWidth={1.5}
        >
          <LinearGradient
            start={vec(bounds.x, screenY)}
            end={vec(bounds.x + bounds.width, screenY)}
            colors={['rgba(255, 255, 255, 0.8)', 'rgba(200, 200, 255, 0.4)']}
          />
        </RoundedRect>
        {platform.glassHits > 0 && (
          <Line
            p1={vec(bounds.x + bounds.width * 0.3, screenY)}
            p2={vec(bounds.x + bounds.width * 0.5, screenY + bounds.height)}
            color="rgba(255, 255, 255, 0.5)"
            strokeWidth={1}
          />
        )}
        {platform.glassHits > 1 && (
          <Line
            p1={vec(bounds.x + bounds.width * 0.7, screenY)}
            p2={vec(bounds.x + bounds.width * 0.4, screenY + bounds.height)}
            color="rgba(255, 255, 255, 0.5)"
            strokeWidth={1}
          />
        )}
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

      {/* Top highlight */}
      <Rect
        x={bounds.x + shakeX}
        y={screenY + shakeY}
        width={bounds.width}
        height={3}
        color="rgba(255, 255, 255, 0.2)"
      />

      {/* Bounce arrows */}
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

      {/* Conveyor arrows */}
      {platform.type === 'conveyor' && (
        <>
          {[0.2, 0.4, 0.6, 0.8].map((pos) => {
            const arrowPath = Skia.Path.Make();
            const ax = bounds.x + bounds.width * pos;
            const ay = screenY + bounds.height / 2;
            const dir = platform.conveyorSpeed > 0 ? 1 : -1;
            arrowPath.moveTo(ax - 4 * dir, ay - 3);
            arrowPath.lineTo(ax + 4 * dir, ay);
            arrowPath.lineTo(ax - 4 * dir, ay + 3);
            return (
              <Path
                key={pos}
                path={arrowPath}
                color="rgba(255, 255, 255, 0.6)"
                style="stroke"
                strokeWidth={1.5}
              />
            );
          })}
        </>
      )}

      {/* Gravity arrows (double upward) */}
      {platform.type === 'gravity' && (
        <>
          {[0.3, 0.5, 0.7].map((pos) => {
            const arrowPath = Skia.Path.Make();
            const ax = bounds.x + bounds.width * pos;
            const ay = screenY + bounds.height / 2;
            arrowPath.moveTo(ax - 5, ay + 2);
            arrowPath.lineTo(ax, ay - 4);
            arrowPath.lineTo(ax + 5, ay + 2);
            arrowPath.moveTo(ax - 5, ay + 6);
            arrowPath.lineTo(ax, ay);
            arrowPath.lineTo(ax + 5, ay + 6);
            return (
              <Path
                key={pos}
                path={arrowPath}
                color="rgba(255, 255, 255, 0.7)"
                style="stroke"
                strokeWidth={1.5}
              />
            );
          })}
        </>
      )}

      {/* Ice shimmer */}
      {platform.type === 'ice' && (
        <Rect
          x={bounds.x + shakeX + 4}
          y={screenY + shakeY + 2}
          width={bounds.width - 8}
          height={3}
          color="rgba(255, 255, 255, 0.5)"
        />
      )}

      {/* Sticky dots */}
      {platform.type === 'sticky' && (
        <>
          {[0.2, 0.4, 0.6, 0.8].map((pos) => (
            <Circle
              key={pos}
              cx={bounds.x + bounds.width * pos}
              cy={screenY + bounds.height / 2}
              r={3}
              color="rgba(200, 255, 100, 0.6)"
            />
          ))}
        </>
      )}

      {/* Wall pattern */}
      {platform.type === 'wall' && (
        <>
          {Array.from({ length: Math.floor(bounds.width / 12) }).map((_, i) => (
            <Rect
              key={i}
              x={bounds.x + i * 12 + 1}
              y={screenY + 2}
              width={10}
              height={bounds.height - 4}
              color="rgba(0, 0, 0, 0.15)"
            />
          ))}
        </>
      )}

      {/* Slowmo wave glow */}
      {platform.type === 'slowmo' && (
        <RoundedRect
          x={bounds.x + shakeX}
          y={screenY + shakeY}
          width={bounds.width}
          height={bounds.height}
          r={4}
        >
          <Shadow dx={0} dy={0} blur={8} color="rgba(33, 150, 243, 0.5)" />
        </RoundedRect>
      )}
    </Group>
  );
}

// Power-up renderer
function PowerUpRenderer({
  powerUp,
  cameraY,
}: {
  powerUp: PowerUp;
  cameraY: number;
}) {
  const screenY = GAME.HEIGHT - (powerUp.y - cameraY) + powerUp.getFloatOffset();

  if (screenY > SCREEN_HEIGHT + 50 || screenY < -50) return null;
  if (powerUp.collected) return null;

  const pulse = powerUp.getPulse();
  const color = powerUp.getColor();
  const size = powerUp.size * pulse;

  return (
    <Group>
      {/* Outer glow */}
      <Circle cx={powerUp.x} cy={screenY} r={size / 2 + 8}>
        <RadialGradient
          c={vec(powerUp.x, screenY)}
          r={size / 2 + 8}
          colors={[`${color}66`, `${color}00`]}
        />
      </Circle>

      {/* Power-up body */}
      <RoundedRect
        x={powerUp.x - size / 2}
        y={screenY - size / 2}
        width={size}
        height={size}
        r={size / 4}
      >
        <LinearGradient
          start={vec(powerUp.x - size / 2, screenY - size / 2)}
          end={vec(powerUp.x + size / 2, screenY + size / 2)}
          colors={[color, `${color}cc`]}
        />
        <Shadow dx={0} dy={0} blur={10} color={color} />
      </RoundedRect>

      {/* Border glow */}
      <RoundedRect
        x={powerUp.x - size / 2}
        y={screenY - size / 2}
        width={size}
        height={size}
        r={size / 4}
        color="transparent"
        style="stroke"
        strokeWidth={2}
      >
        <LinearGradient
          start={vec(powerUp.x, screenY - size / 2)}
          end={vec(powerUp.x, screenY + size / 2)}
          colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.1)']}
        />
      </RoundedRect>

      {/* Inner icon circle */}
      <Circle
        cx={powerUp.x}
        cy={screenY}
        r={size / 4}
        color="rgba(255, 255, 255, 0.3)"
      />
    </Group>
  );
}

// Coin renderer
function CoinRenderer({ coin, cameraY }: { coin: Coin; cameraY: number }) {
  const screenY = GAME.HEIGHT - (coin.y - cameraY) + coin.getFloatOffset();

  if (screenY > SCREEN_HEIGHT + 50 || screenY < -50) return null;
  if (coin.collected && coin.collectAnimation >= 1) return null;

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

// Player renderer
function PlayerRenderer({
  player,
  worldToScreen,
  hasShield,
}: {
  player: any;
  worldToScreen: (x: number, y: number) => { x: number; y: number };
  hasShield: boolean;
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
      {/* Shield effect */}
      {hasShield && (
        <Circle cx={0} cy={0} r={halfSize + 10}>
          <RadialGradient
            c={vec(0, 0)}
            r={halfSize + 10}
            colors={['rgba(33, 150, 243, 0.3)', 'rgba(33, 150, 243, 0.1)', 'rgba(33, 150, 243, 0)']}
          />
        </Circle>
      )}
      {hasShield && (
        <Circle
          cx={0}
          cy={0}
          r={halfSize + 8}
          color="transparent"
          style="stroke"
          strokeWidth={2}
        >
          <LinearGradient
            start={vec(-halfSize, -halfSize)}
            end={vec(halfSize, halfSize)}
            colors={['rgba(33, 150, 243, 0.6)', 'rgba(100, 200, 255, 0.3)']}
          />
        </Circle>
      )}

      {/* Glow */}
      <RoundedRect
        x={-halfSize - 4}
        y={-halfSize - 4}
        width={size + 8}
        height={size + 8}
        r={6}
      >
        <Shadow dx={0} dy={0} blur={20} color={skin.glowColor} />
      </RoundedRect>

      {/* Player body */}
      <RoundedRect x={-halfSize} y={-halfSize} width={size} height={size} r={4}>
        <LinearGradient
          start={vec(-halfSize, -halfSize)}
          end={vec(halfSize, halfSize)}
          colors={[skin.primaryColor, skin.secondaryColor]}
        />
      </RoundedRect>

      {/* Border */}
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

      {/* Highlight */}
      <Rect
        x={-halfSize + 4}
        y={-halfSize + 4}
        width={size - 8}
        height={8}
        color="rgba(255, 255, 255, 0.3)"
      />

      {/* Eye */}
      <Circle cx={halfSize - 10} cy={-halfSize + 10} r={7} color="#ffffff" />
      <Circle cx={halfSize - 8} cy={-halfSize + 10} r={3.5} color="#000000" />
      <Circle cx={halfSize - 6.5} cy={-halfSize + 8} r={1.5} color="#ffffff" />
    </Group>
  );
}

// HUD renderer
function HUDRenderer({ state }: { state: any }) {
  return (
    <Group>
      {/* Score background */}
      <RoundedRect
        x={20}
        y={60}
        width={120}
        height={40}
        r={20}
        color="rgba(0, 0, 0, 0.5)"
      />
      {/* Coin icon */}
      <Circle cx={44} cy={80} r={10} color={COLORS.COIN.primary} />
      <Circle cx={43} cy={79} r={3} color="rgba(255, 255, 255, 0.5)" />

      {/* Combo indicator */}
      {state.combo > 1 && (
        <RoundedRect
          x={SCREEN_WIDTH / 2 - 50}
          y={55}
          width={100}
          height={34}
          r={17}
          color="rgba(255, 165, 0, 0.7)"
        />
      )}

      {/* Active power-up indicator */}
      {state.activePowerUp && (
        <RoundedRect
          x={SCREEN_WIDTH - 140}
          y={60}
          width={120}
          height={40}
          r={20}
        >
          <LinearGradient
            start={vec(SCREEN_WIDTH - 140, 60)}
            end={vec(SCREEN_WIDTH - 20, 100)}
            colors={[
              state.activePowerUp === 'magnet' ? 'rgba(233, 30, 99, 0.7)' :
              state.activePowerUp === 'slowmo' ? 'rgba(156, 39, 176, 0.7)' :
              'rgba(255, 152, 0, 0.7)',
              'rgba(0, 0, 0, 0.3)'
            ]}
          />
        </RoundedRect>
      )}

      {/* Shield indicator */}
      {state.hasShield && (
        <Circle
          cx={SCREEN_WIDTH - 30}
          cy={120}
          r={14}
          color="rgba(33, 150, 243, 0.6)"
        >
          <Shadow dx={0} dy={0} blur={8} color="rgba(33, 150, 243, 0.4)" />
        </Circle>
      )}
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
