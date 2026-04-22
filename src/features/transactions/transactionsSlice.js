import { createSlice } from '@reduxjs/toolkit'

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

export const { addTransaction, setFilterType, setFilterCategory } = transactionsSlice.actions

export const selectTransactions = (state) => state.transactions.items
export const selectFilters = (state) => state.transactions.filters

export const selectFilteredTransactions = (state) => {
  const transactions = selectTransactions(state)
  const filters = selectFilters(state)

  return transactions.filter((transaction) => {
    const matchesType = filters.type === "all" || transaction.type === filters.type
    const matchesCategory = filters.category === "all" || transaction.category === filters.category

    return matchesType && matchesCategory
  })
}

export const selectTotalIncome = (state) =>
  selectTransactions(state)
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)

export const selectTotalExpenses = (state) =>
  selectTransactions(state)
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)

export const selectBalance = (state) => selectTotalIncome(state) - selectTotalExpenses(state)

export default transactionsSlice.reducer
