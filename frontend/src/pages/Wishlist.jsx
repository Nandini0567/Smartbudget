import { useState, useEffect, useCallback, useMemo } from "react";
import { dashboardService, authService } from "../api/api";

const CATEGORY_EMOJIS = {
  electronics: "💻",
  gadgets: "📱",
  home: "🛋️",
  furniture: "🪑",
  travel: "✈️",
  vacation: "🏖️",
  vehicle: "🚗",
  car: "🚙",
  fashion: "👟",
  clothing: "👗",
  health: "💪",
  fitness: "🏋️",
  education: "📚",
  gaming: "🎮",
  appliances: "🧺",
  other: "🎁",
};

function getCategoryEmoji(cat) {
  if (!cat) return "🎁";
  const key = cat.trim().toLowerCase();
  for (const [k, emoji] of Object.entries(CATEGORY_EMOJIS)) {
    if (key.includes(k)) return emoji;
  }
  return "🎁";
}

function Wishlist() {
  const userId = authService.getUserId();
  const STORAGE_KEY = `smartbudget_wishlist_${userId}`;

  // Current financial savings fetched from backend
  const [savings, setSavings] = useState(0);
  const [loadingSavings, setLoadingSavings] = useState(true);

  // Wishlist items state (persisted in localStorage per user)
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load wishlist from storage", e);
    }
    // Initial sample items for quick onboarding
    return [
      {
        id: "wish_1",
        name: "Noise-Canceling Wireless Headphones",
        price: 249.99,
        category: "Electronics",
        priority: "High",
        notes: "For focus during work and travel",
        purchased: false,
        createdAt: new Date().toLocaleDateString(),
      },
      {
        id: "wish_2",
        name: "Ergonomic Office Chair",
        price: 380.0,
        category: "Home & Furniture",
        priority: "Medium",
        notes: "Better back support for home office",
        purchased: false,
        createdAt: new Date().toLocaleDateString(),
      },
      {
        id: "wish_3",
        name: "Weekend Mountain Getaway",
        price: 650.0,
        category: "Travel",
        priority: "Low",
        notes: "Cabin rental and hiking trip",
        purchased: false,
        createdAt: new Date().toLocaleDateString(),
      },
    ];
  });

  // Toggle state for Add/Edit Form to prevent the page from exceeding screen space
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State for Add / Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [priority, setPriority] = useState("Medium");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Filter State
  const [filterTab, setFilterTab] = useState("ALL"); // ALL, AFFORDABLE, SAVING, PURCHASED

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Number(val) || 0);
  };

  // Save items to localStorage whenever items change
  const saveItems = useCallback(
    (newItems) => {
      setItems(newItems);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      } catch (err) {
        console.error("Failed to save wishlist items", err);
      }
    },
    [STORAGE_KEY]
  );

  // Fetch live available savings from backend (totalIncome - totalExpenses)
  const fetchSavings = useCallback(async () => {
    if (!userId) return;
    setLoadingSavings(true);
    try {
      const summary = await dashboardService.getSummary(userId);
      if (summary) {
        const availableBalance =
          (Number(summary.totalIncome) || 0) - (Number(summary.totalExpenses) || 0);
        setSavings(availableBalance);
      }
    } catch (err) {
      console.error("Failed to load savings balance:", err);
    } finally {
      setLoadingSavings(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSavings();
  }, [fetchSavings]);

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setName("");
    setPrice("");
    setCategory("Electronics");
    setPriority("Medium");
    setNotes("");
    setFormError("");
  };

  const handleEditClick = (item) => {
    setIsEditing(true);
    setShowAddForm(true);
    setEditingId(item.id);
    setName(item.name);
    setPrice(String(item.price));
    setCategory(item.category || "Other");
    setPriority(item.priority || "Medium");
    setNotes(item.notes || "");
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Item name is required.");
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setFormError("Please enter a valid positive price.");
      return;
    }

    if (isEditing && editingId) {
      // Update existing item
      const updated = items.map((item) =>
        item.id === editingId
          ? {
              ...item,
              name: name.trim(),
              price: numPrice,
              category: category.trim(),
              priority,
              notes: notes.trim(),
            }
          : item
      );
      saveItems(updated);
      setSuccessMsg("Wishlist item updated successfully!");
    } else {
      // Add new item
      const newItem = {
        id: "wish_" + Date.now(),
        name: name.trim(),
        price: numPrice,
        category: category.trim(),
        priority,
        notes: notes.trim(),
        purchased: false,
        createdAt: new Date().toLocaleDateString(),
      };
      saveItems([newItem, ...items]);
      setSuccessMsg("New item added to your Wishlist!");
    }

    resetForm();
    setShowAddForm(false);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // Toggle purchased state
  const handleTogglePurchased = (item) => {
    const updated = items.map((i) =>
      i.id === item.id ? { ...i, purchased: !i.purchased } : i
    );
    saveItems(updated);
    setSuccessMsg(
      !item.purchased
        ? `🎉 Marked "${item.name}" as purchased!`
        : `Reverted "${item.name}" back to wishlist.`
    );
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (!deleteTarget) return;
    const updated = items.filter((i) => i.id !== deleteTarget.id);
    saveItems(updated);
    setDeleteTarget(null);
    setSuccessMsg("Wishlist item removed.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  // Calculations for stats
  const activeItems = useMemo(() => items.filter((i) => !i.purchased), [items]);
  const totalWishlistCost = useMemo(
    () => activeItems.reduce((sum, i) => sum + (Number(i.price) || 0), 0),
    [activeItems]
  );
  const affordableItems = useMemo(
    () => activeItems.filter((i) => savings >= Number(i.price)),
    [activeItems, savings]
  );

  // Filtered display list
  const filteredItems = useMemo(() => {
    if (filterTab === "PURCHASED") {
      return items.filter((i) => i.purchased);
    }
    if (filterTab === "AFFORDABLE") {
      return activeItems.filter((i) => savings >= Number(i.price));
    }
    if (filterTab === "SAVING") {
      return activeItems.filter((i) => savings < Number(i.price));
    }
    return activeItems;
  }, [items, activeItems, filterTab, savings]);

  return (
    <div className="page-container wishlist-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Future Wishlist & Goals</h1>
          <p className="page-subtitle">
            Plan and track items you want to buy with live savings comparison.
          </p>
        </div>

        <div className="quick-actions">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={fetchSavings}
            title="Refresh current savings balance"
          >
            🔄 Refresh Savings
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (isEditing) {
                resetForm();
              }
              setShowAddForm((prev) => !prev);
            }}
          >
            {showAddForm && !isEditing ? "− Close Form" : "+ Add Goal"}
          </button>
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

      {/* Top Savings Overview Cards */}
      <div className="summary-grid wishlist-summary-grid">
        <div className="summary-card card-income">
          <div className="card-header">
            <span className="card-title">Available Savings</span>
            <div className="card-icon-bubble icon-income">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <div className="card-body">
            <h2 className="card-amount">
              {loadingSavings ? "..." : formatCurrency(savings)}
            </h2>
            <span className="card-subtitle">
              Total Income − Total Expenses
            </span>
          </div>
        </div>

        <div className="summary-card card-balance">
          <div className="card-header">
            <span className="card-title">Total Wishlist Cost</span>
            <div className="card-icon-bubble icon-balance">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </div>
          </div>
          <div className="card-body">
            <h2 className="card-amount">{formatCurrency(totalWishlistCost)}</h2>
            <span className="card-subtitle">
              Across {activeItems.length} active future goals
            </span>
          </div>
        </div>

        <div className={`summary-card card-expense ${affordableItems.length > 0 ? "card-ready-glow" : ""}`}>
          <div className="card-header">
            <span className="card-title">Ready To Buy</span>
            <div
              className={`card-icon-bubble ${affordableItems.length > 0 ? "icon-income" : "icon-neutral"}`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <div className="card-body">
            <h2
              className={`card-amount ${affordableItems.length > 0 ? "text-success" : ""}`}
            >
              {affordableItems.length} {affordableItems.length === 1 ? "Item" : "Items"}
            </h2>
            <span className="card-subtitle">
              {affordableItems.length > 0
                ? "Covered by current available savings!"
                : "Keep saving to unlock items"}
            </span>
          </div>
        </div>
      </div>

      {/* Add / Edit Wishlist Item Form */}
      <div className="form-card wishlist-form-card">
        <div className="card-title-bar">
          <div>
            <h2 className="card-heading">
              {isEditing ? "Edit Wishlist Item" : "Add Item to Wishlist"}
            </h2>
            <p className="section-subtitle">
              {isEditing
                ? "Modify your target goal specifications"
                : showAddForm
                ? "Specify what you want to buy and its target price"
                : "Add new future items and track affordability"}
            </p>
          </div>
          <div className="card-title-actions">
            {isEditing ? (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  resetForm();
                  setShowAddForm(false);
                }}
              >
                Cancel Edit
              </button>
            ) : (
              <button
                type="button"
                className={`btn btn-sm ${showAddForm ? "btn-outline-secondary" : "btn-primary"}`}
                onClick={() => setShowAddForm((prev) => !prev)}
              >
                {showAddForm ? "− Collapse" : "+ Add Goal"}
              </button>
            )}
          </div>
        </div>

        {(showAddForm || isEditing) && (
          <div className="wishlist-form-wrapper">
            {formError && (
              <div className="form-error-banner">
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="entry-form">
              <div className="form-grid">
                <div className="form-group form-group-span-2">
                  <label htmlFor="wishlist-name">Item Name *</label>
                  <input
                    id="wishlist-name"
                    type="text"
                    placeholder="e.g., Apple iPad Air, Kitchen Blender, Running Shoes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="wishlist-price">Target Price ($) *</label>
                  <input
                    id="wishlist-price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="wishlist-category">Category</label>
                  <select
                    id="wishlist-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Electronics">Electronics & Gadgets</option>
                    <option value="Home & Furniture">Home & Furniture</option>
                    <option value="Travel">Travel & Vacation</option>
                    <option value="Vehicle">Vehicle & Transport</option>
                    <option value="Fashion">Fashion & Apparel</option>
                    <option value="Health & Fitness">Health & Fitness</option>
                    <option value="Education">Books & Learning</option>
                    <option value="Gaming">Gaming & Entertainment</option>
                    <option value="Appliances">Home Appliances</option>
                    <option value="Other">Other Personal Goals</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="wishlist-priority">Priority</label>
                  <select
                    id="wishlist-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="High">🔥 High Priority</option>
                    <option value="Medium">⭐ Medium Priority</option>
                    <option value="Low">🌱 Low Priority</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="wishlist-notes">Notes or Product Link (Optional)</label>
                  <input
                    id="wishlist-notes"
                    type="text"
                    placeholder="Details, store URL, or target date"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {isEditing ? "Update Wishlist Item" : "+ Add to Wishlist"}
                </button>
                {isEditing ? (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      resetForm();
                      setShowAddForm(false);
                    }}
                  >
                    Discard Changes
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowAddForm(false)}
                  >
                    Close
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="category-chips-bar wishlist-chips-bar">
        <span className="chips-label">View:</span>
        <button
          type="button"
          className={`chip-btn ${filterTab === "ALL" ? "active" : ""}`}
          onClick={() => setFilterTab("ALL")}
        >
          All Items ({activeItems.length})
        </button>
        <button
          type="button"
          className={`chip-btn ${filterTab === "AFFORDABLE" ? "active" : ""}`}
          onClick={() => setFilterTab("AFFORDABLE")}
        >
          🎉 Enough Savings to Buy ({affordableItems.length})
        </button>
        <button
          type="button"
          className={`chip-btn ${filterTab === "SAVING" ? "active" : ""}`}
          onClick={() => setFilterTab("SAVING")}
        >
          ⏳ In Progress ({activeItems.length - affordableItems.length})
        </button>
        <button
          type="button"
          className={`chip-btn ${filterTab === "PURCHASED" ? "active" : ""}`}
          onClick={() => setFilterTab("PURCHASED")}
        >
          ✅ Purchased ({items.filter((i) => i.purchased).length})
        </button>
      </div>

      {/* Wishlist Cards Grid */}
      <div className="records-card wishlist-records-card">
        <div className="card-title-bar">
          <div>
            <h2 className="card-heading">
              Wishlist Items ({filteredItems.length})
            </h2>
            <p className="section-subtitle">
              Live comparison against your current balance of{" "}
              <strong>{formatCurrency(savings)}</strong>
            </p>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎁</div>
            <h3>No items in this section</h3>
            <p>
              {filterTab === "AFFORDABLE"
                ? "No items are currently affordable with your available savings. Add income to boost your balance!"
                : filterTab === "PURCHASED"
                ? "No items have been marked as purchased yet."
                : "Add your first future purchase goal using the form above!"}
            </p>
            {filterTab === "ALL" && !showAddForm && !isEditing && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ marginTop: "14px" }}
                onClick={() => setShowAddForm(true)}
              >
                + Add Your First Goal
              </button>
            )}
          </div>
        ) : (
          <div className="wishlist-cards-grid">
            {filteredItems.map((item) => {
              const itemPrice = Number(item.price) || 0;
              const hasEnoughSavings = savings >= itemPrice;
              const difference = savings - itemPrice;
              const progressPercentage =
                itemPrice > 0 ? Math.min(100, (savings / itemPrice) * 100) : 100;

              return (
                <div
                  key={item.id}
                  className={`wishlist-card ${hasEnoughSavings ? "affordable-card" : ""} ${
                    item.purchased ? "purchased-card" : ""
                  }`}
                >
                  {/* Readiness Banner when Savings >= Price */}
                  {hasEnoughSavings && !item.purchased && (
                    <div className="enough-savings-banner">
                      <div className="banner-content">
                        <span className="banner-icon">🎉</span>
                        <div className="banner-text">
                          <strong>You have enough savings to buy this item!</strong>
                          <span>
                            Fully covered with {formatCurrency(difference)} remaining.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {item.purchased && (
                    <div className="purchased-badge-banner">
                      <span>✅ Purchased Goal Completed!</span>
                    </div>
                  )}

                  <div className="wishlist-card-header">
                    <div className="wishlist-title-group">
                      <span className="wishlist-cat-icon">
                        {getCategoryEmoji(item.category)}
                      </span>
                      <div className="wishlist-title-text-wrap">
                        <h3 className="wishlist-item-title">{item.name}</h3>
                        <span className="wishlist-category-tag">{item.category}</span>
                      </div>
                    </div>

                    <div className="wishlist-price-tag">
                      <span className="item-price-val">
                        {formatCurrency(item.price)}
                      </span>
                      <span className={`priority-pill priority-${item.priority.toLowerCase()}`}>
                        {item.priority}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar & Affordability Breakdown */}
                  {!item.purchased && (
                    <div className="wishlist-savings-progress">
                      <div className="progress-label-row">
                        <span>
                          Savings Coverage:{" "}
                          <strong>{progressPercentage.toFixed(1)}%</strong>
                        </span>
                        <span>
                          {hasEnoughSavings ? (
                            <span className="text-success font-semibold">
                              Fully Covered!
                            </span>
                          ) : (
                            <span className="text-danger font-semibold">
                              Need {formatCurrency(Math.abs(difference))} more
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="progress-bar-track large">
                        <div
                          className={`progress-bar-fill ${
                            hasEnoughSavings ? "badge-safe" : "badge-warning"
                          }`}
                          style={{
                            width: `${progressPercentage}%`,
                          }}
                        ></div>
                      </div>

                      <div className="wishlist-metric-subtext">
                        <span>Available: {formatCurrency(savings)}</span>
                        <span>Target: {formatCurrency(item.price)}</span>
                      </div>
                    </div>
                  )}

                  {item.notes && (
                    <p className="wishlist-notes-text">
                      📝 {item.notes}
                    </p>
                  )}

                  <div className="wishlist-card-footer">
                    <span className="wishlist-date-text">
                      Added on {item.createdAt}
                    </span>

                    <div className="wishlist-card-actions">
                      <button
                        type="button"
                        className={`btn-action ${
                          item.purchased ? "edit" : hasEnoughSavings ? "purchase" : "edit"
                        }`}
                        onClick={() => handleTogglePurchased(item)}
                        title={item.purchased ? "Move back to wishlist" : "Mark as purchased"}
                      >
                        {item.purchased ? "↩️ Reopen" : hasEnoughSavings ? "🛍️ Buy / Purchased" : "✓ Purchased"}
                      </button>

                      {!item.purchased && (
                        <button
                          type="button"
                          className="btn-action edit"
                          onClick={() => handleEditClick(item)}
                          title="Edit this wishlist item"
                        >
                          ✏️ Edit
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-action delete"
                        onClick={() => setDeleteTarget(item)}
                        title="Remove from wishlist"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to remove <strong>{deleteTarget.name}</strong> ({formatCurrency(deleteTarget.price)}) from your wishlist?
              </p>
              <p className="modal-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={confirmDelete}
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wishlist;

