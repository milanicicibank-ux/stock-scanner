
import { OHLC, StockData, Timeframe, PatternType, ScanResult } from '../types';

const timeframeToMinutes = (tf: string): number => {
  if (tf === '1 day') return 375; // Total market minutes (9:15 to 15:30)
  const parts = tf.split(' ');
  const val = parseFloat(parts[0]);
  if (parts[1] === 'hour' || parts[1] === 'hours') return val * 60;
  if (tf.includes('.')) { 
    // handles formats like "1.15 mins" which means 1 hour 15 mins (75 mins)
    const [h, m] = tf.split(' ')[0].split('.');
    return parseInt(h) * 60 + parseInt(m);
  }
  return val;
};

/**
 * Normalizes a timestamp to the nearest 5-minute boundary to handle sheet lag.
 * e.g., 09:14:59 becomes 09:15:00
 */
const normalizeTime = (date: Date): Date => {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const seconds = rounded.getSeconds();
  
  // If we're within 10 seconds of the next 5-minute mark, round up
  if (seconds >= 50 && (minutes + 1) % 5 === 0) {
    rounded.setMinutes(minutes + 1);
    rounded.setSeconds(0);
  } else if (seconds <= 10 && minutes % 5 === 0) {
    // Already at the start of a 5-min mark
    rounded.setSeconds(0);
  } else {
    // General rounding to nearest 5 mins if it's slightly off
    const m = Math.round(date.getMinutes() / 5) * 5;
    rounded.setMinutes(m);
    rounded.setSeconds(0);
  }
  rounded.setMilliseconds(0);
  return rounded;
};

export const aggregateData = (history: OHLC[], tfMinutes: number): OHLC[] => {
  if (history.length === 0) return [];

  // 1. Group by Date first
  const dayGroups: Record<string, OHLC[]> = {};
  history.forEach(tick => {
    const dateStr = tick.timestamp.split(' ')[0];
    if (!dayGroups[dateStr]) dayGroups[dateStr] = [];
    dayGroups[dateStr].push(tick);
  });

  const result: OHLC[] = [];

  // 2. Process each day with fixed buckets starting from 09:15
  Object.keys(dayGroups).sort().forEach(dateKey => {
    const dayTicks = dayGroups[dateKey];
    
    if (tfMinutes >= 375) { // Daily aggregation
      result.push({
        timestamp: `${dateKey} 09:15:00`,
        open: dayTicks[0].open,
        high: Math.max(...dayTicks.map(t => t.high)),
        low: Math.min(...dayTicks.map(t => t.low)),
        close: dayTicks[dayTicks.length - 1].close,
        volume: dayTicks.reduce((acc, t) => acc + (t.volume || 0), 0)
      });
      return;
    }

    // Intraday bucketing
    const marketOpen = new Date(`${dateKey} 09:15:00`);
    const buckets: Record<number, OHLC[]> = {};

    dayTicks.forEach(tick => {
      const tickTime = normalizeTime(new Date(tick.timestamp));
      const diffMs = tickTime.getTime() - marketOpen.getTime();
      const diffMins = diffMs / (1000 * 60);

      // Only consider data within market hours or slightly before (9:15 start)
      if (diffMins < 0 && diffMins > -5) {
        // Treat 9:14:59 as 9:15:00 (bucket 0)
        const bucketIndex = 0;
        if (!buckets[bucketIndex]) buckets[bucketIndex] = [];
        buckets[bucketIndex].push(tick);
      } else if (diffMins >= 0) {
        const bucketIndex = Math.floor(diffMins / tfMinutes);
        if (!buckets[bucketIndex]) buckets[bucketIndex] = [];
        buckets[bucketIndex].push(tick);
      }
    });

    // 3. Convert buckets to OHLC
    Object.keys(buckets).map(Number).sort((a, b) => a - b).forEach(idx => {
      const ticks = buckets[idx];
      const startTime = new Date(marketOpen.getTime() + (idx * tfMinutes * 60000));
      
      // Format timestamp to match UI slots
      const timeStr = `${startTime.getHours()}:${startTime.getMinutes().toString().padStart(2, '0')}`;
      
      result.push({
        timestamp: `${dateKey} ${timeStr}:00`,
        open: ticks[0].open,
        high: Math.max(...ticks.map(t => t.high)),
        low: Math.min(...ticks.map(t => t.low)),
        close: ticks[ticks.length - 1].close,
        volume: ticks.reduce((acc, t) => acc + (t.volume || 0), 0)
      });
    });
  });

  return result;
};

// Pattern Detection Logic
export const checkPattern = (candles: OHLC[], index: number, pattern: string): boolean => {
  if (index < 0 || index >= candles.length) return false;
  const c = candles[index];
  const p = index > 0 ? candles[index - 1] : null;
  const pp = index > 1 ? candles[index - 2] : null;

  const body = Math.abs(c.close - c.open);
  const range = c.high - c.low + 0.0000001;
  const isGreen = c.close >= c.open;
  const isRed = !isGreen;

  switch (pattern) {
    case PatternType.HAMMER_GREEN:
      return isGreen && 
             (c.high - Math.max(c.open, c.close)) <= 0.1 * body && 
             (Math.min(c.open, c.close) - c.low) >= 2 * body &&
             body >= 0.001 * range;

    case PatternType.HAMMER_RED:
      return isRed &&
             (c.high - Math.max(c.open, c.close)) <= 0.1 * body &&
             (Math.min(c.open, c.close) - c.low) >= 2 * body &&
             body >= 0.001 * range;

    case PatternType.INVERTED_HAMMER_GREEN:
      return isGreen &&
             (c.high - Math.max(c.open, c.close)) >= 2 * body &&
             (Math.min(c.open, c.close) - c.low) <= 0.1 * body;

    case PatternType.INVERTED_HAMMER_RED:
      return isRed &&
             (c.high - Math.max(c.open, c.close)) >= 2 * body &&
             (Math.min(c.open, c.close) - c.low) <= 0.1 * body;

    case PatternType.BULLISH_ENGULFING:
      if (!p) return false;
      return (p.close < p.open) && (c.close > c.open) && (c.open <= p.close) && (c.close >= p.open);

    case PatternType.BEARISH_ENGULFING:
      if (!p) return false;
      return (p.close > p.open) && (c.close < c.open) && (c.open >= p.close) && (c.close <= p.open);

    case PatternType.GREEN_MARUBOZU:
      return isGreen && body >= 0.9 * range;

    case PatternType.RED_MARUBOZU:
      return isRed && body >= 0.9 * range;

    case PatternType.MORNING_STAR:
      if (!p || !pp) return false;
      const pBody = Math.abs(p.close - p.open);
      const ppBody = Math.abs(pp.close - pp.open);
      return (pp.close < pp.open) && (pBody < 0.3 * ppBody) && (c.close > c.open) && (c.close >= pp.open - (ppBody * 0.5));

    case PatternType.EVENING_STAR:
      if (!p || !pp) return false;
      const pBodyE = Math.abs(p.close - p.open);
      const ppBodyE = Math.abs(pp.close - pp.open);
      return (pp.close > pp.open) && (pBodyE < 0.3 * ppBodyE) && (c.close < c.open) && (c.close <= pp.open + (ppBodyE * 0.5));

    default:
      return false;
  }
};

export const getTimeSlots = (tf: string): string[] => {
  const slots: string[] = [];
  const start = new Date();
  start.setHours(9, 15, 0, 0);
  const end = new Date();
  end.setHours(15, 30, 0, 0);

  const mins = timeframeToMinutes(tf);
  let current = new Date(start);

  while (current < end) {
    const next = new Date(current.getTime() + mins * 60000);
    const slotStr = `${current.getHours()}:${current.getMinutes().toString().padStart(2, '0')} - ${next.getHours()}:${next.getMinutes().toString().padStart(2, '0')}`;
    slots.push(slotStr);
    current = next;
  }
  return slots;
};
