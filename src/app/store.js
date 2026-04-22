import { configureStore } from '@reduxjs/toolkit'
import transactionsReducer from '../features/transactions/transactionsSlice'

const STORAGE_KEY = 'expense-tracker-state'

const loadState = () => {
  if (typeof window === 'undefined') {
    return undefined
  }

  try {
    const savedState = window.localStorage.getItem(STORAGE_KEY)
    return savedState ? JSON.parse(savedState) : undefined
  } catch {
    return undefined
  }
}

export const store = configureStore({
  reducer: {
    transactions: transactionsReducer,
  },
  preloadedState: loadState(),
})

if (typeof window !== 'undefined') {
  store.subscribe(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store.getState()))
    } catch {
      // Ignore persistence errors so the app stays usable even if storage is unavailable.
    }
  })
}
