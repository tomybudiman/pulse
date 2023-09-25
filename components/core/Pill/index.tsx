import React, {memo, useRef, useMemo, useEffect} from 'react';
import {StyleSheet, Animated, TouchableOpacity} from 'react-native';
import {moderateScale} from 'react-native-size-matters/extend';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    height: moderateScale(32),
    borderRadius: moderateScale(16),
  },
  animatedContainer: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(12),
  },
  labelText: {
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
});

export interface PillProps {
  children?: React.ReactNode | string;
  onPress?: () => void | null;
  active?: boolean;
}

const Pill: React.FC<PillProps> = ({
  onPress = () => null,
  children,
  active,
}) => {
  const animatedContainer = useRef(new Animated.Value(active ? 1 : 0)).current;
  // Methods
  const animatedContainerStyle = useMemo(() => {
    return [
      styles.animatedContainer,
      {
        backgroundColor: animatedContainer.interpolate({
          inputRange: [0, 1],
          outputRange: ['#FFFFFFFF', '#000000FF'],
        }),
      },
    ];
  }, [animatedContainer]);
  const animatedLabelTextStyle = useMemo(() => {
    return [
      styles.labelText,
      {
        color: animatedContainer.interpolate({
          inputRange: [0, 1],
          outputRange: ['#000000FF', '#FFFFFFFF'],
        }),
      },
    ];
  }, [animatedContainer]);
  // Hooks
  useEffect(() => {
    const transitionDuration = 200;
    setTimeout(() => {
      animatedContainer.setValue(active ? 1 : 0);
    }, transitionDuration + 10);
    Animated.timing(animatedContainer, {
      duration: transitionDuration,
      toValue: active ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }, [active]);
  // Render
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.container}>
      <Animated.View style={animatedContainerStyle}>
        {typeof children === 'string' ? (
          <Animated.Text style={animatedLabelTextStyle}>
            {children}
          </Animated.Text>
        ) : (
          children
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default memo(Pill);
