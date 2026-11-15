import { Link } from "react-router-dom";
import { ArrowUpRight, Circle } from "lucide-react";
import { formatDate } from "../utils/date";

export default function EmailCard({ email, sent = false }) {
  const person = sent ? email.recipient : email.sender;
  const displayName = person?.name || person?.email || (sent ? email.recipientEmail : null) || "Unknown contact";
  const preview = (email.message || "").replace(/\s+/g, " ").trim();
  return (
    <Link className={`email-row ${!sent && !email.isRead ? "email-unread" : ""}`} to={`/mail/${email._id}`}>
      <span className={`email-status ${!sent && !email.isRead ? "status-unread" : ""}`}><Circle size={8} fill="currentColor" /></span>
      <span className="avatar email-avatar">{displayName.slice(0, 1).toUpperCase()}</span>
      <span className="email-row-content">
        <span className="email-row-heading"><strong>{sent ? `To: ${displayName}` : displayName}</strong><time>{formatDate(email.createdAt)}</time></span>
        <span className="email-subject">{email.subject || "(no subject)"}</span>
        <span className="email-preview">{preview || "No message content"}</span>
      </span>
      <span className={`read-pill ${sent && email.deliveryStatus === "failed" ? "pill-failed" : ""} ${!sent && !email.isRead ? "pill-unread" : ""}`}>{sent ? email.deliveryStatus === "failed" ? "Failed" : email.deliveryStatus === "pending" ? "Sending" : "Sent" : email.isRead ? "Read" : "Unread"}</span>
      <ArrowUpRight className="row-arrow" size={16} />
    </Link>
  );
}
