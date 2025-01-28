<template>
  <div class="stock-chart">
    <Line :data="chartData" :options="chartOptions" class="h-40" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import type { HistoricalData } from '@/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const props = defineProps<{
  historicalData: HistoricalData[]
}>()

const chartData = computed(() => ({
  labels: props.historicalData.map((d) => new Date(d.date).toLocaleDateString()),
  datasets: [
    {
      label: 'Price',
      data: props.historicalData.map((d) => d.price),
      borderColor: '#3b82f6',
      tension: 0.1,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: false,
    },
  },
}
</script>
