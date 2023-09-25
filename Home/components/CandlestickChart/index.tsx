import React, {
  memo,
  useRef,
  useState,
  useEffect,
  forwardRef,
  useCallback,
  useImperativeHandle,
  ForwardRefRenderFunction,
} from 'react';
import {CandlestickChart as CandlestickChartNative} from 'react-native-wagmi-charts';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {moderateScale} from 'react-native-size-matters/extend';
import {View, Text, StyleSheet} from 'react-native';
import {isArray, isEmpty} from 'lodash';
import {Buffer} from 'buffer';

// Global components
import Pill from '@components/core/Pill';

// Global utils
import {ActiveTimeframes} from '@utils/types';

// Request
import {getCandles} from '@request';

// Local components
import Header from './Header';

const styles = StyleSheet.create({
  container: {
    flex: 0,
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
  tooltipText: {
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    position: 'absolute',
    backgroundColor: '#000000',
    fontSize: moderateScale(14),
    borderRadius: moderateScale(4),
    paddingHorizontal: moderateScale(8),
    marginHorizontal: moderateScale(16),
    transform: [{translateY: moderateScale(-14)}],
  },
});

interface CandlestickChartProps {
  market: string;
}

const CandlestickChart: ForwardRefRenderFunction<any, CandlestickChartProps> = (
  {market},
  ref,
) => {
  const connection = new WebSocket('wss://api-pub.bitfinex.com/ws/2');
  const [timeframePills, setTimeframePills] = useState({
    '5m': true,
    '30m': false,
    '1h': false,
    '12h': false,
    '1D': false,
    '1W': false,
  });
  const [ohlcDynamicData, setOhlcData] = useState([]);
  const isWebSocketConnected = useRef(false);
  const isSwitchingTimeframe = useRef(false);
  const activeChannelId = useRef('');
  const numberOfCandleStickBars = 40;
  // Methods
  const toggleStreaming = useCallback(
    (
      active: boolean = true,
      activeTimeframe: ActiveTimeframes = Object.keys(timeframePills)[0],
    ) => {
      if (isWebSocketConnected.current) {
        if (!active && isEmpty(activeChannelId.current)) {
          return null;
        } else {
          getCandles(activeTimeframe, market).then(response => {
            const reMappedOhlcData = response
              .slice(0, numberOfCandleStickBars)
              .map(eachData => {
                const [timestamp, open, close, high, low] = eachData;
                return {timestamp, open, close, high, low};
              })
              .reverse();
            setOhlcData(reMappedOhlcData);
          });
        }
        connection.send(
          shapeSubscribingObject(
            active ? 'subscribe' : 'unsubscribe',
            activeTimeframe,
            market,
          ),
        );
      } else {
        setTimeout(() => toggleStreaming(active, activeTimeframe), 500);
      }
    },
    [isWebSocketConnected.current],
  );
  const shapeSubscribingObject = useCallback(
    (
      type: 'subscribe' | 'unsubscribe' = 'subscribe',
      timeframe: ActiveTimeframes,
      symbol: string,
    ) => {
      if (type === 'subscribe') {
        return JSON.stringify({
          event: 'subscribe',
          channel: 'candles',
          key: `trade:${timeframe}:t${symbol}`, //'trade:TIMEFRAME:SYMBOL'
        });
      } else {
        return JSON.stringify({
          event: 'unsubscribe',
          chanId: activeChannelId.current,
        });
      }
    },
    [activeChannelId.current],
  );
  // Event handler methods
  const onPressTimeframePill = useCallback((key: ActiveTimeframes) => {
    if (!isSwitchingTimeframe.current) {
      const tempTimeframePills = {...timeframePills};
      Object.keys(tempTimeframePills).forEach(eachKey => {
        tempTimeframePills[eachKey] = eachKey === key;
      });
      setTimeframePills(tempTimeframePills);
      isSwitchingTimeframe.current = true;
      toggleStreaming(false, key);
      setTimeout(() => toggleStreaming(true, key), 500);
    }
  }, []);
  const onMessageWebSocket = useCallback(
    event => {
      const data = JSON.parse(Buffer.from(event.data).toString('utf-8'));
      if (data.serverId) {
        isWebSocketConnected.current = true;
      }
      if (data.chanId) {
        activeChannelId.current = data.chanId;
      }
      if (isArray(data) && data.length === 2) {
        const [_, ohlcData] = data;
        if (
          isArray(ohlcData) &&
          typeof ohlcData !== 'string' &&
          ohlcData.length === 6
        ) {
          const [timestamp, open, close, high, low] = ohlcData;
          const newOhlcObjectData = {timestamp, open, close, high, low};
          setOhlcData(prevOhlcData => {
            if (
              prevOhlcData.findIndex(
                eachData => eachData.timestamp === timestamp,
              ) === -1
            ) {
              return [...prevOhlcData, newOhlcObjectData].slice(
                1,
                numberOfCandleStickBars + 1,
              );
            } else {
              return prevOhlcData.map(eachData => {
                if (eachData.timestamp === timestamp) {
                  return newOhlcObjectData;
                }
                return eachData;
              });
            }
          });
        }
      }
    },
    [timeframePills],
  );
  // Hooks
  useEffect(() => {
    // WebSocket listener
    connection.onmessage = onMessageWebSocket;
  }, []);
  useEffect(() => {
    setTimeout(() => (isSwitchingTimeframe.current = false), 100);
  }, [ohlcDynamicData]);
  useImperativeHandle(
    ref,
    () => {
      return {
        startStreaming: () => toggleStreaming(true),
        stopStreaming: () => toggleStreaming(false),
      };
    },
    [],
  );
  // Render
  return (
    <View style={styles.container}>
      <Header ohlcDynamicData={ohlcDynamicData} />
      <View style={styles.pillsContainer}>
        <Text style={styles.pillTitleText}>Interval</Text>
        {Object.keys(timeframePills).map((key: ActiveTimeframes) => {
          return (
            <Pill
              key={key}
              active={timeframePills[key]}
              onPress={() => onPressTimeframePill(key)}>
              {key.toUpperCase()}
            </Pill>
          );
        })}
      </View>
      <CandlestickChartNative.Provider data={ohlcDynamicData}>
        <CandlestickChartNative>
          <CandlestickChartNative.Candles
            positiveColor="#19A546"
            negativeColor="#fb4b4d"
          />
          <CandlestickChartNative.Crosshair>
            <CandlestickChartNative.Tooltip textStyle={styles.tooltipText} />
          </CandlestickChartNative.Crosshair>
        </CandlestickChartNative>
      </CandlestickChartNative.Provider>
    </View>
  );
};

export default memo(forwardRef(CandlestickChart));