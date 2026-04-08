"use client";
import { Theme } from "../types";
import { Sidebar } from "./Sidebar";

interface MobileDrawerProps {
  C: Theme; dark: boolean; activeMK: string; setActiveMK: (v: string) => void;
  allMKs: string[]; remaining: number; dbLoading: boolean;
  activeTab: string; setActiveTab: (v: string) => void;
  setDrawerOpen: (v: boolean) => void; setShowSettings: (v: boolean) => void;
}

export function MobileDrawer(p: MobileDrawerProps) {
  const { C } = p;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,display:"flex"}}>
      <div style={{width:"260px",background:C.sidebar,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"24px 0",overflowY:"auto"}}>
        <Sidebar
          C={C} dark={p.dark} activeMK={p.activeMK} setActiveMK={p.setActiveMK}
          allMKs={p.allMKs} remaining={p.remaining} dbLoading={p.dbLoading}
          activeTab={p.activeTab} setActiveTab={p.setActiveTab}
          setDrawerOpen={p.setDrawerOpen} setShowSettings={p.setShowSettings}
        />
      </div>
      <div style={{flex:1,background:"rgba(0,0,0,0.3)"}} onClick={()=>p.setDrawerOpen(false)}/>
    </div>
  );
}
