<template>
  <div class="watchlist shadow-sm p-4">
    <h2 class="text-xl font-bold mb-4">Watchlist</h2>
    <div v-if="watchlistStocks.length === 0" class="text-gray-500">No stocks in watchlist</div>
    <div v-else class="space-y-2">
      <div
        v-for="stock in watchlistStocks"
        :key="stock.symbol"
        :class="`border border-${getPriceChangeClass(stock)}`"
        class="p-3 rounded flex justify-between items-center"
      >
        <div>
          <p class="font-bold">{{ stock.symbol }}</p>
          <p class="text-xl">${{ stock.currentPrice.toFixed(2) }}</p>
        </div>
        <div class="text-right">
          <p :class="'text-' + getPriceChangeClass(stock)">{{ calculatePriceChange(stock) }}%</p>
          <button
            @click="stockStore.toggleWatchlist(stock.symbol)"
            class="text-sm cursor-pointer text-gray-500 hover:text-gray-700"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStockStore } from '@/stores/stockStore'
import type { Stock } from '@/types'
import { storeToRefs } from 'pinia'

const stockStore = useStockStore()
const { stocks, watchlist } = storeToRefs(stockStore)

const watchlistStocks = computed(() => {
  return stocks.value.filter((stock) => watchlist.value.includes(stock.symbol))
})

const getPriceChangeClass = (stock: Stock) => {
  const change = ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100
  return change >= 0 ? 'green-600' : 'red-600'
}

const calculatePriceChange = (stock: Stock) => {
  const change = ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100
  return change.toFixed(2)
}
</script>
