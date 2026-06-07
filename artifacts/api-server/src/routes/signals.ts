import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// ── Market Data Simulation ──────────────────────────────────────────────────
// Generates realistic price data seeded by asset name for consistency
function simulateMarketData(asset: string, timeframe: string, bars = 60): number[] {
  const seed = asset.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const tf = { "1m": 1, "5m": 5, "15m": 15, "1h": 60 }[timeframe] || 5;
  const now = Date.now();

  let price = 1.0 + (seed % 100) * 0.01;
  const prices: number[] = [];

  for (let i = bars; i >= 0; i--) {
    const t = now - i * tf * 60 * 1000;
    const cycle = Math.sin(t / (tf * 60 * 1000 * 20)) * 0.003;
    const noise = (Math.random() - 0.5) * 0.0015;
    price += cycle + noise;
    price = Math.max(price, 0.5);
    prices.push(price);
  }
  return prices;
}

// ── RSI ─────────────────────────────────────────────────────────────────────
function calcRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// ── EMA ──────────────────────────────────────────────────────────────────────
function calcEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

// ── MACD ─────────────────────────────────────────────────────────────────────
function calcMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  const ema12 = calcEMA(prices, 12);
  const ema26 = calcEMA(prices, 26);
  const macd = ema12 - ema26;

  // Signal line = 9-period EMA of MACD (approximate with last 9 values)
  const macdSeries: number[] = [];
  for (let i = Math.max(0, prices.length - 35); i <= prices.length - 1; i++) {
    const slice = prices.slice(0, i + 1);
    if (slice.length >= 26) {
      const e12 = calcEMA(slice, 12);
      const e26 = calcEMA(slice, 26);
      macdSeries.push(e12 - e26);
    }
  }
  const signal = calcEMA(macdSeries, 9);
  const histogram = macd - signal;
  return { macd, signal, histogram };
}

// ── Bollinger Bands ──────────────────────────────────────────────────────────
function calcBollingerBands(prices: number[], period = 20, multiplier = 2): {
  upper: number; middle: number; lower: number; bandwidth: number; percentB: number;
} {
  const slice = prices.slice(-period);
  if (slice.length < period) {
    const p = prices[prices.length - 1] || 1;
    return { upper: p * 1.02, middle: p, lower: p * 0.98, bandwidth: 0.04, percentB: 0.5 };
  }
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length;
  const std = Math.sqrt(variance);
  const upper = mean + multiplier * std;
  const lower = mean - multiplier * std;
  const current = prices[prices.length - 1];
  const bandwidth = (upper - lower) / mean;
  const percentB = (upper - lower) > 0 ? (current - lower) / (upper - lower) : 0.5;
  return { upper, middle: mean, lower, bandwidth, percentB };
}

// ── Stochastic Oscillator ────────────────────────────────────────────────────
function calcStochastic(prices: number[], kPeriod = 14, dPeriod = 3): { k: number; d: number } {
  if (prices.length < kPeriod) return { k: 50, d: 50 };
  const slice = prices.slice(-kPeriod);
  const highest = Math.max(...slice);
  const lowest = Math.min(...slice);
  const current = prices[prices.length - 1];
  const k = highest === lowest ? 50 : ((current - lowest) / (highest - lowest)) * 100;

  // D = 3-period SMA of K
  const kValues: number[] = [];
  for (let i = Math.max(0, prices.length - kPeriod - dPeriod + 1); i < prices.length; i++) {
    const s = prices.slice(Math.max(0, i - kPeriod + 1), i + 1);
    const h = Math.max(...s);
    const l = Math.min(...s);
    const c = s[s.length - 1];
    kValues.push(h === l ? 50 : ((c - l) / (h - l)) * 100);
  }
  const d = kValues.slice(-dPeriod).reduce((a, b) => a + b, 0) / Math.min(dPeriod, kValues.length);
  return { k, d };
}

// ── ATR (Average True Range) ─────────────────────────────────────────────────
function calcATR(prices: number[], period = 14): number {
  if (prices.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const high = prices[i] * 1.0005;
    const low = prices[i] * 0.9995;
    const prevClose = prices[i - 1];
    trs.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }
  const slice = trs.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

// ── Williams %R ──────────────────────────────────────────────────────────────
function calcWilliamsR(prices: number[], period = 14): number {
  if (prices.length < period) return -50;
  const slice = prices.slice(-period);
  const highest = Math.max(...slice);
  const lowest = Math.min(...slice);
  const current = prices[prices.length - 1];
  return highest === lowest ? -50 : ((highest - current) / (highest - lowest)) * -100;
}

// ── Multi-Indicator Consensus AI Engine ──────────────────────────────────────
interface SignalResult {
  direction: "BUY" | "SELL" | "HOLD";
  confidence: number;
  rsi: number;
  ema9: number;
  ema21: number;
  ema50: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  bollingerUpper: number;
  bollingerMiddle: number;
  bollingerLower: number;
  stochasticK: number;
  stochasticD: number;
  atr: number;
  williamsR: number;
  asset: string;
  timeframe: string;
  indicators: Record<string, string>;
}

function generateAISignal(prices: number[], asset: string, timeframe: string): SignalResult {
  const rsi = calcRSI(prices);
  const ema9 = calcEMA(prices, 9);
  const ema21 = calcEMA(prices, 21);
  const ema50 = calcEMA(prices, 50);
  const { macd, signal: macdSignal, histogram: macdHistogram } = calcMACD(prices);
  const { upper: bollingerUpper, middle: bollingerMiddle, lower: bollingerLower, percentB } = calcBollingerBands(prices);
  const { k: stochasticK, d: stochasticD } = calcStochastic(prices);
  const atr = calcATR(prices);
  const williamsR = calcWilliamsR(prices);

  // ── Scoring System ──
  // Each indicator votes: +1 = bullish, -1 = bearish, 0 = neutral
  let bullScore = 0;
  let bearScore = 0;
  const indicators: Record<string, string> = {};

  // RSI
  if (rsi < 30) { bullScore += 2; indicators.rsi = "OVERSOLD ↑"; }
  else if (rsi < 45) { bullScore += 1; indicators.rsi = "BULLISH"; }
  else if (rsi > 70) { bearScore += 2; indicators.rsi = "OVERBOUGHT ↓"; }
  else if (rsi > 55) { bearScore += 1; indicators.rsi = "BEARISH"; }
  else { indicators.rsi = "NEUTRAL"; }

  // EMA 9/21 crossover
  if (ema9 > ema21) { bullScore += 1; indicators.ema9_21 = "BULLISH CROSS"; }
  else { bearScore += 1; indicators.ema9_21 = "BEARISH CROSS"; }

  // EMA 21/50 trend
  if (ema21 > ema50) { bullScore += 1; indicators.ema21_50 = "UPTREND"; }
  else { bearScore += 1; indicators.ema21_50 = "DOWNTREND"; }

  // MACD
  if (macd > macdSignal && macdHistogram > 0) { bullScore += 2; indicators.macd = "BULLISH ↑"; }
  else if (macd < macdSignal && macdHistogram < 0) { bearScore += 2; indicators.macd = "BEARISH ↓"; }
  else { indicators.macd = "NEUTRAL"; }

  // Bollinger Bands
  if (percentB < 0.1) { bullScore += 2; indicators.bb = "LOWER BAND BOUNCE"; }
  else if (percentB < 0.3) { bullScore += 1; indicators.bb = "NEAR LOWER BAND"; }
  else if (percentB > 0.9) { bearScore += 2; indicators.bb = "UPPER BAND REJECTION"; }
  else if (percentB > 0.7) { bearScore += 1; indicators.bb = "NEAR UPPER BAND"; }
  else { indicators.bb = "MID RANGE"; }

  // Stochastic
  if (stochasticK < 20 && stochasticD < 20) { bullScore += 2; indicators.stoch = "OVERSOLD BULLISH"; }
  else if (stochasticK > 80 && stochasticD > 80) { bearScore += 2; indicators.stoch = "OVERBOUGHT BEARISH"; }
  else if (stochasticK > stochasticD) { bullScore += 1; indicators.stoch = "BULLISH CROSS"; }
  else { bearScore += 1; indicators.stoch = "BEARISH CROSS"; }

  // Williams %R
  if (williamsR < -80) { bullScore += 1; indicators.wpr = "OVERSOLD"; }
  else if (williamsR > -20) { bearScore += 1; indicators.wpr = "OVERBOUGHT"; }
  else { indicators.wpr = "NEUTRAL"; }

  const totalScore = bullScore + bearScore;
  const maxScore = 14;
  const bullPct = bullScore / maxScore;
  const bearPct = bearScore / maxScore;

  let direction: "BUY" | "SELL" | "HOLD";
  let confidence: number;

  if (bullPct > 0.45 && bullScore > bearScore + 2) {
    direction = "BUY";
    confidence = 60 + bullPct * 35;
  } else if (bearPct > 0.45 && bearScore > bullScore + 2) {
    direction = "SELL";
    confidence = 60 + bearPct * 35;
  } else {
    direction = "HOLD";
    confidence = 40 + Math.abs(bullScore - bearScore) * 3;
  }

  // Volatility filter — low ATR = less reliable signal
  const relativeATR = atr / (prices[prices.length - 1] || 1);
  if (relativeATR < 0.0002) confidence *= 0.85;

  confidence = Math.min(98, Math.max(40, Math.round(confidence * 10) / 10));

  return {
    direction,
    confidence,
    rsi: Math.round(rsi * 100) / 100,
    ema9: Math.round(ema9 * 100000) / 100000,
    ema21: Math.round(ema21 * 100000) / 100000,
    ema50: Math.round(ema50 * 100000) / 100000,
    macd: Math.round(macd * 1000000) / 1000000,
    macdSignal: Math.round(macdSignal * 1000000) / 1000000,
    macdHistogram: Math.round(macdHistogram * 1000000) / 1000000,
    bollingerUpper: Math.round(bollingerUpper * 100000) / 100000,
    bollingerMiddle: Math.round(bollingerMiddle * 100000) / 100000,
    bollingerLower: Math.round(bollingerLower * 100000) / 100000,
    stochasticK: Math.round(stochasticK * 100) / 100,
    stochasticD: Math.round(stochasticD * 100) / 100,
    atr: Math.round(atr * 100000) / 100000,
    williamsR: Math.round(williamsR * 100) / 100,
    asset,
    timeframe,
    indicators,
  };
}

// ── Route ─────────────────────────────────────────────────────────────────────
router.get("/signals", requireAuth, async (req, res): Promise<void> => {
  const { asset, timeframe } = req.query;

  if (!asset || !timeframe || typeof asset !== "string" || typeof timeframe !== "string") {
    res.status(400).json({ error: "asset and timeframe are required" });
    return;
  }

  const prices = simulateMarketData(asset, timeframe);
  const signal = generateAISignal(prices, asset, timeframe);

  res.json(signal);
});

export default router;
