import { useState, useEffect, useCallback } from "react";
import { incomeService, authService } from "../api/api";

const SOURCE_EMOJIS = {
  salary: "💼",
  job: "💼",
  freelance: "💻",
  consulting: "💻",
  business: "🏢",
  investments: "📈",
  stocks: "📈",
  dividends: "💵",
  interest: "🪙",
  rental: "🏠",
  gift: "🎁",
  bonus: "🎉",
  refund: "🔁",
  other: "💰",
};

function getSourceEmoji(src) {
  if (!src) return "💰";
  const key = src.trim().toLowerCase();
  for (const [k, emoji] of Object.entries(SOURCE_EMOJIS)) {
    if (key.includes(k)) return emoji;
  }
  return "💰";
}

function Income() {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
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

  const loadIncomes = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");

    try {
      const data = await incomeService.getAll(userId);
      setIncomes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading income:", err);
      setError(err.message || "Failed to load income records.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadIncomes();
  }, [loadIncomes]);

  const resetForm = () => {
    setEditingId(null);
    setSource("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setFormError("");
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setSource(item.source);
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

    if (!source.trim()) {
      setFormError("Income source is required (e.g., Monthly Salary, Freelancing).");
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
      source: source.trim(),
      amount: numAmount,
      date: date,
      description: description.trim(),
    };

    try {
      if (editingId) {
        await incomeService.update(editingId, userId, payload);
        setSuccessMsg("Income record updated successfully!");
      } else {
        await incomeService.create(userId, payload);
        setSuccessMsg("Income record added successfully!");
      }
      resetForm();
      await loadIncomes();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Income save error:", err);
      setFormError(err.message || "Failed to save income record.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await incomeService.delete(deleteTarget.id, userId);
      setSuccessMsg("Income deleted successfully.");
      setDeleteTarget(null);
      await loadIncomes();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Delete failed:", err);
      setError(err.message || "Failed to delete income record.");
    } finally {
      setDeleting(false);
    }
  };

  const totalIncomeAmount = incomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Income Management</h1>
          <p className="page-subtitle">Track and record your various sources of income</p>
        </div>
        <div className="header-stat-badge income">
          <span className="stat-label">Total Earnings</span>
          <span className="stat-value">{formatCurrency(totalIncomeAmount)}</span>
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

      {/* Income Form Card */}
      <div className="form-card">
        <div className="card-title-bar">
          <div>
            <h2 className="card-heading">
              {editingId ? "Edit Income Entry" : "Record New Income"}
            </h2>
            <p className="section-subtitle">Log salary, freelance work, dividends, or other inflows</p>
          </div>
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
              <label htmlFor="income-source">Income Source *</label>
              <input
                id="income-source"
                type="text"
                list="income-suggestions"
                placeholder="e.g., Monthly Salary, Freelancing, Dividends"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                disabled={submitting}
                required
              />
              <datalist id="income-suggestions">
                <option value="Monthly Salary" />
                <option value="Freelancing" />
                <option value="Consulting" />
                <option value="Investments" />
                <option value="Dividends" />
                <option value="Rental Income" />
                <option value="Bonus" />
              </datalist>
            </div>

            <div className="form-group">
              <label htmlFor="income-amount">Amount ($) *</label>
              <input
                id="income-amount"
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
              <label htmlFor="income-date">Date Received *</label>
              <input
                id="income-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="income-description">Description (Optional)</label>
              <input
                id="income-description"
                type="text"
                placeholder="Additional notes or payment reference"
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
                "Update Income"
              ) : (
                "+ Add Income"
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

      {/* Income Records List */}
      <div className="records-card">
        <div className="card-title-bar">
          <div>
            <h2 className="card-heading">Income History ({incomes.length})</h2>
            <p className="section-subtitle">Chronological ledger of your incoming funds</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading income records...</p>
          </div>
        ) : incomes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h3>No income records found</h3>
            <p>Use the form above to record your first income stream.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((item) => (
                  <tr key={item.id} className={editingId === item.id ? "row-highlight" : ""}>
                    <td className="font-semibold">
                      <span style={{ marginRight: "8px" }}>{getSourceEmoji(item.source)}</span>
                      {item.source}
                    </td>
                    <td className="text-success font-semibold">{formatCurrency(item.amount)}</td>
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
                Are you sure you want to delete the income record for{" "}
                <strong>{deleteTarget.source}</strong> ({formatCurrency(deleteTarget.amount)})?
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
                {deleting ? "Deleting..." : "Delete Income"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Income;
