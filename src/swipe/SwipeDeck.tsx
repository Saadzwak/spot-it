// SwipeDeck.tsx — mécanique de swipe (rotation + spring), découplée du design.
// La carte est rendue via `renderCard` (le screen y injecte BrandTile/WhyForYou).
// Geste réel (pan → rotation) + flingp; boutons via ref impératif (swipeLeft/Right).
import React, { forwardRef, useImperativeHandle, useCallback } from 'react';
import { StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, interpolate, Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { spring as SPRING } from '@/design/tokens';

export interface SwipeDeckHandle {
  swipeLeft: () => void;
  swipeRight: () => void;
}

interface SwipeDeckProps<T> {
  data: T[];
  keyFor: (item: T) => string;
  renderCard: (item: T, isTop: boolean) => React.ReactNode;
  onSwipe: (item: T, accepted: boolean) => void;
  /** overlay rendu par-dessus la carte du dessus selon le sens (progress -1..1). */
  renderOverlays?: (likeOpacity: any, nopeOpacity: any) => React.ReactNode;
  cardStyle?: ViewStyle;
  visibleCount?: number;
}

function SwipeDeckInner<T>(
  { data, keyFor, renderCard, onSwipe, renderOverlays, cardStyle, visibleCount = 3 }: SwipeDeckProps<T>,
  ref: React.Ref<SwipeDeckHandle>,
) {
  const { width } = useWindowDimensions();
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const reset = useCallback(() => { tx.value = withSpring(0, SPRING); ty.value = withSpring(0, SPRING); }, [tx, ty]);

  const commit = useCallback((accepted: boolean) => {
    const item = data[0];
    if (item) onSwipe(item, accepted);
    tx.value = 0; ty.value = 0; // la prochaine carte (nouveau data[0]) repart centrée
  }, [data, onSwipe, tx, ty]);

  const fling = useCallback((dir: 1 | -1) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    tx.value = withTiming(dir * width * 1.3, { duration: 240 }, (done) => {
      if (done) runOnJS(commit)(dir === 1);
    });
  }, [commit, tx, width]);

  useImperativeHandle(ref, () => ({ swipeLeft: () => fling(-1), swipeRight: () => fling(1) }), [fling]);

  const pan = Gesture.Pan()
    .onChange((e) => { tx.value += e.changeX; ty.value += e.changeY; })
    .onEnd((e) => {
      const passed = Math.abs(tx.value) > width * 0.28 || Math.abs(e.velocityX) > 800;
      if (passed) {
        const dir = tx.value > 0 ? 1 : -1;
        tx.value = withTiming(dir * width * 1.3, { duration: 200 }, (done) => {
          if (done) runOnJS(commit)(dir === 1);
        });
      } else {
        runOnJS(reset)();
      }
    });

  const topStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${interpolate(tx.value, [-width, width], [-12, 12], Extrapolation.CLAMP)}deg` },
    ],
  }));
  const likeStyle = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [0, width * 0.25], [0, 1], Extrapolation.CLAMP) }));
  const nopeStyle = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [-width * 0.25, 0], [1, 0], Extrapolation.CLAMP) }));

  const stack = data.slice(0, visibleCount);

  return (
    <View style={styles.wrap}>
      {stack.map((item, i) => {
        const isTop = i === 0;
        const depth = i;
        if (isTop) {
          return (
            <GestureDetector gesture={pan} key={keyFor(item)}>
              <Animated.View style={[styles.card, cardStyle, topStyle]}>
                {renderCard(item, true)}
                {renderOverlays?.(likeStyle, nopeStyle)}
              </Animated.View>
            </GestureDetector>
          );
        }
        return (
          <Animated.View
            key={keyFor(item)}
            style={[styles.card, cardStyle, {
              transform: [{ scale: 1 - depth * 0.04 }, { translateY: depth * 12 }],
              opacity: 1 - depth * 0.12, zIndex: -depth,
            }]}
          >
            {renderCard(item, false)}
          </Animated.View>
        );
      })}
    </View>
  );
}

// forwardRef + generics
export const SwipeDeck = forwardRef(SwipeDeckInner) as <T>(
  p: SwipeDeckProps<T> & { ref?: React.Ref<SwipeDeckHandle> },
) => React.ReactElement;

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { position: 'absolute', width: '100%', height: '100%' },
});

export default SwipeDeck;
