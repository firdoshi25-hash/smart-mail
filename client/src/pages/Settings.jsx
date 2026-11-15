import { BellRing, Mic2, ShieldCheck } from "lucide-react";
import useMail from "../hooks/useMail";
import useAuth from "../hooks/useAuth";

export default function SettingsPage() {
  const { voiceEnabled, setVoiceEnabled } = useMail();
  const { user } = useAuth();
  return (
    <section className="mail-page settings-page">
      <div className="page-title-row"><div><p className="eyebrow">MAKE IT FEEL LIKE YOURS</p><h1>Settings</h1><p className="page-subtitle">A few little ways to make Smart Mail your own.</p></div><span className="page-title-icon"><Mic2 size={23} /></span></div>
      <section className="settings-card"><div className="settings-row"><span className="settings-icon"><BellRing size={19} /></span><div className="settings-copy"><strong>Voice announcements</strong><p>Hear a gentle announcement when a new email arrives.</p></div><button className={`toggle ${voiceEnabled ? "toggle-on" : ""}`} onClick={() => setVoiceEnabled(!voiceEnabled)} aria-label="Toggle voice notifications" aria-pressed={voiceEnabled}><span /></button></div></section>
      <section className="settings-card account-card"><div className="settings-row"><span className="settings-icon settings-icon-green"><ShieldCheck size={19} /></span><div className="settings-copy"><strong>Your account</strong><p>{user?.name} · {user?.email}</p></div><span className="account-badge">Secure</span></div></section>
      <p className="settings-footnote">Your voice setting is saved in this browser. You can turn it off anytime.</p>
    </section>
  );
}
