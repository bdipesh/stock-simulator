import type { Stock, TradeOrder, TradeResponse } from '@/types'
import axios from 'axios'
import { ref } from 'vue'
import MockAdapter from 'axios-mock-adapter'

const mock = new MockAdapter(axios)

// Market sentiment simulation
const marketSentiment = ref({
  trend: 0, // Range from -1 (bearish) to 1 (bullish)
  volatility: 0.5, // Range from 0 to 1
})

// Update market sentiment periodically
const updateMarketSentiment = () => {
  // Gradually shift market sentiment
  marketSentiment.value.trend += (Math.random() - 0.5) * 0.2
  marketSentiment.value.trend = Math.max(-1, Math.min(1, marketSentiment.value.trend))

  // Adjust volatility
  marketSentiment.value.volatility += (Math.random() - 0.5) * 0.1
  marketSentiment.value.volatility = Math.max(0.1, Math.min(1, marketSentiment.value.volatility))
}

// Stock-specific factors
const stockFactors = ref(
  new Map([
    ['AAPL', { beta: 1.2, momentum: 0 }],
    ['GOOL', { beta: 1.1, momentum: 0 }],
    ['TELL', { beta: 2.0, momentum: 0 }],
  ]),
)

const mockStocks = ref<Stock[]>([
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 150,
    previousClose: 148,
    volume: 1000000,
    historicalData: Array(7)
      .fill(null)
      .map((_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        price: 150 + Math.random() * 10 - 5,
      })),
  },
  {
    symbol: 'GOOL',
    name: 'Google Inc.',
    currentPrice: 100,
    previousClose: 123,
    volume: 1000,
    historicalData: Array(7)
      .fill(null)
      .map((_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        price: 100 + Math.random() * 10 - 5,
      })),
  },
  {
    symbol: 'TELL',
    name: 'Tesla Inc.',
    currentPrice: 230,
    previousClose: 231,
    volume: 10000,
    historicalData: Array(7)
      .fill(null)
      .map((_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        price: 230 + Math.random() * 10 - 5,
      })),
  },
])

const calculatePriceChange = (stock: Stock) => {
  const factors = stockFactors.value.get(stock.symbol)
  if (!factors) return 0

  // Base market movement influenced by sentiment
  const marketMove = marketSentiment.value.trend * marketSentiment.value.volatility * 2

  // Stock-specific movement based on beta
  const stockMove = marketMove * factors.beta

  // Momentum factor (tends to continue recent price direction)
  const momentumEffect = factors.momentum * 0.3

  // Random noise component
  const noise = (Math.random() - 0.5) * marketSentiment.value.volatility * 4

  // Combine all factors
  const totalMove = stockMove + momentumEffect + noise

  // Update momentum for next time
  factors.momentum = factors.momentum * 0.8 + totalMove * 0.2
  stockFactors.value.set(stock.symbol, factors)

  // Convert to actual price change (maximum ±20)
  return Math.max(-20, Math.min(20, totalMove * stock.currentPrice * 0.02))
}

const updateVolume = (stock: Stock) => {
  const volumeChange = Math.random() * 0.4 - 0.2 // ±20% change
  return Math.max(1000, stock.volume * (1 + volumeChange))
}

const updateStockPrices = () => {
  // Update market conditions first
  updateMarketSentiment()

  mockStocks.value = mockStocks.value.map((stock) => {
    const priceChange = calculatePriceChange(stock)
    const newPrice = Math.max(0.01, stock.currentPrice + priceChange)
    const newVolume = updateVolume(stock)

    // Update historical data
    const newHistoricalData = [...stock.historicalData]
    newHistoricalData.pop()
    newHistoricalData.unshift({
      date: new Date().toISOString(),
      price: newPrice,
    })

    return {
      ...stock,
      previousClose: stock.currentPrice,
      currentPrice: newPrice,
      volume: newVolume,
      historicalData: newHistoricalData,
    }
  })
}

let priceUpdateInterval: number | null = null

const startPriceUpdates = () => {
  updateStockPrices()
  priceUpdateInterval = window.setInterval(updateStockPrices, 10000)
}

const stopPriceUpdates = () => {
  if (priceUpdateInterval !== null) {
    clearInterval(priceUpdateInterval)
    priceUpdateInterval = null
  }
}

mock.onGet('/api/stocks').reply(() => [200, mockStocks.value])

mock.onPost('/api/trade').reply((config) => {
  const order: TradeOrder = JSON.parse(config.data)
  const stock = mockStocks.value.find((s) => s.symbol === order.symbol)

  if (!stock) {
    return [400, { success: false, message: 'Stock not found' }]
  }

  const response: TradeResponse = {
    success: true,
    message: 'Trade executed successfully',
    transaction: {
      symbol: order.symbol,
      quantity: order.quantity,
      price: stock.currentPrice,
      type: order.type,
      timestamp: new Date().toISOString(),
    },
  }

  return [200, response]
})

export const mockApi = {
  getStocks: () => axios.get('/api/stocks').then((response) => response.data),
  executeTrade: (order: TradeOrder) =>
    axios.post('/api/trade', order).then((response) => response.data),
  startPriceUpdates,
  stopPriceUpdates,
}
