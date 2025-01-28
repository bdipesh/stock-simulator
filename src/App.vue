<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <h1 class="text-3xl font-bold text-gray-900">Stock Trading Simulator</h1>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1 space-y-6">
          <StockList />
        </div>
        <div>
          <TradeForm />
          <Watchlist class="mt-4" />
        </div>
        <div class="space-y-6">
          <Portfolio />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import StockList from '@/components/StockList.vue'
import Portfolio from '@/components/Portfolio.vue'
import TradeForm from '@/components/TradeForm.vue'
import Watchlist from '@/components/Watchlist.vue'
</script>
