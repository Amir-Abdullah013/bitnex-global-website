'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTradingPair } from '../lib/trading-pair-context';
import { usePrice, useChartData } from '../hooks/useWebSocket';
import Card, { CardContent, CardHeader, CardTitle } from './Card';
import Button from './Button';
import { createChart } from 'lightweight-charts';

// TradingView Charting Library integration
const AdvancedChart = ({ 
  className = '',
  height = 500,
  showIndicators = true,
  showVolume = true,
  showTimeframes = true,
  showIndicatorsPanel = true
}) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const { selectedPair, getPairAssets } = useTradingPair();
  const { baseAsset } = getPairAssets();
  
  // State declarations first
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [selectedIndicators, setSelectedIndicators] = useState(['EMA', 'RSI']);
  const [chartData, setChartData] = useState([]);
  const [isChartReady, setIsChartReady] = useState(false);
  const [candlestickSeries, setCandlestickSeries] = useState(null);
  const [volumeSeries, setVolumeSeries] = useState(null);
  
  // Hook calls after state declarations
  const { priceData, isConnected } = usePrice(baseAsset);
  const { chartData: wsChartData, isConnected: wsConnected } = useChartData(baseAsset, selectedTimeframe);

  // Timeframe options
  const timeframes = [
    { label: '1m', value: '1m', interval: '1m' },
    { label: '5m', value: '5m', interval: '5m' },
    { label: '15m', value: '15m', interval: '15m' },
    { label: '1h', value: '1h', interval: '1h' },
    { label: '4h', value: '4h', interval: '4h' },
    { label: '1d', value: '1d', interval: '1d' },
    { label: '1w', value: '1w', interval: '1w' }
  ];

  // Available indicators
  const availableIndicators = [
    { id: 'EMA', name: 'Exponential Moving Average', periods: [9, 21, 50] },
    { id: 'SMA', name: 'Simple Moving Average', periods: [20, 50, 200] },
    { id: 'RSI', name: 'Relative Strength Index', periods: [14] },
    { id: 'MACD', name: 'MACD', periods: [12, 26, 9] },
    { id: 'BB', name: 'Bollinger Bands', periods: [20, 2] },
    { id: 'STOCH', name: 'Stochastic', periods: [14, 3, 3] }
  ];

  // Fetch chart data
  const fetchChartData = useCallback(async (timeframe = selectedTimeframe) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/chart-data?symbol=${baseAsset}&timeframe=${timeframe}&limit=500`);
      const data = await response.json();
      
      if (data.success) {
        setChartData(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch chart data');
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [baseAsset, selectedTimeframe]);

  // Initialize TradingView chart
  const initializeChart = useCallback(async () => {
    if (!chartContainerRef.current || isChartReady) return;

    try {
      if (!createChart) {
        throw new Error('createChart is not available');
      }
      
      if (chartRef.current) {
        chartRef.current.remove();
      }

      // Ensure container has proper dimensions
      const containerWidth = chartContainerRef.current.clientWidth || 800;
      const containerHeight = height || 500;
      
      // Create chart
      const chart = createChart(chartContainerRef.current, {
        width: containerWidth,
        height: containerHeight,
        layout: {
          background: { color: '#1E2329' },
          textColor: '#D1D4DC',
        },
        grid: {
          vertLines: { color: '#2B3139' },
          horzLines: { color: '#2B3139' },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: '#2B3139',
        },
        timeScale: {
          borderColor: '#2B3139',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      // Create candlestick series
      if (!chart.addCandlestickSeries) {
        throw new Error('addCandlestickSeries method not available on chart object');
      }
      
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#0ECB81',
        downColor: '#F6465D',
        borderDownColor: '#F6465D',
        borderUpColor: '#0ECB81',
        wickDownColor: '#F6465D',
        wickUpColor: '#0ECB81',
      });

      // Store series reference
      setCandlestickSeries(candlestickSeries);

      // Create volume series
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      });

      // Store volume series reference
      setVolumeSeries(volumeSeries);

      // Set up volume price scale
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      // Add data to series
      if (chartData.length > 0) {
        candlestickSeries.setData(chartData);
        
        if (showVolume) {
          const volumeData = chartData.map(d => ({
            time: d.time,
            value: d.volume,
            color: d.close >= d.open ? '#0ECB81' : '#F6465D'
          }));
          volumeSeries.setData(volumeData);
        }
      }

      // Add indicators
      if (showIndicators && selectedIndicators.length > 0) {
        await addIndicators(chart);
      }

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      chartRef.current = chart;
      setIsChartReady(true);

      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chart) {
          chart.remove();
        }
      };
    } catch (err) {
      console.error('Error initializing chart:', err);
      console.error('Chart error details:', err.message);
      setError(`Failed to initialize chart: ${err.message}`);
      
      // Try to provide more helpful error message
      if (err.message.includes('addCandlestickSeries')) {
        setError('Chart library compatibility issue. Please check lightweight-charts installation.');
      }
    }
  }, [chartData, height, showIndicators, selectedIndicators, showVolume]);

  // Add indicators to chart
  const addIndicators = async (chart) => {
    try {
      // Add EMA
      if (selectedIndicators.includes('EMA')) {
        const ema9 = chart.addLineSeries({
          color: '#FF6B6B',
          lineWidth: 1,
          title: 'EMA 9',
        });
        const ema21 = chart.addLineSeries({
          color: '#4ECDC4',
          lineWidth: 1,
          title: 'EMA 21',
        });
        const ema50 = chart.addLineSeries({
          color: '#45B7D1',
          lineWidth: 1,
          title: 'EMA 50',
        });

        // Calculate and set EMA data
        const emaData = calculateEMA(chartData, [9, 21, 50]);
        ema9.setData(emaData.ema9);
        ema21.setData(emaData.ema21);
        ema50.setData(emaData.ema50);
      }

      // Add RSI
      if (selectedIndicators.includes('RSI')) {
        const rsiData = calculateRSI(chartData, 14);
        const rsiSeries = chart.addLineSeries({
          color: '#FFA726',
          lineWidth: 1,
          title: 'RSI',
        });
        rsiSeries.setData(rsiData);
      }

      // Add MACD
      if (selectedIndicators.includes('MACD')) {
        const macdData = calculateMACD(chartData, 12, 26, 9);
        const macdLine = chart.addLineSeries({
          color: '#9C27B0',
          lineWidth: 1,
          title: 'MACD',
        });
        const signalLine = chart.addLineSeries({
          color: '#FF9800',
          lineWidth: 1,
          title: 'Signal',
        });
        
        macdLine.setData(macdData.macd);
        signalLine.setData(macdData.signal);
      }
    } catch (err) {
      console.error('Error adding indicators:', err);
    }
  };

  // Calculate EMA
  const calculateEMA = (data, periods) => {
    const ema9 = [];
    const ema21 = [];
    const ema50 = [];

    data.forEach((item, index) => {
      if (index >= periods[0] - 1) {
        ema9.push({
          time: item.time,
          value: calculateEMASingle(data.slice(0, index + 1), periods[0])
        });
      }
      if (index >= periods[1] - 1) {
        ema21.push({
          time: item.time,
          value: calculateEMASingle(data.slice(0, index + 1), periods[1])
        });
      }
      if (index >= periods[2] - 1) {
        ema50.push({
          time: item.time,
          value: calculateEMASingle(data.slice(0, index + 1), periods[2])
        });
      }
    });

    return { ema9, ema21, ema50 };
  };

  // Calculate single EMA
  const calculateEMASingle = (data, period) => {
    if (data.length < period) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = data[0].close;
    
    for (let i = 1; i < data.length; i++) {
      ema = (data[i].close * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  };

  // Calculate RSI
  const calculateRSI = (data, period = 14) => {
    const rsiData = [];
    
    for (let i = period; i < data.length; i++) {
      const slice = data.slice(i - period, i);
      let gains = 0;
      let losses = 0;
      
      for (let j = 1; j < slice.length; j++) {
        const change = slice[j].close - slice[j - 1].close;
        if (change > 0) gains += change;
        else losses -= change;
      }
      
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      
      rsiData.push({
        time: data[i].time,
        value: rsi
      });
    }
    
    return rsiData;
  };

  // Calculate MACD
  const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    const macdData = [];
    const signalData = [];
    
    // Calculate EMAs
    const fastEMA = [];
    const slowEMA = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i >= fastPeriod - 1) {
        fastEMA.push(calculateEMASingle(data.slice(0, i + 1), fastPeriod));
      }
      if (i >= slowPeriod - 1) {
        slowEMA.push(calculateEMASingle(data.slice(0, i + 1), slowPeriod));
      }
    }
    
    // Calculate MACD line
    const macdLine = [];
    for (let i = 0; i < Math.min(fastEMA.length, slowEMA.length); i++) {
      const macd = fastEMA[i] - slowEMA[i];
      macdLine.push({
        time: data[i + slowPeriod - 1].time,
        value: macd
      });
    }
    
    // Calculate signal line (EMA of MACD)
    if (macdLine.length >= signalPeriod) {
      const signalValues = macdLine.map(d => d.value);
      for (let i = signalPeriod - 1; i < signalValues.length; i++) {
        const signal = calculateEMASingle(
          signalValues.slice(0, i + 1).map(v => ({ close: v })), 
          signalPeriod
        );
        signalData.push({
          time: macdLine[i].time,
          value: signal
        });
      }
    }
    
    return {
      macd: macdLine,
      signal: signalData
    };
  };

  // Handle timeframe change
  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);
    fetchChartData(timeframe);
  };

  // Handle indicator toggle
  const handleIndicatorToggle = (indicator) => {
    setSelectedIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  // Update chart with new data from WebSocket
  useEffect(() => {
    if (wsChartData && wsChartData.length > 0) {
      setChartData(wsChartData);
    }
  }, [wsChartData]);

  // Update chart with new data
  useEffect(() => {
    if (isChartReady && candlestickSeries && chartData.length > 0) {
      try {
        candlestickSeries.setData(chartData);
        
        // Update volume data if available
        if (volumeSeries && showVolume) {
          const volumeData = chartData.map(d => ({
            time: d.time,
            value: d.volume,
            color: d.close >= d.open ? '#0ECB81' : '#F6465D'
          }));
          volumeSeries.setData(volumeData);
        }
      } catch (error) {
        console.error('Error updating chart data:', error);
      }
    }
  }, [chartData, isChartReady, candlestickSeries, volumeSeries, showVolume]);

  // Initialize chart when data is ready
  useEffect(() => {
    if (chartData.length > 0 && !isChartReady) {
      initializeChart();
    }
  }, [chartData, initializeChart, isChartReady]);

  // Fetch data on mount and pair change
  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Update chart when indicators change
  useEffect(() => {
    if (isChartReady) {
      // Reset series references
      setCandlestickSeries(null);
      setVolumeSeries(null);
      setIsChartReady(false);
      initializeChart();
    }
  }, [selectedIndicators, initializeChart, isChartReady]);

  if (error) {
    return (
      <Card className={className}>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-red-500">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">Chart Error</p>
              <p className="text-sm">{error}</p>
              <Button 
                onClick={() => fetchChartData()} 
                className="mt-4"
                size="sm"
              >
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-binance-textPrimary">
            Advanced Chart - {selectedPair}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {showTimeframes && (
              <div className="flex space-x-1">
                {timeframes.map((tf) => (
                  <Button
                    key={tf.value}
                    size="sm"
                    variant={selectedTimeframe === tf.value ? 'primary' : 'outline'}
                    onClick={() => handleTimeframeChange(tf.value)}
                    className="text-xs px-2 py-1"
                  >
                    {tf.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-binance-primary mx-auto mb-4"></div>
              <p className="text-binance-textSecondary">Loading chart data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart Container */}
            <div 
              ref={chartContainerRef} 
              className="w-full border border-binance-border rounded-lg"
              style={{ height: `${height}px` }}
            />
            
            {/* Indicators Panel */}
            {showIndicatorsPanel && (
              <div className="border-t border-binance-border pt-4">
                <h4 className="text-sm font-medium text-binance-textPrimary mb-3">Indicators</h4>
                <div className="flex flex-wrap gap-2">
                  {availableIndicators.map((indicator) => (
                    <Button
                      key={indicator.id}
                      size="sm"
                      variant={selectedIndicators.includes(indicator.id) ? 'primary' : 'outline'}
                      onClick={() => handleIndicatorToggle(indicator.id)}
                      className="text-xs"
                    >
                      {indicator.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Chart Info */}
            <div className="flex items-center justify-between text-xs text-binance-textTertiary">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-binance-green rounded-full mr-2"></div>
                  <span>Bullish</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-binance-red rounded-full mr-2"></div>
                  <span>Bearish</span>
                </div>
                {(isConnected || wsConnected) && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span>Live Data</span>
                  </div>
                )}
              </div>
              <div>
                {chartData.length} candles • {selectedTimeframe}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedChart;
