import test from 'node:test'
import assert from 'node:assert/strict'
import { createStoredTransaction, deleteStoredTransaction, listTransactions } from './transactionsService.js'

const buildDb = (transactions = []) => ({
  data: {
    transactions: [...transactions],
  },
  async write() {},
})

test('listTransactions returns normalized transactions for API responses', () => {
  const db = buildDb([
    { id: '2', description: ' Rent ', amount: '1200', type: 'expense', category: 'housing', date: '2026-04-02' },
  ])

  assert.deepEqual(listTransactions(db), [
    { id: 2, description: 'Rent', amount: 1200, type: 'expense', category: 'housing', date: '2026-04-02' },
  ])
})

test('createStoredTransaction creates and persists a normalized transaction', async () => {
  const db = buildDb()

  const result = await createStoredTransaction(
    db,
    {
      description: '  API created expense ',
      amount: '42.5',
      type: 'expense',
      category: 'other',
      date: '2026-04-22',
    },
    () => 999,
  )

  assert.deepEqual(result, {
    ok: true,
    status: 201,
    transaction: {
      id: 999,
      description: 'API created expense',
      amount: 42.5,
      type: 'expense',
      category: 'other',
      date: '2026-04-22',
    },
  })

  assert.deepEqual(db.data.transactions, [
    {
      id: 999,
      description: 'API created expense',
      amount: 42.5,
      type: 'expense',
      category: 'other',
      date: '2026-04-22',
    },
  ])
})

test('createStoredTransaction rejects invalid payloads and does not persist them', async () => {
  const db = buildDb()

  const result = await createStoredTransaction(db, {
    description: '',
    amount: -5,
    type: 'expense',
    category: 'food',
    date: '2026-04-22',
  })

  assert.deepEqual(result, {
    ok: false,
    error: 'Description is required.',
    status: 400,
  })

  assert.deepEqual(db.data.transactions, [])
})

test('deleteStoredTransaction removes an existing transaction', async () => {
  const db = buildDb([
    { id: 10, description: 'Dinner', amount: 25, type: 'expense', category: 'food', date: '2026-04-22' },
    { id: 11, description: 'Salary', amount: 500, type: 'income', category: 'salary', date: '2026-04-23' },
  ])

  const result = await deleteStoredTransaction(db, '10')

  assert.deepEqual(result, {
    ok: true,
    status: 200,
    transaction: {
      id: 10,
      description: 'Dinner',
      amount: 25,
      type: 'expense',
      category: 'food',
      date: '2026-04-22',
    },
  })

  assert.deepEqual(db.data.transactions, [
    { id: 11, description: 'Salary', amount: 500, type: 'income', category: 'salary', date: '2026-04-23' },
  ])
})

test('deleteStoredTransaction returns a not found error for unknown ids', async () => {
  const db = buildDb()

  const result = await deleteStoredTransaction(db, 999)

  assert.deepEqual(result, {
    ok: false,
    error: 'Transaction not found.',
    status: 404,
  })
})
