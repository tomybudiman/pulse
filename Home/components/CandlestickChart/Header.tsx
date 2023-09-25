import React, {useMemo, memo} from 'react';
import {moderateScale} from 'react-native-size-matters/extend';
import {Text, View, StyleSheet} from 'react-native';

// Global utils
import {moneyFormat} from '@utils';

const styles = StyleSheet.create({
  priceInfoContainer: {
    paddingBottom: moderateScale(16),
    paddingHorizontal: moderateScale(16),
  },
  currentPriceText: {
    fontWeight: 'bold',
    fontSize: moderateScale(36),
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
  ohlcDynamicData?: OhlcDynamicData[];
}

const Header: React.FC<HeaderProps> = ({ohlcDynamicData}) => {
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
      <Text style={styles.currentPriceText}>
        ${moneyFormat(getLastPrice)}.00
      </Text>
      <Text style={getSubCurrentPriceTextStyle}>{getSubCurrentPriceText}</Text>
    </View>
  );
};

export default memo(Header);
