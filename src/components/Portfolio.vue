<template>
  <div class="portfolio">
    <div class="p-4 bg-white rounded-lg shadow-sm">
      <h2 class="text-xl font-bold mb-4">Portfolio Summary</h2>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="p-3 bg-gray-50 rounded">
          <p class="text-gray-600">Cash Balance</p>
          <p class="text-2xl">${{ portfolio.cash.toFixed(2) }}</p>
        </div>
        <div class="p-3 bg-gray-50 rounded">
          <p class="text-gray-600">Holding value</p>
          <p class="text-2xl">${{ totalValue.toFixed(2) }}</p>
        </div>
        <div class="p-3 bg-gray-50 rounded">
          <p class="text-gray-600">Total Receivable</p>
          <p class="text-2xl">${{ (totalValue + portfolio.cash).toFixed(2) }}</p>
        </div>
        <div v-if="totalBuyValue && totalSellValue" class="p-3 bg-gray-50 rounded">
          <p :class="totalSellValue > totalBuyValue ? 'text-green-600' : 'text-red-600'">
            {{ totalSellValue > totalBuyValue ? 'Net Profit' : 'Net Loss' }}
          </p>
          <p class="text-2xl">${{ (totalSellValue - totalBuyValue).toFixed(2) }}</p>
        </div>
      </div>

      <h3 class="font-bold mb-2">Holdings</h3>
      <div v-if="portfolio.holdings.length === 0" class="text-gray-500">No stocks in portfolio</div>
      <div v-else class="space-y-2">
        <div v-for="holding in portfolio.holdings" :key="holding.symbol" class="p-3 border rounded">
          <div class="flex justify-between items-center">
            <div>
              <p class="font-bold">{{ holding.symbol }}</p>
              <p class="text-sm text-gray-600">
                {{ holding.quantity }} shares @ ${{ holding.averagePrice.toFixed(2) }}
              </p>
            </div>
            <div class="text-right">
              <p class="font-bold">${{ getCurrentValue(holding).toFixed(2) }}</p>
              <p :class="getProfitLossClass(holding)">{{ getProfitLoss(holding).toFixed(2) }}%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Transaction History Section -->
      <div class="mt-8">
        <h3 class="font-bold mb-4">Transaction History</h3>

        <!-- Buy Transactions -->
        <div class="mb-6">
          <h4 class="text-lg font-semibold text-green-600 mb-2">Buy Transactions</h4>
          <div v-if="buyTransactions?.length === 0" class="text-gray-500">No buy transactions</div>
          <div v-else class="space-y-2">
            <div
              v-for="transaction in buyTransactions"
              :key="transaction.timestamp"
              class="p-3 border border-green-200 rounded bg-green-50"
            >
              <div class="flex justify-between items-center">
                <div>
                  <p class="font-bold">{{ transaction.symbol }}</p>
                  <p class="text-sm text-gray-600">
                    {{ transaction.quantity }} shares @ ${{ transaction.price.toFixed(2) }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-bold">${{ transaction.total.toFixed(2) }}</p>
                  <p class="text-sm text-gray-600">{{ formatDate(transaction.timestamp) }}</p>
                </div>
              </div>
            </div>
          </div>
          <p class="mt-2 text-right font-bold">Total Buy Value: ${{ totalBuyValue.toFixed(2) }}</p>
        </div>

        <!-- Sell Transactions -->
        <div>
          <h4 class="text-lg font-semibold text-red-600 mb-2">Sell Transactions</h4>
          <div v-if="sellTransactions.length === 0" class="text-gray-500">No sell transactions</div>
          <div v-else class="space-y-2">
            <div
              v-for="transaction in sellTransactions"
              :key="transaction.timestamp"
              class="p-3 border border-red-200 rounded bg-red-50"
            >
              <div class="flex justify-between items-center">
                <div>
                  <p class="font-bold">{{ transaction.symbol }}</p>
                  <p class="text-sm text-gray-600">
                    {{ transaction.quantity }} shares @ ${{ transaction.price.toFixed(2) }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-bold">${{ transaction.total.toFixed(2) }}</p>
                  <p class="text-sm text-gray-600">{{ formatDate(transaction.timestamp) }}</p>
                </div>
              </div>
            </div>
          </div>
          <p class="mt-2 text-right font-bold">
            Total Sell Value: ${{ totalSellValue.toFixed(2) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePortfolioStore } from '@/stores/portfolioStore'
import { useStockStore } from '@/stores/stockStore'
import { storeToRefs } from 'pinia'
import type { Holding } from '@/types'

const portfolioStore = usePortfolioStore()
const stockStore = useStockStore()
const { portfolio, totalValue, buyTransactions, sellTransactions, totalBuyValue, totalSellValue } =
  storeToRefs(portfolioStore)

const getCurrentValue = (holding: Holding) => {
  const stock = stockStore.getStockBySymbol(holding.symbol)
  return (stock?.currentPrice ?? 0) * holding.quantity
}

const getProfitLoss = (holding: Holding) => {
  const stock = stockStore.getStockBySymbol(holding.symbol)
  if (!stock) return 0
  return ((stock.currentPrice - holding.averagePrice) / holding.averagePrice) * 100
}

const getProfitLossClass = (holding: Holding) => {
  const profitLoss = getProfitLoss(holding)
  return profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
}

const formatDate = (timestamp: string) => {
  return new Date(timestamp).toLocaleDateString()
}
</script>
