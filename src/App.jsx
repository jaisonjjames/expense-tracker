import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import './App.css'
import {
  addTransaction,
  selectBalance,
  selectFilteredTransactions,
  selectFilters,
  selectTotalExpenses,
  selectTotalIncome,
  setFilterCategory,
  setFilterType,
} from './features/transactions/transactionsSlice'

function App() {
  const dispatch = useDispatch();
  const totalIncome = useSelector(selectTotalIncome);
  const totalExpenses = useSelector(selectTotalExpenses);
  const balance = useSelector(selectBalance);
  const filteredTransactions = useSelector(selectFilteredTransactions);
  const filters = useSelector(selectFilters);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("food");

  const categories = ["food", "housing", "utilities", "transport", "entertainment", "salary", "other"];
  const formatCurrency = (value) => Number(value).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = Number.parseFloat(amount);
    if (!description || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newTransaction = {
      id: Date.now(),
      description,
      amount: parsedAmount,
      type,
      category,
      date: new Date().toISOString().split('T')[0],
    };

    dispatch(addTransaction(newTransaction));
    setDescription("");
    setAmount("");
    setType("expense");
    setCategory("food");
  };


  return (
    <div className="app">
      <h1>Finance Tracker</h1>
      <p className="subtitle">Track your income and expenses</p>

      <div className="summary">
        <div className="summary-card">
          <h3>Income</h3>
          <p className="income-amount">${formatCurrency(totalIncome)}</p>
        </div>
        <div className="summary-card">
          <h3>Expenses</h3>
          <p className="expense-amount">${formatCurrency(totalExpenses)}</p>
        </div>
        <div className="summary-card">
          <h3>Balance</h3>
          <p className="balance-amount">${formatCurrency(balance)}</p>
        </div>
      </div>

      <div className="add-transaction">
        <h2>Add Transaction</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button type="submit">Add</button>
        </form>
      </div>

      <div className="transactions">
        <h2>Transactions</h2>
        <div className="filters">
          <select value={filters.type} onChange={(e) => dispatch(setFilterType(e.target.value))}>
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={filters.category} onChange={(e) => dispatch(setFilterCategory(e.target.value))}>
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>

            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map(t => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>{t.description}</td>
                <td>{t.category}</td>
                <td className={t.type === "income" ? "income-amount" : "expense-amount"}>
                  {t.type === "income" ? "+" : "-"}${formatCurrency(t.amount)}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App
