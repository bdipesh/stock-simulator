import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Portfolio, TradeOrder, Holding, Transaction } from '@/types'
import { mockApi } from '@/services/mockApi'
import { useStockStore } from './stockStore'

export const usePortfolioStore = defineStore('portfolio', () => {
  const portfolio = ref<Portfolio>({
    cash: 10000,
    holdings: [],
  })

  // Add separate lists for buy and sell transactions
  const buyTransactions = ref<Transaction[]>([])
  const sellTransactions = ref<Transaction[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const stockStore = useStockStore()

  const totalValue = computed(() => {
    return portfolio.value.holdings.reduce((total, holding) => {
      const stock = stockStore.getStockBySymbol(holding.symbol)
      return total + (stock?.currentPrice ?? 0) * holding.quantity
    }, 0)
  })

  // Add computed properties for transaction summaries
  const totalBuyValue = computed(() => {
    return buyTransactions.value.reduce((total, trans) => {
      return total + trans.price * trans.quantity
    }, 0)
  })

  const totalSellValue = computed(() => {
    return sellTransactions.value.reduce((total, trans) => {
      return total + trans.price * trans.quantity
    }, 0)
  })

  async function executeTrade(order: TradeOrder) {
    try {
      loading.value = true
      const response = await mockApi.executeTrade(order)

      if (response.success && response.transaction) {
        const { symbol, quantity, price, type } = response.transaction
        const totalCost = quantity * price

        // Record the transaction
        const transaction: Transaction = {
          symbol,
          quantity,
          price,
          type,
          timestamp: new Date().toISOString(),
          total: totalCost,
        }

        if (type === 'BUY') {
          portfolio.value.cash -= totalCost
          buyTransactions.value.push(transaction)
          updateHoldings(symbol, quantity, price, true)
        } else {
          portfolio.value.cash += totalCost
          sellTransactions.value.push(transaction)
          updateHoldings(symbol, quantity, price, false)
        }
      }
      return response
    } catch (err) {
      console.log(err)
      error.value = 'Trade execution failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  function updateHoldings(symbol: string, quantity: number, price: number, isBuy: boolean) {
    const holdingIndex = portfolio.value.holdings.findIndex((h) => h.symbol === symbol)

    if (isBuy) {
      if (holdingIndex === -1) {
        portfolio.value.holdings.push({
          symbol,
          quantity,
          averagePrice: price,
          type: 'Buy',
        })
      } else {
        const holding = portfolio.value.holdings[holdingIndex]
        const totalShares = holding.quantity + quantity
        const totalCost = holding.quantity * holding.averagePrice + quantity * price
        holding.averagePrice = totalCost / totalShares
        holding.quantity = totalShares
        portfolio.value.cash =
          portfolio.value.cash - (isBuy ? totalCost : 0) + (isBuy ? 0 : totalCost)
      }
    } else {
      if (holdingIndex === -1) {
        throw new Error('Trade execution failed')
      }
      const holding = portfolio.value.holdings[holdingIndex]
      holding.quantity -= quantity
      if (holding.quantity === 0) {
        portfolio.value.holdings.splice(holdingIndex, 1)
      }
    }
  }

  return {
    portfolio,
    loading,
    error,
    totalValue,
    buyTransactions,
    sellTransactions,
    totalBuyValue,
    totalSellValue,
    executeTrade,
  }
})
