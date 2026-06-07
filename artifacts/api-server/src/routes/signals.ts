import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function simulateMarketData() {
  const prices: number[] = [];
  let price = 1.0 + Math.random() * 0.1;
  for (let i = 0; i < 30; i++) {
    price += (Math.random() - 0.5) * 0.002;
    prices.push(price);
  }
  return prices;
}

function calcRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calcEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

router.get("/signals", requireAuth, async (req, res): Promise<void> => {
  const { asset, timeframe } = req.query;

  if (!asset || !timeframe || typeof asset !== "string" || typeof timeframe !== "string") {
    res.status(400).json({ error: "asset and timeframe are required" });
    return;
  }

  const prices = simulateMarketData();
  const rsi = calcRSI(prices);
  const ema9 = calcEMA(prices, 9);
  const ema21 = calcEMA(prices, 21);

  let direction: "BUY" | "SELL" | "HOLD";
  let baseConfidence: number;

  if (rsi < 30 && ema9 > ema21) {
    direction = "BUY";
    baseConfidence = 65 + Math.random() * 25; // 65-90%
  } else if (rsi > 70 && ema9 < ema21) {
    direction = "SELL";
    baseConfidence = 65 + Math.random() * 25; // 65-90%
  } else {
    direction = "HOLD";
    baseConfidence = 50 + Math.random() * 20; // 50-70%
  }

  const confidence = Math.round(baseConfidence * 10) / 10;

  res.json({
    direction,
    confidence,
    rsi: Math.round(rsi * 100) / 100,
    ema9: Math.round(ema9 * 100000) / 100000,
    ema21: Math.round(ema21 * 100000) / 100000,
    asset,
    timeframe,
  });
});

export default router;
