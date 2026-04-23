import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeTransaction, validateTransactionPayload } from './transactionModel.js'

test('validateTransactionPayload accepts a valid transaction and trims description', () => {
  const result = validateTransactionPayload({
    description: '  Client invoice  ',
    amount: '1250.50',
    type: 'income',
    category: 'salary',
    date: '2026-04-22',
  })

  assert.equal(result.ok, true)
  assert.deepEqual(result.value, {
    description: 'Client invoice',
    amount: 1250.5,
    type: 'income',
    category: 'salary',
    date: '2026-04-22',
  })
})

test('validateTransactionPayload rejects invalid amount, category, type, and date scenarios', () => {
  assert.deepEqual(
    validateTransactionPayload({
      description: 'Lunch',
      amount: 0,
      type: 'expense',
      category: 'food',
      date: '2026-04-22',
    }),
    { ok: false, message: 'Amount must be a positive number.' },
  )

  assert.deepEqual(
    validateTransactionPayload({
      description: 'Lunch',
      amount: 10,
      type: 'refund',
      category: 'food',
      date: '2026-04-22',
    }),
    { ok: false, message: 'Type must be income or expense.' },
  )

  assert.deepEqual(
    validateTransactionPayload({
      description: 'Lunch',
      amount: 10,
      type: 'expense',
      category: 'travel',
      date: '2026-04-22',
    }),
    { ok: false, message: 'Category is invalid.' },
  )

  assert.deepEqual(
    validateTransactionPayload({
      description: 'Lunch',
      amount: 10,
      type: 'expense',
      category: 'food',
      date: '04/22/2026',
    }),
    { ok: false, message: 'Date must be in YYYY-MM-DD format.' },
  )
})

test('normalizeTransaction converts persisted values into canonical API values', () => {
  assert.deepEqual(
    normalizeTransaction({
      id: '12',
      description: ' Salary bonus ',
      amount: '500',
      type: 'income',
      category: 'salary',
      date: '2026-04-22',
    }),
    {
      id: 12,
      description: 'Salary bonus',
      amount: 500,
      type: 'income',
      category: 'salary',
      date: '2026-04-22',
    },
  )
})
