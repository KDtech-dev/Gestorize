import { ReactNode, useMemo } from 'react';
import { Animated, StyleSheet } from 'react-native';

type AnimatedListHeaderProps = {
  scrollY: Animated.Value;
  children: ReactNode;
  top?: number;
  marginTop?: number;
};

/** Cabeçalho flutuante para busca e filtros de listas com rolagem. */
const AnimatedListHeader = ({
  scrollY,
  children,
  top = 140,
  marginTop = 12,
}: AnimatedListHeaderProps) => {
  const animatedStyle = useMemo(() => {
    const opacity = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
    const translateY = scrollY.interpolate({
      inputRange: [0, 120],
      outputRange: [0, -120],
      extrapolate: 'clamp',
    });

    return { opacity, transform: [{ translateY }] };
  }, [scrollY]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.container, { top, marginTop }, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
};

export default AnimatedListHeader;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
