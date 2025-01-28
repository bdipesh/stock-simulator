export interface Stock {
  symbol: string
  name: string
  currentPrice: number
  previousClose: number
  volume: number
  historicalData: HistoricalData[]
}

export interface HistoricalData {
  date: string
  price: number
}

export interface Portfolio {
  cash: number
  holdings: Holding[]
}
export interface Transaction {
  symbol: string
  quantity: number
  price: number
  type: 'BUY' | 'SELL'
  timestamp: string
  total: number
}
export interface Holding {
  symbol: string
  quantity: number
  averagePrice: number
}

export interface TradeOrder {
  symbol: string
  quantity: number
  type: 'BUY' | 'SELL'
}

export interface TradeResponse {
  success: boolean
  message: string
  transaction?: {
    symbol: string
    quantity: number
    price: number
    type: 'BUY' | 'SELL'
    timestamp: string
  }
}
