import React, {memo, useMemo} from 'react';
import {createShimmerPlaceholder} from 'react-native-shimmer-placeholder';
import {moderateScale} from 'react-native-size-matters/extend';
import {LinearGradient} from 'expo-linear-gradient';
import {Text, View, StyleSheet} from 'react-native';

// Global utils
import {moneyFormat} from '@utils';

const ShimmerPlaceholder = createShimmerPlaceholder(LinearGradient);
const styles = StyleSheet.create({
  priceInfoContainer: {
    paddingBottom: moderateScale(16),
    paddingHorizontal: moderateScale(16),
  },
  currentPriceTextPlaceholder: {
    width: moderateScale(160),
    height: moderateScale(36),
    borderRadius: moderateScale(8),
  },
  currentPriceText: {
    fontWeight: 'bold',
    fontSize: moderateScale(36),
  },
  subCurrentPriceTextLoading: {
    width: moderateScale(100),
    height: moderateScale(16),
    marginTop: moderateScale(4),
    borderRadius: moderateScale(8),
  },
  subCurrentPriceText: {
    fontSize: moderateScale(16),
  },
});

type OhlcDynamicData = {
  timestamp: number;
  open: number;
  close: number;
  high: number;
  low: number;
};

interface HeaderProps {
  loading?: boolean;
  ohlcDynamicData?: OhlcDynamicData[];
}

const Header: React.FC<HeaderProps> = ({loading = false, ohlcDynamicData}) => {
  // Constants
  const getLastPrice: number = useMemo(() => {
    return ohlcDynamicData[ohlcDynamicData.length - 1]?.close || 0;
  }, [ohlcDynamicData]);
  const getPriceUpdateChange: {
    symbol: 'positive' | 'negative' | 'equal';
    amount: number;
    percentage: number;
  } = useMemo(() => {
    const getLastSecondaryPrice =
      ohlcDynamicData[ohlcDynamicData.length - 2]?.close || 0;
    const subtract = getLastPrice - getLastSecondaryPrice;
    let symbol: 'positive' | 'negative' | 'equal';
    let amount: number = subtract;
    if (subtract < 0) {
      symbol = 'negative';
      amount = subtract * -1;
    } else if (subtract > 0) {
      symbol = 'positive';
    } else {
      symbol = 'equal';
    }
    return {
      symbol,
      amount,
      percentage: Math.abs(subtract / getLastSecondaryPrice) * 100,
    };
  }, [ohlcDynamicData, getLastPrice]);
  const getSubCurrentPriceTextStyle = useMemo(() => {
    return [
      styles.subCurrentPriceText,
      {
        color:
          getPriceUpdateChange.symbol === 'positive'
            ? '#10b981'
            : getPriceUpdateChange.symbol === 'negative'
            ? '#ef4444'
            : '#000000',
      },
    ];
  }, [getPriceUpdateChange]);
  const getSubCurrentPriceText = useMemo(() => {
    const textSymbol =
      getPriceUpdateChange.symbol === 'positive'
        ? '+'
        : getPriceUpdateChange.symbol === 'negative'
        ? '-'
        : '';
    return `${textSymbol}$${moneyFormat(
      getPriceUpdateChange.amount,
    )} (${textSymbol}${getPriceUpdateChange.percentage.toFixed(2)}%)`;
  }, [getPriceUpdateChange]);
  // Render
  return (
    <View style={styles.priceInfoContainer}>
      {loading ? (
        <>
          <ShimmerPlaceholder style={styles.currentPriceTextPlaceholder} />
          <ShimmerPlaceholder style={styles.subCurrentPriceTextLoading} />
        </>
      ) : (
        <>
          <Text style={styles.currentPriceText}>
            ${moneyFormat(getLastPrice)}.00
          </Text>
          <Text style={getSubCurrentPriceTextStyle}>
            {getSubCurrentPriceText}
          </Text>
        </>
      )}
    </View>
  );
};

export default memo(Header);
