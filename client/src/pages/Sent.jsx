import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api";
import EmailCard from "../components/EmailCard";

export default function Sent() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api.get("/mail/sent")
      .then(({ data }) => active && setEmails(data.emails))
      .catch((requestError) => active && setError(requestError.response?.data?.message || "We couldn't load sent mail."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);
  return (
    <section className="mail-page">
      <div className="page-title-row"><div><p className="eyebrow">A LITTLE MAIL FROM YOU</p><h1>Sent mail</h1><p className="page-subtitle">Every kind word you’ve sent, all together.</p></div><span className="page-title-icon page-title-pink"><Send size={23} /></span></div>
      {error ? <div className="inline-error">{error}</div> : loading ? <div className="loading-block"><span className="spinner" />Gathering sent mail…</div> : emails.length ? <div className="email-list email-list-page">{emails.map((email) => <EmailCard key={email._id} email={email} sent />)}</div> : <div className="empty-state page-empty"><span className="empty-icon"><Send size={24} /></span><strong>No sent mail yet</strong><p>Your sent notes will be saved here.</p><Link className="button button-primary" to="/compose">Write an email</Link></div>}
    </section>
  );
}
