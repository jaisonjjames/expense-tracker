import cors from 'cors'
import express from 'express'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSONFilePreset } from 'lowdb/node'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataDirectory = path.join(__dirname, 'data')
const dataFile = path.join(dataDirectory, 'transactions.json')
const PORT = Number(process.env.PORT) || 3001

const seedTransactions = [
  { id: 1, description: "Salary", amount: 5000, type: "income", category: "salary", date: "2025-01-01" },
  { id: 2, description: "Rent", amount: 1200, type: "expense", category: "housing", date: "2025-01-02" },
  { id: 3, description: "Groceries", amount: 150, type: "expense", category: "food", date: "2025-01-03" },
  { id: 4, description: "Freelance Work", amount: 800, type: "income", category: "salary", date: "2025-01-05" },
  { id: 5, description: "Electric Bill", amount: 95, type: "expense", category: "utilities", date: "2025-01-06" },
  { id: 6, description: "Dinner Out", amount: 65, type: "expense", category: "food", date: "2025-01-07" },
  { id: 7, description: "Gas", amount: 45, type: "expense", category: "transport", date: "2025-01-08" },
  { id: 8, description: "Netflix", amount: 15, type: "expense", category: "entertainment", date: "2025-01-10" },
]

const categories = new Set(["food", "housing", "utilities", "transport", "entertainment", "salary", "other"])
const transactionTypes = new Set(["income", "expense"])

const normalizeTransaction = (transaction) => ({
  id: Number(transaction.id),
  description: String(transaction.description).trim(),
  amount: Number(transaction.amount),
  type: transaction.type,
  category: transaction.category,
  date: transaction.date,
})

const validateTransactionPayload = (payload) => {
  const description = String(payload.description ?? '').trim()
  const amount = Number(payload.amount)
  const type = payload.type
  const category = payload.category
  const date = String(payload.date ?? '')

  if (!description) {
    return { ok: false, message: 'Description is required.' }
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: 'Amount must be a positive number.' }
  }

  if (!transactionTypes.has(type)) {
    return { ok: false, message: 'Type must be income or expense.' }
  }

  if (!categories.has(category)) {
    return { ok: false, message: 'Category is invalid.' }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, message: 'Date must be in YYYY-MM-DD format.' }
  }

  return {
    ok: true,
    value: {
      description,
      amount,
      type,
      category,
      date,
    },
  }
}

const startServer = async () => {
  await mkdir(dataDirectory, { recursive: true })
  const db = await JSONFilePreset(dataFile, { transactions: seedTransactions })

  const app = express()
  app.use(cors())
  app.use(express.json())

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true })
  })

  app.get('/api/transactions', (_request, response) => {
    const transactions = db.data.transactions.map(normalizeTransaction)
    response.json({ transactions })
  })

  app.post('/api/transactions', async (request, response) => {
    const validation = validateTransactionPayload(request.body ?? {})

    if (!validation.ok) {
      response.status(400).json({ error: validation.message })
      return
    }

    const nextTransaction = {
      id: Date.now(),
      ...validation.value,
    }

    db.data.transactions.push(nextTransaction)
    await db.write()

    response.status(201).json({ transaction: normalizeTransaction(nextTransaction) })
  })

  app.listen(PORT, () => {
    console.log(`Transaction API listening on http://localhost:${PORT}`)
  })
}

startServer().catch((error) => {
  console.error('Failed to start the transaction API.', error)
  process.exit(1)
})
