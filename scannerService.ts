import { OHLC, Timeframe, PatternType } from '../types';

const timeframeToMinutes = (tf: string): number => {
  if (tf === '1 day') return 375;
  const parts = tf.split(' ');
  const val = parseFloat(parts[0]);
  if (parts[1] === 'hour' || parts[1] === 'hours') return val * 60;
  if (tf.includes('.')) { 
    const [h, m] = tf.split(' ')[0].split('.');
    return parseInt(h) * 60 + parseInt(m);
  }
  return val;
};

const normalizeTime = (date: Date): Date => {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const seconds = rounded.getSeconds();
  
  if (seconds >= 45 && (minutes + 1) % 5 === 0) {
    rounded.setMinutes(minutes + 1);
    rounded.setSeconds(0);
  } else if (seconds <= 15 && minutes % 5 === 0) {
    rounded.setSeconds(0);
  } else {
    const m = Math.round(date.getMinutes() / 5) * 5;
    rounded.setMinutes(m);
    rounded.setSeconds(0);
  }
  rounded.setMilliseconds(0);
  return rounded;
};

export const aggregateData = (history: OHLC[], tfMinutes: number): OHLC[] => {
  if (history.length === 0) return [];
  const dayGroups: Record<string, OHLC[]> = {};
  history.forEach(tick => {
    const dateStr = tick.timestamp.split(' ')[0];
    if (!dayGroups[dateStr]) dayGroups[dateStr] = [];
    dayGroups[dateStr].push(tick);
  });

  const result: OHLC[] = [];
  Object.keys(dayGroups).sort().forEach(dateKey => {
    const dayTicks = dayGroups[dateKey];
    if (tfMinutes >= 375) {
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

    const marketOpen = new Date(`${dateKey} 09:15:00`);
    const buckets: Record<number, OHLC[]> = {};
    dayTicks.forEach(tick => {
      const tickTime = normalizeTime(new Date(tick.timestamp));
      const diffMins = (tickTime.getTime() - marketOpen.getTime()) / 60000;
      if (diffMins >= 0) {
        const bucketIndex = Math.floor(diffMins / tfMinutes);
        if (!buckets[bucketIndex]) buckets[bucketIndex] = [];
        buckets[bucketIndex].push(tick);
      }
    });

    Object.keys(buckets).map(Number).sort((a, b) => a - b).forEach(idx => {
      const ticks = buckets[idx];
      const startTime = new Date(marketOpen.getTime() + (idx * tfMinutes * 60000));
      const timeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
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

export const checkPattern = (candles: OHLC[], index: number, pattern: string): boolean => {
  if (index < 0 || index >= candles.length) return false;
  const c = candles[index];
  const p = index > 0 ? candles[index - 1] : null;
  const pp = index > 1 ? candles[index - 2] : null;

  const body = Math.abs(c.close - c.open);
  const range = (c.high - c.low) || 0.0000001;
  const isGreen = c.close >= c.open;
  const isRed = !isGreen;
  const upperShadow = c.high - Math.max(c.open, c.close);
  const lowerShadow = Math.min(c.open, c.close) - c.low;

  // Implementation based on user formula concepts
  // GREEN HAMMER: ABS(C-E)<=0.001*(C-D), MIN(B,E)-D>=2*ABS(E-B), ABS(E-B)>=0.001*(C-D)
  // RED HAMMER: B-A<=0.001*(B-C), D<A, D-C>=2*(A-D), A-D>=0.001*(B-C)
  // (Note: A=Open, B=High, C=Low, D=Close, E=Volume in formula context usually, 
  // but looking at logic: it checks body vs shadow ratios)

  switch (pattern) {
    case PatternType.HAMMER_GREEN:
      return isGreen && (upperShadow <= 0.1 * range) && (lowerShadow >= 2 * body) && (body >= 0.05 * range);
    case PatternType.HAMMER_RED:
      return isRed && (upperShadow <= 0.1 * range) && (lowerShadow >= 2 * body) && (body >= 0.05 * range);
    case PatternType.INVERTED_HAMMER_GREEN:
      return isGreen && (lowerShadow <= 0.1 * range) && (upperShadow >= 2 * body) && (body >= 0.05 * range);
    case PatternType.INVERTED_HAMMER_RED:
      return isRed && (lowerShadow <= 0.1 * range) && (upperShadow >= 2 * body) && (body >= 0.05 * range);
    case PatternType.BULLISH_ENGULFING:
      return p ? (p.close < p.open && isGreen && c.close >= p.open && c.open <= p.close) : false;
    case PatternType.BEARISH_ENGULFING:
      return p ? (p.close > p.open && isRed && c.close <= p.open && c.open >= p.close) : false;
    case PatternType.GREEN_MARUBOZU:
      return isGreen && body >= 0.9 * range;
    case PatternType.RED_MARUBOZU:
      return isRed && body >= 0.9 * range;
    case PatternType.MORNING_STAR:
      if (!p || !pp) return false;
      return (pp.close < pp.open && Math.abs(p.close - p.open) < 0.3 * Math.abs(pp.close - pp.open) && isGreen && c.close >= (pp.open - 0.5 * Math.abs(pp.close - pp.open)));
    case PatternType.EVENING_STAR:
      if (!p || !pp) return false;
      return (pp.close > pp.open && Math.abs(p.close - p.open) < 0.3 * Math.abs(pp.close - pp.open) && isRed && c.close <= (pp.open + 0.5 * Math.abs(pp.close - pp.open)));
    default: return false;
  }
};

export const getTimeSlots = (tf: string): string[] => {
  const slots: string[] = [];
  const start = new Date(); start.setHours(9, 15, 0, 0);
  const end = new Date(); end.setHours(15, 30, 0, 0);
  const mins = timeframeToMinutes(tf);
  let current = new Date(start);
  while (current < end) {
    const next = new Date(current.getTime() + mins * 60000);
    const slotStr = `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')} - ${next.getHours().toString().padStart(2, '0')}:${next.getMinutes().toString().padStart(2, '0')}`;
    slots.push(slotStr);
    current = next;
  }
  return slots;
};