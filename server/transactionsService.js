import { normalizeTransaction, validateTransactionPayload } from './transactionModel.js'

export const listTransactions = (db) => db.data.transactions.map(normalizeTransaction)

export const createStoredTransaction = async (db, payload, idGenerator = () => Date.now()) => {
  const validation = validateTransactionPayload(payload ?? {})

  if (!validation.ok) {
    return {
      ok: false,
      error: validation.message,
      status: 400,
    }
  }

  const nextTransaction = {
    id: idGenerator(),
    ...validation.value,
  }

  db.data.transactions.push(nextTransaction)
  await db.write()

  return {
    ok: true,
    status: 201,
    transaction: normalizeTransaction(nextTransaction),
  }
}

export const deleteStoredTransaction = async (db, transactionId) => {
  const normalizedId = Number(transactionId)
  const index = db.data.transactions.findIndex((transaction) => Number(transaction.id) === normalizedId)

  if (index === -1) {
    return {
      ok: false,
      error: 'Transaction not found.',
      status: 404,
    }
  }

  const [removedTransaction] = db.data.transactions.splice(index, 1)
  await db.write()

  return {
    ok: true,
    status: 200,
    transaction: normalizeTransaction(removedTransaction),
  }
}
