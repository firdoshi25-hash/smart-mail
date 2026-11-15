import { Bell, Mail } from "lucide-react";

export default function Navbar({ user, unreadCount, onSearch, onSettings }) {
  return (
    <header className="topbar">
      <form className="search-box" onSubmit={(event) => {
        event.preventDefault();
        const query = new FormData(event.currentTarget).get("search")?.toString().trim() || "";
        onSearch(query);
      }}>
        <Mail size={17} />
        <input name="search" aria-label="Search emails" placeholder="Search emails…" />
      </form>
      <button className="icon-button notification-trigger" aria-label={`${unreadCount} unread emails`} onClick={() => onSearch("")}>
        <Bell size={20} />{unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
      </button>
      <button className="profile-button" onClick={onSettings} title="Open settings">
        <span className="avatar avatar-small">{user?.name?.slice(0, 1).toUpperCase()}</span>
      </button>
    </header>
  );
}
