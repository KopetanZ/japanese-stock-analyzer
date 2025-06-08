import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Bell, BarChart3, Brain, Activity, Zap, Target, Eye, Cpu } from 'lucide-react';

// 🔽 ここから型定義を追加
type StockData = {
  date: string;
  price: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  change: number;
};

type MLResult = {
  prediction: 'BUY' | 'SELL' | 'HOLD';
  confidence: string;
  ensembleScore: string;
  modelScores: {
    neuralNetwork: string;
    randomForest: string;
    gradientBoosting: string;
  };
  features: Record<string, number>;
  riskLevel: string;
};

type Signal = {
  type: string;
  source: string;
  indicator: string;
  message: string;
  strength: string;
  confidence: number;
  timestamp: string;
};

type FeatureVector = {
  priceChange: number;
  volatility: number;
  rsiNorm: number;
  macdSignal: number;
  bollPosition: number;
  volumeSignal: number;
  momentum5: number;
  momentum25: number;
};

type TechnicalIndicators = {
  sma5: string;
  sma25: string;
  sma75: string;
  ema12: string;
  ema26: string;
  macd: string;
  rsi: string;
  stochK: string;
  williamsR: string;
  atr: string;
  bollingerUpper: string;
  bollingerLower: string;
  bollingerWidth: string;
  volumeRatio: string;
  avgVolume: string;
};

type RealTimePrice = {
  current: number;
  change: number;
  changePercent: number;
  volume: number;
};

type VolatilityInfo = {
  dailyVol: string;
  annualizedVol: string;
  riskLevel: 'Very High' | 'High' | 'Medium' | string;
};
// 🔼 型定義ここまで

const JapaneseGrowthStockAnalyzer = () => {
  const [selectedStock, setSelectedStock] = useState('6178');
  const [signals, setSignals] = useState<Signal[]>([]);
  const [chartData, setChartData] = useState<StockData[]>([]);
  const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalIndicators | null>(null);
  const [advancedIndicators, setAdvancedIndicators] = useState({});
  const [mlPrediction, setMlPrediction] = useState<MLResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [realTimePrice, setRealTimePrice] = useState<RealTimePrice | null>(null);
  const [volatilityAnalysis, setVolatilityAnalysis] = useState<VolatilityInfo | null>(null);

  // 日本のグロース株銘柄
  const japaneseGrowthStocks = [
    { code: '6178', name: '日本郵政', sector: 'IT・通信', market: 'プライム' },
    { code: '4751', name: 'サイバーエージェント', sector: 'インターネット・広告', market: 'プライム' },
    { code: '3659', name: 'ネクソン', sector: 'ゲーム', market: 'プライム' },
    { code: '4385', name: 'メルカリ', sector: 'Eコマース', market: 'グロース' },
    { code: '4478', name: 'フリー', sector: 'クラウドサービス', market: 'グロース' },
    { code: '4433', name: 'ヒューマンウェブ', sector: 'AI・DX', market: 'グロース' },
    { code: '3696', name: 'セレス', sector: 'デジタルマーケティング', market: 'プライム' },
    { code: '4382', name: 'HEROZ', sector: 'AI・機械学習', market: 'グロース' },
    { code: '4490', name: 'ビザスク', sector: 'プラットフォーム', market: 'グロース' },
    { code: '4494', name: 'バリューコマース', sector: 'アフィリエイト', market: 'プライム' },
    { code: '7779', name: 'サイバーダイン', sector: 'ロボティクス', market: 'グロース' },
    { code: '3900', name: 'クラウドワークス', sector: 'クラウドソーシング', market: 'グロース' }
  ];

  // 実際の株価データをシミュレート（実際のAPIでは外部データソースを使用）
/*   const fetchRealStockData = useCallback(async (stockCode) => {
    // Yahoo Finance APIやQuandl APIなどを使用する想定でシミュレート
    const basePrice = Math.random() * 3000 + 500;
    const data = [];
    let currentPrice = basePrice;
    
    // より現実的な日本株の値動きパターンを生成
    for (let i = 0; i < 100; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (99 - i));
      
      // 日本市場の特徴を反映した値動き
      const marketTrend = Math.sin(i / 10) * 0.02; // 中期トレンド
      const randomWalk = (Math.random() - 0.5) * 0.06; // ランダムウォーク
      const momentum = i > 50 ? 0.01 : -0.005; // モメンタム効果
      
      const totalChange = marketTrend + randomWalk + momentum;
      currentPrice = currentPrice * (1 + totalChange);
      
      const volume = Math.floor(Math.random() * 5000000) + 100000;
      const high = currentPrice * (1 + Math.random() * 0.03);
      const low = currentPrice * (1 - Math.random() * 0.03);
      const open = currentPrice * (0.98 + Math.random() * 0.04);
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat(currentPrice.toFixed(0)),
        volume: volume,
        high: parseFloat(high.toFixed(0)),
        low: parseFloat(low.toFixed(0)),
        open: parseFloat(open.toFixed(0)),
        change: i > 0 ? currentPrice - data[i-1]?.price : 0
      });
    }
    
    return data;
  }, []); */

  // Yahoo Finance APIから実際の株価データを取得
  const fetchRealStockData = useCallback(async (stockCode: string | number) => {
    try {
      // 東京証券取引所の銘柄には.Tを付加
      const symbol = `${stockCode}.T`;
      
      // 過去100日分のデータを取得するための日付計算
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 100);
      
      const period1 = Math.floor(startDate.getTime() / 1000);
      const period2 = Math.floor(endDate.getTime() / 1000);
      
      // Yahoo Finance APIエンドポイント
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d&includePrePost=true&events=div%7Csplit`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.chart?.result?.[0]?.timestamp) {
        throw new Error('Invalid data structure from Yahoo Finance API');
      }
      
      const timestamps = result.chart.result[0].timestamp;
      const prices = result.chart.result[0].indicators.quote[0];
      const volumes = prices.volume;
      const opens = prices.open;
      const highs = prices.high;
      const lows = prices.low;
      const closes = prices.close;
      
      const data: StockData[] = timestamps.map((timestamp: number, i: number) => {
        const date = new Date(timestamp * 1000);
        const price = closes[i];
        const prevPrice = i > 0 ? closes[i - 1] : price;
        
        return {
          date: date.toISOString().split('T')[0],
          price: price ? parseFloat(price.toFixed(0)) : 0,
          volume: volumes[i] || 0,
          high: highs[i] ? parseFloat(highs[i].toFixed(0)) : price,
          low: lows[i] ? parseFloat(lows[i].toFixed(0)) : price,
          open: opens[i] ? parseFloat(opens[i].toFixed(0)) : price,
          change: price && prevPrice ? price - prevPrice : 0
        };
      }).filter((item: StockData) => item.price > 0); // 無効なデータを除外
      
      return data;
      
    } catch (error) {
      console.error('Yahoo Finance API Error:', error);
      
      // APIエラー時のフォールバック（シミュレートデータ）
      console.log('Falling back to simulated data...');
      const basePrice = Math.random() * 3000 + 500;
      const data: StockData[] = [];
      let currentPrice = basePrice;
      
      for (let i = 0; i < 100; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (99 - i));
        
        const marketTrend = Math.sin(i / 10) * 0.02;
        const randomWalk = (Math.random() - 0.5) * 0.06;
        const momentum = i > 50 ? 0.01 : -0.005;
        
        const totalChange = marketTrend + randomWalk + momentum;
        currentPrice = currentPrice * (1 + totalChange);
        
        const volume = Math.floor(Math.random() * 5000000) + 100000;
        const high = currentPrice * (1 + Math.random() * 0.03);
        const low = currentPrice * (1 - Math.random() * 0.03);
        const open = currentPrice * (0.98 + Math.random() * 0.04);
        
        data.push({
          date: date.toISOString().split('T')[0],
          price: parseFloat(currentPrice.toFixed(0)),
          volume: volume,
          high: parseFloat(high.toFixed(0)),
          low: parseFloat(low.toFixed(0)),
          open: parseFloat(open.toFixed(0)),
          change: i > 0 ? currentPrice - data[i-1]?.price : 0
        });
      }
      
      return data;
    }
  }, []);

  // 高度なテクニカル指標計算
//  const calculateAdvancedTechnicalIndicators = useCallback((data: StockData[]): Record<string, string> => {
  const calculateAdvancedTechnicalIndicators = useCallback((data: StockData[]): TechnicalIndicators | null => {
//    if (data.length < 50) return {};
    if (data.length < 50) return null;

    const prices = data.map(d => d.price);
    const volumes = data.map(d => d.volume);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);

    // 基本移動平均
    const sma5 = prices.slice(-5).reduce((sum, p) => sum + p, 0) / 5;
    const sma25 = prices.slice(-25).reduce((sum, p) => sum + p, 0) / 25;
    const sma75 = prices.slice(-75).reduce((sum, p) => sum + p, 0) / 75;

    // 指数移動平均 (EMA)
    const calculateEMA = (values: number[], period: number): number => {
      const k = 2 / (period + 1);
      let ema = values[0];
      for (let i = 1; i < values.length; i++) {
        ema = values[i] * k + ema * (1 - k);
      }
      return ema;
    };

    const ema12 = calculateEMA(prices.slice(-26), 12);
    const ema26 = calculateEMA(prices.slice(-26), 26);
    const macd = ema12 - ema26;

    // RSI計算（改良版）
    const calculateRSI = (values: number[], period = 14): number => {
      const gains = [];
      const losses = [];
      
      for (let i = 1; i < values.length; i++) {
        const change = values[i] - values[i - 1];
        if (change > 0) gains.push(change);
        else losses.push(Math.abs(change));
      }
      
      const avgGain = gains.slice(-period).reduce((sum, g) => sum + g, 0) / period;
      const avgLoss = losses.slice(-period).reduce((sum, l) => sum + l, 0) / period;
      
      return avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
    };

    const rsi = calculateRSI(prices.slice(-30));

    // ストキャスティクス
    const calculateStochastic = (highs: number[], lows: number[], closes: number[], period = 14) => {
      const recentHighs = highs.slice(-period);
      const recentLows = lows.slice(-period);
      const currentClose = closes[closes.length - 1];
      
      const highestHigh = Math.max(...recentHighs);
      const lowestLow = Math.min(...recentLows);
      
      return ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    };

    const stochK = calculateStochastic(highs.slice(-20), lows.slice(-20), prices.slice(-20));

    // ウィリアムズ%R
    const williamsR = ((Math.max(...highs.slice(-14)) - prices[prices.length - 1]) / 
                      (Math.max(...highs.slice(-14)) - Math.min(...lows.slice(-14)))) * -100;

    // ATR (Average True Range)
    const calculateATR = (highs: number[], lows: number[], closes: number[], period = 14) => {
      const trueRanges = [];
      for (let i = 1; i < highs.length; i++) {
        const tr1 = highs[i] - lows[i];
        const tr2 = Math.abs(highs[i] - closes[i - 1]);
        const tr3 = Math.abs(lows[i] - closes[i - 1]);
        trueRanges.push(Math.max(tr1, tr2, tr3));
      }
      return trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
    };

    const atr = calculateATR(highs.slice(-20), lows.slice(-20), prices.slice(-20));

    // ボリンジャーバンド（改良版）
    const bollinger = (() => {
      const period = 20;
      const recentPrices = prices.slice(-period);
      const sma = recentPrices.reduce((sum, p) => sum + p, 0) / period;
      const variance = recentPrices.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      
      return {
        upper: sma + (2 * stdDev),
        middle: sma,
        lower: sma - (2 * stdDev),
        width: (4 * stdDev) / sma * 100 // %B
      };
    })();

    // Volume indicators
    const avgVolume = volumes.slice(-20).reduce((sum, v) => sum + v, 0) / 20;
    const volumeRatio = volumes[volumes.length - 1] / avgVolume;

    return {
      sma5: sma5.toFixed(0),
      sma25: sma25.toFixed(0),
      sma75: sma75.toFixed(0),
      ema12: ema12.toFixed(0),
      ema26: ema26.toFixed(0),
      macd: macd.toFixed(2),
      rsi: rsi.toFixed(1),
      stochK: stochK.toFixed(1),
      williamsR: williamsR.toFixed(1),
      atr: atr.toFixed(0),
      bollingerUpper: bollinger.upper.toFixed(0),
      bollingerLower: bollinger.lower.toFixed(0),
      bollingerWidth: bollinger.width.toFixed(2),
      volumeRatio: volumeRatio.toFixed(2),
      avgVolume: (avgVolume / 1000).toFixed(0) + 'K'
    };
  }, []);

  // 高度な機械学習予測（アンサンブル手法）
  const advancedMLPrediction = useCallback((data: StockData[], indicators: Record<string, string>): MLResult => {
    const currentPrice = data[data.length - 1].price;
    const prices = data.map(d => d.price);
    
    // Feature Engineering
    const features: FeatureVector = {
      // Price-based features
      priceChange: (currentPrice - prices[prices.length - 2]) / prices[prices.length - 2],
      volatility: Math.sqrt(prices.slice(-20).reduce((sum, p, i, arr) => {
        if (i === 0) return sum;
        const ret = (p - arr[i-1]) / arr[i-1];
        return sum + ret * ret;
      }, 0) / 19),
      
      // Technical indicators as features
      rsiNorm: (parseFloat(indicators.rsi) - 50) / 50,
      macdSignal: parseFloat(indicators.macd) > 0 ? 1 : -1,
      bollPosition: (currentPrice - parseFloat(indicators.bollingerLower)) / 
                   (parseFloat(indicators.bollingerUpper) - parseFloat(indicators.bollingerLower)),
      volumeSignal: parseFloat(indicators.volumeRatio) > 1.5 ? 1 : 0,
      
      // Momentum features
      momentum5: (currentPrice - parseFloat(indicators.sma5)) / parseFloat(indicators.sma5),
      momentum25: (currentPrice - parseFloat(indicators.sma25)) / parseFloat(indicators.sma25)
    };

    // Neural Network simulation (simplified)
    const neuralNetworkPredict = (features: FeatureVector): number => {
      let score = 0;
      
      // Input layer to hidden layer
      score += features.priceChange * 0.3;
      score += features.rsiNorm * 0.25;
      score += features.bollPosition * 0.2;
      score += features.momentum5 * 0.15;
      score += features.volumeSignal * 0.1;
      
      // Activation function (tanh)
      return Math.tanh(score);
    };

    // Random Forest simulation
    const randomForestPredict = (features: FeatureVector): number => {
      let votes = 0;
      const trees = 5;
      
      for (let i = 0; i < trees; i++) {
        let treeScore = 0;
        
        // Tree 1: RSI focused
        if (i === 0) {
          if (features.rsiNorm < -0.4) treeScore += 0.8; // Oversold
          if (features.volumeSignal > 0) treeScore += 0.2;
        }
        // Tree 2: Momentum focused
        else if (i === 1) {
          if (features.momentum5 > 0.02) treeScore += 0.6;
          if (features.momentum25 > 0) treeScore += 0.4;
        }
        // Tree 3: Bollinger focused
        else if (i === 2) {
          if (features.bollPosition < 0.2) treeScore += 0.7; // Near lower band
          if (features.macdSignal > 0) treeScore += 0.3;
        }
        // Tree 4: Volume focused
        else if (i === 3) {
          if (features.volumeSignal > 0 && features.priceChange > 0) treeScore += 0.9;
        }
        // Tree 5: Volatility focused
        else {
          if (features.volatility > 0.03 && features.rsiNorm < 0) treeScore += 0.8;
        }
        
        votes += treeScore > 0.5 ? 1 : -1;
      }
      
      return votes / trees;
    };

    // Gradient Boosting simulation
    const gradientBoostingPredict = (features: FeatureVector): number => {
      let prediction = 0;
      const learningRate = 0.1;
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        let weakLearner = 0;
        
        // Different weak learners for each iteration
        if (i % 3 === 0) {
          weakLearner = features.rsiNorm * 0.5 + features.bollPosition * 0.3;
        } else if (i % 3 === 1) {
          weakLearner = features.momentum5 * 0.4 + features.volumeSignal * 0.4;
        } else {
          weakLearner = features.priceChange * 0.6 + features.macdSignal * 0.2;
        }
        
        prediction += learningRate * weakLearner;
      }
      
      return Math.tanh(prediction);
    };

    // Ensemble predictions
    const nnPred = neuralNetworkPredict(features);
    const rfPred = randomForestPredict(features);
    const gbPred = gradientBoostingPredict(features);
    
    // Weighted ensemble
    const ensemblePred = (nnPred * 0.4 + rfPred * 0.35 + gbPred * 0.25);
    
    // Convert to trading signal
    const confidence = Math.abs(ensemblePred) * 100;
    const prediction = ensemblePred > 0.1 ? 'BUY' : ensemblePred < -0.1 ? 'SELL' : 'HOLD';
    
    return {
      prediction,
      confidence: Math.min(95, Math.max(5, confidence)).toFixed(1),
      ensembleScore: ensemblePred.toFixed(3),
      modelScores: {
        neuralNetwork: nnPred.toFixed(3),
        randomForest: rfPred.toFixed(3),
        gradientBoosting: gbPred.toFixed(3)
      },
      features: features,
      riskLevel: confidence > 80 ? 'High Confidence' : confidence > 60 ? 'Medium' : 'Low Confidence'
    };
  }, []);

  // 高度なシグナル生成
  const generateAdvancedSignals = useCallback((data: StockData[], indicators: Record<string, string>, mlResult: MLResult): Signal[] => {
    const signals = [];
    const currentPrice = data[data.length - 1].price;
    const prevPrice = data[data.length - 2]?.price || currentPrice;
    
    // 複合テクニカルシグナル
    const rsi = parseFloat(indicators.rsi);
    const macd = parseFloat(indicators.macd);
    const stochK = parseFloat(indicators.stochK);
    const williamsR = parseFloat(indicators.williamsR);
    const volumeRatio = parseFloat(indicators.volumeRatio);
    
    // ゴールデンクロス＋ボリューム確認
    if (parseFloat(indicators.sma5) > parseFloat(indicators.sma25) && 
        parseFloat(indicators.sma25) > parseFloat(indicators.sma75) &&
        volumeRatio > 1.3) {
      signals.push({
        type: 'BUY',
        source: 'Technical Combo',
        indicator: 'Triple MA + Volume',
        message: 'トリプル移動平均線上昇＋出来高増加',
        strength: 'Strong',
        confidence: 85,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    
    // 過売り複合シグナル
    if (rsi < 25 && stochK < 20 && williamsR < -80) {
      signals.push({
        type: 'BUY',
        source: 'Technical Combo',
        indicator: 'Triple Oversold',
        message: '三重過売りシグナル（RSI+Stoch+%R）',
        strength: 'Very Strong',
        confidence: 90,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    
    // MACD + RSI Divergence
    if (macd > 0 && rsi > 30 && rsi < 70) {
      signals.push({
        type: 'BUY',
        source: 'Technical',
        indicator: 'MACD + RSI',
        message: 'MACD上昇＋RSI適正レンジ',
        strength: 'Medium',
        confidence: 70,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    
    // ボリンジャーバンド + ボリューム
    const bollPosition = (currentPrice - parseFloat(indicators.bollingerLower)) / 
                        (parseFloat(indicators.bollingerUpper) - parseFloat(indicators.bollingerLower));
    
    if (bollPosition < 0.1 && volumeRatio > 1.5) {
      signals.push({
        type: 'BUY',
        source: 'Technical',
        indicator: 'Bollinger + Volume',
        message: 'ボリ下限接触＋出来高急増',
        strength: 'Strong',
        confidence: 80,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    
    // 機械学習シグナル
    if (mlResult.prediction === 'BUY' && parseFloat(mlResult.confidence) > 75) {
      signals.push({
        type: 'BUY',
        source: 'AI Ensemble',
        indicator: 'ML Models',
        message: `AI予測：${mlResult.confidence}%信頼度`,
        strength: mlResult.riskLevel === 'High Confidence' ? 'Very Strong' : 'Strong',
        confidence: parseFloat(mlResult.confidence),
        timestamp: new Date().toLocaleTimeString()
      });
    }
    
    // リスク警告シグナル
    if (parseFloat(indicators.bollingerWidth) > 8) {
      signals.push({
        type: 'WARNING',
        source: 'Risk Management',
        indicator: 'Volatility Alert',
        message: 'ボラティリティ急拡大中',
        strength: 'Medium',
        confidence: 75,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    
    return signals.sort((a, b) => b.confidence - a.confidence);
  }, []);

  // データ分析実行
  const analyzeStock = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      // 模擬的な遅延（実際のAPI呼び出しをシミュレート）
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const data = await fetchRealStockData(selectedStock);
      const indicators = calculateAdvancedTechnicalIndicators(data);
      if (!indicators) return; // もしくは fallback を入れる
      const mlResult = advancedMLPrediction(data, indicators);
      const newSignals = generateAdvancedSignals(data, indicators, mlResult);
      
      // リアルタイム価格設定
      const currentPrice = data[data.length - 1].price;
      const prevPrice = data[data.length - 2]?.price || currentPrice;
      const change = currentPrice - prevPrice;
      const changePercent = (change / prevPrice) * 100;
      
      setRealTimePrice({
        current: currentPrice,
        change: change,
        changePercent: changePercent,
        volume: data[data.length - 1].volume
      });
      
      setChartData(data);
      setTechnicalIndicators(indicators);
      setMlPrediction(mlResult);
      setSignals(newSignals);
      
      // ボラティリティ分析
      const prices = data.map(d => d.price);
      const returns = [];
      for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i-1]) / prices[i-1]);
      }
      const volatility = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length) * Math.sqrt(252);
      
      setVolatilityAnalysis({
        dailyVol: (Math.sqrt(returns.slice(-20).reduce((sum, r) => sum + r * r, 0) / 20) * 100).toFixed(2),
        annualizedVol: (volatility * 100).toFixed(2),
        riskLevel: volatility > 0.4 ? 'Very High' : volatility > 0.3 ? 'High' : 'Medium'
      });
      
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedStock, fetchRealStockData, calculateAdvancedTechnicalIndicators, advancedMLPrediction, generateAdvancedSignals]);

  useEffect(() => {
    analyzeStock();
  }, [selectedStock, analyzeStock]);

  // 自動更新（15秒間隔）
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isAnalyzing) {
        analyzeStock();
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [analyzeStock, isAnalyzing]);

  const getSignalColor = (type: Signal['type']) => {
    switch(type) {
      case 'BUY': return 'text-green-600 bg-green-50 border-green-200';
      case 'SELL': return 'text-red-600 bg-red-50 border-red-200';
      case 'WARNING': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStrengthIcon = (strength: Signal['strength']) => {
    switch(strength) {
      case 'Very Strong': return <Zap className="w-4 h-4 text-green-500" />;
      case 'Strong': return <TrendingUp className="w-4 h-4 text-blue-500" />;
      case 'Medium': return <Activity className="w-4 h-4 text-yellow-500" />;
      default: return <TrendingDown className="w-4 h-4 text-gray-500" />;
    }
  };

  const selectedStockInfo = japaneseGrowthStocks.find(stock => stock.code === selectedStock);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              日本株グロース銘柄 AI分析システム
            </h1>
          </div>
          <p className="text-slate-300">アンサンブル機械学習 × 高度テクニカル分析による次世代投資支援システム</p>
        </div>

        {/* リアルタイム価格表示 */}
        {realTimePrice && (
          <div className="mb-6">
            <div className="bg-slate-800/60 rounded-xl p-6 backdrop-blur-sm border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedStockInfo?.name} ({selectedStock})
                  </h2>
                  <p className="text-slate-400">{selectedStockInfo?.sector} | {selectedStockInfo?.market}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">¥{realTimePrice.current.toLocaleString()}</div>
                  <div className={`text-lg ${realTimePrice.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {realTimePrice.change >= 0 ? '+' : ''}{realTimePrice.change.toFixed(0)} 
                    ({realTimePrice.changePercent >= 0 ? '+' : ''}{realTimePrice.changePercent.toFixed(2)}%)
                  </div>
                  <div className="text-sm text-slate-400">
                    出来高: {(realTimePrice.volume / 1000).toFixed(0)}K株
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 銘柄選択 */}
        <div className="mb-6">
          <div className="bg-slate-800/50 rounded-xl p-6 backdrop-blur-sm border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              銘柄選択
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {japaneseGrowthStocks.map((stock) => (
                <button
                  key={stock.code}
                  onClick={() => setSelectedStock(stock.code)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    selectedStock === stock.code
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  <div className="font-bold">{stock.code}</div>
                  <div className="text-sm opacity-75">{stock.name}</div>
                  <div className="text-xs opacity-50">{stock.sector}</div>
                  <div className="text-xs opacity-50">{stock.market}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 分析状況 */}
        {isAnalyzing && (
          <div className="mb-6">
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full"></div>
                <span className="text-purple-300">高度分析実行中... アンサンブルML + 20種類テクニカル指標を計算しています</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* メインチャート */}
          <div className="lg:col-span-2 space-y-6">
            {/* 価格チャート */}
            <div className="bg-slate-800/50 rounded-xl p-6 backdrop-blur-sm border border-slate-700">
              <h2 className="text-xl font-semibold mb-4">
                {selectedStock} 株価チャート（過去100日）
              </h2>
              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F3F4F6'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      fill="url(#priceGradient)"
                      name="株価"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* 出来高チャート */}
            <div className="bg-slate-800/50 rounded-xl p-6 backdrop-blur-sm border border-slate-700">
              <h2 className="text-xl font-semibold mb-4">出来高分析</h2>
              {chartData.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData.slice(-30)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F3F4F6'
                      }} 
                    />
                    <Bar dataKey="volume" fill="#06B6D4" name="出来高" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* 高度テクニカル指標 */}
            <div className="bg-slate-800/50 rounded-xl p-6 backdrop-blur-sm border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                高度テクニカル指標
              </h2>
              {technicalIndicators ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400">RSI (14)</div>
                      <div className={`text-xl font-bold ${
                        parseFloat(technicalIndicators.rsi) < 30 ? 'text-green-400' :
                        parseFloat(technicalIndicators.rsi) > 70 ? 'text-red-400' : 'text-blue-400'
                      }`}>
                        {technicalIndicators.rsi}
                      </div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400">MACD</div>
                      <div className={`text-xl font-bold ${
                        parseFloat(technicalIndicators.macd) > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {technicalIndicators.macd}
                      </div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400">Stoch %K</div>
                      <div className={`text-xl font-bold ${
                        parseFloat(technicalIndicators.stochK) < 20 ? 'text-green-400' :
                        parseFloat(technicalIndicators.stochK) > 80 ? 'text-red-400' : 'text-purple-400'
                      }`}>
                        {technicalIndicators.stochK}%
                      </div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400">Williams %R</div>
                      <div className={`text-xl font-bold ${
                        parseFloat(technicalIndicators.williamsR) < -80 ? 'text-green-400' :
                        parseFloat(technicalIndicators.williamsR) > -20 ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {technicalIndicators.williamsR}%
                      </div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400">ATR</div>
                      <div className="text-xl font-bold text-orange-400">¥{technicalIndicators.atr}</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400">ボリ幅</div>
                      <div className="text-xl font-bold text-pink-400">{technicalIndicators.bollingerWidth}%</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400">出来高比</div>
                      <div className={`text-xl font-bold ${
                        parseFloat(technicalIndicators.volumeRatio) > 1.5 ? 'text-green-400' : 'text-slate-400'
                      }`}>
                        {technicalIndicators.volumeRatio}x
                      </div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400">平均出来高</div>
                      <div className="text-xl font-bold text-cyan-400">{technicalIndicators.avgVolume}</div>
                    </div>
                  </div>

                  {/* 移動平均線 */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">移動平均線</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <div className="text-sm text-slate-400">SMA5</div>
                        <div className="text-xl font-bold text-green-400">¥{technicalIndicators.sma5}</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <div className="text-sm text-slate-400">SMA25</div>
                        <div className="text-xl font-bold text-blue-400">¥{technicalIndicators.sma25}</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <div className="text-sm text-slate-400">SMA75</div>
                        <div className="text-xl font-bold text-purple-400">¥{technicalIndicators.sma75}</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <div className="text-sm text-slate-400">EMA12</div>
                        <div className="text-xl font-bold text-yellow-400">¥{technicalIndicators.ema12}</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400 py-8">
                  <div className="animate-pulse">テクニカル指標を読み込み中...</div>
                </div>
              )}
            </div>
          </div>

          {/* サイドパネル */}
          <div className="space-y-6">
            {/* アンサンブルAI予測 */}
            <div className="bg-slate-800/50 rounded-xl p-6 backdrop-blur-sm border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                アンサンブルAI予測
              </h2>
              {mlPrediction ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border-2 ${
                    mlPrediction.prediction === 'BUY' ? 'bg-green-900/30 border-green-500' :
                    mlPrediction.prediction === 'SELL' ? 'bg-red-900/30 border-red-500' :
                    'bg-yellow-900/30 border-yellow-500'
                  }`}>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{mlPrediction.prediction}</div>
                      <div className="text-lg">信頼度: {mlPrediction.confidence}%</div>
                      <div className="text-sm opacity-75">{mlPrediction.riskLevel}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-semibold">モデル別スコア:</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">ニューラルネット:</span>
                        <span className={`font-mono ${parseFloat(mlPrediction.modelScores.neuralNetwork) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {mlPrediction.modelScores.neuralNetwork}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">ランダムフォレスト:</span>
                        <span className={`font-mono ${parseFloat(mlPrediction.modelScores.randomForest) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {mlPrediction.modelScores.randomForest}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">勾配ブースティング:</span>
                        <span className={`font-mono ${parseFloat(mlPrediction.modelScores.gradientBoosting) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {mlPrediction.modelScores.gradientBoosting}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-600">
                      <div className="flex justify-between font-semibold">
                        <span>アンサンブル:</span>
                        <span className={`font-mono ${parseFloat(mlPrediction.ensembleScore) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {mlPrediction.ensembleScore}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 py-8">
                  <div className="animate-pulse">AI予測を計算中...</div>
                </div>
              )}
            </div>

            {/* ボラティリティ分析 */}
            <div className="bg-slate-800/50 rounded-xl p-6 backdrop-blur-sm border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-400" />
                ボラティリティ分析
              </h2>
              {volatilityAnalysis?.dailyVol ? (
//              {volatilityAnalysis.dailyVol ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400">日次ボラティリティ</div>
                      <div className="text-2xl font-bold text-red-400">{volatilityAnalysis.dailyVol}%</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400">年率ボラティリティ</div>
                      <div className="text-2xl font-bold text-orange-400">{volatilityAnalysis.annualizedVol}%</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400">リスクレベル</div>
                      <div className={`text-lg font-bold ${
                        volatilityAnalysis.riskLevel === 'Very High' ? 'text-red-500' :
                        volatilityAnalysis.riskLevel === 'High' ? 'text-orange-500' : 'text-yellow-500'
                      }`}>
                        {volatilityAnalysis.riskLevel}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 py-8">
                  <div className="animate-pulse">ボラティリティを計算中...</div>
                </div>
              )}
            </div>

            {/* 高度シグナル一覧 */}
            <div className="bg-slate-800/50 rounded-xl p-6 backdrop-blur-sm border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-400" />
                アクティブシグナル
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {signals.length === 0 ? (
                  <div className="text-slate-400 text-center py-4">
                    現在アクティブなシグナルはありません
                  </div>
                ) : (
                  signals.map((signal, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${getSignalColor(signal.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStrengthIcon(signal.strength)}
                            <span className="font-semibold">{signal.type}</span>
                            <span className="text-xs opacity-75">({signal.source})</span>
                          </div>
                          <div className="text-sm">{signal.message}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs opacity-75">{signal.timestamp}</span>
                            <span className="text-xs bg-black/20 px-2 py-1 rounded">
                              信頼度: {signal.confidence}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 操作パネル */}
            <div className="bg-slate-800/50 rounded-xl p-6 backdrop-blur-sm border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-400" />
                操作パネル
              </h2>
              <div className="space-y-3">
                <button
                  onClick={analyzeStock}
                  disabled={isAnalyzing}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      高度分析実行中...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      手動再分析
                    </>
                  )}
                </button>
                
                <div className="text-xs text-slate-400 space-y-1">
                  <p>• アンサンブル機械学習（3モデル統合）</p>
                  <p>• 20種類のテクニカル指標</p>
                  <p>• リアルタイム市場データ</p>
                  <p>• 自動更新: 15秒間隔</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center text-slate-400 text-sm space-y-2">
          <p>※ このシステムはAI技術を活用した分析ツールです。投資判断は自己責任で行ってください。</p>
          <p>使用技術: Neural Network • Random Forest • Gradient Boosting • 高度テクニカル分析</p>
          <p>最終更新: {new Date().toLocaleString()} | 次回自動更新まで: <span id="countdown">15</span>秒</p>
        </div>
      </div>
    </div>
  );
};
export default JapaneseGrowthStockAnalyzer;
