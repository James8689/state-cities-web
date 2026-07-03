import { useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: "🏠" },
  { path: "/states", label: "States", icon: "🗺️" },
  { path: "/journey", label: "Journey", icon: "🏆" },
];

export function Sidebar({ collapsed, onClose }: { collapsed?: boolean; onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  function handleNav(path: string) {
    navigate(path);
    onClose?.();
  }

  function isActive(path: string) {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  }

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar-brand" onClick={() => handleNav("/")}>
        <span className="sidebar-logo">🌎</span>
        {!collapsed && <span className="sidebar-title">State Cities</span>}
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            type="button"
            className={`sidebar-link ${isActive(item.path) ? "sidebar-link--active" : ""}`}
            onClick={() => handleNav(item.path)}
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <p className="sidebar-footer-text">Learn US city geography</p>
        )}
      </div>
    </aside>
  );
}
