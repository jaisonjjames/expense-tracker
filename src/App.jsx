import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CATEGORIES,
  clearTransactionsError,
  createTransaction,
  deleteTransaction,
  fetchTransactions,
  selectBalance,
  selectCreateTransactionStatus,
  selectDeletingTransactionIds,
  selectExpenseByCategory,
  selectFilteredTransactions,
  selectFilters,
  selectInsights,
  selectRecentTransactions,
  selectTimelineData,
  selectTransactionsError,
  selectTransactionsStatus,
  selectTotalExpenses,
  selectTotalIncome,
  setFilterCategory,
  setFilterType,
} from './features/transactions/transactionsSlice'

const THEME_KEY = 'expense-tracker-theme'

const pieColors = ['#ff7a59', '#ffb347', '#ffd166', '#34d399', '#60a5fa', '#8b5cf6']

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0)
const formatCompactCurrency = (value) => compactCurrencyFormatter.format(Number(value) || 0)
const formatPercent = (value) => `${Math.round(value)}%`

const formatChartDate = (value) =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const savedTheme = window.localStorage.getItem(THEME_KEY)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const panelClass =
  'rounded-[28px] border border-[var(--border-color)] bg-[var(--panel-bg)] shadow-[var(--panel-shadow)] backdrop-blur-[22px]'

const mutedTextClass = 'text-[color:var(--muted-text)]'
const eyebrowClass = `inline-block text-[0.76rem] leading-none tracking-[0.16em] uppercase ${mutedTextClass}`
const sectionTitleClass = 'mt-2 text-[1.45rem] tracking-[-0.04em]'
const inputClass =
  'h-13 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg)] px-4 text-[var(--text-color)] outline-none transition focus:border-[var(--accent-strong)] focus:ring-4 focus:ring-[var(--focus-ring)]'

function App() {
  const dispatch = useDispatch()
  const totalIncome = useSelector(selectTotalIncome)
  const totalExpenses = useSelector(selectTotalExpenses)
  const balance = useSelector(selectBalance)
  const filteredTransactions = useSelector(selectFilteredTransactions)
  const filters = useSelector(selectFilters)
  const timelineData = useSelector(selectTimelineData)
  const expenseByCategory = useSelector(selectExpenseByCategory)
  const recentTransactions = useSelector(selectRecentTransactions)
  const insights = useSelector(selectInsights)
  const transactionsStatus = useSelector(selectTransactionsStatus)
  const createTransactionStatus = useSelector(selectCreateTransactionStatus)
  const deletingTransactionIds = useSelector(selectDeletingTransactionIds)
  const transactionsError = useSelector(selectTransactionsError)

  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState("expense")
  const [category, setCategory] = useState("food")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [searchTerm, setSearchTerm] = useState("")
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (transactionsStatus === 'idle') {
      dispatch(fetchTransactions())
    }
  }, [dispatch, transactionsStatus])

  useEffect(() => {
    if (!transactionsError) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      dispatch(clearTransactionsError())
    }, 4000)

    return () => window.clearTimeout(timeoutId)
  }, [dispatch, transactionsError])

  const searchedTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) {
      return filteredTransactions
    }

    return filteredTransactions.filter((transaction) => {
      const combinedText = [
        transaction.description,
        transaction.category,
        transaction.date,
        transaction.type,
      ]
        .join(' ')
        .toLowerCase()

      return combinedText.includes(query)
    })
  }, [filteredTransactions, searchTerm])

  const largestTransaction = useMemo(() => {
    if (recentTransactions.length === 0) {
      return null
    }

    return [...recentTransactions].sort((left, right) => Number(right.amount) - Number(left.amount))[0]
  }, [recentTransactions])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const parsedAmount = Number.parseFloat(amount)

    if (!description.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0 || !date) {
      return
    }

    try {
      await dispatch(
        createTransaction({
          description: description.trim(),
          amount: parsedAmount,
          type,
          category,
          date,
        }),
      ).unwrap()

      setDescription("")
      setAmount("")
      setType("expense")
      setCategory("food")
      setDate(new Date().toISOString().split('T')[0])
    } catch {
      // The slice already captures and exposes the API error.
    }
  }

  const handleDeleteTransaction = async (transactionId) => {
    try {
      await dispatch(deleteTransaction(transactionId)).unwrap()
    } catch {
      // The slice already captures and exposes the API error.
    }
  }

  const themeLabel = theme === 'dark' ? 'Switch to light' : 'Switch to dark'
  const isLoadingTransactions = transactionsStatus === 'loading'
  const isSavingTransaction = createTransactionStatus === 'loading'

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -right-40 -top-32 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(255,122,89,0.9)_0%,rgba(255,122,89,0)_68%)] opacity-40 blur-[70px]" />
      <div className="pointer-events-none absolute -bottom-48 -left-32 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.78)_0%,rgba(96,165,250,0)_68%)] opacity-40 blur-[70px]" />

      <main className="relative z-10 mx-auto w-[min(1280px,calc(100%-32px))] px-0 py-8 max-[720px]:w-[min(1280px,calc(100%-20px))] max-[720px]:pt-5">
        <section className={`${panelClass} mb-6 flex flex-col gap-4 px-6 py-[18px] lg:flex-row lg:items-center lg:justify-between`}>
          <div className="flex items-center gap-3.5">
            <div className="grid h-[52px] w-[52px] place-items-center rounded-[18px] bg-linear-to-br from-[var(--accent-strong)] to-[var(--accent-secondary)] shadow-[0_18px_34px_rgba(255,122,89,0.26)]">
              <span className="h-[22px] w-[22px] rounded-full border-[3px] border-white/95 shadow-[0_0_0_5px_rgba(255,255,255,0.18),inset_0_0_0_2px_rgba(255,255,255,0.25)]" />
            </div>
            <div className="grid gap-1">
              <span className={eyebrowClass}>Transaction monitor</span>
              <strong className="text-[1.02rem] tracking-[-0.03em]">Finance dashboard</strong>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between lg:justify-end">
            <div className="inline-flex min-h-12 items-center gap-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--glass-bg)] px-[18px] font-semibold text-[var(--text-color)]">
              <span className="h-[9px] w-[9px] rounded-full bg-emerald-400" />
              {insights.transactionCount} transactions recorded
            </div>
            <button
              type="button"
              className="inline-flex min-h-12 cursor-pointer items-center gap-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--glass-bg)] px-[18px] text-[var(--text-color)] transition hover:-translate-y-px"
              onClick={() => setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))}
            >
              <span className="h-3 w-3 rounded-full bg-linear-to-br from-[var(--accent-strong)] to-[var(--accent-secondary)] shadow-[0_0_0_4px_rgba(255,255,255,0.08)]" />
              {themeLabel}
            </button>
          </div>
        </section>

        {transactionsError ? (
          <section className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 shadow-sm">
            {transactionsError}
          </section>
        ) : null}

        <section className="mb-6 grid items-start gap-7 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.72fr)]">
          <section
            className={`${panelClass} relative self-start overflow-hidden border-[rgba(255,122,89,0.35)] bg-[radial-gradient(circle_at_top_right,rgba(255,122,89,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.16),transparent_32%),var(--panel-bg)] p-6 shadow-[0_28px_60px_rgba(255,122,89,0.18),var(--panel-shadow)] before:pointer-events-none before:absolute before:inset-0 before:bg-linear-to-br before:from-white/6 before:to-transparent`}
          >
            <div className="relative z-10 mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className={eyebrowClass}>New Entry</span>
                <h2 className="mt-2 text-[1.7rem] tracking-[-0.04em]">Add transaction</h2>
              </div>
            </div>

            <form className="relative z-10 grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-[0.92rem] text-[var(--muted-text)]">
                <span>Description</span>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Client payment, grocery run..."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="grid min-w-0 gap-2 text-[0.92rem] text-[var(--muted-text)]">
                  <span>Amount</span>
                  <input
                    className={inputClass}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </label>
                <label className="grid min-w-0 gap-2 text-[0.92rem] text-[var(--muted-text)]">
                  <span>Date</span>
                  <input
                    className={inputClass}
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </label>
                <label className="grid min-w-0 gap-2 text-[0.92rem] text-[var(--muted-text)]">
                  <span>Type</span>
                  <select className={inputClass} value={type} onChange={(event) => setType(event.target.value)}>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </label>
                <label className="grid min-w-0 gap-2 text-[0.92rem] text-[var(--muted-text)]">
                  <span>Category</span>
                  <select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value)}>
                    {CATEGORIES.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex">
                <button
                  className="min-h-14 w-full cursor-pointer rounded-2xl bg-linear-to-br from-[var(--accent-strong)] to-[var(--accent-secondary)] px-[18px] font-bold text-[#fff7ef] shadow-[0_22px_44px_rgba(255,122,89,0.3)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                  type="submit"
                  disabled={isSavingTransaction}
                >
                  {isSavingTransaction ? 'Saving transaction...' : 'Save transaction'}
                </button>
              </div>
            </form>
          </section>

          <div className={`${panelClass} grid gap-[18px] p-6`}>
            <div className="grid min-h-[232px] place-items-center rounded-[30px] border border-white/12 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 text-center">
              <span className={eyebrowClass}>Balance</span>
              <strong className="my-2.5 text-[clamp(2rem,4vw,3rem)] tracking-[-0.05em]">
                {formatCurrency(balance)}
              </strong>
              <small className={mutedTextClass}>{formatPercent(insights.savingsRate)} savings rate</small>
            </div>
            <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-2">
              <article className="rounded-[22px] border border-[var(--border-color)] bg-[var(--glass-bg)] p-[18px]">
                <span className={eyebrowClass}>Top expense</span>
                <strong className="mt-2.5 block text-[1.2rem] capitalize">
                  {insights.topExpenseCategory?.name ?? 'None'}
                </strong>
                <small className={`mt-2 block ${mutedTextClass}`}>
                  {insights.topExpenseCategory ? formatCurrency(insights.topExpenseCategory.value) : 'No data yet'}
                </small>
              </article>
              <article className="rounded-[22px] border border-[var(--border-color)] bg-[var(--glass-bg)] p-[18px]">
                <span className={eyebrowClass}>Average move</span>
                <strong className="mt-2.5 block text-[1.2rem]">{formatCurrency(insights.averageTransaction)}</strong>
                <small className={`mt-2 block ${mutedTextClass}`}>Across all transactions</small>
              </article>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Income', formatCurrency(totalIncome), 'Cash inflow across tracked entries', 'text-[var(--income-color)]'],
            ['Expenses', formatCurrency(totalExpenses), 'Outgoing spend from all categories', 'text-[var(--expense-color)]'],
            ['Net balance', formatCurrency(balance), 'Updated instantly from your store', 'text-[var(--text-color)]'],
            [
              'Biggest movement',
              largestTransaction ? formatCurrency(largestTransaction.amount) : formatCurrency(0),
              largestTransaction ? largestTransaction.description : 'Add more transactions to unlock insights',
              'text-[var(--text-color)]',
            ],
          ].map(([label, value, footnote, valueClass]) => (
            <article className={`${panelClass} p-[22px]`} key={label}>
              <div className={`${eyebrowClass} text-[0.72rem]`}>{label}</div>
              <div className={`mt-2.5 text-[clamp(1.5rem,2.8vw,2.2rem)] font-bold tracking-[-0.04em] ${valueClass}`}>
                {value}
              </div>
              <div className={`mt-2.5 text-[0.94rem] leading-6 ${mutedTextClass}`}>{footnote}</div>
            </article>
          ))}
        </section>

        <section className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.82fr)]">
          <section className={`${panelClass} min-w-0 p-6`}>
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className={eyebrowClass}>Trend View</span>
                <h2 className={sectionTitleClass}>Cashflow over time</h2>
              </div>
              <p className={`text-sm leading-6 lg:max-w-[26ch] ${mutedTextClass}`}>
                Income and expense movement by transaction date.
              </p>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff7a59" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#ff7a59" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--grid-line)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                    tick={{ fill: 'var(--muted-text)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatCompactCurrency}
                    tick={{ fill: 'var(--muted-text)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={formatChartDate}
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '18px',
                      color: 'var(--text-color)',
                    }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#34d399" fill="url(#incomeFill)" strokeWidth={3} />
                  <Area type="monotone" dataKey="expenses" stroke="#ff7a59" fill="url(#expenseFill)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <aside className="grid gap-6">
            <section className={`${panelClass} p-6`}>
              <div className="mb-5">
                <span className={eyebrowClass}>Highlights</span>
                <h2 className={sectionTitleClass}>Quick insights</h2>
              </div>

              <div className="grid gap-3">
                {[
                  ['Savings rate', formatPercent(insights.savingsRate), 'Based on total income versus total expenses.'],
                  ['Transactions', `${insights.transactionCount}`, 'Total records currently stored in the API.'],
                  [
                    'Top category',
                    insights.topExpenseCategory?.name ?? 'No data',
                    insights.topExpenseCategory
                      ? `${formatCurrency(insights.topExpenseCategory.value)} spent here so far.`
                      : 'Once you add expense data, this card will update.',
                  ],
                ].map(([label, value, copy]) => (
                  <article
                    className="rounded-[20px] border border-[var(--border-color)] bg-[var(--soft-bg)] p-[18px]"
                    key={label}
                  >
                    <span className={eyebrowClass}>{label}</span>
                    <strong className="my-3 block text-2xl tracking-[-0.04em] capitalize">{value}</strong>
                    <p className={`text-sm leading-6 ${mutedTextClass}`}>{copy}</p>
                  </article>
                ))}
              </div>
            </section>
          </aside>

          <section className={`${panelClass} col-span-full p-6`}>
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className={eyebrowClass}>Breakdown</span>
                <h2 className={sectionTitleClass}>Expense categories</h2>
              </div>
              <p className={`text-sm leading-6 lg:max-w-[26ch] ${mutedTextClass}`}>
                See where most of your spending goes.
              </p>
            </div>

            <div className="grid items-center gap-[18px] lg:grid-cols-[minmax(220px,0.9fr)_minmax(0,1fr)]">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseByCategory} dataKey="value" nameKey="name" innerRadius={68} outerRadius={96} paddingAngle={4}>
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'var(--tooltip-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '18px',
                        color: 'var(--text-color)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-3">
                {expenseByCategory.length > 0 ? (
                  expenseByCategory.map((entry, index) => (
                    <div
                      className="flex items-center justify-between gap-3 rounded-[18px] bg-[var(--soft-bg)] px-4 py-[14px]"
                      key={entry.name}
                    >
                      <div className="inline-flex items-center gap-2.5 capitalize">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: pieColors[index % pieColors.length] }}
                        />
                        <span>{entry.name}</span>
                      </div>
                      <strong>{formatCurrency(entry.value)}</strong>
                    </div>
                  ))
                ) : (
                  <p className={`text-sm leading-6 ${mutedTextClass}`}>Add some expenses to generate a category chart.</p>
                )}
              </div>
            </div>
          </section>
        </section>

        <section className={`${panelClass} p-6`}>
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
              <div>
                <span className={eyebrowClass}>Ledger</span>
                <h2 className={sectionTitleClass}>Transaction activity</h2>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap xl:flex-nowrap">
              <input
                className={`${inputClass} min-w-full md:min-w-80`}
                type="search"
                placeholder="Search description, date, or category"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <select className={inputClass} value={filters.type} onChange={(event) => dispatch(setFilterType(event.target.value))}>
                <option value="all">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <select
                className={inputClass}
                value={filters.category}
                onChange={(event) => dispatch(setFilterCategory(event.target.value))}
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoadingTransactions ? (
            <div className={`rounded-2xl border border-[var(--border-color)] bg-[var(--soft-bg)] px-4 py-6 text-center ${mutedTextClass}`}>
              Loading transactions from the API...
            </div>
          ) : (
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
              <div className="flex-1 overflow-auto rounded-[20px] border border-[var(--border-color)] bg-[var(--table-bg)]">
                <table className="w-full border-collapse">
                  <thead className="bg-[var(--table-head-bg)]">
                    <tr>
                      {['Date', 'Description', 'Category', 'Type', 'Amount', 'Action'].map((heading) => (
                        <th
                          className={`border-b border-[var(--border-color)] px-[18px] py-4 text-left text-[0.77rem] uppercase tracking-[0.14em] ${mutedTextClass}`}
                          key={heading}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {searchedTransactions.length > 0 ? (
                      searchedTransactions
                        .slice()
                        .sort((left, right) => new Date(right.date) - new Date(left.date))
                        .map((transaction) => {
                          const isDeletingTransaction = deletingTransactionIds.includes(Number(transaction.id))

                          return (
                          <tr className="transition hover:bg-[var(--row-hover)]" key={transaction.id}>
                            <td className="border-b border-[var(--border-color)] px-[18px] py-4 max-[720px]:px-3">
                              {formatChartDate(transaction.date)}
                            </td>
                            <td className="border-b border-[var(--border-color)] px-[18px] py-4 max-[720px]:px-3">
                              {transaction.description}
                            </td>
                            <td className="border-b border-[var(--border-color)] px-[18px] py-4 max-[720px]:px-3">
                              <span className="inline-flex min-h-8 items-center rounded-full bg-[var(--soft-bg)] px-3 text-sm font-bold capitalize">
                                {transaction.category}
                              </span>
                            </td>
                            <td className="border-b border-[var(--border-color)] px-[18px] py-4 max-[720px]:px-3">
                              <span
                                className={`inline-flex min-h-8 items-center rounded-full px-3 text-sm font-bold capitalize ${
                                  transaction.type === 'income'
                                    ? 'bg-emerald-400/15 text-[var(--income-color)]'
                                    : 'bg-[rgba(255,122,89,0.14)] text-[var(--expense-color)]'
                                }`}
                              >
                                {transaction.type}
                              </span>
                            </td>
                            <td
                              className={`border-b border-[var(--border-color)] px-[18px] py-4 font-semibold max-[720px]:px-3 ${
                                transaction.type === 'income'
                                  ? 'text-[var(--income-color)]'
                                  : 'text-[var(--expense-color)]'
                              }`}
                            >
                              {transaction.type === 'income' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="border-b border-[var(--border-color)] px-[18px] py-4 max-[720px]:px-3">
                              <button
                                type="button"
                                className="inline-flex min-h-9 items-center rounded-full border border-rose-400/25 bg-rose-500/10 px-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                disabled={isDeletingTransaction}
                              >
                                {isDeletingTransaction ? 'Deleting...' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        )})
                    ) : (
                      <tr>
                        <td className={`px-[18px] py-9 text-center ${mutedTextClass}`} colSpan="6">
                          No transactions match the current filters or search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rounded-[20px] border border-[var(--border-color)] bg-[var(--soft-bg)] p-[18px] xl:w-[32%] xl:min-w-[280px]">
                <h3 className="mb-3.5 text-[1.45rem] tracking-[-0.04em]">Recent activity</h3>
                {recentTransactions.map((transaction, index) => (
                  <article
                    className={`flex items-center justify-between gap-3 ${index > 0 ? 'mt-4 border-t border-[var(--border-color)] pt-4' : ''}`}
                    key={transaction.id}
                  >
                    <div>
                      <strong className="mb-1.5 block">{transaction.description}</strong>
                      <p className={`text-sm leading-6 ${mutedTextClass}`}>
                        {transaction.category} • {formatChartDate(transaction.date)}
                      </p>
                    </div>
                    <span className={transaction.type === 'income' ? 'text-[var(--income-color)]' : 'text-[var(--expense-color)]'}>
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
