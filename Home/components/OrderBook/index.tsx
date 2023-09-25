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
import {moderateScale} from 'react-native-size-matters/extend';
import {Text, View, StyleSheet} from 'react-native';
import {isArray, isEmpty} from 'lodash';
import {Buffer} from 'buffer';

// Local components
import BarChart from './BarChart';

const styles = StyleSheet.create({
  container: {
    paddingVertical: moderateScale(16),
  },
  titleText: {
    fontWeight: 'bold',
    fontSize: moderateScale(20),
    paddingHorizontal: moderateScale(16),
  },
});

interface OrderBookProps {
  market: string;
}

const OrderBook: ForwardRefRenderFunction<any, OrderBookProps> = (
  {market},
  ref,
) => {
  const connection = new WebSocket('wss://api-pub.bitfinex.com/ws/2');
  const dynamicBookDataPersist = useRef({
    bid: [],
    ask: [],
  });
  const [dynamicBookData, setBookData] = useState(
    dynamicBookDataPersist.current,
  );
  const isWebSocketConnected = useRef(false);
  const isDebounceWaiting = useRef(false);
  const activeChannelId = useRef('');
  // Methods
  const setBookDataFunction = data => {
    dynamicBookDataPersist.current = data;
    setBookData(dynamicBookDataPersist.current);
  };
  const toggleStreaming = useCallback(
    (active: boolean = true) => {
      if (isWebSocketConnected.current) {
        connection.send(
          shapeSubscribingObject(active ? 'subscribe' : 'unsubscribe', market),
        );
      } else {
        setTimeout(() => toggleStreaming(active), 500);
      }
    },
    [isWebSocketConnected.current],
  );
  const shapeSubscribingObject = useCallback(
    (type: 'subscribe' | 'unsubscribe' = 'subscribe', symbol: string) => {
      if (type === 'subscribe') {
        return JSON.stringify({
          event: 'subscribe',
          channel: 'book',
          symbol: `t${symbol}`,
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
  const onMessageWebSocket = useCallback(
    event => {
      const data = JSON.parse(Buffer.from(event.data).toString('utf-8'));
      if (data.serverId) {
        isWebSocketConnected.current = true;
      }
      if (data.chanId) {
        activeChannelId.current = data.chanId;
      }
      if (isArray(data) && data.length === 2 && !isDebounceWaiting.current) {
        isDebounceWaiting.current = true;
        setTimeout(() => (isDebounceWaiting.current = false), 1000);
        const [_, bookData] = data;
        const tempObjectData = {
          bid: [],
          ask: [],
        };
        if (bookData.length === 3) {
          const [price, count, amount] = bookData;
          let existingData = [
            ...dynamicBookDataPersist.current.bid,
            ...dynamicBookDataPersist.current.ask,
          ].filter(eachData => eachData.count > 0);
          if (
            existingData.findIndex(eachData => eachData.price === price) === -1
          ) {
            existingData.push({price, count, amount});
          } else {
            existingData = existingData.map(eachData => {
              if (eachData.price === price) {
                return {price, count, amount};
              }
              return eachData;
            });
          }
          existingData.forEach(eachData => {
            tempObjectData[eachData.amount > 0 ? 'bid' : 'ask'].push(eachData);
          });
          setBookDataFunction(tempObjectData);
        } else if (bookData.length > 3) {
          bookData.forEach((eachData: number[]) => {
            const [price, count, amount] = eachData;
            if (amount > 0) {
              tempObjectData.bid.push({price, count, amount});
            } else {
              tempObjectData.ask.push({price, count, amount});
            }
          });
          setBookDataFunction(tempObjectData);
        }
      }
    },
    [dynamicBookDataPersist.current, isDebounceWaiting.current],
  );
  // Hooks
  useEffect(() => {
    // WebSocket listener
    connection.onmessage = onMessageWebSocket;
  }, []);
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
      <Text style={styles.titleText}>Order Book</Text>
      <BarChart
        bidData={dynamicBookData.bid}
        askData={dynamicBookData.ask}
        loading={isEmpty(dynamicBookData.bid) && isEmpty(dynamicBookData.ask)}
      />
    </View>
  );
};

export default memo(forwardRef(OrderBook));
