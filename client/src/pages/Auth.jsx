import { useEffect, useState } from "react";
import { Eye, EyeOff, Heart, Mail, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import useAuth from "../hooks/useAuth";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [form, setForm] = useState({
    name: "Arshii",
    email: "arshiarshi8384@gmail.com",
    password: "",
  });
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [navigate, user]);

  if (user) {
    return null;
  }

  const changeMode = () => {
    setIsLogin((value) => !value);
    setMessage("");
    setError(false);
  };

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setError(false);
    setBusy(true);
    try {
      if (!isLogin) {
        await api.post("/auth/register", {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
        setMessage("Account created! Sign in to open your mailbox.");
        setIsLogin(true);
        setForm((current) => ({ ...current, name: "Arshii", password: "" }));
      } else {
        const { data } = await api.post("/auth/login", {
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
        login(data);
        navigate("/", { replace: true });
      }
    } catch (requestError) {
      setError(true);
      setMessage(requestError.response?.data?.message || "We couldn't connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-decoration decor-one" /><div className="auth-decoration decor-two" />
      <section className="auth-card">
        <div className="auth-brand"><span className="brand-mark"><Send size={23} fill="currentColor" /></span></div>
        <p className="eyebrow">A LITTLE MORE JOY IN YOUR INBOX</p>
        <h1>{isLogin ? "Welcome back" : "Find your people"}</h1>
        <p className="auth-subtitle">{isLogin ? "Your inbox is right where you left it." : "Create your account and start sharing notes."}</p>
        <form className="auth-form" onSubmit={submit}>
          {!isLogin && <label>Your name<input autoComplete="name" name="name" placeholder="How should we call you?" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} minLength="2" maxLength="80" required /></label>}
          <label>Email address<span className="input-icon"><Mail size={17} /><input type="email" autoComplete="email" name="email" placeholder="you@example.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></span></label>
          <label>Password<span className="input-icon password-input"><input type={visible ? "text" : "password"} autoComplete={isLogin ? "current-password" : "new-password"} name="password" placeholder="At least 8 characters" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength="8" required /><button type="button" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible((value) => !value)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          {message && <p className={`form-message ${error ? "form-error" : "form-success"}`} role="status">{message}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? <><span className="button-spinner" />One moment…</> : isLogin ? "Sign in to Smart Mail" : "Create my account"}</button>
        </form>
        <p className="auth-switch-copy">{isLogin ? "New around here?" : "Already have an account?"} <button type="button" onClick={changeMode}>{isLogin ? "Create an account" : "Sign in"}</button></p>
        <p className="auth-footer"><Heart size={13} fill="currentColor" /> A calmer, kinder place for your mail</p>
      </section>
    </div>
  );
}
