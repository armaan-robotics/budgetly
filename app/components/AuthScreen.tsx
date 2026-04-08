"use client";
import { useState, CSSProperties } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { btnP, makeTheme } from "./types";

interface AuthScreenProps {
  onAuth: (user: User) => void;
  dark: boolean;
}

export default function AuthScreen({ onAuth, dark: _dark }: AuthScreenProps) {
  // Always light mode on login page
  const C = makeTheme(false);
  const ACCENT = "#6c5ce7";
  const [mode,     setMode]     = useState<"login" | "signup">("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  const sInput: CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: "9px",
    border: "1.5px solid #e0ddf8", background: "#f5f3ff",
    color: "#1a1a2e", fontSize: "14px", outline: "none",
    boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif", marginBottom: "10px",
  };

  const handle = async () => {
    setError(""); setLoading(true);
    if (mode === "signup") {
      const { error: e } = await supabase.auth.signUp({ email, password });
      if (e) { setError(e.message); setLoading(false); return; }
      setDone(true); setLoading(false); return;
    }
    const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) { setError(e.message); setLoading(false); return; }
    if (data.user) onAuth(data.user);
    setLoading(false);
  };

  const pageStyle: CSSProperties = {
    height: "100vh", background: "#f7f6ff",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    fontFamily: "'DM Sans',sans-serif",
    padding: "16px", boxSizing: "border-box", overflow: "hidden",
  };

  if (done) return (
    <div style={pageStyle}>
      <div style={{ maxWidth: "360px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "36px", marginBottom: "18px" }}>📧</div>
        <div style={{ fontSize: "18px", fontWeight: 700, color: "#1a1a2e", marginBottom: "8px" }}>Check your email</div>
        <div style={{ fontSize: "13px", color: "#555", lineHeight: 1.6, marginBottom: "20px" }}>We sent a confirmation link to <strong>{email}</strong>. Click it then come back and log in.</div>
        <button onClick={() => { setDone(false); setMode("login"); }} style={{ ...btnP, width: "100%", padding: "11px" }}>Back to Login</button>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: "360px", width: "100%", display: "flex", flexDirection: "column", gap: "0" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#1a1a2e", letterSpacing: "-0.5px" }}>
            <span style={{ color: ACCENT }}>Budget</span>ly
          </div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "3px" }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </div>
        </div>

        {/* Email/password */}
        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)} style={sInput} />
        <div style={{ position: "relative", marginBottom: "10px" }}>
          <input type={showPw ? "text" : "password"} placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()}
            style={{ ...sInput, marginBottom: "0", paddingRight: "52px" }} />
          <button onClick={() => setShowPw(v => !v)}
            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "12px", fontFamily: "'DM Sans',sans-serif" }}>
            {showPw ? "Hide" : "Show"}
          </button>
        </div>
        {error && <div style={{ fontSize: "12px", color: "#c0392b", marginBottom: "8px", padding: "8px 10px", background: "#fdecea", borderRadius: "7px" }}>{error}</div>}
        <button onClick={handle} disabled={loading}
          style={{ ...btnP, width: "100%", padding: "11px", fontSize: "14px", opacity: loading ? 0.7 : 1, marginBottom: "18px" }}>
          {loading ? "..." : (mode === "login" ? "Log In" : "Sign Up")}
        </button>
        <div style={{ textAlign: "center", fontSize: "12px", color: "#888" }}>
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            style={{ background: "none", border: "none", color: ACCENT, cursor: "pointer", fontWeight: 700, fontSize: "12px", fontFamily: "'DM Sans',sans-serif" }}>
            {mode === "login" ? "Sign Up" : "Log In"}
          </button>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #e0ddf8", margin: "16px 0" }} />

        {/* Install instructions */}
        <div style={{ background: "#ede9f8", borderRadius: "10px", padding: "12px 14px" }}>
          <div style={{ fontSize: "11px", color: ACCENT, fontWeight: 700, marginBottom: "6px" }}>📱 Install on Android</div>
          {["Open this page in Chrome", "Tap ⋮ → Add to Home screen", "Tap Add — done"].map((step, i) => (
            <div key={i} style={{ display: "flex", gap: "7px", marginBottom: "3px", alignItems: "flex-start" }}>
              <div style={{ width: "14px", height: "14px", borderRadius: "50%", background: ACCENT, color: "#fff", fontSize: "8px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>{i + 1}</div>
              <div style={{ fontSize: "11px", color: "#555", lineHeight: 1.4 }}>{step}</div>
            </div>
          ))}
        </div>

        {/* Credit */}
        <div style={{ textAlign: "center", fontSize: "11px", color: "#aaa", marginTop: "12px" }}>
          Made by <span style={{ color: "#888", fontWeight: 600 }}>Armaan Gupta</span>
        </div>
      </div>
    </div>
  );
}
