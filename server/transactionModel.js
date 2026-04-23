export const categories = new Set(["food", "housing", "utilities", "transport", "entertainment", "salary", "other"])
export const transactionTypes = new Set(["income", "expense"])

export const normalizeTransaction = (transaction) => ({
  id: Number(transaction.id),
  description: String(transaction.description).trim(),
  amount: Number(transaction.amount),
  type: transaction.type,
  category: transaction.category,
  date: transaction.date,
})

export const validateTransactionPayload = (payload) => {
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
