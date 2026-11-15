import { useCallback, useMemo, useState } from "react";
import MailContext from "./mailContext";

export function MailProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notification, setNotification] = useState(null);
  const [incomingEmail, setIncomingEmail] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(
    () => localStorage.getItem("voiceEnabled") !== "false",
  );
  const updateVoiceEnabled = useCallback((enabled) => {
    localStorage.setItem("voiceEnabled", String(enabled));
    setVoiceEnabled(enabled);
  }, []);
  const value = useMemo(() => ({
    unreadCount,
    setUnreadCount,
    notification,
    setNotification,
    incomingEmail,
    setIncomingEmail,
    voiceEnabled,
    setVoiceEnabled: updateVoiceEnabled,
  }), [unreadCount, notification, incomingEmail, voiceEnabled, updateVoiceEnabled]);
  return <MailContext.Provider value={value}>{children}</MailContext.Provider>;
}
