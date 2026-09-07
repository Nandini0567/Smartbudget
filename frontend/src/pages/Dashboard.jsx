import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { dashboardService, budgetService, authService } from "../api/api";
import SummaryCard from "../components/SummaryCard";
import ExpenseChart from "../components/ExpenseChart";

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0 });
  const [categoryExpenses, setCategoryExpenses] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [budgetAnalysis, setBudgetAnalysis] = useState([]);

  const userId = authService.getUserId();
  const user = authService.getUser();

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Number(val) || 0);
  };

  const fetchDashboardData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError("");

    try {
      // Execute parallel calls to backend APIs
      const [sumRes, catRes, monthRes, budgetRes] = await Promise.allSettled([
        dashboardService.getSummary(userId),
        dashboardService.getCategoryExpenses(userId),
        dashboardService.getMonthlySummary(userId),
        budgetService.getAnalysis(userId),
      ]);

      if (sumRes.status === "fulfilled" && sumRes.value) {
        setSummary({
          totalIncome: Number(sumRes.value.totalIncome) || 0,
          totalExpenses: Number(sumRes.value.totalExpenses) || 0,
          balance: (Number(sumRes.value.totalIncome) || 0) - (Number(sumRes.value.totalExpenses) || 0),
        });
      }

      if (catRes.status === "fulfilled" && Array.isArray(catRes.value)) {
        setCategoryExpenses(catRes.value);
      }

      if (monthRes.status === "fulfilled" && Array.isArray(monthRes.value)) {
        setMonthlySummary(monthRes.value);
      }

      if (budgetRes.status === "fulfilled" && Array.isArray(budgetRes.value)) {
        setBudgetAnalysis(budgetRes.value);
      }

      // If all failed, show error
      if (
        sumRes.status === "rejected" &&
        catRes.status === "rejected" &&
        monthRes.status === "rejected"
      ) {
        throw new Error(sumRes.reason?.message || "Failed to connect to backend server.");
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard data. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Month-to-Month Comparison calculations
  const calculateComparison = () => {
    if (!monthlySummary || monthlySummary.length < 1) {
      return null;
    }

    const current = monthlySummary[monthlySummary.length - 1];
    const previous = monthlySummary.length >= 2 ? monthlySummary[monthlySummary.length - 2] : null;

    const currentIncome = Number(current.income || 0);
    const previousIncome = previous ? Number(previous.income || 0) : 0;

    const currentExpenses = Number(current.expenses || 0);
    const previousExpenses = previous ? Number(previous.expenses || 0) : 0;

    const currentSavings = Number(current.savings || 0);
    const previousSavings = previous ? Number(previous.savings || 0) : 0;

    const getChange = (prev, curr, reverseGood = false) => {
      if (prev === 0 && curr === 0) {
        return { text: "0.0%", type: "neutral" };
      }
      if (prev === 0) {
        return { text: "+100% (New)", type: reverseGood ? "negative" : "positive" };
      }
      const pct = ((curr - prev) / prev) * 100;
      const isPositive = pct > 0;
      const formatted = `${isPositive ? "+" : ""}${pct.toFixed(1)}%`;

      let changeType = "neutral";
      if (pct > 0) {
        changeType = reverseGood ? "negative" : "positive";
      } else if (pct < 0) {
        changeType = reverseGood ? "positive" : "negative";
      }

      return { text: formatted, type: changeType };
    };

    return {
      currentMonth: current.month,
      previousMonth: previous ? previous.month : "Previous Period",
      income: {
        current: currentIncome,
        previous: previousIncome,
        change: getChange(previousIncome, currentIncome, false),
      },
      expenses: {
        current: currentExpenses,
        previous: previousExpenses,
        change: getChange(previousExpenses, currentExpenses, true), // for expenses, lower is better
      },
      savings: {
        current: currentSavings,
        previous: previousSavings,
        change: getChange(previousSavings, currentSavings, false),
      },
    };
  };

  const comparison = calculateComparison();

  return (
    <div className="dashboard-container">
      {/* Page Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Financial Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, <strong>{user.name}</strong>. Here is your financial snapshot.
          </p>
        </div>

        <div className="quick-actions">
          <Link to="/income" className="btn btn-outline-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Income</span>
          </Link>
          <Link to="/expenses" className="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Expense</span>
          </Link>
          <Link to="/budgets" className="btn btn-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
            <span>Set Budget</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <div className="alert-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
          <button className="btn btn-sm btn-outline-danger" onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="dashboard-loading">
          <div className="spinner large"></div>
          <p>Loading financial insights...</p>
        </div>
      ) : (
        <>
          {/* Top Summary Metric Cards */}
          <div className="summary-grid">
            <SummaryCard
              title="Total Income"
              amount={summary.totalIncome}
              type="income"
              subtitle="All recorded earnings"
            />
            <SummaryCard
              title="Total Expenses"
              amount={summary.totalExpenses}
              type="expense"
              subtitle="All recorded expenditures"
            />
            <SummaryCard
              title="Available Balance"
              amount={summary.balance}
              type="balance"
              subtitle="Total Income - Total Expenses"
            />
          </div>

          {/* Month-to-Month Comparison Section */}
          {comparison && (
            <div className="section-card comparison-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Month-to-Month Performance</h2>
                  <p className="section-subtitle">
                    Comparing <strong>{comparison.currentMonth}</strong> against{" "}
                    <strong>{comparison.previousMonth}</strong>
                  </p>
                </div>
              </div>

              <div className="comparison-grid">
                <div className="comparison-card">
                  <div className="comparison-label">Monthly Income</div>
                  <div className="comparison-values">
                    <span className="current-val">{formatCurrency(comparison.income.current)}</span>
                    <span className="prev-val">prev: {formatCurrency(comparison.income.previous)}</span>
                  </div>
                  <div className={`trend-badge trend-${comparison.income.change.type}`}>
                    {comparison.income.change.type === "positive" ? "↑ " : comparison.income.change.type === "negative" ? "↓ " : "• "}
                    {comparison.income.change.text}
                  </div>
                </div>

                <div className="comparison-card">
                  <div className="comparison-label">Monthly Expenses</div>
                  <div className="comparison-values">
                    <span className="current-val">{formatCurrency(comparison.expenses.current)}</span>
                    <span className="prev-val">prev: {formatCurrency(comparison.expenses.previous)}</span>
                  </div>
                  <div className={`trend-badge trend-${comparison.expenses.change.type}`}>
                    {comparison.expenses.change.type === "positive" ? "↓ " : comparison.expenses.change.type === "negative" ? "↑ " : "• "}
                    {comparison.expenses.change.text}
                  </div>
                </div>

                <div className="comparison-card">
                  <div className="comparison-label">Monthly Savings</div>
                  <div className="comparison-values">
                    <span className="current-val">{formatCurrency(comparison.savings.current)}</span>
                    <span className="prev-val">prev: {formatCurrency(comparison.savings.previous)}</span>
                  </div>
                  <div className={`trend-badge trend-${comparison.savings.change.type}`}>
                    {comparison.savings.change.type === "positive" ? "↑ " : comparison.savings.change.type === "negative" ? "↓ " : "• "}
                    {comparison.savings.change.text}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Visual Breakdown & Budget Overview Grid */}
          <div className="dashboard-two-col">
            {/* Expense Breakdown & Chart */}
            <div className="section-card">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Expense Breakdown</h2>
                  <p className="section-subtitle">Distribution across categories</p>
                </div>
                <Link to="/expenses" className="section-link">
                  Manage Expenses &rarr;
                </Link>
              </div>

              <ExpenseChart expenses={categoryExpenses} />
            </div>

            {/* Budget Overview */}
            <div className="section-card">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Budget Overview</h2>
                  <p className="section-subtitle">Current month tracking & limits</p>
                </div>
                <Link to="/budgets" className="section-link">
                  All Budgets &rarr;
                </Link>
              </div>

              {budgetAnalysis.length === 0 ? (
                <div className="empty-state-box">
                  <p className="empty-text">No active budget limits configured.</p>
                  <Link to="/budgets" className="btn btn-sm btn-primary">
                    Create a Budget
                  </Link>
                </div>
              ) : (
                <div className="budget-overview-list">
                  {budgetAnalysis.slice(0, 5).map((budget, idx) => {
                    const usage = Math.min(Number(budget.usagePercentage) || 0, 100);
                    const status = String(budget.status || "SAFE").toUpperCase();
                    let statusClass = "badge-safe";
                    if (status.includes("OVER")) statusClass = "badge-danger";
                    else if (status.includes("WARN")) statusClass = "badge-warning";

                    return (
                      <div key={`${budget.category}-${idx}`} className="budget-progress-item">
                        <div className="budget-item-header">
                          <span className="budget-category-title">{budget.category}</span>
                          <span className={`status-badge ${statusClass}`}>{budget.status}</span>
                        </div>

                        <div className="budget-metric-row">
                          <span>Spent: {formatCurrency(budget.spent)}</span>
                          <span>Limit: {formatCurrency(budget.budget)}</span>
                        </div>

                        <div className="progress-bar-track">
                          <div
                            className={`progress-bar-fill ${statusClass}`}
                            style={{ width: `${usage}%` }}
                          ></div>
                        </div>

                        <div className="budget-remaining-text">
                          {Number(budget.remaining) >= 0 ? (
                            <span>{formatCurrency(budget.remaining)} remaining</span>
                          ) : (
                            <span className="text-danger">
                              {formatCurrency(Math.abs(budget.remaining))} over limit
                            </span>
                          )}
                          <span className="usage-pct-pill">{(Number(budget.usagePercentage) || 0).toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Monthly Performance History Table */}
          <div className="section-card">
            <div className="section-header">
              <div>
                <h2 className="section-title">Monthly Performance History</h2>
                <p className="section-subtitle">Aggregated income, expense and savings trend</p>
              </div>
            </div>

            {monthlySummary.length === 0 ? (
              <p className="empty-table-text">No historical monthly data recorded yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Income</th>
                      <th>Expenses</th>
                      <th>Savings</th>
                      <th>Savings Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlySummary.map((item, idx) => {
                      const income = Number(item.income) || 0;
                      const savings = Number(item.savings) || 0;
                      const rate = income > 0 ? ((savings / income) * 100).toFixed(1) : "0.0";

                      return (
                        <tr key={`${item.month}-${idx}`}>
                          <td className="font-semibold">{item.month}</td>
                          <td className="text-success font-medium">{formatCurrency(item.income)}</td>
                          <td className="text-danger font-medium">{formatCurrency(item.expenses)}</td>
                          <td className={savings >= 0 ? "text-primary font-semibold" : "text-danger font-semibold"}>
                            {formatCurrency(item.savings)}
                          </td>
                          <td>
                            <span className={`rate-badge ${Number(rate) > 20 ? "good" : Number(rate) > 0 ? "ok" : "low"}`}>
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
