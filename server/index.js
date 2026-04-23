import cors from 'cors'
import express from 'express'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSONFilePreset } from 'lowdb/node'
import { createStoredTransaction, deleteStoredTransaction, listTransactions } from './transactionsService.js'

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

export const createApp = (db) => {
  const app = express()
  app.use(cors())
  app.use(express.json())

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true })
  })

  app.get('/api/transactions', (_request, response) => {
    response.json({ transactions: listTransactions(db) })
  })

  app.post('/api/transactions', async (request, response) => {
    const result = await createStoredTransaction(db, request.body)

    if (!result.ok) {
      response.status(result.status).json({ error: result.error })
      return
    }

    response.status(result.status).json({ transaction: result.transaction })
  })

  app.delete('/api/transactions/:id', async (request, response) => {
    const result = await deleteStoredTransaction(db, request.params.id)

    if (!result.ok) {
      response.status(result.status).json({ error: result.error })
      return
    }

    response.status(result.status).json({ transaction: result.transaction })
  })

  return app
}

export const createDatabase = async () => {
  await mkdir(dataDirectory, { recursive: true })
  return JSONFilePreset(dataFile, { transactions: seedTransactions })
}

export const startServer = async (port = PORT) => {
  const db = await createDatabase()
  const app = createApp(db)

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Transaction API listening on http://localhost:${port}`)
      resolve(server)
    })
  })
}

if (process.argv[1] === __filename) {
  startServer().catch((error) => {
    console.error('Failed to start the transaction API.', error)
    process.exit(1)
  })
}
