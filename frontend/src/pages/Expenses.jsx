import { useState, useEffect, useCallback, useMemo } from "react";
import { expenseService, authService } from "../api/api";

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  // Filter & Search State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Helper to normalize category name for case-insensitive display & aggregation
  const normalizeCategory = (cat) => {
    if (!cat) return "Other";
    const trimmed = cat.trim();
    if (!trimmed) return "Other";
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  const loadExpenses = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");

    try {
      const data = await expenseService.getAll(userId);
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading expenses:", err);
      setError(err.message || "Failed to load expense records.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const resetForm = () => {
    setEditingId(null);
    setCategory("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setFormError("");
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setCategory(item.category);
    setAmount(String(item.amount));
    setDate(item.date || new Date().toISOString().split("T")[0]);
    setDescription(item.description || "");
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");

    if (!category.trim()) {
      setFormError("Category is required (e.g., Food, Housing, Utilities).");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid positive amount.");
      return;
    }
    if (!date) {
      setFormError("Date is required.");
      return;
    }

    setSubmitting(true);

    const payload = {
      category: category.trim(),
      amount: numAmount,
      date: date,
      description: description.trim(),
    };

    try {
      if (editingId) {
        await expenseService.update(editingId, userId, payload);
        setSuccessMsg("Expense record updated successfully!");
      } else {
        await expenseService.create(userId, payload);
        setSuccessMsg("Expense record added successfully!");
      }
      resetForm();
      await loadExpenses();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Expense save error:", err);
      setFormError(err.message || "Failed to save expense record.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await expenseService.delete(deleteTarget.id, userId);
      setSuccessMsg("Expense deleted successfully.");
      setDeleteTarget(null);
      await loadExpenses();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Delete failed:", err);
      setError(err.message || "Failed to delete expense record.");
    } finally {
      setDeleting(false);
    }
  };

  // Case-insensitive category aggregation
  const aggregatedCategories = useMemo(() => {
    const map = new Map();
    expenses.forEach((item) => {
      const normalized = normalizeCategory(item.category);
      const current = map.get(normalized) || 0;
      map.set(normalized, current + (Number(item.amount) || 0));
    });
    return Array.from(map.entries()).map(([cat, total]) => ({ category: cat, total }));
  }, [expenses]);

  // Filtered list
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const normalized = normalizeCategory(item.category);
      const matchesCategory =
        selectedCategoryFilter === "ALL" || normalized === selectedCategoryFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        normalized.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [expenses, selectedCategoryFilter, searchQuery]);

  const totalExpenseAmount = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expense Management</h1>
          <p className="page-subtitle">Track, categorize, and control your daily expenditures</p>
        </div>
        <div className="header-stat-badge expense">
          <span className="stat-label">Total Outflow</span>
          <span className="stat-value">{formatCurrency(totalExpenseAmount)}</span>
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

      {/* Category Quick Chips */}
      {aggregatedCategories.length > 0 && (
        <div className="category-chips-bar">
          <span className="chips-label">Categories:</span>
          <button
            type="button"
            className={`chip-btn ${selectedCategoryFilter === "ALL" ? "active" : ""}`}
            onClick={() => setSelectedCategoryFilter("ALL")}
          >
            All ({expenses.length})
          </button>
          {aggregatedCategories.map((c) => (
            <button
              key={c.category}
              type="button"
              className={`chip-btn ${selectedCategoryFilter === c.category ? "active" : ""}`}
              onClick={() => setSelectedCategoryFilter(c.category)}
            >
              {c.category} <span className="chip-amt">{formatCurrency(c.total)}</span>
            </button>
          ))}
        </div>
      )}

      {/* Expense Form Card */}
      <div className="form-card">
        <div className="card-title-bar">
          <h2 className="card-heading">
            {editingId ? "Edit Expense Entry" : "Add New Expense"}
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
              <label htmlFor="expense-category">Category *</label>
              <input
                id="expense-category"
                type="text"
                list="category-suggestions"
                placeholder="e.g., Food, Groceries, Rent, Transport"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
                required
              />
              <datalist id="category-suggestions">
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
              <label htmlFor="expense-amount">Amount ($) *</label>
              <input
                id="expense-amount"
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
              <label htmlFor="expense-date">Expense Date *</label>
              <input
                id="expense-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="expense-description">Description (Optional)</label>
              <input
                id="expense-description"
                type="text"
                placeholder="Details (e.g., Dinner with friends, weekly market)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
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
                "Update Expense"
              ) : (
                "Add Expense"
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

      {/* Expense Records List */}
      <div className="records-card">
        <div className="card-title-bar search-bar-row">
          <h2 className="card-heading">
            Expense Records ({filteredExpenses.length})
          </h2>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading expenses...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <h3>No expenses found</h3>
            <p>
              {expenses.length === 0
                ? "Record your first expense above to start tracking your budget."
                : "No expenses match the selected filters."}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((item) => (
                  <tr key={item.id} className={editingId === item.id ? "row-highlight" : ""}>
                    <td>
                      <span className="category-pill">{normalizeCategory(item.category)}</span>
                    </td>
                    <td className="text-danger font-semibold">{formatCurrency(item.amount)}</td>
                    <td className="text-muted">{item.date}</td>
                    <td className="text-secondary">{item.description || "—"}</td>
                    <td className="text-right">
                      <div className="action-buttons">
                        <button
                          className="btn-action edit"
                          onClick={() => handleEditClick(item)}
                          title="Edit this entry"
                        >
                          Edit
                        </button>
                        <button
                          className="btn-action delete"
                          onClick={() => setDeleteTarget(item)}
                          title="Delete this entry"
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
                Are you sure you want to delete the expense for{" "}
                <strong>{normalizeCategory(deleteTarget.category)}</strong> (
                {formatCurrency(deleteTarget.amount)})?
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
                {deleting ? "Deleting..." : "Delete Expense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Expenses;
