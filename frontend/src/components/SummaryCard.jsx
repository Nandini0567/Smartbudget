function SummaryCard({ title, amount, type = "income", subtitle }) {
  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const icons = {
    income: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7"/>
      </svg>
    ),
    expense: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12l7 7 7-7"/>
      </svg>
    ),
    balance: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  };

  return (
    <div className={`summary-card card-${type}`}>
      <div className="card-header">
        <span className="card-title">{title}</span>
        <div className={`card-icon-bubble icon-${type}`}>
          {icons[type] || icons.balance}
        </div>
      </div>
      <div className="card-body">
        <h2 className="card-amount">{formatCurrency(amount)}</h2>
        {subtitle && <span className="card-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}

export default SummaryCard;
