"use client";
import { useState, CSSProperties } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { Theme } from "../types";
import { makeTheme, btnP, btnB } from "../constants";

export function AuthScreen({ onAuth, dark }: { onAuth:(user:User)=>void; dark:boolean }) {
  const C = makeTheme(dark);
  const [mode,     setMode]     = useState<"login"|"signup">("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  const sInput: CSSProperties = { width:"100%",padding:"11px 14px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"15px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif",marginBottom:"12px" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"32px",border:`1px solid ${C.border}` };

  const handle = async () => {
    setError(""); setLoading(true);
    if (mode==="signup") {
      const { error:e } = await supabase.auth.signUp({ email, password });
      if (e) { setError(e.message); setLoading(false); return; }
      setDone(true); setLoading(false); return;
    }
    const { data, error:e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) { setError(e.message); setLoading(false); return; }
    if (data.user) onAuth(data.user);
    setLoading(false);
  };

  if (done) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{...sCard,maxWidth:"380px",width:"90%",textAlign:"center"}}>
        <div style={{fontSize:"32px",marginBottom:"12px"}}>📧</div>
        <div style={{fontSize:"18px",fontWeight:600,color:C.text,marginBottom:"8px"}}>Check your email</div>
        <div style={{fontSize:"13px",color:C.muted,lineHeight:1.6}}>We sent a confirmation link to <strong>{email}</strong>. Click it then come back and log in.</div>
        <button onClick={()=>{setDone(false);setMode("login");}} style={{...btnP,marginTop:"20px",width:"100%",padding:"11px"}}>Back to Login</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{...sCard,maxWidth:"380px",width:"90%"}}>
        <div style={{marginBottom:"24px"}}>
          <div style={{fontSize:"22px",fontWeight:700,color:C.text,marginBottom:"4px"}}><span style={{color:C.accent}}>Budget</span>ly</div>
          <div style={{fontSize:"13px",color:C.muted}}>{mode==="login"?"Welcome back":"Create your account"}</div>
        </div>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={sInput}/>
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} style={sInput}/>
        {error&&<div style={{fontSize:"12px",color:C.red,marginBottom:"10px",padding:"8px 10px",background:C.pillRed,borderRadius:"7px"}}>{error}</div>}
        <button onClick={handle} disabled={loading} style={{...btnP,width:"100%",padding:"12px",fontSize:"14px",opacity:loading?0.7:1}}>
          {loading?"...":(mode==="login"?"Log In":"Sign Up")}
        </button>
        <div style={{textAlign:"center",marginTop:"16px",fontSize:"13px",color:C.muted}}>
          {mode==="login"?"Don't have an account? ":"Already have an account? "}
          <button onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");}}
            style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontWeight:600,fontSize:"13px",fontFamily:"'DM Sans',sans-serif"}}>
            {mode==="login"?"Sign Up":"Log In"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MigrateModal({ onDecide, C }: { onDecide:(migrate:boolean)=>void; C:Theme }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{background:C.card,borderRadius:"14px",padding:"28px",maxWidth:"380px",width:"90%",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:"18px",fontWeight:600,color:C.text,marginBottom:"8px"}}>Import your existing data?</div>
        <div style={{fontSize:"13px",color:C.muted,lineHeight:1.7,marginBottom:"20px"}}>We found budget data saved locally on this device from before you had an account. Import it now so it syncs across all your devices?</div>
        <div style={{display:"flex",gap:"10px"}}>
          <button onClick={()=>onDecide(true)}  style={{...btnP,flex:1,padding:"11px"}}>Yes, import</button>
          <button onClick={()=>onDecide(false)} style={{...btnB,flex:1,padding:"11px",background:C.cancelBg,color:C.muted}}>Start fresh</button>
        </div>
      </div>
    </div>
  );
}
