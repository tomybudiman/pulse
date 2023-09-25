import React, {memo} from 'react';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import {moderateScale} from 'react-native-size-matters/extend';
import {LinearGradient} from 'expo-linear-gradient';
import {Text, View, StyleSheet} from 'react-native';

// Global components
import Pill from '@components/core/Pill';

// Global types
import {ActiveTimeframes} from '@utils/types';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);
const styles = StyleSheet.create({
  loadingPill: {
    width: moderateScale(48),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
  },
  pillsContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
  },
  pillTitleText: {
    color: '#797979',
    fontWeight: '900',
    fontSize: moderateScale(14),
  },
});

interface IntervalPillsProps {
  loading?: boolean;
  intervalPills: {[key: string]: boolean};
  onPressPill: (key: string) => null | void;
}

const IntervalPills: React.FC<IntervalPillsProps> = ({
  loading = false,
  onPressPill = () => null,
  intervalPills = {},
}) => {
  return (
    <View style={styles.pillsContainer}>
      <Text style={styles.pillTitleText}>Interval</Text>
      {loading
        ? Array.from({length: Object.keys(intervalPills).length}, (_, i) => (
            <ShimmerPlaceholder key={i} style={styles.loadingPill} />
          ))
        : Object.keys(intervalPills).map((key: ActiveTimeframes) => {
            return (
              <Pill
                key={key}
                active={intervalPills[key]}
                onPress={() => onPressPill(key)}>
                {key.toUpperCase()}
              </Pill>
            );
          })}
    </View>
  );
};

export default memo(IntervalPills);
