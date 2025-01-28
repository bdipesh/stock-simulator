<template>
  <div class="stock-list">
    <div v-if="loading" class="loading">Loading stocks...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">
      <div v-for="stock in stocks" :key="stock.symbol" class="p-4 border rounded-lg shadow-sm">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-bold">{{ stock.symbol }}</h3>
          <button
            @click="toggleWatchlist(stock.symbol)"
            class="p-1 cursor-pointer rounded-full hover:bg-gray-100"
          >
            Watch
            <span v-if="isWatchlisted(stock.symbol)">⭐</span>
            <span v-else>☆</span>
          </button>
        </div>
        <div class="mt-2">
          <p class="text-2xl">${{ stock.currentPrice.toFixed(2) }}</p>
          <p :class="getPriceChangeClass(stock)">{{ calculatePriceChange(stock) }}%</p>
          <p class="text-gray-600">Vol: {{ formatVolume(stock.volume) }}</p>
        </div>
        <StockChart :historicalData="stock.historicalData" class="mt-4" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useStockStore } from '@/stores/stockStore'
import StockChart from './StockChart.vue'
import { storeToRefs } from 'pinia'
import { mockApi } from '@/services/mockApi'

import type { Stock } from '@/types'

const stockStore = useStockStore()
const { stocks, loading, error, watchlist } = storeToRefs(stockStore)

onMounted(() => {
  stockStore.fetchStocks()
  // Set up interval for price updates
  const interval = setInterval(() => {
    mockApi.startPriceUpdates()
    stockStore.fetchStocks()
  }, 10000)

  onUnmounted(() => {
    clearInterval(interval)
    mockApi.startPriceUpdates()
  })
})

const getPriceChangeClass = (stock: Stock) => {
  const change = ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100
  return change >= 0 ? 'text-green-600' : 'text-red-600'
}

const calculatePriceChange = (stock: Stock) => {
  const change = ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100
  return change.toFixed(2)
}

const formatVolume = (volume: number) => {
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(volume)
}

const isWatchlisted = (symbol: string) => watchlist.value.includes(symbol)
const toggleWatchlist = (symbol: string) => stockStore.toggleWatchlist(symbol)
</script>
