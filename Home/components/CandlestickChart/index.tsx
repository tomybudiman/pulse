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
import {moderateScale} from 'react-native-size-matters/extend';
import {View, StyleSheet} from 'react-native';
import {isArray, isEmpty} from 'lodash';
import {Buffer} from 'buffer';

// Global utils
import {Intervals} from '@utils/types';

// Request
import {getCandles} from '@request';

// Local components
import Header from './Header';
import IntervalPills from './IntervalPills';

const styles = StyleSheet.create({
  container: {
    flex: 0,
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
  const [intervalPills, setTimeframePills] = useState({
    '5m': true,
    '30m': false,
    '1h': false,
    '12h': false,
    '1D': false,
    '1W': false,
  });
  const [isLoading, setLoadingState] = useState(true);
  const [ohlcDynamicData, setOhlcData] = useState([]);
  const selectedInterval = useRef(Object.keys(intervalPills)[0]);
  const isWebSocketConnected = useRef(false);
  const isSwitchingTimeframe = useRef(false);
  const isIntervalSubsMatch = useRef(false);
  const activeChannelId = useRef('');
  const numberOfCandleStickBars = 40;
  // Methods
  const toggleStreaming = useCallback(
    (
      active: boolean = true,
      activeTimeframe: Intervals = Object.keys(intervalPills)[0],
    ) => {
      if (isWebSocketConnected.current) {
        if (!active && isEmpty(activeChannelId.current)) {
          return null;
        } else {
          /**
           * Get initial data from REST API because initial
           * data from websocket sometimes return an empty array
           */
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
        /**
         * Subscribing or unsubscribing to the websocket based on the shaped object
         */
        connection.send(
          shapeSubscribingObject(
            active ? 'subscribe' : 'unsubscribe',
            activeTimeframe,
            market,
          ),
        );
      } else {
        /**
         * Retry streaming function if websocket server is not
         * connected yet by calling itself (recursive)
         */
        setTimeout(() => toggleStreaming(active, activeTimeframe), 500);
      }
    },
    [isWebSocketConnected.current],
  );
  const shapeSubscribingObject = useCallback(
    (
      type: 'subscribe' | 'unsubscribe' = 'subscribe',
      timeframe: Intervals,
      symbol: string,
    ) => {
      return JSON.stringify(
        type === 'subscribe'
          ? {
              event: 'subscribe',
              channel: 'candles',
              key: `trade:${timeframe}:t${symbol}`, //'trade:TIMEFRAME:SYMBOL'
            }
          : {
              event: 'unsubscribe',
              chanId: activeChannelId.current,
            },
      );
    },
    [activeChannelId.current],
  );
  // Event handler methods
  const onPressChangeIntervalPill = useCallback((key: Intervals) => {
    if (!isSwitchingTimeframe.current) {
      const tempTimeframePills = {...intervalPills};
      Object.keys(tempTimeframePills).forEach(eachKey => {
        tempTimeframePills[eachKey] = eachKey === key;
      });
      setTimeframePills(tempTimeframePills);
      isIntervalSubsMatch.current = false;
      isSwitchingTimeframe.current = true;
      toggleStreaming(false, key);
      setTimeout(() => toggleStreaming(true, key), 500);
    }
  }, []);
  const onMessageWebSocket = useCallback(event => {
    /**
     * Parse event data from a buffer to an object
     */
    const data = JSON.parse(Buffer.from(event.data).toString('utf-8'));
    /**
     * Check if websocket connected properly to the server
     */
    if (data.serverId) {
      isWebSocketConnected.current = true;
    }
    /**
     * Check if subscription is successful and channel id is returned
     */
    if (data.chanId) {
      const [_, interval] = data.key.split(':');
      isIntervalSubsMatch.current = selectedInterval.current === interval;
      activeChannelId.current = data.chanId;
    }
    /**
     * Receive streaming update data for the chart
     */
    if (isArray(data) && data.length === 2) {
      const [_, ohlcData] = data;
      if (
        isArray(ohlcData) &&
        ohlcData.length === 6 &&
        isIntervalSubsMatch.current &&
        typeof ohlcData !== 'string'
      ) {
        const [timestamp, open, close, high, low] = ohlcData;
        const newOhlcObjectData = {timestamp, open, close, high, low};
        setOhlcData(prevOhlcData => {
          if (
            prevOhlcData.findIndex(
              eachData => eachData.timestamp === timestamp,
            ) === -1
          ) {
            /**
             * Update existing candlestick point data when
             * websocket send existing data instead the new one
             */
            return [...prevOhlcData, newOhlcObjectData].slice(
              1,
              numberOfCandleStickBars + 1,
            );
          } else {
            /**
             * Push new data to the timeframe data collection
             */
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
  }, []);
  // Hooks
  useEffect(() => {
    selectedInterval.current = Object.keys(intervalPills).find(
      eachKey => intervalPills[eachKey],
    );
    // WebSocket listener
    connection.onmessage = onMessageWebSocket;
  }, [intervalPills]);
  useEffect(() => {
    if (ohlcDynamicData.length > 0) {
      setTimeout(() => setLoadingState(false), 1000);
    }
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
      <Header loading={isLoading} ohlcDynamicData={ohlcDynamicData} />
      <IntervalPills
        loading={isLoading}
        intervalPills={intervalPills}
        onPressPill={key => onPressChangeIntervalPill(key)}
      />
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
