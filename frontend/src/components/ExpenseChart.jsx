import { useState } from "react";

const PALETTE = [
  "#3b82f6", // Royal blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#f43f5e", // Rose / Coral
  "#8b5cf6", // Violet
  "#06b6d4", // Cyan
  "#ec4899", // Fuchsia Pink
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#14b8a6", // Teal
];

const CATEGORY_EMOJIS = {
  food: "🍔",
  dining: "🍽️",
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
  bills: "🧾",
  personal: "✨",
  other: "💳",
};

function getEmoji(categoryName) {
  if (!categoryName) return "💳";
  const key = categoryName.trim().toLowerCase();
  return CATEGORY_EMOJIS[key] || "💳";
}

function ExpenseChart({ expenses = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Number(val) || 0);
  };

  const total = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  if (!expenses || expenses.length === 0 || total === 0) {
    return (
      <div className="chart-empty">
        <div className="chart-empty-icon">📊</div>
        <p className="chart-empty-title">No expenses recorded yet</p>
        <p className="chart-empty-subtitle">Add expenses to visualize your spending breakdown by category.</p>
      </div>
    );
  }

  // SVG Donut calculations
  const size = 220;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let runningAngle = 0;
  const slices = [];
  for (let index = 0; index < expenses.length; index++) {
    const item = expenses[index];
    const amount = Number(item.amount) || 0;
    const percentage = total > 0 ? (amount / total) * 100 : 0;
    const strokeDash = (percentage / 100) * circumference;
    const strokeOffset = circumference - runningAngle;
    runningAngle += strokeDash;

    slices.push({
      category: item.category,
      amount,
      percentage,
      color: PALETTE[index % PALETTE.length],
      emoji: getEmoji(item.category),
      strokeDash,
      strokeOffset,
      index,
    });
  }

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="expense-chart-wrapper">
      <div className="donut-chart-container">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-svg">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {slices.map((slice) => (
            <circle
              key={slice.category}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={hoveredIndex === slice.index ? strokeWidth + 5 : strokeWidth}
              strokeDasharray={`${slice.strokeDash} ${circumference}`}
              strokeDashoffset={slice.strokeOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="donut-slice"
              onMouseEnter={() => setHoveredIndex(slice.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                cursor: "pointer",
                transition: "stroke-width 0.2s ease, opacity 0.2s ease",
                opacity: hoveredIndex === null || hoveredIndex === slice.index ? 1 : 0.65,
              }}
            />
          ))}
        </svg>

        <div className="donut-center-text">
          <span className="donut-center-label">
            {activeSlice ? `${activeSlice.emoji} ${activeSlice.category}` : "Total Spent"}
          </span>
          <span className="donut-center-value">
            {formatCurrency(activeSlice ? activeSlice.amount : total)}
          </span>
          {activeSlice ? (
            <span className="donut-center-pct">
              {activeSlice.percentage.toFixed(1)}% of total
            </span>
          ) : (
            <span className="donut-center-pct">
              {expenses.length} Categories
            </span>
          )}
        </div>
      </div>

      <div className="chart-legend-container">
        {slices.map((slice) => (
          <div
            key={slice.category}
            className={`legend-item ${hoveredIndex === slice.index ? "active" : ""}`}
            onMouseEnter={() => setHoveredIndex(slice.index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="legend-info">
              <span className="legend-color-dot" style={{ backgroundColor: slice.color }}></span>
              <span className="legend-name" title={slice.category}>
                {slice.emoji} {slice.category}
              </span>
            </div>
            <div className="legend-values">
              <span className="legend-amount">{formatCurrency(slice.amount)}</span>
              <span className="legend-pct">({slice.percentage.toFixed(1)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExpenseChart;
