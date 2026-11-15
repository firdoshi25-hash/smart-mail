import { useEffect, useMemo, useState } from "react";
import { Mail, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import useMail from "../hooks/useMail";
import api from "../api";
import EmailCard from "../components/EmailCard";

export default function Inbox() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const { unreadCount, setUnreadCount, incomingEmail } = useMail();
  const search = (searchParams.get("search") || "").toLowerCase();

  useEffect(() => {
    let active = true;
    api.get("/mail/inbox")
      .then(({ data }) => {
        if (!active) return;
        setEmails(data.emails);
        setUnreadCount(data.unreadCount);
      })
      .catch((requestError) => active && setError(requestError.response?.data?.message || "We couldn't load your inbox."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [setUnreadCount]);

  const displayEmails = useMemo(() => {
    if (!incomingEmail?._id) return emails;
    const newest = emails.find((email) => email._id === incomingEmail._id) || incomingEmail;
    return [newest, ...emails.filter((email) => email._id !== incomingEmail._id)];
  }, [emails, incomingEmail]);
  const filtered = displayEmails.filter((email) => [email.subject, email.message, email.sender?.name, email.sender?.email].some((value) => value?.toLowerCase().includes(search)));
  return (
    <section className="mail-page">
      <div className="page-title-row"><div><p className="eyebrow">ALL YOUR NOTES, IN ONE PLACE</p><h1>Inbox</h1><p className="page-subtitle">You have <strong>{unreadCount}</strong> unread {unreadCount === 1 ? "email" : "emails"}.</p></div><span className="page-title-icon"><Mail size={23} /></span></div>
      {search && <p className="search-result-label"><Search size={14} /> Results for “{searchParams.get("search")}”</p>}
      {error ? <div className="inline-error">{error}</div> : loading ? <div className="loading-block"><span className="spinner" />Opening your inbox…</div> : filtered.length ? <div className="email-list email-list-page">{filtered.map((email) => <EmailCard key={email._id} email={email} />)}</div> : <div className="empty-state page-empty"><span className="empty-icon"><Mail size={24} /></span><strong>{search ? "No matching emails" : "Your inbox is all caught up"}</strong><p>{search ? "Try another search, or clear the search box." : "When you receive an email, it will show up here."}</p></div>}
    </section>
  );
}
