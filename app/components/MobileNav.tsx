"use client";
import { Theme } from "../types";
import { NAV, fmt } from "../constants";

interface MobileNavProps {
  C: Theme; dark: boolean; activeTab: string; setActiveTab: (v: string) => void;
  remaining: number; toggleDark: () => void; setDrawerOpen: (v: boolean) => void;
}

export function MobileHeader({ C, dark, remaining, toggleDark, setDrawerOpen }: Omit<MobileNavProps, "activeTab"|"setActiveTab">) {
  return (
    <div className="mob-header">
      <div style={{fontSize:"18px",fontWeight:700,color:C.text}}><span style={{color:C.accent}}>Budget</span>ly</div>
      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
        <span style={{fontSize:"13px",fontWeight:600,color:remaining>=0?C.green:C.red}}>{fmt(remaining)}</span>
        <button onClick={toggleDark} style={{background:C.navActive,border:`1px solid ${C.border}`,borderRadius:"20px",padding:"4px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:"5px"}}>
          <div style={{width:"28px",height:"16px",borderRadius:"16px",background:dark?C.accent:"#d1cfe8",position:"relative",flexShrink:0}}>
            <div style={{position:"absolute",top:"2px",left:dark?"14px":"2px",width:"12px",height:"12px",borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
          </div>
          <span style={{fontSize:"12px"}}>{dark?"☀️":"🌙"}</span>
        </button>
        <button onClick={()=>setDrawerOpen(true)} style={{background:"none",border:`1px solid ${C.border}`,color:C.text,cursor:"pointer",borderRadius:"7px",padding:"5px 9px",fontSize:"14px"}}>☰</button>
      </div>
    </div>
  );
}

export function MobileNav({ C, activeTab, setActiveTab }: Pick<MobileNavProps, "C"|"activeTab"|"setActiveTab">) {
  return (
    <div className="mob-nav">
      {NAV.map(item=>(
        <button key={item.id} onClick={()=>setActiveTab(item.id)} style={{flex:1,padding:"5px 3px",border:"none",background:"transparent",color:activeTab===item.id?C.accent:C.faint,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",fontFamily:"'DM Sans',sans-serif"}}>
          <span style={{fontSize:"16px"}}>{item.icon}</span>
          <span style={{fontSize:"9px",fontWeight:activeTab===item.id?600:400}}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
