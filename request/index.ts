import axios from 'axios';

// Global utils
import {Intervals} from '@utils/types';

export const getCandles = async (interval: Intervals, currency: string) => {
  try {
    const response = await axios({
      method: 'get',
      url: `https://api-pub.bitfinex.com/v2/candles/trade%3A${interval}%3At${currency}/hist`,
    });
    const returnData: number[][] = response.data;
    return returnData;
  } catch (e) {
    console.log(e);
    return [];
  }
};
