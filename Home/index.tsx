import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  Image,
  AppState,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {moderateScale} from 'react-native-size-matters/extend';
import {SafeAreaView} from 'react-native-safe-area-context';

// Assets
// @ts-ignore
import PNG_Bitcoin from '@assets/bitcoin.png';

// Local components
import CandlestickChart from './components/CandlestickChart';
import OrderBook from './components/OrderBook';

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    height: moderateScale(64),
    paddingHorizontal: moderateScale(16),
  },
  imageIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
  },
  headerRightSide: {
    paddingLeft: moderateScale(8),
  },
  headerTitleText: {
    fontWeight: 'bold',
    fontSize: moderateScale(18),
  },
  headerSubtitleText: {
    fontSize: moderateScale(12),
  },
});

const Home = () => {
  const candleStickChartRef = useRef<any>();
  const orderBookRef = useRef<any>();
  // Methods
  const toggleDataSubscription = (active: boolean = true) => {
    if (candleStickChartRef.current && orderBookRef.current) {
      if (active) {
        candleStickChartRef.current.startStreaming();
        orderBookRef.current.startStreaming();
      } else {
        candleStickChartRef.current.stopStreaming();
        orderBookRef.current.stopStreaming();
      }
    }
  };
  // Hooks
  useEffect(() => {
    toggleDataSubscription(true);
    const subscriptionAppState = AppState.addEventListener(
      'change',
      nextAppState => {
        toggleDataSubscription(nextAppState === 'active');
      },
    );
    return () => {
      toggleDataSubscription(false);
      subscriptionAppState.remove();
    };
  }, []);
  // Render
  return (
    <SafeAreaView style={styles.safeAreaView}>
      <GestureHandlerRootView style={styles.safeAreaView}>
        <ScrollView style={styles.safeAreaView}>
          <View style={styles.header}>
            <Image source={PNG_Bitcoin} style={styles.imageIcon} />
            <View style={styles.headerRightSide}>
              <Text style={styles.headerTitleText}>Bitcoin</Text>
              <Text style={styles.headerSubtitleText}>BTC/USD</Text>
            </View>
          </View>
          <CandlestickChart market="BTCUSD" ref={candleStickChartRef} />
          <OrderBook market="BTCUSD" ref={orderBookRef} />
        </ScrollView>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

export default Home;
