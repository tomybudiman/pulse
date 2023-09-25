import React from 'react';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import {moderateScale} from 'react-native-size-matters/extend';
import {LinearGradient} from 'expo-linear-gradient';
import {View, StyleSheet} from 'react-native';

// @ts-ignore
const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);
const styles = StyleSheet.create({
  container: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: moderateScale(12),
    paddingHorizontal: moderateScale(16),
  },
  loadingBar: {
    width: '49%',
    height: moderateScale(24),
    borderRadius: moderateScale(8),
  },
});

const BarChartLoading = () => {
  const placeholderLength = 10;
  // Render
  return (
    <View style={styles.container}>
      {Array.from({length: placeholderLength}, (_, i) => {
        return (
          <ShimmerPlaceholder
            key={i}
            style={[
              styles.loadingBar,
              {
                marginBottom: moderateScale(i < placeholderLength - 2 ? 8 : 0),
              },
            ]}
          />
        );
      })}
    </View>
  );
};

export default BarChartLoading;
