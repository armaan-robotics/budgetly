"use client";
import { CSSProperties } from "react";
import { Theme } from "../types";
import { NAV, fmt, fmtMK } from "../constants";

interface SidebarProps {
  C: Theme; dark: boolean; activeMK: string; setActiveMK: (v: string) => void;
  allMKs: string[]; remaining: number; dbLoading: boolean;
  activeTab: string; setActiveTab: (v: string) => void;
  setDrawerOpen: (v: boolean) => void; setShowSettings: (v: boolean) => void;
}

export function Sidebar(p: SidebarProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"0 18px 20px"}}>
        <div style={{fontSize:"20px",fontWeight:700,letterSpacing:"-0.3px",color:C.text}}><span style={{color:C.accent}}>Budget</span>ly</div>
        <div style={{fontSize:"10px",color:p.dark?C.muted:C.faint,marginTop:"1px"}}>by Armaan Gupta</div>
      </div>

      <div style={{padding:"0 12px 14px"}}>
        <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"5px"}}>Active Month</div>
        <select value={p.activeMK} onChange={e=>p.setActiveMK(e.target.value)}
          style={{...sInput,fontSize:"12px",appearance:"none",cursor:"pointer",padding:"8px 11px"}}>
          {p.allMKs.map(mk=><option key={mk} value={mk}>{fmtMK(mk)}</option>)}
        </select>
      </div>

      <div style={{margin:"0 12px 16px",background:p.remaining>=0?C.pillGreen:C.pillRed,borderRadius:"10px",padding:"12px 14px",border:`1px solid ${p.remaining>=0?C.pillGreenBorder:C.pillRedBorder}`}}>
        <div style={{fontSize:"9px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"3px"}}>To Spend</div>
        <div style={{fontSize:"19px",fontWeight:600,color:p.remaining>=0?C.green:C.red}}>{fmt(p.remaining)}</div>
        <div style={{fontSize:"10px",color:C.muted,marginTop:"2px"}}>{fmtMK(p.activeMK)}</div>
      </div>

      {p.dbLoading&&<div style={{textAlign:"center",fontSize:"11px",color:C.faint,marginBottom:"10px"}}>Syncing…</div>}

      <nav style={{flex:1,padding:"0 8px"}}>
        {NAV.map(item=>(
          <button key={item.id} onClick={()=>{p.setActiveTab(item.id);p.setDrawerOpen(false);}} style={{
            width:"100%",padding:"9px 12px",borderRadius:"9px",border:"none",
            background:p.activeTab===item.id?C.navActive:"transparent",
            color:p.activeTab===item.id?C.accent:C.muted,
            fontWeight:p.activeTab===item.id?600:400,
            fontSize:"13px",cursor:"pointer",textAlign:"left",
            display:"flex",alignItems:"center",gap:"9px",
            marginBottom:"2px",fontFamily:"'DM Sans',sans-serif",
          }}>
            <span style={{fontSize:"14px",width:"18px",textAlign:"center"}}>{item.icon}</span>
            {item.label}
          </button>
        ))}
        <button onClick={()=>{p.setActiveTab("trends");p.setDrawerOpen(false);}} style={{
          width:"100%",padding:"9px 12px",borderRadius:"9px",border:"none",
          background:p.activeTab==="trends"?C.navActive:"transparent",
          color:p.activeTab==="trends"?C.accent:C.muted,
          fontWeight:p.activeTab==="trends"?600:400,
          fontSize:"13px",cursor:"pointer",textAlign:"left",
          display:"flex",alignItems:"center",gap:"9px",
          marginBottom:"2px",fontFamily:"'DM Sans',sans-serif",
        }}>
          <span style={{fontSize:"14px",width:"18px",textAlign:"center",fontStyle:"normal"}}>∿</span>
          Trends
        </button>
      </nav>

      <div style={{padding:"10px 12px 0",borderTop:`1px solid ${C.border}`}}>
        <button onClick={()=>p.setShowSettings(true)} style={{
          width:"100%",padding:"9px 12px",borderRadius:"9px",border:"none",
          background:"transparent",color:C.muted,fontWeight:400,
          fontSize:"13px",cursor:"pointer",textAlign:"left",
          display:"flex",alignItems:"center",gap:"9px",
          fontFamily:"'DM Sans',sans-serif",
        }}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.background=C.navActive;(e.currentTarget as HTMLButtonElement).style.color=C.accent;}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.background="transparent";(e.currentTarget as HTMLButtonElement).style.color=C.muted;}}>
          <span style={{fontSize:"15px",width:"18px",textAlign:"center"}}>⚙</span>
          Settings
        </button>
      </div>
    </div>
  );
}
