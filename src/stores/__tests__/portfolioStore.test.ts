import { setActivePinia, createPinia } from 'pinia'
import { usePortfolioStore } from '../portfolioStore'
import { useStockStore } from '../stockStore'
import { mockApi } from '@/services/mockApi'

import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the mockApi
vi.mock('@/services/mockApi', () => ({
  mockApi: {
    executeTrade: vi.fn((order) => {
      const mockPrice = 150 // Mock stock price
      return Promise.resolve({
        success: true,
        transaction: {
          symbol: order.symbol,
          quantity: order.quantity,
          price: mockPrice,
          type: order.type,
          timestamp: new Date().toISOString(),
          total: order.quantity * mockPrice,
        },
      })
    }),
    getStocks: vi.fn(() =>
      Promise.resolve([
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          currentPrice: 150,
          previousClose: 148,
          volume: 1000000,
          historicalData: [],
        },
      ]),
    ),
  },
}))

describe('Portfolio Store', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    // Initialize stock store with mock data
    const stockStore = useStockStore()
    await stockStore.fetchStocks()
  })

  describe('Initial State', () => {
    it('should initialize with correct starting values', () => {
      const store = usePortfolioStore()

      expect(store.portfolio.cash).toBe(10000)
      expect(store.portfolio.holdings).toHaveLength(0)
      expect(store.buyTransactions).toHaveLength(0)
      expect(store.sellTransactions).toHaveLength(0)
      expect(store.totalBuyValue).toBe(0)
      expect(store.totalSellValue).toBe(0)
    })
  })

  describe('Buy Transactions', () => {
    it('should correctly process a buy order and update all related state', async () => {
      const store = usePortfolioStore()

      await store.executeTrade({
        symbol: 'AAPL',
        quantity: 10,
        type: 'BUY',
      })

      // Check portfolio updates
      expect(store.portfolio.cash).toBe(8500) // 10000 - (150 * 10)
      expect(store.portfolio.holdings).toHaveLength(1)
      expect(store.portfolio.holdings[0]).toEqual({
        symbol: 'AAPL',
        quantity: 10,
        averagePrice: 150,
        type: 'Buy',
      })

      // Check transaction records
      expect(store.buyTransactions).toHaveLength(1)
      expect(store.buyTransactions[0]).toMatchObject({
        symbol: 'AAPL',
        quantity: 10,
        price: 150,
        type: 'BUY',
        total: 1500,
      })
      expect(store.totalBuyValue).toBe(1500)
    })

    it('should update average price correctly when buying more of existing holding', async () => {
      const store = usePortfolioStore()

      // First buy at 150
      await store.executeTrade({
        symbol: 'AAPL',
        quantity: 10,
        type: 'BUY',
      })

      // Second buy at 150
      await store.executeTrade({
        symbol: 'AAPL',
        quantity: 5,
        type: 'BUY',
      })

      expect(store.portfolio.holdings[0].averagePrice).toBe(150)
      expect(store.portfolio.holdings[0].quantity).toBe(15)
      expect(store.buyTransactions).toHaveLength(2)
      expect(store.totalBuyValue).toBe(2250) // (10 * 150) + (5 * 150)
    })
  })

  describe('Sell Transactions', () => {
    it('should correctly process a sell order and update all related state', async () => {
      const store = usePortfolioStore()

      // First buy some stock
      await store.executeTrade({
        symbol: 'AAPL',
        quantity: 10,
        type: 'BUY',
      })

      // Then sell some
      await store.executeTrade({
        symbol: 'AAPL',
        quantity: 5,
        type: 'SELL',
      })

      // Check portfolio updates
      expect(store.portfolio.holdings[0].quantity).toBe(5)
      expect(store.portfolio.cash).toBe(9250) // 8500 + (150 * 5)

      // Check transaction records
      expect(store.sellTransactions).toHaveLength(1)
      expect(store.sellTransactions[0]).toMatchObject({
        symbol: 'AAPL',
        quantity: 5,
        price: 150,
        type: 'SELL',
        total: 750,
      })
      expect(store.totalSellValue).toBe(750)
    })

    it('should remove holding completely when selling all shares', async () => {
      const store = usePortfolioStore()

      // Buy stock
      await store.executeTrade({
        symbol: 'AAPL',
        quantity: 10,
        type: 'BUY',
      })

      // Sell all
      await store.executeTrade({
        symbol: 'AAPL',
        quantity: 10,
        type: 'SELL',
      })

      expect(store.portfolio.holdings).toHaveLength(0)
      expect(store.portfolio.cash).toBe(10000)
      expect(store.sellTransactions).toHaveLength(1)
      expect(store.totalSellValue).toBe(1500)
    })
  })

  describe('Computed Values', () => {
    it('should calculate total value correctly', async () => {
      const store = usePortfolioStore()
      const stockStore = useStockStore()

      // Update mock stocks with new price
      vi.mocked(mockApi.getStocks).mockResolvedValueOnce([
        {
          symbol: 'AAPL',
          name: 'Apple Inc.',
          currentPrice: 160, // Mock a price increase
          previousClose: 150,
          volume: 1000000,
          historicalData: [],
        },
      ])
      await stockStore.fetchStocks()

      // Buy some stock
      await store.executeTrade({
        symbol: 'AAPL',
        quantity: 10,
        type: 'BUY',
      })

      // Total value should be current price * quantity
      expect(store.totalValue).toBe(1600) // 160 * 10
    })

    it('should track transaction totals correctly', async () => {
      const store = usePortfolioStore()

      // Execute multiple trades
      await store.executeTrade({
        symbol: 'AAPL',
        quantity: 10,
        type: 'BUY',
      })

      await store.executeTrade({
        symbol: 'AAPL',
        quantity: 5,
        type: 'SELL',
      })

      await store.executeTrade({
        symbol: 'AAPL',
        quantity: 2,
        type: 'BUY',
      })

      expect(store.totalBuyValue).toBe(1800) // (10 * 150) + (2 * 150)
      expect(store.totalSellValue).toBe(750) // (5 * 150)
    })
  })
})
