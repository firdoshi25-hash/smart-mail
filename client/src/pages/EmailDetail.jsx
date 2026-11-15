import { useEffect, useState } from "react";
import { ArrowLeft, Pause, Play, Send, Square, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useMail from "../hooks/useMail";
import api from "../api";
import { formatDate } from "../utils/date";
import useSpeech from "../hooks/useSpeech";

export default function EmailDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setUnreadCount } = useMail();
  const [email, setEmail] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const { supported, state, play, pause, resume, stop } = useSpeech();
  const sent = email?.isSender;

  useEffect(() => {
    let active = true;
    api.get(`/mail/${id}`)
      .then(({ data }) => {
        if (!active) return;
        setEmail(data.email);
        setUnreadCount(data.unreadCount);
      })
      .catch((requestError) => active && setError({ id, message: requestError.response?.data?.message || "We couldn't open this email." }))
      .finally(() => active && setBusy(false));
    return () => { active = false; stop(); };
  }, [id, setUnreadCount, stop]);

  async function removeEmail() {
    if (!window.confirm("Delete this email? This can't be undone.")) return;
    setBusy(true);
    try {
      const { data } = await api.delete(`/mail/${id}`);
      setUnreadCount(data.unreadCount);
      navigate(sent ? "/sent" : "/inbox", { replace: true });
    } catch (requestError) {
      setError({ id, message: requestError.response?.data?.message || "We couldn't delete this email." });
      setBusy(false);
    }
  }

  if (error?.id === id) return <section className="mail-page"><Link to="/inbox" className="back-link"><ArrowLeft size={16} /> Back to inbox</Link><div className="inline-error">{error.message}</div></section>;
  if (!email || email._id !== id) return <div className="loading-block"><span className="spinner" />Opening your email…</div>;
  const person = sent ? email.recipient : email.sender;
  const personName = person?.name || person?.email || (sent ? email.recipientEmail : "Unknown contact");
  const speechText = `Subject: ${email.subject}. Message: ${email.message}`;
  return (
    <section className="detail-page">
      <div className="detail-toolbar"><Link to={sent ? "/sent" : "/inbox"} className="back-link"><ArrowLeft size={16} /> Back to {sent ? "sent mail" : "inbox"}</Link><button className="icon-button delete-button" onClick={removeEmail} disabled={busy} aria-label="Delete email"><Trash2 size={18} /></button></div>
      <article className="detail-card">
        <span className="detail-label">{sent ? "SENT EMAIL" : "IN YOUR INBOX"}</span>
        <h1>{email.subject}</h1>
        <div className="detail-meta"><span className="avatar">{personName.slice(0, 1).toUpperCase()}</span><div><strong>{sent ? "To" : "From"}: {personName}</strong><p>{person?.email || (sent ? email.recipientEmail : "")}</p></div><time>{formatDate(email.createdAt)}</time></div>
        {sent && email.deliveryStatus === "failed" && <p className="delivery-warning">Gmail could not send this email. You can try composing it again after checking your SMTP settings.</p>}
        <div className="detail-message">{email.message}</div>
        {!sent && <div className="speech-toolbar">
          {state === "idle" && <button className="button button-primary" onClick={() => play(speechText)} disabled={!supported}><Play size={15} fill="currentColor" /> Listen</button>}
          {state === "playing" && <button className="button button-primary" onClick={pause}><Pause size={15} fill="currentColor" /> Pause</button>}
          {state === "paused" && <button className="button button-primary" onClick={resume}><Play size={15} fill="currentColor" /> Resume</button>}
          <button className="button button-soft" onClick={stop} disabled={state === "idle"}><Square size={13} fill="currentColor" /> Stop</button>
          {!supported && <span className="speech-note">Speech playback is unavailable in this browser.</span>}
        </div>}
        {sent && <Link className="button button-primary reply-button" to="/compose"><Send size={15} /> Compose another</Link>}
      </article>
    </section>
  );
}
