import { useState } from "react";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Compose() {
  const [form, setForm] = useState({ recipientEmail: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const { data } = await api.post("/mail/send", {
        recipientEmail: form.recipientEmail.trim().toLowerCase(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setStatus({
        type: data.externalDelivery === "failed" ? "warning" : "success",
        text: data.message || "Your email is on its way!",
      });
      setForm({ recipientEmail: "", subject: "", message: "" });
    } catch (error) {
      setStatus({
        type: "error",
        text: error.response?.data?.message || "Your email couldn't be sent. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="compose-page">
      <Link to="/inbox" className="back-link"><ArrowLeft size={16} /> Back to inbox</Link>
      <div className="page-title-row compose-title"><div><p className="eyebrow">SOMETHING KIND, INCOMING</p><h1>Compose email</h1><p className="page-subtitle">Send to any email address. Your mail is sent through your configured email account.</p></div><span className="page-title-icon"><Sparkles size={23} /></span></div>
      <form className="compose-card" onSubmit={submit}>
        <label>To <span className="compose-input"><input type="email" placeholder="friend@example.com" value={form.recipientEmail} onChange={(event) => setForm({ ...form, recipientEmail: event.target.value })} required /></span><small>Send to any valid email address, even if they don't use Smart Mail.</small></label>
        <label>Subject<input type="text" placeholder="What’s on your mind?" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} maxLength="160" required /></label>
        <label>Message<textarea placeholder="Write something lovely…" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} maxLength="10000" rows="10" required /></label>
        {status && <p className={`form-message ${status.type === "error" ? "form-error" : status.type === "warning" ? "form-warning" : "form-success"}`} role="status">{status.text}</p>}
        <div className="compose-footer"><span>Made with a little love <span>♡</span></span><button className="button button-primary" type="submit" disabled={busy}>{busy ? <><span className="button-spinner" />Sending…</> : <><Send size={16} /> Send email</>}</button></div>
      </form>
    </section>
  );
}
