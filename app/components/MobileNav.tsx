"use client";

import { MobileNavProps } from "./types";

export default function MobileNav({ C, activeTab, setActiveTab }: MobileNavProps) {
  return (
    <div className="mob-nav">
      {([
        {id:"overview", label:"Overview", icon:"◎"},
        {id:"expenses", label:"Expenses", icon:"↓"},
        {id:"earnings", label:"Cash In",  icon:"↑"},
        {id:"credit",   label:"Credits",  icon:"⇄"},
        {id:"settings", label:"Settings", icon:"⚙"},
      ] as const).map(item=>(
        <button key={item.id} onClick={()=>setActiveTab(item.id)} style={{flex:1,padding:"8px 3px",border:"none",background:"transparent",color:activeTab===item.id?C.accent:C.faint,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",fontFamily:"'DM Sans',sans-serif"}}>
          <span style={{fontSize:"16px"}}>{item.icon}</span>
          <span style={{fontSize:"9px",fontWeight:activeTab===item.id?600:400}}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
