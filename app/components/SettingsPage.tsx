"use client";
import { CSSProperties } from "react";
import { User } from "@supabase/supabase-js";
import { Theme, Expense, Entry } from "../types";
import { btnB, btnP, fmtMK } from "../constants";

interface SettingsPageProps {
  C: Theme; dark: boolean; user: User | null; activeMK: string;
  budget: number; totalEarnings: number; cashFlowIn: number; cashFlowOut: number;
  totalSavings: number; remaining: number;
  expenses: Expense[]; earnings: Entry[]; savings: Entry[];
  deleteMonthConfirm: boolean; setDeleteMonthConfirm: (v: boolean) => void;
  setShowSettings: (v: boolean) => void; toggleDark: () => void;
  addNextMonth: () => void; deleteMonth: () => void;
  logout: () => void; setActiveTab: (v: string) => void;
}

export function SettingsPage(p: SettingsPageProps) {
  const { C } = p;
  const sCard: CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };

  const exportCSV = () => {
    const rows: string[][] = [];
    const q = (s: string | number) => `"${String(s).replace(/"/g,'""')}"`;
    rows.push(["BUDGETLY EXPORT"]);
    rows.push(["Month", fmtMK(p.activeMK)]);
    rows.push(["Exported on", new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})]);
    rows.push([]);
    rows.push(["SUMMARY"]);
    rows.push(["Budget", String(p.budget)]);
    rows.push(["Total Earnings", String(p.totalEarnings)]);
    rows.push(["Cash Flow In", String(p.cashFlowIn)]);
    rows.push(["Total Expenses", String(p.cashFlowOut)]);
    rows.push(["Total Savings", String(p.totalSavings)]);
    rows.push(["To Spend (Remaining)", String(p.remaining)]);
    rows.push([]);
    rows.push(["EXPENSES"]);
    rows.push(["Date","Category","Description","Amount (INR)"]);
    if (p.expenses.length === 0) rows.push(["No expenses"]);
    else [...p.expenses].sort((a,b)=>a.date.localeCompare(b.date)).forEach(e => rows.push([e.date, e.category, e.description||"—", String(e.amount)]));
    rows.push([]);
    rows.push(["CASH IN (EARNINGS)"]);
    rows.push(["Date","Description","Amount (INR)"]);
    if (p.earnings.length === 0) rows.push(["No earnings"]);
    else [...p.earnings].sort((a,b)=>a.date.localeCompare(b.date)).forEach(e => rows.push([e.date, e.description||"—", String(e.amount)]));
    rows.push([]);
    rows.push(["SAVINGS"]);
    rows.push(["Date","Description","Amount (INR)"]);
    if (p.savings.length === 0) rows.push(["No savings"]);
    else [...p.savings].sort((a,b)=>a.date.localeCompare(b.date)).forEach(e => rows.push([e.date, e.description||"—", String(e.amount)]));
    const csv = rows.map(r => r.map(c => q(c)).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `budgetly-${p.activeMK}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}
      onClick={e=>{if(e.target===e.currentTarget)p.setShowSettings(false);}}>
      <div style={{background:C.card,borderRadius:"20px 20px 0 0",padding:"28px 24px 36px",width:"100%",maxWidth:"460px",border:`1px solid ${C.border}`,borderBottom:"none",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{width:"36px",height:"4px",borderRadius:"4px",background:C.faint,margin:"0 auto 24px"}}/>
        <div style={{fontSize:"17px",fontWeight:600,color:C.text,marginBottom:"20px"}}>Settings</div>

        <div style={{marginBottom:"20px",paddingBottom:"20px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Account</div>
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.cardAlt,padding:"10px 12px",borderRadius:"10px",border:`1px solid ${C.border}`,marginBottom:"10px"}}>
              <div>
                <div style={{fontSize:"11px",color:C.muted,marginBottom:"2px"}}>Signed in as</div>
                <div style={{fontSize:"13px",color:C.text,fontWeight:500}}>{p.user?.email}</div>
              </div>
              <button onClick={()=>{p.setShowSettings(false);p.logout();}} style={{...btnB,background:C.delBg,color:C.red,padding:"7px 14px",fontSize:"12px"}}>Log out</button>
            </div>
            <div style={{background:C.green+"14",border:`1px solid ${C.green}33`,borderRadius:"10px",padding:"11px 14px"}}>
              <div style={{fontSize:"11px",color:C.green,fontWeight:600,marginBottom:"3px"}}>✓ Account active</div>
              <div style={{fontSize:"11px",color:C.muted,lineHeight:1.7}}>Your data syncs across all devices and is securely stored.</div>
            </div>
          </>
        </div>

        <div style={{marginBottom:"20px",paddingBottom:"20px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Appearance</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.cardAlt,padding:"12px 14px",borderRadius:"10px",border:`1px solid ${C.border}`}}>
            <div>
              <div style={{fontSize:"13px",color:C.text,fontWeight:500}}>{p.dark?"Dark Mode":"Light Mode"}</div>
              <div style={{fontSize:"11px",color:C.muted,marginTop:"2px"}}>Switch appearance</div>
            </div>
            <button onClick={p.toggleDark} style={{background:p.dark?C.accent:"#d1cfe8",border:"none",borderRadius:"20px",width:"44px",height:"24px",cursor:"pointer",position:"relative",flexShrink:0}}>
              <div style={{position:"absolute",top:"3px",left:p.dark?"23px":"3px",width:"18px",height:"18px",borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.25)"}}/>
            </button>
          </div>
        </div>

        <div style={{marginBottom:"20px",paddingBottom:"20px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Month</div>
          <button onClick={()=>{p.addNextMonth();p.setShowSettings(false);}} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.cardAlt,color:C.accent,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,textAlign:"left",marginBottom:"8px"}}>
            + Add New Month
          </button>
          {p.deleteMonthConfirm ? (
            <div>
              <div style={{fontSize:"12px",color:C.text,marginBottom:"8px",textAlign:"center"}}>Delete {fmtMK(p.activeMK)}?</div>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>{p.deleteMonth();p.setShowSettings(false);}} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:C.delBg,color:C.red,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Yes, delete</button>
                <button onClick={()=>p.setDeleteMonthConfirm(false)} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:C.cancelBg,color:C.muted,cursor:"pointer",fontSize:"12px",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>p.setDeleteMonthConfirm(true)} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:"transparent",color:C.red,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",textAlign:"left",opacity:0.8}}>
              🗑 Delete {fmtMK(p.activeMK)}
            </button>
          )}
        </div>

        <div style={{marginBottom:"20px",paddingBottom:"20px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>App</div>
          <button onClick={()=>{p.setShowSettings(false);p.setActiveTab("categories");}} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.cardAlt,color:C.text,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:500,textAlign:"left",marginBottom:"8px",display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"15px"}}>▦</span> Manage Categories
          </button>
          <button onClick={()=>{p.setShowSettings(false);p.setActiveTab("tutorial");}} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.cardAlt,color:C.text,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:500,textAlign:"left",display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"15px"}}>?</span> How to use Budgetly
          </button>
        </div>

        <div style={{marginBottom:"20px",paddingBottom:"20px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Get the App</div>
          <div style={{background:C.navActive,borderRadius:"10px",padding:"14px",border:`1px solid ${C.border}`}}>
            <div style={{fontSize:"12px",color:C.accent,fontWeight:600,marginBottom:"8px"}}>📱 Install on Android</div>
            {[
              "Open budgetly-xldm.vercel.app in Chrome on your phone",
              "Tap the 3-dot menu (⋮) in the top right",
              `Tap "Add to Home screen"`,
              `Tap "Add" — done`,
            ].map((step, i) => (
              <div key={i} style={{display:"flex",gap:"10px",marginBottom:"6px",alignItems:"flex-start"}}>
                <div style={{width:"18px",height:"18px",borderRadius:"50%",background:C.accent,color:"#fff",fontSize:"10px",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"1px"}}>{i+1}</div>
                <div style={{fontSize:"11px",color:C.muted,lineHeight:1.6}}>{step}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{marginBottom:"20px",paddingBottom:"20px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Export Data</div>
          <div style={{fontSize:"11px",color:C.muted,lineHeight:1.6,marginBottom:"10px"}}>Download all your data for {fmtMK(p.activeMK)} as a spreadsheet (.csv) you can open in Excel, Google Sheets, or any spreadsheet app.</div>
          <button onClick={exportCSV} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.cardAlt,color:C.green,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,textAlign:"left"}}>
            ↓ Export {fmtMK(p.activeMK)} as Spreadsheet
          </button>
        </div>

        <div>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Feedback</div>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSdtx7DdVgiihO1C6qGfO8Y_nPjvyMvjQUr9fZMdwuG2C1DlCg/viewform?usp=publish-editor"
            target="_blank" rel="noreferrer" onClick={()=>p.setShowSettings(false)}
            style={{display:"block",textAlign:"center",padding:"10px",borderRadius:"10px",background:C.navActive,color:C.accent,fontSize:"13px",fontWeight:600,textDecoration:"none"}}>
            💬 Give Feedback
          </a>
        </div>
      </div>
    </div>
  );
}
