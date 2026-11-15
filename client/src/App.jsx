import { useEffect, useRef } from "react";
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import useAuth from "./hooks/useAuth";
import useMail from "./hooks/useMail";
import api from "./api";
import { connectSocket } from "./socket";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Inbox from "./pages/Inbox";
import Sent from "./pages/Sent";
import Compose from "./pages/Compose";
import EmailDetail from "./pages/EmailDetail";
import SettingsPage from "./pages/Settings";
import Notification from "./components/Notification";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import "./App.css";

function ProtectedRoute() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="screen-loader"><span className="spinner" />Preparing your mailbox…</div>;
  return user ? <Outlet /> : <Navigate to="/auth" replace />;
}

function AppLayout() {
  const { user, logout } = useAuth();
  const { unreadCount, setUnreadCount, notification, setNotification, setIncomingEmail, voiceEnabled, setVoiceEnabled } = useMail();
  const navigate = useNavigate();
  const voicePreference = useRef(voiceEnabled);

  useEffect(() => {
    voicePreference.current = voiceEnabled;
  }, [voiceEnabled]);

  useEffect(() => {
    let active = true;
    api.get("/mail/unread-count")
      .then(({ data }) => active && setUnreadCount(data.unreadCount))
      .catch((error) => console.error("Could not load unread mail count:", error.message));
    const socket = connectSocket(localStorage.getItem("token"));
    socket.on("newEmail", ({ email, unreadCount: nextCount }) => {
      setUnreadCount(nextCount);
      setIncomingEmail(email);
      setNotification({
        title: "New email!",
        message: `From ${email?.sender?.name || email?.sender?.email || "a new contact"}: ${email?.subject || "New message"}`,
        emailId: email?._id,
      });
      if (voicePreference.current && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance("You have received a new email."));
      }
    });
    socket.on("connect_error", (error) => {
      console.error("Smart Mail socket connection failed:", error.message);
      setNotification({
        title: "Connection issue",
        message: "Live updates are temporarily unavailable. Your mailbox is still safe.",
      });
    });
    socket.on("connect", () => {
      setNotification((current) => current?.title === "Connection issue" ? null : current);
    });
    return () => {
      active = false;
      socket.disconnect();
    };
  }, [setUnreadCount, setNotification, setIncomingEmail]);

  return (
    <div className="app-shell">
      <Sidebar user={user} unreadCount={unreadCount} onLogout={() => { logout(); navigate("/auth", { replace: true }); }} />
      <div className="main-column">
        <Navbar
          user={user}
          unreadCount={unreadCount}
          onSearch={(query) => navigate(`/inbox${query ? `?search=${encodeURIComponent(query)}` : ""}`)}
          onSettings={() => navigate("/settings")}
        />
        <main className="page-content"><Outlet /></main>
      </div>
      {notification && <Notification notification={notification} voiceEnabled={voiceEnabled} onMute={() => setVoiceEnabled(false)} onClose={() => setNotification(null)} onOpen={() => {
        if (notification.emailId) navigate(`/mail/${notification.emailId}`);
        setNotification(null);
      }} />}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="sent" element={<Sent />} />
          <Route path="compose" element={<Compose />} />
          <Route path="mail/:id" element={<EmailDetail />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
