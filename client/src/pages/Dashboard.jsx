import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Inbox as InboxIcon, Mail, Mic2, Pause, Play, Send, Square } from "lucide-react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useMail from "../hooks/useMail";
import api from "../api";
import EmailCard from "../components/EmailCard";
import useSpeech from "../hooks/useSpeech";

export default function Dashboard() {
  const { user } = useAuth();
  const { unreadCount, setUnreadCount, voiceEnabled, setVoiceEnabled, incomingEmail } = useMail();
  const [emails, setEmails] = useState([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const speech = useSpeech();

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/mail/inbox"), api.get("/mail/sent"), api.get("/mail/unread-count")])
      .then(([inboxResponse, sentResponse, unreadResponse]) => {
        if (!active) return;
        setEmails(inboxResponse.data.emails.slice(0, 5));
        setInboxCount(inboxResponse.data.count);
        setSentCount(sentResponse.data.count);
        setUnreadCount(unreadResponse.data.unreadCount);
      })
      .catch((requestError) => active && setError(requestError.response?.data?.message || "We couldn't load your mailbox."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [setUnreadCount]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  }, []);
  const displayEmails = useMemo(() => {
    if (!incomingEmail?._id) return emails;
    const newest = emails.find((email) => email._id === incomingEmail._id) || incomingEmail;
    return [newest, ...emails.filter((email) => email._id !== incomingEmail._id)].slice(0, 5);
  }, [emails, incomingEmail]);
  const displayInboxCount = inboxCount + Number(Boolean(incomingEmail?._id && !emails.some((email) => email._id === incomingEmail._id)));
  const sampleEmail = displayEmails[0];

  return (
    <div className="dashboard-grid">
      <section className="dashboard-main">
        <div className="welcome-row">
          <div><p className="eyebrow">YOUR LITTLE CORNER OF THE INTERNET</p><h1>{greeting}, {user?.name?.split(" ")[0]} <span className="greeting-flower">✿</span></h1><p className="welcome-subtitle">Here's what's happening with your mail today <span>♡</span></p></div>
          <div className="envelope-doodle" aria-hidden="true"><Mail size={42} /><span>♥</span></div>
        </div>
        <div className="stats-grid">
          <article className="stat-card stat-lilac"><span className="stat-icon"><InboxIcon size={20} /></span><span className="stat-copy"><small>Inbox</small><strong>{loading ? "—" : displayInboxCount}</strong></span><span className="stat-spark">✿</span></article>
          <article className="stat-card stat-pink"><span className="stat-icon"><Send size={20} /></span><span className="stat-copy"><small>Sent</small><strong>{loading ? "—" : sentCount}</strong></span><span className="stat-spark">♥</span></article>
          <article className="stat-card stat-violet"><span className="stat-icon"><Mail size={20} /></span><span className="stat-copy"><small>Unread</small><strong>{unreadCount}</strong></span><span className="stat-spark">✧</span></article>
        </div>
        <section className="recent-panel">
          <div className="section-heading"><h2><Mail size={20} /> Recent emails</h2><Link to="/inbox" className="text-link">View all <ArrowRight size={15} /></Link></div>
          {error ? <div className="inline-error">{error}</div> : loading ? <div className="loading-block"><span className="spinner" />Gathering your mail…</div> : displayEmails.length ? <div className="email-list">{displayEmails.map((email) => <EmailCard key={email._id} email={email} />)}</div> : <div className="empty-state"><span className="empty-icon"><Mail size={24} /></span><strong>Nothing in your inbox just yet</strong><p>When someone writes to you, their note will land right here.</p><Link className="button button-soft" to="/compose">Send the first note</Link></div>}
        </section>
      </section>
      <aside className="dashboard-rail">
        <Link to="/compose" className="button button-primary compose-cta"><Send size={17} /> Compose email <span>✦</span></Link>
        <div className="postcard-art" aria-label="Stay connected illustration">
          <span className="postcard-spark spark-a">✦</span><span className="postcard-spark spark-b">♥</span>
          <div className="postcard-envelope"><Mail size={57} /><span>♥</span></div>
          <div className="postcard-note">Stay<br />connected <span>♡</span></div>
          <span className="postcard-heart">♥</span>
        </div>
        <section className="voice-panel">
          <div className="voice-heading"><span className="voice-icon"><Mic2 size={20} /></span><div><h3>Voice assistant</h3><p>Listen to your email notes</p></div><button className={`toggle ${voiceEnabled ? "toggle-on" : ""}`} onClick={() => setVoiceEnabled(!voiceEnabled)} aria-label="Toggle voice notifications" aria-pressed={voiceEnabled}><span /></button></div>
          <div className="waveform" aria-hidden="true">{Array.from({ length: 31 }, (_, index) => <i key={index} style={{ height: `${7 + ((index * 17) % 18)}px` }} />)}</div>
          {sampleEmail && <div className="voice-controls">
            {speech.state === "idle" && <button onClick={() => speech.play(`Subject: ${sampleEmail.subject}. ${sampleEmail.message}`)}><Play size={14} fill="currentColor" /> Listen</button>}
            {speech.state === "playing" && <button onClick={speech.pause}><Pause size={14} fill="currentColor" /> Pause</button>}
            {speech.state === "paused" && <button onClick={speech.resume}><Play size={14} fill="currentColor" /> Resume</button>}
            <button onClick={speech.stop} disabled={speech.state === "idle"}><Square size={12} fill="currentColor" /> Stop</button>
          </div>}
          {!speech.supported && <p className="speech-note">Voice playback isn't supported in this browser.</p>}
        </section>
        <div className="tip-card"><span>✿</span><p><strong>A gentle reminder</strong><br />A thoughtful note can brighten someone's whole day.</p></div>
      </aside>
    </div>
  );
}
