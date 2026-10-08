import { useState, useEffect, useCallback } from "react";
import { budgetService, authService, expenseService } from "../api/api";

const CATEGORY_EMOJIS = {
  food: "🍔",
  groceries: "🛒",
  rent: "🏠",
  housing: "🏡",
  utilities: "💡",
  transport: "🚗",
  transportation: "🚕",
  entertainment: "🎬",
  health: "🩺",
  medical: "💊",
  shopping: "🛍️",
  education: "📚",
  travel: "✈️",
  other: "💳",
};

function getEmoji(cat) {
  if (!cat) return "💳";
  return CATEGORY_EMOJIS[cat.trim().toLowerCase()] || "💳";
}

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [analysis, setAnalysis] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Period Type: MONTHLY or YEARLY
  const [periodType, setPeriodType] = useState("MONTHLY");

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${mm}`;
  });
  const [year, setYear] = useState(() => new Date().getFullYear().toString());
  const [formError, setFormError] = useState("");

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Archive / Erase to end state
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  // Stored / Archived Year-End Budgets State (saved in localStorage for persistence)
  const userId = authService.getUserId();
  const STORAGE_KEY = `smartbudget_stored_budgets_${userId}`;

  const [storedBudgets, setStoredBudgets] = useState(() => {
    try {
      const saved = localStorage.getItem(`smartbudget_stored_budgets_${authService.getUserId()}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Edit modal for Stored / Archived Budget
  const [editingStoredBudget, setEditingStoredBudget] = useState(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Number(val) || 0);
  };

  // Helper to persist stored budgets
  const saveStoredBudgets = (newList) => {
    setStoredBudgets(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (err) {
      console.error("Failed to persist stored budgets:", err);
    }
  };

  const loadBudgetData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");

    try {
      const [budgetRes, analysisRes, expenseRes] = await Promise.allSettled([
        budgetService.getAll(userId),
        budgetService.getAnalysis(userId),
        expenseService.getAll(userId),
      ]);

      if (budgetRes.status === "fulfilled" && Array.isArray(budgetRes.value)) {
        setBudgets(budgetRes.value);
      }
      if (analysisRes.status === "fulfilled" && Array.isArray(analysisRes.value)) {
        setAnalysis(analysisRes.value);
      }
      if (expenseRes.status === "fulfilled" && Array.isArray(expenseRes.value)) {
        setAllExpenses(expenseRes.value);
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
    setPeriodType("MONTHLY");
    setMonth(() => {
      const d = new Date();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      return `${d.getFullYear()}-${mm}`;
    });
    setYear(new Date().getFullYear().toString());
    setFormError("");
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setCategory(item.category);
    setAmount(String(item.amount));
    if (item.month && item.month.length === 4) {
      setPeriodType("YEARLY");
      setYear(item.month);
    } else {
      setPeriodType("MONTHLY");
      setMonth(item.month || "");
    }
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

    const targetPeriod = periodType === "YEARLY" ? year.trim() : month.trim();
    if (!targetPeriod) {
      setFormError(periodType === "YEARLY" ? "Target year is required (YYYY)." : "Budget month is required (YYYY-MM).");
      return;
    }

    setSubmitting(true);

    const payload = {
      category: category.trim(),
      amount: numAmount,
      month: targetPeriod,
    };

    try {
      if (editingId) {
        await budgetService.update(editingId, userId, payload);
        setSuccessMsg("Budget limit updated successfully!");
      } else {
        await budgetService.create(userId, payload);
        setSuccessMsg(periodType === "YEARLY" ? "Yearly budget created successfully!" : "Monthly budget created successfully!");
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

  // Erase from active and store at end
  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      // Calculate spent amount for this budget from allExpenses
      const matchingExpenses = allExpenses.filter((exp) => {
        const catMatch = exp.category && exp.category.trim().toLowerCase() === archiveTarget.category.trim().toLowerCase();
        const dateMatch = exp.date && exp.date.startsWith(archiveTarget.month);
        return catMatch && dateMatch;
      });
      const spentAmount = matchingExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const usagePct = archiveTarget.amount > 0 ? (spentAmount / archiveTarget.amount) * 100 : 0;
      let finalStatus = "SAFE";
      if (usagePct >= 100) finalStatus = "OVER BUDGET";
      else if (usagePct >= 80) finalStatus = "WARNING";

      const archivedItem = {
        id: "archived_" + Date.now(),
        originalId: archiveTarget.id,
        category: archiveTarget.category,
        amount: archiveTarget.amount,
        month: archiveTarget.month,
        spent: spentAmount,
        remaining: archiveTarget.amount - spentAmount,
        usagePercentage: usagePct,
        status: finalStatus,
        archivedAt: new Date().toLocaleDateString(),
        notes: `Archived from active budget on ${new Date().toLocaleDateString()}`,
      };

      // 1. Delete from active backend budget table (erasing it from active view)
      await budgetService.delete(archiveTarget.id, userId);

      // 2. Add to stored budgets list at the end
      const updatedStored = [archivedItem, ...storedBudgets];
      saveStoredBudgets(updatedStored);

      setSuccessMsg(`Budget for ${archiveTarget.category} erased from active and stored in Year-End Records below!`);
      setArchiveTarget(null);
      await loadBudgetData();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      console.error("Archiving failed:", err);
      setError(err.message || "Failed to archive budget.");
    } finally {
      setArchiving(false);
    }
  };

  // Delete active budget
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

  // Edit Stored Budget Handler
  const handleSaveStoredBudgetEdit = (e) => {
    e.preventDefault();
    if (!editingStoredBudget) return;

    const updatedList = storedBudgets.map((item) => {
      if (item.id === editingStoredBudget.id) {
        const amt = parseFloat(editingStoredBudget.amount) || item.amount;
        const spent = Number(item.spent) || 0;
        const usage = amt > 0 ? (spent / amt) * 100 : 0;
        let st = "SAFE";
        if (usage >= 100) st = "OVER BUDGET";
        else if (usage >= 80) st = "WARNING";

        return {
          ...item,
          category: editingStoredBudget.category,
          amount: amt,
          month: editingStoredBudget.month,
          notes: editingStoredBudget.notes || "",
          remaining: amt - spent,
          usagePercentage: usage,
          status: st,
        };
      }
      return item;
    });

    saveStoredBudgets(updatedList);
    setEditingStoredBudget(null);
    setSuccessMsg("Stored year-end budget updated successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Restore Stored Budget to Active
  const handleRestoreToActive = async (item) => {
    try {
      await budgetService.create(userId, {
        category: item.category,
        amount: item.amount,
        month: item.month,
      });

      // Remove from stored
      const updatedStored = storedBudgets.filter((b) => b.id !== item.id);
      saveStoredBudgets(updatedStored);

      setSuccessMsg(`Budget for ${item.category} restored to active budgets!`);
      await loadBudgetData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Restore failed:", err);
      setError("Failed to restore budget to active.");
    }
  };

  // Delete Stored Budget
  const handleDeleteStoredBudget = (id) => {
    if (!window.confirm("Permanently delete this stored record from archives?")) return;
    const updated = storedBudgets.filter((b) => b.id !== id);
    saveStoredBudgets(updated);
    setSuccessMsg("Stored record deleted.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const totalBudgeted = budgets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Monthly Budget</h1>
          <p className="page-subtitle">Configure financial budgets, monthly thresholds, and live spending tracking</p>
        </div>
        <div className="header-stat-badge budget">
          <span className="stat-label">Active Allocated</span>
          <span className="stat-value">{formatCurrency(totalBudgeted)}</span>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success">
          <div className="alert-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>{successMsg}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          <div className="alert-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Budget Creation & Edit Form Card */}
      <div className="form-card">
        <div className="card-title-bar">
          <div>
            <h2 className="card-heading">
              {editingId ? "Edit Active Budget Limit" : "Create Budget Target"}
            </h2>
            <p className="section-subtitle">Select Monthly or Yearly period to track category spending</p>
          </div>

          <div className="period-toggle-group">
            <button
              type="button"
              className={`period-toggle-btn ${periodType === "MONTHLY" ? "active" : ""}`}
              onClick={() => setPeriodType("MONTHLY")}
            >
              📅 Monthly
            </button>
            <button
              type="button"
              className={`period-toggle-btn ${periodType === "YEARLY" ? "active" : ""}`}
              onClick={() => setPeriodType("YEARLY")}
            >
              🌟 Yearly
            </button>
          </div>
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
                placeholder="e.g., Food, Housing, Utilities, Travel"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
                required
              />
              <datalist id="budget-category-options">
                <option value="Food" />
                <option value="Groceries" />
                <option value="Rent" />
                <option value="Housing" />
                <option value="Utilities" />
                <option value="Entertainment" />
                <option value="Transportation" />
                <option value="Health" />
                <option value="Shopping" />
                <option value="Education" />
                <option value="Travel" />
              </datalist>
            </div>

            <div className="form-group">
              <label htmlFor="budget-amount">
                {periodType === "YEARLY" ? "Yearly Limit ($) *" : "Monthly Limit ($) *"}
              </label>
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

            {periodType === "MONTHLY" ? (
              <div className="form-group">
                <label htmlFor="budget-month">Target Month *</label>
                <input
                  id="budget-month"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="budget-year">Target Year *</label>
                <input
                  id="budget-year"
                  type="number"
                  min="2020"
                  max="2035"
                  step="1"
                  placeholder="e.g., 2026"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            )}
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
                `Set ${periodType === "YEARLY" ? "Yearly" : "Monthly"} Budget`
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
          <div>
            <h2 className="card-heading">Live Budget Analysis & Spending Progress</h2>
            <p className="section-subtitle">Real-time matching against recorded expenses</p>
          </div>
          <span className="status-badge badge-safe">⚡ Live Data</span>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner large"></div>
            <p>Evaluating spending utilization...</p>
          </div>
        ) : analysis.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No active budget analysis</h3>
            <p>Set budget limits above to begin live tracking against your expenses.</p>
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
                    <h3 className="budget-card-category">
                      <span>{getEmoji(item.category)}</span>
                      <span>{item.category}</span>
                    </h3>
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

      {/* Configured Active Budgets Table */}
      <div className="records-card">
        <div className="card-title-bar">
          <div>
            <h2 className="card-heading">Active Configured Budgets ({budgets.length})</h2>
            <p className="section-subtitle">
              Current active budgets. You can erase and store completed/yearly budgets to the Year-End field below.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading configured budgets...</p>
          </div>
        ) : budgets.length === 0 ? (
          <div className="empty-state">
            <p className="empty-text">No active budgets recorded yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Budget Limit</th>
                  <th>Period</th>
                  <th>Type</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => {
                  const isYearly = b.month && b.month.length === 4;
                  return (
                    <tr key={b.id} className={editingId === b.id ? "row-highlight" : ""}>
                      <td className="font-semibold">
                        <span style={{ marginRight: "6px" }}>{getEmoji(b.category)}</span>
                        {b.category}
                      </td>
                      <td className="text-primary font-semibold">{formatCurrency(b.amount)}</td>
                      <td>
                        <span className="category-pill">
                          {isYearly ? `Year ${b.month}` : b.month}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${isYearly ? "badge-warning" : "badge-safe"}`}>
                          {isYearly ? "🌟 Yearly" : "📅 Monthly"}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="action-buttons">
                          <button
                            className="btn-archive-trigger"
                            onClick={() => setArchiveTarget(b)}
                            title="Erase from active and store in Year-End field at the end"
                          >
                            📦 Erase & Store
                          </button>
                          <button
                            className="btn-action edit"
                            onClick={() => handleEditClick(b)}
                            title="Edit this active budget"
                          >
                            Edit
                          </button>
                          <button
                            className="btn-action delete"
                            onClick={() => setDeleteTarget(b)}
                            title="Delete this budget"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================================
          YEAR-END STORED & ARCHIVED BUDGETS FIELD (SHOWN AT END OF PAGE)
          =================================================================== */}
      <div className="archive-section" id="stored-budgets-field">
        <div className="archive-header">
          <div className="archive-title-group">
            <div className="archive-icon-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 8v13H3V8" />
                <path d="M1 3h22v5H1z" />
                <path d="M10 12h4" />
              </svg>
            </div>
            <div>
              <h2 className="archive-title">Stored & Archived Year-End Budgets</h2>
              <p className="archive-desc">
                Completed and yearly budgets erased from active view are preserved here for historical review. You can edit, restore, or delete them.
              </p>
            </div>
          </div>
          <span className="archive-count-pill">
            {storedBudgets.length} Stored {storedBudgets.length === 1 ? "Record" : "Records"}
          </span>
        </div>

        {storedBudgets.length === 0 ? (
          <div className="empty-state-box">
            <p className="empty-text">
              No year-end budgets have been archived yet. Click <strong>"Erase & Store"</strong> on any budget in the active table above to archive it here!
            </p>
          </div>
        ) : (
          <div className="archive-grid">
            {storedBudgets.map((item) => (
              <div key={item.id} className="archived-budget-card">
                <div className="archived-card-header">
                  <h3 className="archived-card-title">
                    <span>{getEmoji(item.category)}</span>
                    <span>{item.category}</span>
                  </h3>
                  <span className="year-pill">
                    {item.month && item.month.length === 4 ? `YEAR ${item.month}` : item.month}
                  </span>
                </div>

                <div className="archived-details-grid">
                  <div className="stat-col">
                    <span className="stat-col-label">Budget Limit</span>
                    <span className="stat-col-val text-primary">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="stat-col">
                    <span className="stat-col-label">Total Spent</span>
                    <span className="stat-col-val text-danger">{formatCurrency(item.spent || 0)}</span>
                  </div>
                  <div className="stat-col">
                    <span className="stat-col-label">Remaining</span>
                    <span className={`stat-col-val ${Number(item.remaining) >= 0 ? "text-success" : "text-danger"}`}>
                      {formatCurrency(item.remaining || 0)}
                    </span>
                  </div>
                  <div className="stat-col">
                    <span className="stat-col-label">Final Status</span>
                    <span className="stat-col-val">
                      <span className={`status-badge ${item.status?.includes("OVER") ? "badge-danger" : item.status?.includes("WARN") ? "badge-warning" : "badge-safe"}`}>
                        {item.status || "SAFE"}
                      </span>
                    </span>
                  </div>
                </div>

                {item.notes && (
                  <p style={{ fontSize: "12.5px", color: "#78350f", fontStyle: "italic" }}>
                    📌 {item.notes}
                  </p>
                )}

                <div className="archived-actions">
                  <button
                    type="button"
                    className="btn-archive-action edit"
                    onClick={() => setEditingStoredBudget({ ...item })}
                    title="Edit stored budget details"
                  >
                    ✏️ Edit Stored
                  </button>
                  <button
                    type="button"
                    className="btn-archive-action restore"
                    onClick={() => handleRestoreToActive(item)}
                    title="Restore back into active budgets"
                  >
                    🔄 Restore
                  </button>
                  <button
                    type="button"
                    className="btn-archive-action delete"
                    onClick={() => handleDeleteStoredBudget(item.id)}
                    title="Permanently remove"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Stored Budget Modal */}
      {editingStoredBudget && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">Edit Stored Year-End Budget</h3>
              <button
                className="modal-close-btn"
                onClick={() => setEditingStoredBudget(null)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveStoredBudgetEdit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>Category</label>
                  <input
                    type="text"
                    value={editingStoredBudget.category}
                    onChange={(e) =>
                      setEditingStoredBudget({
                        ...editingStoredBudget,
                        category: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>Budget Limit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editingStoredBudget.amount}
                    onChange={(e) =>
                      setEditingStoredBudget({
                        ...editingStoredBudget,
                        amount: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label>Period / Year</label>
                  <input
                    type="text"
                    value={editingStoredBudget.month}
                    onChange={(e) =>
                      setEditingStoredBudget({
                        ...editingStoredBudget,
                        month: e.target.value,
                      })
                    }
                    placeholder="e.g., 2026 or 2026-09"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Year-End Notes</label>
                  <input
                    type="text"
                    value={editingStoredBudget.notes || ""}
                    onChange={(e) =>
                      setEditingStoredBudget({
                        ...editingStoredBudget,
                        notes: e.target.value,
                      })
                    }
                    placeholder="e.g., Holiday season expense adjustments"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setEditingStoredBudget(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Stored Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Erase & Store Confirmation Modal */}
      {archiveTarget && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">Erase from Active & Store at End</h3>
              <button
                className="modal-close-btn"
                onClick={() => setArchiveTarget(null)}
                disabled={archiving}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to erase the budget for{" "}
                <strong>{archiveTarget.category}</strong> ({formatCurrency(archiveTarget.amount)}) from active tracking?
              </p>
              <p style={{ marginTop: "10px", color: "#b45309", fontWeight: 600 }}>
                It will be archived and stored at the end of this page in the <strong>Stored & Archived Year-End Budgets</strong> field where you can review, edit, or restore it anytime.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setArchiveTarget(null)}
                disabled={archiving}
              >
                Cancel
              </button>
              <button
                className="btn btn-warning"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white" }}
                onClick={confirmArchive}
                disabled={archiving}
              >
                {archiving ? "Storing..." : "Erase & Store at End"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                Are you sure you want to permanently delete the budget for{" "}
                <strong>{deleteTarget.category}</strong> ({formatCurrency(deleteTarget.amount)})?
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
