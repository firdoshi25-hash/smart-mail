import { useEffect } from "react";
import { Mail, X } from "lucide-react";

export default function Notification({ notification, voiceEnabled, onMute, onClose, onOpen }) {
  useEffect(() => {
    const timeout = window.setTimeout(onClose, 7000);
    return () => window.clearTimeout(timeout);
  }, [notification, onClose]);

  return (
    <section className="toast-card" role="status" aria-live="polite">
      <span className="toast-icon"><Mail size={19} /></span>
      <div className="toast-copy">
        <strong>{notification.title}</strong>
        <p>{notification.message}</p>
        {notification.emailId && <button className="toast-open" onClick={onOpen}>Open email</button>}
        {notification.emailId && voiceEnabled && <button className="toast-mute" onClick={onMute}>Mute voice</button>}
      </div>
      <button className="icon-button toast-close" aria-label="Dismiss notification" onClick={onClose}><X size={17} /></button>
    </section>
  );
}
