import React, {memo, useCallback, useMemo} from 'react';
import {moderateScale} from 'react-native-size-matters/extend';
import {View, StyleSheet, Text} from 'react-native';
import {get, maxBy} from 'lodash';

// Global utils
import {moneyFormat} from '@utils';

// Local components
import BarChartLoading from './BarChartLoading';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    paddingTop: moderateScale(12),
  },
  sideContainer: {
    width: '50%',
    position: 'relative',
  },
  headerLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: moderateScale(4),
  },
  headerLabelText: {
    color: '#878787',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  barContainer: {
    width: '100%',
    position: 'relative',
    height: moderateScale(24),
  },
  labelContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelText: {
    color: '#3a3a3a',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
  bidBar: {
    height: '100%',
    backgroundColor: 'rgba(25,165,70,0.35)',
    borderTopLeftRadius: moderateScale(4),
    borderBottomLeftRadius: moderateScale(4),
  },
  askBar: {
    height: '100%',
    backgroundColor: 'rgba(251,75,77,0.35)',
    borderTopRightRadius: moderateScale(4),
    borderBottomRightRadius: moderateScale(4),
  },
});

interface BarChartProps {
  loading?: boolean;
  bidData: {price: number; count: number; amount: number}[];
  askData: {price: number; count: number; amount: number}[];
}

const BarChart: React.FC<BarChartProps> = ({
  loading = false,
  bidData,
  askData,
}) => {
  const sortedBidData = useMemo(() => {
    return bidData.sort((a, b) => b.price - a.price).slice(0, 15);
  }, [bidData]);
  const sortedAskData = useMemo(() => {
    return bidData.sort((a, b) => a.price - b.price).slice(0, 15);
  }, [askData]);
  const highestBidCount = get(maxBy(sortedBidData, 'count'), 'count', 0);
  const highestAskCount = get(maxBy(sortedAskData, 'count'), 'count', 0);
  // Methods
  const getWidthPercentage = useCallback((max: number, value: number) => {
    return (value * 100) / max;
  }, []);
  // Render
  const labelContainerBidStyle = {
    paddingLeft: moderateScale(16),
    paddingRight: moderateScale(8),
  };
  const labelContainerAskStyle = {
    paddingLeft: moderateScale(8),
    paddingRight: moderateScale(16),
  };
  return loading ? (
    <BarChartLoading />
  ) : (
    <View style={styles.container}>
      <View style={styles.sideContainer}>
        <View style={[styles.headerLabelContainer, labelContainerBidStyle]}>
          <Text style={styles.headerLabelText}>Count</Text>
          <Text style={styles.headerLabelText}>Bid (USD)</Text>
        </View>
        {sortedBidData.map(eachData => {
          const barWidth: number =
            highestBidCount > 0
              ? getWidthPercentage(highestBidCount, eachData.count)
              : 0;
          return (
            <View
              key={eachData.price}
              style={[
                styles.barContainer,
                {
                  alignItems: 'flex-end',
                },
              ]}>
              <View
                style={[
                  styles.bidBar,
                  {
                    width: `${barWidth}%`,
                  },
                ]}
              />
              <View style={[styles.labelContainer, labelContainerBidStyle]}>
                <Text style={styles.labelText}>{eachData.count}</Text>
                <Text
                  style={[
                    styles.labelText,
                    {
                      color: 'rgba(5,93,35,0.5)',
                    },
                  ]}>
                  {moneyFormat(eachData.price)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.sideContainer}>
        <View style={[styles.headerLabelContainer, labelContainerAskStyle]}>
          <Text style={styles.headerLabelText}>Ask (USD)</Text>
          <Text style={styles.headerLabelText}>Count</Text>
        </View>
        {sortedAskData.map(eachData => {
          const barWidth: number =
            highestAskCount > 0
              ? getWidthPercentage(highestAskCount, eachData.count)
              : 0;
          return (
            <View key={eachData.price} style={styles.barContainer}>
              <View
                style={[
                  styles.askBar,
                  {
                    width: `${barWidth}%`,
                  },
                ]}
              />
              <View style={[styles.labelContainer, labelContainerAskStyle]}>
                <Text
                  style={[
                    styles.labelText,
                    {
                      color: 'rgb(243,43,47)',
                    },
                  ]}>
                  {moneyFormat(eachData.price)}
                </Text>
                <Text style={styles.labelText}>{eachData.count}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default memo(BarChart);
