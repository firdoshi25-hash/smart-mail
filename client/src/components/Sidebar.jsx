import { LayoutDashboard, LogOut, Mail, PenLine, Send, Settings } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

export default function Sidebar({ user, unreadCount, onLogout }) {
  const links = [
    { to: "/", label: "Dashboard", Icon: LayoutDashboard, end: true },
    { to: "/inbox", label: "Inbox", Icon: Mail, count: unreadCount },
    { to: "/sent", label: "Sent Mail", Icon: Send },
    { to: "/compose", label: "Compose", Icon: PenLine },
    { to: "/settings", label: "Settings", Icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <Link className="brand" to="/">
        <span className="brand-mark"><Send size={23} fill="currentColor" /></span>
        <span><strong>Smart Mail</strong><small>Your smart email companion</small></span>
      </Link>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {links.map(({ to, label, Icon, count, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            <Icon size={18} />
            <span>{label}</span>
            {count > 0 && <span className="nav-count">{count}</span>}
          </NavLink>
        ))}
        <button className="nav-link mobile-logout" onClick={onLogout}>
          <LogOut size={18} /><span>Log out</span>
        </button>
      </nav>
      <div className="sidebar-bottom">
        <div className="user-mini">
          <span className="avatar avatar-small">{user?.name?.slice(0, 1).toUpperCase()}</span>
          <span className="user-mini-text"><strong>{user?.name}</strong><small>{user?.email}</small></span>
        </div>
        <button className="nav-link logout-link" onClick={onLogout}>
          <LogOut size={18} /><span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
