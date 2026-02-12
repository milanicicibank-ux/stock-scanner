
export interface OHLC {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockData {
  symbol: string;
  history: OHLC[];
}

export enum Timeframe {
  MIN_15 = '15 mins',
  MIN_30 = '30 mins',
  MIN_45 = '45 mins',
  H_1 = '1 hour',
  H_1_15 = '1.15 mins',
  H_1_30 = '1.30 mins',
  H_1_45 = '1.45 mins',
  H_2 = '2 hours',
  H_2_15 = '2.15 mins',
  H_2_30 = '2.30 mins',
  H_2_45 = '2.45 mins',
  H_3 = '3 hours',
  H_3_15 = '3.15 mins',
  H_3_30 = '3.30 mins',
  H_3_45 = '3.45 mins',
  H_4 = '4 hours',
  DAY_1 = '1 day'
}

export enum PatternType {
  HAMMER_GREEN = 'Hammer (Green)',
  HAMMER_RED = 'Hammer (Red)',
  INVERTED_HAMMER_GREEN = 'Inverted Hammer (Green)',
  INVERTED_HAMMER_RED = 'Inverted Hammer (Red)',
  BULLISH_ENGULFING = 'Bullish Engulfing',
  BEARISH_ENGULFING = 'Bearish Engulfing',
  GREEN_MARUBOZU = 'Green Marubozu',
  RED_MARUBOZU = 'Red Marubozu',
  MORNING_STAR = 'Morning Star',
  EVENING_STAR = 'Evening Star'
}

export interface ScanResult {
  symbol: string;
  timeframe: string;
  pattern: string;
  timeSlot: string;
  timestamp: number; // for sorting
}

export interface DashboardStats {
  stocksScanned: number;
  patternsFound: number;
  stocksWithPatterns: number;
}
