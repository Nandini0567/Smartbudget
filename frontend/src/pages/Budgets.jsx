import { useState, useEffect, useCallback } from "react";
import { budgetService, authService } from "../api/api";

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [analysis, setAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${mm}`;
  });
  const [formError, setFormError] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const userId = authService.getUserId();

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Number(val) || 0);
  };

  const loadBudgetData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");

    try {
      const [budgetRes, analysisRes] = await Promise.allSettled([
        budgetService.getAll(userId),
        budgetService.getAnalysis(userId),
      ]);

      if (budgetRes.status === "fulfilled" && Array.isArray(budgetRes.value)) {
        setBudgets(budgetRes.value);
      }
      if (analysisRes.status === "fulfilled" && Array.isArray(analysisRes.value)) {
        setAnalysis(analysisRes.value);
      }

      if (budgetRes.status === "rejected" && analysisRes.status === "rejected") {
        throw new Error(budgetRes.reason?.message || "Failed to load budget records.");
      }
    } catch (err) {
      console.error("Error loading budgets:", err);
      setError(err.message || "Failed to load budget data.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

  const resetForm = () => {
    setEditingId(null);
    setCategory("");
    setAmount("");
    setMonth(() => {
      const d = new Date();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      return `${d.getFullYear()}-${mm}`;
    });
    setFormError("");
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setCategory(item.category);
    setAmount(String(item.amount));
    setMonth(item.month || "");
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (!category.trim()) {
      setFormError("Category is required.");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid positive budget amount.");
      return;
    }
    if (!month.trim()) {
      setFormError("Budget month is required (YYYY-MM).");
      return;
    }

    setSubmitting(true);

    const payload = {
      category: category.trim(),
      amount: numAmount,
      month: month.trim(),
    };

    try {
      if (editingId) {
        await budgetService.update(editingId, userId, payload);
        setSuccessMsg("Budget limit updated successfully!");
      } else {
        await budgetService.create(userId, payload);
        setSuccessMsg("Budget limit created successfully!");
      }
      resetForm();
      await loadBudgetData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Budget save error:", err);
      setFormError(err.message || "Failed to save budget.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await budgetService.delete(deleteTarget.id, userId);
      setSuccessMsg("Budget deleted successfully.");
      setDeleteTarget(null);
      await loadBudgetData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Delete failed:", err);
      setError(err.message || "Failed to delete budget.");
    } finally {
      setDeleting(false);
    }
  };

  const totalBudgeted = budgets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Budget Management</h1>
          <p className="page-subtitle">Set category thresholds and track monthly spending targets</p>
        </div>
        <div className="header-stat-badge budget">
          <span className="stat-label">Total Allocated</span>
          <span className="stat-value">{formatCurrency(totalBudgeted)}</span>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Budget Form Card */}
      <div className="form-card">
        <div className="card-title-bar">
          <h2 className="card-heading">
            {editingId ? "Edit Budget Limit" : "Create New Budget"}
          </h2>
          {editingId && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>

        {formError && (
          <div className="form-error-banner">
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="entry-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="budget-category">Category *</label>
              <input
                id="budget-category"
                type="text"
                list="budget-category-options"
                placeholder="e.g., Food, Groceries, Rent, Utilities"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
                required
              />
              <datalist id="budget-category-options">
                <option value="Food" />
                <option value="Groceries" />
                <option value="Rent" />
                <option value="Utilities" />
                <option value="Entertainment" />
                <option value="Transportation" />
                <option value="Health" />
                <option value="Shopping" />
              </datalist>
            </div>

            <div className="form-group">
              <label htmlFor="budget-amount">Budget Limit ($) *</label>
              <input
                id="budget-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="budget-month">Target Month (YYYY-MM) *</label>
              <input
                id="budget-month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="btn-loading-content">
                  <span className="spinner"></span>
                  <span>Saving...</span>
                </span>
              ) : editingId ? (
                "Update Budget"
              ) : (
                "Set Budget"
              )}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={resetForm}
                disabled={submitting}
              >
                Discard Changes
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Live Budget Analysis / Progress Cards */}
      <div className="section-card">
        <div className="card-title-bar">
          <h2 className="card-heading">Live Budget Analysis & Spending Progress</h2>
          <span className="card-hint">
            Aggregates actual expenses matching each category & month
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Evaluating budget utilization...</p>
          </div>
        ) : analysis.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No budget analysis available</h3>
            <p>Create budget limits above to monitor your category spending progress.</p>
          </div>
        ) : (
          <div className="budget-cards-grid">
            {analysis.map((item, index) => {
              const usage = Math.min(Number(item.usagePercentage) || 0, 100);
              const status = String(item.status || "SAFE").toUpperCase();
              let statusClass = "badge-safe";
              if (status.includes("OVER")) statusClass = "badge-danger";
              else if (status.includes("WARN")) statusClass = "badge-warning";

              return (
                <div key={`${item.category}-${index}`} className="budget-analysis-card">
                  <div className="budget-card-header">
                    <h3 className="budget-card-category">{item.category}</h3>
                    <span className={`status-badge ${statusClass}`}>{item.status}</span>
                  </div>

                  <div className="budget-card-stats">
                    <div className="stat-col">
                      <span className="stat-col-label">Budget</span>
                      <span className="stat-col-val">{formatCurrency(item.budget)}</span>
                    </div>
                    <div className="stat-col">
                      <span className="stat-col-label">Spent</span>
                      <span className="stat-col-val text-danger">{formatCurrency(item.spent)}</span>
                    </div>
                    <div className="stat-col">
                      <span className="stat-col-label">Remaining</span>
                      <span className={`stat-col-val ${Number(item.remaining) >= 0 ? "text-success" : "text-danger"}`}>
                        {formatCurrency(item.remaining)}
                      </span>
                    </div>
                  </div>

                  <div className="progress-bar-track large">
                    <div
                      className={`progress-bar-fill ${statusClass}`}
                      style={{ width: `${usage}%` }}
                    ></div>
                  </div>

                  <div className="budget-card-footer">
                    <span className="usage-detail">
                      {(Number(item.usagePercentage) || 0).toFixed(1)}% of budget utilized
                    </span>
                    {Number(item.remaining) < 0 && (
                      <span className="over-budget-warning">Exceeded limit!</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Configured Budgets Table */}
      <div className="records-card">
        <div className="card-title-bar">
          <h2 className="card-heading">Configured Budgets ({budgets.length})</h2>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading configured budgets...</p>
          </div>
        ) : budgets.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">No budgets recorded yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Budget Limit</th>
                  <th>Month</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => (
                  <tr key={b.id} className={editingId === b.id ? "row-highlight" : ""}>
                    <td className="font-semibold">{b.category}</td>
                    <td className="text-primary font-semibold">{formatCurrency(b.amount)}</td>
                    <td className="text-muted">{b.month}</td>
                    <td className="text-right">
                      <div className="action-buttons">
                        <button
                          className="btn-action edit"
                          onClick={() => handleEditClick(b)}
                          title="Edit budget"
                        >
                          Edit
                        </button>
                        <button
                          className="btn-action delete"
                          onClick={() => setDeleteTarget(b)}
                          title="Delete budget"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">Confirm Deletion</h3>
              <button
                className="modal-close-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete the budget for{" "}
                <strong>{deleteTarget.category}</strong> ({formatCurrency(deleteTarget.amount)}) for month{" "}
                <strong>{deleteTarget.month}</strong>?
              </p>
              <p className="modal-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Budget"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Budgets;
