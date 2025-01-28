import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Stock } from '@/types'
import { mockApi } from '@/services/mockApi'

export const useStockStore = defineStore('stock', () => {
  const stocks = ref<Stock[]>([])
  const watchlist = ref<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getStockBySymbol = computed(() => {
    return (symbol: string) => stocks.value.find((s) => s.symbol === symbol)
  })

  async function fetchStocks() {
    try {
      loading.value = true
      const response = await mockApi.getStocks()
      stocks.value = response
    } catch (err) {
      error.value = 'Failed to fetch stocks'
    } finally {
      loading.value = false
    }
  }

  function toggleWatchlist(symbol: string) {
    const index = watchlist.value.indexOf(symbol)
    if (index === -1) {
      watchlist.value.push(symbol)
    } else {
      watchlist.value.splice(index, 1)
    }
  }

  return {
    stocks,
    watchlist,
    loading,
    error,
    getStockBySymbol,
    fetchStocks,
    toggleWatchlist,
  }
})
