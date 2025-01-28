<template>
  <div class="trade-form bg-white shadow-sm p-4 rounded-sm">
    <form @submit.prevent="executeTrade" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Stock</label>
        <select
          v-model="order.symbol"
          required
          class="mt-1 block w-full border rounded-md px-3 py-2 border-gray-300"
        >
          <option v-for="stock in stocks" :key="stock.symbol" :value="stock.symbol">
            {{ stock.symbol }} - ${{ stock?.currentPrice?.toFixed(2) }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Type</label>
        <select
          v-model="order.type"
          required
          class="mt-1 pa-3 block w-full border-gray-300 border rounded-md px-3 py-2"
        >
          <option class="py-3" value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Quantity</label>
        <input
          type="number"
          v-model.number="order.quantity"
          required
          min="1"
          class="mt-1 block w-full border-gray-300 border rounded-md px-3 py-2"
        />
      </div>

      <div v-if="selectedStock" class="text-sm text-gray-600">
        <p>Total Cost: ${{ totalCost.toFixed(2) }}</p>
        <p v-if="order.type === 'BUY'">
          Remaining Cash: ${{ (portfolio.cash - totalCost).toFixed(2) }}
        </p>
      </div>

      <div v-if="error" class="text-red-600 text-sm">{{ error }}</div>

      <button
        type="submit"
        :disabled="loading || !isValid"
        class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Processing...' : order.type === 'BUY' ? 'Buy' : 'Sell' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStockStore } from '@/stores/stockStore'
import { usePortfolioStore } from '@/stores/portfolioStore'
import type { TradeOrder } from '@/types'
import { storeToRefs } from 'pinia'

const stockStore = useStockStore()
const portfolioStore = usePortfolioStore()
const { stocks } = storeToRefs(stockStore)
const { portfolio, loading } = storeToRefs(portfolioStore)

const error = ref<string | null>(null)
const order = ref<TradeOrder>({
  symbol: '',
  quantity: 1,
  type: 'BUY',
})

const selectedStock = computed(() => {
  return stockStore.getStockBySymbol(order.value.symbol)
})

const totalCost = computed(() => {
  if (!selectedStock.value) return 0
  return selectedStock.value.currentPrice * order.value.quantity
})

const isValid = computed(() => {
  if (!selectedStock.value || order.value.quantity <= 0) return false

  if (order.value.type === 'BUY') {
    return totalCost.value <= portfolio.value.cash
  } else {
    const holding = portfolio.value.holdings.find((h) => h.symbol === order.value.symbol)
    return holding && holding.quantity >= order.value.quantity
  }
})

const executeTrade = async () => {
  if (!isValid.value) return

  try {
    error.value = null
    const response = await portfolioStore.executeTrade(order.value)
    if (response.success) {
      order.value.quantity = 1
    }
  } catch (err) {
    console.log('errr', err)
    error.value = err instanceof Error ? err.message : 'Trade execution failed'
  }
}
</script>
