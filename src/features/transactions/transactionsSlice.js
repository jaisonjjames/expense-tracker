import { createSelector, createSlice } from '@reduxjs/toolkit'

export const CATEGORIES = [
  "food",
  "housing",
  "utilities",
  "transport",
  "entertainment",
  "salary",
  "other",
]

const initialTransactions = [
  { id: 1, description: "Salary", amount: 5000, type: "income", category: "salary", date: "2025-01-01" },
  { id: 2, description: "Rent", amount: 1200, type: "expense", category: "housing", date: "2025-01-02" },
  { id: 3, description: "Groceries", amount: 150, type: "expense", category: "food", date: "2025-01-03" },
  { id: 4, description: "Freelance Work", amount: 800, type: "income", category: "salary", date: "2025-01-05" },
  { id: 5, description: "Electric Bill", amount: 95, type: "expense", category: "utilities", date: "2025-01-06" },
  { id: 6, description: "Dinner Out", amount: 65, type: "expense", category: "food", date: "2025-01-07" },
  { id: 7, description: "Gas", amount: 45, type: "expense", category: "transport", date: "2025-01-08" },
  { id: 8, description: "Netflix", amount: 15, type: "expense", category: "entertainment", date: "2025-01-10" },
]

const initialState = {
  items: initialTransactions,
  filters: {
    type: "all",
    category: "all",
  },
}

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    hydrateTransactionsState: (_state, action) => action.payload,
    addTransaction: (state, action) => {
      state.items.push(action.payload)
    },
    setFilterType: (state, action) => {
      state.filters.type = action.payload
    },
    setFilterCategory: (state, action) => {
      state.filters.category = action.payload
    },
  },
})

export const {
  hydrateTransactionsState,
  addTransaction,
  setFilterType,
  setFilterCategory,
} = transactionsSlice.actions

export const selectTransactions = (state) => state.transactions.items
export const selectFilters = (state) => state.transactions.filters

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
