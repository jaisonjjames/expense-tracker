import test from 'node:test'
import assert from 'node:assert/strict'
import { configureStore } from '@reduxjs/toolkit'
import reducer, {
  createTransaction,
  deleteTransaction,
  fetchTransactions,
  selectBalance,
  selectDeletingTransactionIds,
  selectExpenseByCategory,
  selectFilteredTransactions,
  selectInsights,
  selectTimelineData,
  selectTotalExpenses,
  selectTotalIncome,
} from './transactionsSlice.js'

const buildState = (items, filters = { type: 'all', category: 'all' }) => ({
  transactions: {
    items,
    filters,
    status: 'succeeded',
    createStatus: 'idle',
    error: null,
  },
})

const buildStore = () =>
  configureStore({
    reducer: {
      transactions: reducer,
    },
  })

const transactions = [
  { id: 1, description: 'Salary', amount: 5000, type: 'income', category: 'salary', date: '2026-04-01' },
  { id: 2, description: 'Rent', amount: 1200, type: 'expense', category: 'housing', date: '2026-04-02' },
  { id: 3, description: 'Groceries', amount: 150, type: 'expense', category: 'food', date: '2026-04-02' },
  { id: 4, description: 'Freelance', amount: 800, type: 'income', category: 'salary', date: '2026-04-03' },
  { id: 5, description: 'Dinner', amount: 65, type: 'expense', category: 'food', date: '2026-04-03' },
]

test('summary selectors compute total income, total expenses, and balance', () => {
  const state = buildState(transactions)

  assert.equal(selectTotalIncome(state), 5800)
  assert.equal(selectTotalExpenses(state), 1415)
  assert.equal(selectBalance(state), 4385)
})

test('filtered selector narrows by type and category together', () => {
  const state = buildState(transactions, { type: 'expense', category: 'food' })

  assert.deepEqual(
    selectFilteredTransactions(state).map((transaction) => transaction.description),
    ['Groceries', 'Dinner'],
  )
})

test('timeline selector groups transactions by date into income and expense buckets', () => {
  const state = buildState(transactions)

  assert.deepEqual(selectTimelineData(state), [
    { date: '2026-04-01', income: 5000, expenses: 0, balance: 5000 },
    { date: '2026-04-02', income: 0, expenses: 1350, balance: -1350 },
    { date: '2026-04-03', income: 800, expenses: 65, balance: 735 },
  ])
})

test('expense and insight selectors identify top category and savings rate', () => {
  const state = buildState(transactions)

  assert.deepEqual(selectExpenseByCategory(state), [
    { name: 'housing', value: 1200 },
    { name: 'food', value: 215 },
  ])

  assert.deepEqual(selectInsights(state), {
    transactionCount: 5,
    savingsRate: (4385 / 5800) * 100,
    topExpenseCategory: { name: 'housing', value: 1200 },
    averageTransaction: 1443,
  })
})

test('fetchTransactions stores API data after a successful response', async () => {
  const store = buildStore()
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return { transactions }
    },
  })

  try {
    const action = await store.dispatch(fetchTransactions())

    assert.equal(action.type, 'transactions/fetchTransactions/fulfilled')
    assert.equal(store.getState().transactions.status, 'succeeded')
    assert.deepEqual(store.getState().transactions.items, transactions)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('fetchTransactions surfaces malformed API payloads as errors', async () => {
  const store = buildStore()
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return { transactions: null }
    },
  })

  try {
    const action = await store.dispatch(fetchTransactions())

    assert.equal(action.type, 'transactions/fetchTransactions/rejected')
    assert.equal(
      store.getState().transactions.error,
      'The transaction API returned an invalid transactions payload.',
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('createTransaction appends a saved transaction to state', async () => {
  const store = buildStore()
  const originalFetch = globalThis.fetch
  const createdTransaction = {
    id: 10,
    description: 'API created expense',
    amount: 42.5,
    type: 'expense',
    category: 'other',
    date: '2026-04-22',
  }

  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return { transaction: createdTransaction }
    },
  })

  try {
    const action = await store.dispatch(
      createTransaction({
        description: 'API created expense',
        amount: 42.5,
        type: 'expense',
        category: 'other',
        date: '2026-04-22',
      }),
    )

    assert.equal(action.type, 'transactions/createTransaction/fulfilled')
    assert.equal(store.getState().transactions.createStatus, 'succeeded')
    assert.deepEqual(store.getState().transactions.items, [createdTransaction])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('createTransaction stores API errors when saving fails', async () => {
  const store = buildStore()
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => ({
    ok: false,
    async json() {
      return { error: 'Description is required.' }
    },
  })

  try {
    const action = await store.dispatch(
      createTransaction({
        description: '',
        amount: 42.5,
        type: 'expense',
        category: 'other',
        date: '2026-04-22',
      }),
    )

    assert.equal(action.type, 'transactions/createTransaction/rejected')
    assert.equal(store.getState().transactions.createStatus, 'failed')
    assert.equal(store.getState().transactions.error, 'Description is required.')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('deleteTransaction removes the transaction and clears row delete state', async () => {
  const store = configureStore({
    reducer: {
      transactions: reducer,
    },
    preloadedState: {
      transactions: {
        items: transactions,
        filters: { type: 'all', category: 'all' },
        status: 'succeeded',
        createStatus: 'idle',
        deletingIds: [],
        error: null,
      },
    },
  })
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return { transaction: transactions[1] }
    },
  })

  try {
    const actionPromise = store.dispatch(deleteTransaction(2))
    assert.deepEqual(selectDeletingTransactionIds(store.getState()), [2])

    const action = await actionPromise

    assert.equal(action.type, 'transactions/deleteTransaction/fulfilled')
    assert.deepEqual(
      store.getState().transactions.items.map((transaction) => transaction.id),
      [1, 3, 4, 5],
    )
    assert.deepEqual(selectDeletingTransactionIds(store.getState()), [])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('deleteTransaction stores API errors when deletion fails', async () => {
  const store = buildStore()
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => ({
    ok: false,
    async json() {
      return { error: 'Transaction not found.' }
    },
  })

  try {
    const action = await store.dispatch(deleteTransaction(999))

    assert.equal(action.type, 'transactions/deleteTransaction/rejected')
    assert.deepEqual(selectDeletingTransactionIds(store.getState()), [])
    assert.equal(store.getState().transactions.error, 'Transaction not found.')
  } finally {
    globalThis.fetch = originalFetch
  }
})
