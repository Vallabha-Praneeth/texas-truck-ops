import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

export interface LottieIconProps {
  /** Path to Lottie JSON file or inline JSON object */
  source: any;
  /** Size in pixels (default: 24) */
  size?: number;
  /** Color tint for monochrome animations */
  color?: string;
  /** Loop animation (default: true) */
  loop?: boolean;
  /** Autoplay on mount (default: true) */
  autoPlay?: boolean;
  /** Animation speed multiplier (default: 1) */
  speed?: number;
  /** Additional styles */
  style?: any;
}

/**
 * Lottie Icon Component for React Native
 *
 * IMPORTANT: Best practices based on previous failures:
 * 1. Always use validated Lottie JSON (v5.7.4+)
 * 2. Keep animations simple for icons (<100kb)
 * 3. Use inline JSON or require() for local files
 * 4. Avoid remote URLs for critical UI
 * 5. Test on both iOS and Android
 */
export const LottieIcon: React.FC<LottieIconProps> = ({
  source,
  size = 24,
  color,
  loop = true,
  autoPlay = true,
  speed = 1,
  style,
}) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (autoPlay && animationRef.current) {
      animationRef.current.play();
    }
  }, [autoPlay]);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <LottieView
        ref={animationRef}
        source={source}
        loop={loop}
        speed={speed}
        autoPlay={autoPlay}
        style={styles.animation}
        // Color filter for monochrome icons (iOS/Android support varies)
        colorFilters={
          color
            ? [
                {
                  keypath: '*',
                  color: color,
                },
              ]
            : undefined
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});
