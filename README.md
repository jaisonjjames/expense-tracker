# Expense Tracker

> This is the starter project used in my [Claude Code course](https://codewithmosh.com/p/claude-code).

A basic expense tracker app built with React. It intentionally has a bug, poor UI, and messy code — all of which we fix together throughout the course.

## Getting Started

```bash
npm install
npm run dev
```

This now starts both:

- the Vite frontend at `http://localhost:5173`
- the transactions API at `http://localhost:3001`

The frontend talks to the backend through `/api` and transaction data is persisted in [server/data/transactions.json](/Users/jaison/Projects/AI/expense-tracker/server/data/transactions.json).

## API

- `GET /api/health`
- `GET /api/transactions`
- `POST /api/transactions`

Example payload:

```json
{
  "description": "Client invoice",
  "amount": 1250,
  "type": "income",
  "category": "salary",
  "date": "2026-04-22"
}
```
