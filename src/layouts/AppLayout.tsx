import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isQuizActive = location.pathname === "/quiz" || location.pathname === "/results";

  return (
    <div className={`web-layout ${isQuizActive ? "web-layout--quiz" : ""}`}>
      {!isQuizActive && (
        <>
          <Sidebar
            onClose={() => setMobileMenuOpen(false)}
          />
          {mobileMenuOpen && (
            <div
              className="mobile-overlay mobile-overlay--visible"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
        </>
      )}

      <main className={`web-content ${isQuizActive ? "web-content--quiz" : ""}`}>
        {!isQuizActive && (
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Open menu"
          >
            <span className="mobile-menu-icon">☰</span>
          </button>
        )}
        <Outlet />
      </main>

      {!isQuizActive && <MobileTabBar />}
    </div>
  );
}

function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  function isActive(path: string) {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  }

  const tabs = [
    { path: "/", label: "Home", icon: "🏠" },
    { path: "/states", label: "States", icon: "🗺️" },
    { path: "/journey", label: "Journey", icon: "🏆" },
  ];

  return (
    <nav className="mobile-tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          type="button"
          className={`mobile-tab ${isActive(tab.path) ? "mobile-tab--active" : ""}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="mobile-tab-icon">{tab.icon}</span>
          <span className="mobile-tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
