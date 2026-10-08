import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { authService } from "../api/api";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const user = authService.getUser();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar-container">
      <div className="navbar-content">
        <div className="navbar-brand">
          <NavLink to="/dashboard" className="brand-link" onClick={closeMenu}>
            <div className="brand-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <span className="brand-title">SmartBudget</span>
          </NavLink>
        </div>

        <button
          className="mobile-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
          <span className="hamburger-bar"></span>
        </button>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            onClick={closeMenu}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/income"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            onClick={closeMenu}
          >
            Income
          </NavLink>

          <NavLink
            to="/expenses"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            onClick={closeMenu}
          >
            Expenses
          </NavLink>

          <NavLink
            to="/budgets"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            onClick={closeMenu}
          >
            Budgets
          </NavLink>

          <NavLink
            to="/wishlist"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            onClick={closeMenu}
          >
            Wishlist
          </NavLink>

          <div className="navbar-user">
            <span className="user-greeting">
              <span className="user-avatar">{user.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
              <span className="user-name">{user.name || "User"}</span>
            </span>

            <button onClick={handleLogout} className="logout-button" title="Sign out of SmartBudget">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
