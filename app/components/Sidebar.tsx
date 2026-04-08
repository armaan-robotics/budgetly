"use client";

import { CSSProperties } from "react";
import { SidebarProps, NAV, fmtMK } from "./types";

export default function Sidebar({ C, appMode, activeMK, allMKs, activeTab, dbLoading, setActiveMK, setActiveTab, setDrawerOpen }: SidebarProps) {
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* Logo */}
      <div style={{padding:"0 20px 24px"}}>
        <div style={{fontSize:"24px",fontWeight:900,letterSpacing:"-0.8px",color:C.text}}><span style={{color:C.accent}}>Budget</span>ly</div>
        <div style={{display:"flex",alignItems:"center",gap:"5px",marginTop:"4px"}}>
          <span style={{fontSize:"9px",background:C.navActive,color:C.accent,padding:"2px 7px",borderRadius:"20px",fontWeight:700,letterSpacing:"0.5px",textTransform:"uppercase"}}>
            {appMode==="household"?"🏠 Household":"🎓 Student"}
          </span>
        </div>
      </div>

      {/* Month selector */}
      <div style={{padding:"0 14px 20px"}}>
        <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"5px"}}>Active Month</div>
        <select value={activeMK} onChange={e=>setActiveMK(e.target.value)}
          style={{...sInput,fontSize:"12px",appearance:"none",cursor:"pointer",padding:"8px 11px"}}>
          {allMKs.map(mk=><option key={mk} value={mk}>{fmtMK(mk)}</option>)}
        </select>
      </div>



      {dbLoading&&<div style={{textAlign:"center",fontSize:"11px",color:C.faint,marginBottom:"10px"}}>Syncing…</div>}

      {/* Nav */}
      <nav style={{flex:1,padding:"0 8px"}}>
        {NAV.map(item=>(
          <button key={item.id} onClick={()=>{setActiveTab(item.id);setDrawerOpen(false);}} style={{
            width:"100%",padding:"11px 14px",borderRadius:"10px",border:"none",
            background:activeTab===item.id?C.navActive:"transparent",
            color:activeTab===item.id?C.accent:C.muted,
            fontWeight:activeTab===item.id?600:400,
            fontSize:"13px",cursor:"pointer",textAlign:"left",
            display:"flex",alignItems:"center",gap:"9px",
            marginBottom:"4px",fontFamily:"'DM Sans',sans-serif",
          }}>
            <span style={{fontSize:"14px",width:"18px",textAlign:"center"}}>{item.icon}</span>
            {item.label}
          </button>
        ))}
        {/* Trends — sidebar only */}
        <button onClick={()=>{setActiveTab("trends");setDrawerOpen(false);}} style={{
          width:"100%",padding:"11px 14px",borderRadius:"10px",border:"none",
          background:activeTab==="trends"?C.navActive:"transparent",
          color:activeTab==="trends"?C.accent:C.muted,
          fontWeight:activeTab==="trends"?600:400,
          fontSize:"13px",cursor:"pointer",textAlign:"left",
          display:"flex",alignItems:"center",gap:"9px",
          marginBottom:"4px",fontFamily:"'DM Sans',sans-serif",
        }}>
          <span style={{fontSize:"14px",width:"18px",textAlign:"center",fontStyle:"normal"}}>∿</span>
          Trends
        </button>
      </nav>

      {/* Settings button at bottom */}
      <div style={{padding:"10px 12px 0",borderTop:`1px solid ${C.border}`}}>
        <button onClick={()=>{setActiveTab("settings");setDrawerOpen(false);}} style={{
          width:"100%",padding:"11px 14px",borderRadius:"10px",border:"none",
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
