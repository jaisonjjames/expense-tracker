import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'

export const CATEGORIES = [
  "food",
  "housing",
  "utilities",
  "transport",
  "entertainment",
  "salary",
  "other",
]

const FALLBACK_API_PORT = '3001'

const resolveApiBaseUrl = () => {
  const configuredApiUrl = import.meta.env?.VITE_API_URL

  if (configuredApiUrl) {
    return configuredApiUrl
  }

  if (typeof window === 'undefined') {
    return '/api'
  }

  if (window.location.port === FALLBACK_API_PORT) {
    return '/api'
  }

  return `${window.location.protocol}//${window.location.hostname}:${FALLBACK_API_PORT}/api`
}

const apiBaseUrl = resolveApiBaseUrl()

const readJsonSafely = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

const initialState = {
  items: [],
  filters: {
    type: "all",
    category: "all",
  },
  status: 'idle',
  createStatus: 'idle',
  deletingIds: [],
  error: null,
}

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${apiBaseUrl}/transactions`)
      const data = await readJsonSafely(response)

      if (!response.ok) {
        return rejectWithValue(data?.error ?? 'Failed to load transactions.')
      }

      if (!Array.isArray(data?.transactions)) {
        return rejectWithValue('The transaction API returned an invalid transactions payload.')
      }

      return data.transactions
    } catch {
      return rejectWithValue('Could not reach the transaction API.')
    }
  },
)

export const createTransaction = createAsyncThunk(
  'transactions/createTransaction',
  async (transaction, { rejectWithValue }) => {
    try {
      const response = await fetch(`${apiBaseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      })
      const data = await readJsonSafely(response)

      if (!response.ok) {
        return rejectWithValue(data?.error ?? 'Failed to save the transaction.')
      }

      if (!data?.transaction) {
        return rejectWithValue('The transaction API returned an invalid create response.')
      }

      return data.transaction
    } catch {
      return rejectWithValue('Could not save the transaction to the API.')
    }
  },
)

export const deleteTransaction = createAsyncThunk(
  'transactions/deleteTransaction',
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${apiBaseUrl}/transactions/${transactionId}`, {
        method: 'DELETE',
      })
      const data = await readJsonSafely(response)

      if (!response.ok) {
        return rejectWithValue(data?.error ?? 'Failed to delete the transaction.')
      }

      if (!data?.transaction) {
        return rejectWithValue('The transaction API returned an invalid delete response.')
      }

      return data.transaction
    } catch {
      return rejectWithValue('Could not delete the transaction from the API.')
    }
  },
)

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setFilterType: (state, action) => {
      state.filters.type = action.payload
    },
    setFilterCategory: (state, action) => {
      state.filters.category = action.payload
    },
    clearTransactionsError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? 'Failed to load transactions.'
      })
      .addCase(createTransaction.pending, (state) => {
        state.createStatus = 'loading'
        state.error = null
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.createStatus = 'succeeded'
        state.items.push(action.payload)
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.createStatus = 'failed'
        state.error = action.payload ?? 'Failed to save the transaction.'
      })
      .addCase(deleteTransaction.pending, (state, action) => {
        state.error = null
        state.deletingIds.push(Number(action.meta.arg))
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        const deletedId = Number(action.payload.id)
        state.items = state.items.filter((transaction) => Number(transaction.id) !== deletedId)
        state.deletingIds = state.deletingIds.filter((transactionId) => transactionId !== deletedId)
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        const failedId = Number(action.meta.arg)
        state.deletingIds = state.deletingIds.filter((transactionId) => transactionId !== failedId)
        state.error = action.payload ?? 'Failed to delete the transaction.'
      })
  },
})

export const { setFilterType, setFilterCategory, clearTransactionsError } = transactionsSlice.actions

export const selectTransactions = (state) => state.transactions.items
export const selectFilters = (state) => state.transactions.filters
export const selectTransactionsStatus = (state) => state.transactions.status
export const selectCreateTransactionStatus = (state) => state.transactions.createStatus
export const selectDeletingTransactionIds = (state) => state.transactions.deletingIds
export const selectTransactionsError = (state) => state.transactions.error

export const selectFilteredTransactions = createSelector(
  [selectTransactions, selectFilters],
  (transactions, filters) =>
    transactions.filter((transaction) => {
      const matchesType = filters.type === "all" || transaction.type === filters.type
      const matchesCategory = filters.category === "all" || transaction.category === filters.category

      return matchesType && matchesCategory
    }),
)

export const selectTotalIncome = createSelector([selectTransactions], (transactions) =>
  transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
)

export const selectTotalExpenses = createSelector([selectTransactions], (transactions) =>
  transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
)

export const selectBalance = createSelector(
  [selectTotalIncome, selectTotalExpenses],
  (totalIncome, totalExpenses) => totalIncome - totalExpenses,
)

export const selectRecentTransactions = createSelector([selectTransactions], (transactions) =>
  [...transactions]
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .slice(0, 5),
)

export const selectExpenseByCategory = createSelector([selectTransactions], (transactions) => {
  const grouped = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((accumulator, transaction) => {
      const currentTotal = accumulator[transaction.category] ?? 0
      accumulator[transaction.category] = currentTotal + Number(transaction.amount)
      return accumulator
    }, {})

  return Object.entries(grouped)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((left, right) => right.value - left.value)
})

export const selectTimelineData = createSelector([selectTransactions], (transactions) => {
  const grouped = transactions.reduce((accumulator, transaction) => {
    const key = transaction.date
    const currentPoint = accumulator[key] ?? { date: key, income: 0, expenses: 0 }

    if (transaction.type === "income") {
      currentPoint.income += Number(transaction.amount)
    } else {
      currentPoint.expenses += Number(transaction.amount)
    }

    accumulator[key] = currentPoint
    return accumulator
  }, {})

  return Object.values(grouped)
    .sort((left, right) => new Date(left.date) - new Date(right.date))
    .map((entry) => ({
      ...entry,
      balance: entry.income - entry.expenses,
    }))
})

export const selectInsights = createSelector(
  [selectTransactions, selectTotalIncome, selectTotalExpenses, selectBalance, selectExpenseByCategory],
  (transactions, totalIncome, totalExpenses, balance, expenseByCategory) => {
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0
    const topExpenseCategory = expenseByCategory[0] ?? null
    const averageTransaction =
      transactions.length > 0
        ? transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0) / transactions.length
        : 0

    return {
      transactionCount: transactions.length,
      savingsRate,
      topExpenseCategory,
      averageTransaction,
    }
  },
)

export default transactionsSlice.reducer
