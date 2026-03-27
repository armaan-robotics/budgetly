"use client";

import { useState, useEffect, useCallback, ReactNode, CSSProperties } from "react";
import { createClient, User } from "@supabase/supabase-js";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface Entry    { id: number; amount: number; description: string; date: string; mode?: string; }
interface Expense extends Entry { category: string; account?: string; }
interface MonthData { budget: number; expenses: Expense[]; earnings: Entry[]; savings: Entry[]; }
interface AllMonths { [mk: string]: MonthData; }
type AppMode = "student" | "household";
interface Theme {
  bg: string; sidebar: string; card: string; cardAlt: string;
  border: string; text: string; muted: string; faint: string;
  accent: string; green: string; red: string; amber: string;
  inputBg: string; progressTrack: string; navActive: string;
  pillGreen: string; pillGreenBorder: string; pillRed: string; pillRedBorder: string;
  delBg: string; cancelBg: string; upcomingBg: string;
}

// ─── localStorage ─────────────────────────────────────────────────────────────
function lsLoad<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? (JSON.parse(r) as T) : fallback; }
  catch { return fallback; }
}
function lsSave(key: string, val: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_CATS: string[] = ["Food","Transport","College","Entertainment","Health","Shopping","Other"];
const DEFAULT_ACCOUNTS: string[] = ["Main Account","Cash","Savings Account"];
const PAYMENT_MODES: string[] = ["UPI","Cash","Card","Bank Transfer","Other"];
const CAT_COLORS: string[]   = ["#f97316","#06b6d4","#8b5cf6","#10b981","#f43f5e","#eab308","#6366f1","#ec4899","#14b8a6","#84cc16","#ef4444","#3b82f6"];
const NAV = [
  { id:"overview",   label:"Overview",   icon:"◎" },
  { id:"expenses",   label:"Expenses",   icon:"↓" },
  { id:"earnings",   label:"Cash In",    icon:"↑" },
  { id:"savings",    label:"Savings",    icon:"⬡" },
  { id:"credit",     label:"Credit",     icon:"⇄" },
] as const;

// Swipeable tab order (only main tabs, not settings/categories/tutorial)
const SWIPE_TABS = ["overview","expenses","earnings","savings","credit","trends"];

// ─── Theme factory ────────────────────────────────────────────────────────────
function makeTheme(dark: boolean): Theme {
  return dark ? {
    bg:             "#111114",
    sidebar:        "#18181c",
    card:           "#1e1e23",
    cardAlt:        "#16161a",
    border:         "#2c2c34",
    text:           "#c8c6d0",
    muted:          "#68667a",
    faint:          "#3c3a4c",
    accent:         "#7c6fd4",
    green:          "#3aaa80",
    red:            "#b86050",
    amber:          "#b89028",
    inputBg:        "#141418",
    progressTrack:  "#2c2c34",
    navActive:      "#222230",
    pillGreen:      "#0e241a",
    pillGreenBorder:"#1c3e2c",
    pillRed:        "#241212",
    pillRedBorder:  "#3e2020",
    delBg:          "#241414",
    cancelBg:       "#1e1e26",
    upcomingBg:     "#141418",
  } : {
    bg:             "#f7f6f3",
    sidebar:        "#ffffff",
    card:           "#ffffff",
    cardAlt:        "#faf9f7",
    border:         "#e8e5e0",
    text:           "#2d2926",
    muted:          "#9c9589",
    faint:          "#c8c3bc",
    accent:         "#6c5ce7",
    green:          "#00b894",
    red:            "#e17055",
    amber:          "#e0a800",
    inputBg:        "#faf9f7",
    progressTrack:  "#f0ede8",
    navActive:      "#ede9f8",
    pillGreen:      "#edfaf5",
    pillGreenBorder:"#b2ead0",
    pillRed:        "#fdecea",
    pillRedBorder:  "#f5c0b8",
    delBg:          "#fde8e4",
    cancelBg:       "#f0ede8",
    upcomingBg:     "#faf9f7",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt     = (n: number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
const todayS  = () => new Date().toISOString().split("T")[0];
const curMK   = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const fmtMK   = (mk:string) => { const [y,m]=mk.split("-"); return new Date(+y,+m-1,1).toLocaleDateString("en-IN",{month:"long",year:"numeric"}); };
const getDays = (mk:string) => { const [y,m]=mk.split("-").map(Number); return new Date(y,m,0).getDate(); };
const emptyMD = (): MonthData => ({ budget:10000, expenses:[], earnings:[], savings:[] });

// ─── Shared button base ───────────────────────────────────────────────────────
const btnB: CSSProperties = { borderRadius:"9px",border:"none",fontWeight:600,fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"9px 18px",transition:"opacity 0.15s" };
const btnP  = { ...btnB, background:"#6c5ce7", color:"#fff" };
const btnG  = { ...btnB, background:"#00b894", color:"#fff" };
const btnA  = { ...btnB, background:"#e0a800", color:"#fff" };

// ─── Props interfaces ─────────────────────────────────────────────────────────
interface OvProps {
  C:Theme; budget:number; cashFlowIn:number; cashFlowOut:number; totalEarnings:number;
  totalSavings:number; remaining:number; spentPct:number;
  editingBudget:boolean; tempBudget:string;
  setEditingBudget:(v:boolean)=>void; setTempBudget:(v:string)=>void; saveBudget:()=>void;
  expenses:Expense[]; savings:Entry[]; categories:string[]; accounts:string[]; appMode:AppMode;
  daysInMonth:number; todayDay:number; idealPerDay:number;
  idealSpentByToday:number; actualVsIdeal:number;
  moneyLeft:number; daysLeft:number; currentDailyAvg:number; currentIdealAvg:number;
}
interface ExProps { C:Theme; expenses:Expense[];categories:string[];accounts:string[];appMode:AppMode;totalExpenses:number;expAmt:string;expCat:string;expDesc:string;expDate:string;expMode:string;expAcc:string;setExpAmt:(v:string)=>void;setExpCat:(v:string)=>void;setExpDesc:(v:string)=>void;setExpDate:(v:string)=>void;setExpMode:(v:string)=>void;setExpAcc:(v:string)=>void;addExpense:()=>void;deleteConfirm:number|null;setDeleteConfirm:(v:number|null)=>void;deleteExpense:(id:number)=>void;updateExpense:(id:number,u:Partial<Expense>)=>void; }
interface ErProps { C:Theme; earnings:Entry[];accounts:string[];appMode:AppMode;totalEarnings:number;earnAmt:string;earnDesc:string;earnDate:string;earnMode:string;earnAcc:string;setEarnAmt:(v:string)=>void;setEarnDesc:(v:string)=>void;setEarnDate:(v:string)=>void;setEarnMode:(v:string)=>void;setEarnAcc:(v:string)=>void;addEarning:()=>void;deleteConfirm:number|null;setDeleteConfirm:(v:number|null)=>void;deleteEarning:(id:number)=>void;updateEarning:(id:number,u:Partial<Entry>)=>void; }
interface SvProps { C:Theme; savings:Entry[];accounts:string[];appMode:AppMode;totalSavings:number;cashFlowIn:number;savAmt:string;savDesc:string;savDate:string;savMode:string;savAcc:string;setSavAmt:(v:string)=>void;setSavDesc:(v:string)=>void;setSavDate:(v:string)=>void;setSavMode:(v:string)=>void;setSavAcc:(v:string)=>void;addSaving:()=>void;deleteConfirm:number|null;setDeleteConfirm:(v:number|null)=>void;deleteSaving:(id:number)=>void;updateSaving:(id:number,u:Partial<Entry>)=>void; }
interface CaProps { C:Theme; categories:string[];expenses:Expense[];cashFlowOut:number;newCategory:string;setNewCategory:(v:string)=>void;addCategory:()=>void;deleteCategory:(cat:string)=>void; }
interface CreditEntry { id:number; person:string; amount:number; description:string; date:string; type:"owed_to_me"|"i_owe"; cleared:boolean; }
interface CrProps { C:Theme; credits:CreditEntry[];crAmt:string;crPerson:string;crDesc:string;crDate:string;crType:"owed_to_me"|"i_owe";setCrAmt:(v:string)=>void;setCrPerson:(v:string)=>void;setCrDesc:(v:string)=>void;setCrDate:(v:string)=>void;setCrType:(v:"owed_to_me"|"i_owe")=>void;addCredit:()=>void;toggleCleared:(id:number)=>void;deleteCredit:(id:number)=>void;deleteConfirm:number|null;setDeleteConfirm:(v:number|null)=>void; }
interface TrProps { C:Theme; allMonths:AllMonths; activeMK:string; categories:string[]; }

// ─── Primitives (module-level) ────────────────────────────────────────────────
function FF({ label, children, C }: { label:string; children:ReactNode; C:Theme }) {
  return (
    <div style={{marginBottom:"12px"}}>
      <label style={{display:"block",fontSize:"11px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"6px",fontWeight:500}}>{label}</label>
      {children}
    </div>
  );
}

function EntryRow({ left, right, C }: { left:ReactNode; right:ReactNode; C:Theme }) {
  return (
    <div style={{background:C.cardAlt,borderRadius:"10px",padding:"11px 13px",border:`1px solid ${C.border}`,marginBottom:"6px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"10px"}}>
      <div style={{flex:1,minWidth:0}}>{left}</div>
      <div style={{display:"flex",alignItems:"center",gap:"9px",flexShrink:0}}>{right}</div>
    </div>
  );
}

function DelBtn({ id,confirm,setConfirm,onDel,C }: { id:number;confirm:number|null;setConfirm:(v:number|null)=>void;onDel:(id:number)=>void;C:Theme }) {
  if (confirm===id) return (
    <div style={{display:"flex",gap:"5px"}}>
      <button onClick={()=>onDel(id)} style={{background:C.delBg,border:"none",color:C.red,borderRadius:"7px",padding:"4px 9px",cursor:"pointer",fontSize:"12px",fontWeight:600}}>Del</button>
      <button onClick={()=>setConfirm(null)} style={{background:C.cancelBg,border:"none",color:C.muted,borderRadius:"7px",padding:"4px 9px",cursor:"pointer",fontSize:"12px"}}>No</button>
    </div>
  );
  return (
    <button onClick={()=>setConfirm(id)}
      style={{background:"none",border:`1px solid ${C.border}`,color:C.faint,cursor:"pointer",fontSize:"11px",borderRadius:"7px",padding:"3px 8px"}}
      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.red;(e.currentTarget as HTMLButtonElement).style.borderColor=C.red+"66";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.faint;(e.currentTarget as HTMLButtonElement).style.borderColor=C.border;}}>✕</button>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ C, title, fields, onSave, onClose }: {
  C: Theme;
  title: string;
  fields: { label: string; value: string; onChange: (v: string) => void; type?: string; options?: string[] }[];
  onSave: () => void;
  onClose: () => void;
}) {
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:"16px"}}>
      <div style={{background:C.card,borderRadius:"16px",padding:"24px",width:"100%",maxWidth:"420px",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:"16px",fontWeight:600,color:C.text,marginBottom:"18px"}}>{title}</div>
        {fields.map((f,i) => (
          <div key={i} style={{marginBottom:"12px"}}>
            <label style={{display:"block",fontSize:"11px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"6px",fontWeight:500}}>{f.label}</label>
            {f.options ? (
              <select value={f.value} onChange={e=>f.onChange(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}>
                {f.options.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type={f.type||"text"} value={f.value} onChange={e=>f.onChange(e.target.value)} style={sInput}/>
            )}
          </div>
        ))}
        <div style={{display:"flex",gap:"10px",marginTop:"8px"}}>
          <button onClick={onSave} style={{...{borderRadius:"9px",border:"none",fontWeight:600,fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"10px 18px",transition:"opacity 0.15s"},background:"#6c5ce7",color:"#fff",flex:1}}>Save</button>
          <button onClick={onClose} style={{...{borderRadius:"9px",border:"none",fontWeight:600,fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"10px 18px",transition:"opacity 0.15s"},background:C.cancelBg,color:C.muted,flex:1}}>Cancel</button>
        </div>
      </div>
      {p.appMode==="household"&&p.accounts.length>0&&(()=>{
        const accTotals=p.accounts.map((acc,i)=>({
          name:acc,color:CAT_COLORS[i%CAT_COLORS.length],
          totalOut:p.expenses.filter(e=>e.account===acc).reduce((s,e)=>s+e.amount,0),
          totalIn:(p.savings as any[]).filter(e=>e.account===acc).reduce((s:number,e:any)=>s+e.amount,0),
          count:p.expenses.filter(e=>e.account===acc).length,
        })).filter(a=>a.totalOut>0||a.totalIn>0);
        if(accTotals.length===0)return null;
        return(
          <div style={{...sCard,marginBottom:"12px"}}>
            <div style={sSecT}>By Account</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"9px"}}>
              {accTotals.map(acc=>(
                <div key={acc.name} style={{background:C.cardAlt,borderRadius:"10px",padding:"12px",border:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"}}>
                    <div style={{width:"7px",height:"7px",borderRadius:"50%",background:acc.color}}/>
                    <span style={{fontSize:"12px",fontWeight:500,color:C.text}}>{acc.name}</span>
                  </div>
                  <div style={{fontSize:"14px",fontWeight:600,color:acc.color}}>{fmt(acc.totalOut)}</div>
                  <div style={{fontSize:"10px",color:C.faint,marginTop:"2px"}}>{acc.count} transactions</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Entry List Sub-components (with edit) ───────────────────────────────────
// ─── Tab components (module-level — stable references, no typing bug) ─────────
function OverviewTab(p: OvProps) {
  const { C } = p;
  const sCard: CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT: CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };
  const catTotals = p.categories.map((cat,i)=>({
    name:cat,color:CAT_COLORS[i%CAT_COLORS.length],
    total:p.expenses.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0),
    count:p.expenses.filter(e=>e.category===cat).length,
  })).filter(c=>c.total>0);
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"10px",marginBottom:"12px"}}>
        {([
          {label:"Cash Flow In", val:fmt(p.cashFlowIn),  color:C.green,  sub:`Budget + ${fmt(p.totalEarnings)} earned`},
          {label:"Cash Flow Out",val:fmt(p.cashFlowOut), color:C.red,    sub:`${p.expenses.length} expense${p.expenses.length!==1?"s":""}`},
          {label:"Total Savings",val:fmt(p.totalSavings),color:C.amber,  sub:`${p.savings.length} entr${p.savings.length!==1?"ies":"y"}`},
          {label:"To Spend",     val:fmt(p.remaining),   color:p.remaining>=0?C.green:C.red, sub:p.remaining>=0?"On track":"Over budget ⚠"},
        ] as {label:string;val:string;color:string;sub:string}[]).map(s=>(
          <div key={s.label} style={{...sCard,borderTop:`3px solid ${s.color}`,padding:"14px"}}>
            <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"5px"}}>{s.label}</div>
            <div style={{fontSize:"clamp(15px,2.5vw,21px)",fontWeight:600,color:s.color}}>{s.val}</div>
            <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {p.appMode==="student"&&<div style={{...sCard,marginBottom:"12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px",flexWrap:"wrap",gap:"8px"}}>
          <div>
            <div style={sSecT}>Monthly Budget</div>
            {p.editingBudget ? (
              <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
                <input value={p.tempBudget} onChange={e=>p.setTempBudget(e.target.value)}
                  style={{width:"120px",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif"}}
                  type="number"/>
                <button onClick={p.saveBudget} style={btnP}>Save</button>
                <button onClick={()=>p.setEditingBudget(false)} style={{...btnB,background:C.cancelBg,color:C.muted}}>✕</button>
              </div>
            ):(
              <div style={{display:"flex",alignItems:"baseline",gap:"9px"}}>
                <span style={{fontSize:"clamp(18px,3vw,26px)",fontWeight:600,color:C.text}}>{fmt(p.budget)}</span>
                <button onClick={()=>{p.setEditingBudget(true);p.setTempBudget(String(p.budget));}}
                  style={{...btnB,background:C.navActive,color:C.accent,padding:"3px 10px",fontSize:"12px"}}>Edit</button>
              </div>
            )}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={sSecT}>Spent</div>
            <div style={{fontSize:"clamp(18px,3vw,26px)",fontWeight:600,color:p.spentPct>80?C.red:C.text}}>{p.spentPct.toFixed(1)}%</div>
          </div>
        </div>
        <div style={{background:C.progressTrack,borderRadius:"8px",height:"8px",overflow:"hidden",marginBottom:"7px"}}>
          <div style={{height:"100%",borderRadius:"8px",background:p.spentPct>80?C.red:C.accent,width:`${p.spentPct}%`,transition:"width 0.5s ease"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:"11px",color:C.muted}}>Spent {fmt(p.cashFlowOut)}</span>
          <span style={{fontSize:"11px",color:C.muted}}>of {fmt(p.cashFlowIn)}</span>
        </div>
      </div>}

      {p.appMode==="student"&&<div style={{...sCard,marginBottom:"12px"}}>
        <div style={sSecT}>Daily Averages</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)"}}>
          {([
            {label:"Ideal monthly avg",  val:fmt(p.idealPerDay),     color:C.accent, note:""},
            {label:"Daily avg to spend", val:fmt(p.currentIdealAvg), color:p.currentIdealAvg<p.idealPerDay?C.green:C.red, note:""},
            {label:"Spent per day",      val:fmt(p.currentDailyAvg), color:C.muted,  note:""},
          ] as {label:string;val:string;color:string;note:string}[]).map((d,i)=>(
            <div key={i} style={{padding:"10px 8px",borderLeft:i>0?`1px solid ${C.border}`:"none",textAlign:"center"}}>
              <div style={{fontSize:"9px",color:C.muted,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:"6px",lineHeight:1.3}}>{d.label}</div>
              <div style={{fontSize:"clamp(13px,2vw,18px)",fontWeight:600,color:d.color}}>{d.val}</div>
              <div style={{fontSize:"9px",color:C.muted,marginTop:"4px",lineHeight:1.3}}>{d.note}</div>
            </div>
          ))}
        </div>

      </div>}

      {catTotals.length>0&&(
        <div style={{...sCard,marginBottom:"12px"}}>
          <div style={sSecT}>Spending by Category</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"9px"}}>
            {catTotals.map(cat=>(
              <div key={cat.name} style={{background:C.cardAlt,borderRadius:"10px",padding:"12px",border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                    <div style={{width:"7px",height:"7px",borderRadius:"50%",background:cat.color}}/>
                    <span style={{fontSize:"12px",fontWeight:500,color:C.text}}>{cat.name}</span>
                  </div>
                  <span style={{fontSize:"10px",color:C.faint}}>{cat.count}</span>
                </div>
                <div style={{fontSize:"16px",fontWeight:600,color:cat.color,marginBottom:"5px"}}>{fmt(cat.total)}</div>
                <div style={{background:C.progressTrack,borderRadius:"5px",height:"3px"}}>
                  <div style={{height:"100%",borderRadius:"5px",background:cat.color,width:`${p.cashFlowOut>0?Math.min((cat.total/p.cashFlowOut)*100,100):0}%`}}/>
                </div>
                <div style={{fontSize:"10px",color:C.faint,marginTop:"3px"}}>{p.cashFlowOut>0?((cat.total/p.cashFlowOut)*100).toFixed(1):0}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Entry Table (sortable, clickable rows) ───────────────────────────────────
type SortKey = "date"|"amount"|"description"|"category"|"mode"|"account";
function EntryTable<T extends Entry>({entries, columns, accentColor, onEdit, onDelete, C}: {
  entries: T[];
  columns: {key: SortKey; label: string; render: (e:T)=>React.ReactNode; sortable?: boolean}[];
  accentColor: string;
  onEdit: (e:T)=>void;
  onDelete: (id:number)=>void;
  C: Theme;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [expandId, setExpandId] = useState<number|null>(null);
  const [deleteId, setDeleteId] = useState<number|null>(null);

  const sorted = [...entries].sort((a,b)=>{
    let av: any = (a as any)[sortKey]??"";
    let bv: any = (b as any)[sortKey]??"";
    if(sortKey==="amount"){av=+(av);bv=+(bv);}
    if(av<bv)return sortDir==="asc"?-1:1;
    if(av>bv)return sortDir==="asc"?1:-1;
    return 0;
  });

  const toggleSort = (key: SortKey) => {
    if(sortKey===key) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const thStyle: CSSProperties = {
    padding:"8px 10px", fontSize:"10px", color:C.muted, textTransform:"uppercase",
    letterSpacing:"1.2px", fontWeight:600, cursor:"pointer", userSelect:"none",
    borderBottom:`1px solid ${C.border}`, textAlign:"left", whiteSpace:"nowrap",
  };
  const tdStyle: CSSProperties = {
    padding:"9px 10px", fontSize:"13px", color:C.text, borderBottom:`1px solid ${C.border}`,
    verticalAlign:"middle",
  };

  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'DM Sans',sans-serif"}}>
        <thead>
          <tr style={{background:C.cardAlt}}>
            {columns.map(col=>(
              <th key={col.key} style={thStyle} onClick={()=>col.sortable!==false&&toggleSort(col.key)}>
                {col.label}{sortKey===col.key?(sortDir==="asc"?" ↑":" ↓"):""}
              </th>
            ))}
            <th style={{...thStyle,cursor:"default",width:"60px"}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length===0&&(
            <tr><td colSpan={columns.length+1} style={{...tdStyle,textAlign:"center",color:C.faint,padding:"32px"}}>No entries yet</td></tr>
          )}
          {sorted.map(entry=>(
            <>
              <tr key={entry.id} style={{cursor:"pointer",transition:"background 0.1s"}}
                onClick={()=>setExpandId(expandId===entry.id?null:entry.id)}
                onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background=C.cardAlt}
                onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background=""}>
                {columns.map(col=>(
                  <td key={col.key} style={tdStyle}>{col.render(entry)}</td>
                ))}
                <td style={{...tdStyle,whiteSpace:"nowrap"}}>
                  {deleteId===entry.id?(
                    <span style={{display:"flex",gap:"4px"}}>
                      <button onClick={e=>{e.stopPropagation();onDelete(entry.id);setDeleteId(null);}}
                        style={{...btnB,background:"#e17055",color:"#fff",padding:"3px 8px",fontSize:"11px"}}>Del</button>
                      <button onClick={e=>{e.stopPropagation();setDeleteId(null);}}
                        style={{...btnB,background:C.cancelBg,color:C.muted,padding:"3px 8px",fontSize:"11px"}}>No</button>
                    </span>
                  ):(
                    <span style={{display:"flex",gap:"4px"}}>
                      <button onClick={e=>{e.stopPropagation();onEdit(entry);}}
                        style={{...btnB,background:C.navActive,color:C.accent,padding:"3px 8px",fontSize:"11px"}}>✎</button>
                      <button onClick={e=>{e.stopPropagation();setDeleteId(entry.id);}}
                        style={{...btnB,background:C.delBg,color:C.red,padding:"3px 8px",fontSize:"11px"}}>✕</button>
                    </span>
                  )}
                </td>
              </tr>
              {expandId===entry.id&&(
                <tr key={entry.id+"_exp"}>
                  <td colSpan={columns.length+1} style={{background:C.cardAlt,padding:"10px 14px",borderBottom:`1px solid ${C.border}`}}>
                    <div style={{display:"flex",gap:"20px",flexWrap:"wrap",fontSize:"12px",color:C.muted}}>
                      <span><strong style={{color:C.text}}>Date:</strong> {entry.date}</span>
                      <span><strong style={{color:C.text}}>Mode:</strong> {entry.mode||"—"}</span>
                      {(entry as any).category&&<span><strong style={{color:C.text}}>Category:</strong> {(entry as any).category}</span>}
                      {(entry as any).account&&<span><strong style={{color:C.text}}>Account:</strong> {(entry as any).account}</span>}
                      <span><strong style={{color:C.text}}>Description:</strong> {entry.description||"—"}</span>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExpensesTab(p: ExProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<Expense|null>(null);
  const [editAmt, setEditAmt] = useState(""); const [editCat, setEditCat] = useState("");
  const [editDesc, setEditDesc] = useState(""); const [editDate, setEditDate] = useState("");
  const [editMode, setEditMode] = useState(""); const [editAcc, setEditAcc] = useState("");

  const openEdit = (e: Expense) => {
    setEditEntry(e); setEditAmt(String(e.amount)); setEditCat(e.category);
    setEditDesc(e.description); setEditDate(e.date);
    setEditMode(e.mode||""); setEditAcc(e.account||"");
  };

  const cols = [
    {key:"date" as SortKey, label:"Date", render:(e:Expense)=><span style={{color:C.muted,fontSize:"12px"}}>{e.date}</span>},
    {key:"description" as SortKey, label:"Description", render:(e:Expense)=><span>{e.description||"—"}</span>},
    {key:"category" as SortKey, label:"Category", render:(e:Expense)=>{
      const ci=p.categories.indexOf(e.category); const col=CAT_COLORS[ci>=0?ci%CAT_COLORS.length:0];
      return <span style={{background:col+"22",color:col,padding:"2px 8px",borderRadius:"20px",fontSize:"11px",fontWeight:600}}>{e.category}</span>;
    }},
    ...(p.appMode==="household"?[{key:"account" as SortKey, label:"Account", render:(e:Expense)=><span style={{color:C.muted,fontSize:"12px"}}>{e.account||"—"}</span>}]:[]),
    {key:"mode" as SortKey, label:"Mode", render:(e:Expense)=><span style={{color:C.muted,fontSize:"12px"}}>{e.mode||"—"}</span>},
    {key:"amount" as SortKey, label:"Amount", render:(e:Expense)=><span style={{color:C.red,fontWeight:600}}>-{fmt(e.amount)}</span>},
  ];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
        <div style={{...sCard,padding:"12px 16px",display:"inline-flex",gap:"16px",alignItems:"center"}}>
          <div><div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px"}}>Total</div>
          <div style={{fontSize:"18px",fontWeight:600,color:C.red}}>{fmt(p.totalExpenses)}</div></div>
          <div style={{width:"1px",height:"36px",background:C.border}}/>
          <div><div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px"}}>Entries</div>
          <div style={{fontSize:"18px",fontWeight:600,color:C.text}}>{p.expenses.length}</div></div>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} style={{...btnP,padding:"10px 18px",fontSize:"20px",lineHeight:1}}>+</button>
      </div>

      {showForm&&(
        <div style={{...sCard,marginBottom:"14px"}}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Expense</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"10px"}}>
            <FF label="Amount (₹) *" C={C}><input type="number" placeholder="0" value={p.expAmt} onChange={e=>p.setExpAmt(e.target.value)} style={sInput}/></FF>
            <FF label="Category" C={C}><select value={p.expCat} onChange={e=>p.setExpCat(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}>{p.categories.map(c=><option key={c} value={c}>{c}</option>)}</select></FF>
            <FF label="Description" C={C}><input type="text" placeholder="What did you spend on?" value={p.expDesc} onChange={e=>p.setExpDesc(e.target.value)} style={sInput}/></FF>
            <FF label="Date" C={C}><input type="date" value={p.expDate} onChange={e=>p.setExpDate(e.target.value)} style={sInput}/></FF>
            <FF label="Payment Mode" C={C}><select value={p.expMode} onChange={e=>p.setExpMode(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}>{PAYMENT_MODES.map(m=><option key={m} value={m}>{m}</option>)}</select></FF>
            {p.appMode==="household"&&<FF label="Account" C={C}><select value={p.expAcc} onChange={e=>p.setExpAcc(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}><option value="">—</option>{p.accounts.map(a=><option key={a} value={a}>{a}</option>)}</select></FF>}
          </div>
          <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
            <button onClick={()=>{p.addExpense();setShowForm(false);}} style={{...btnP,flex:1,padding:"11px"}}>+ Add Expense</button>
            <button onClick={()=>setShowForm(false)} style={{...btnB,background:C.cancelBg,color:C.muted,padding:"11px 18px"}}>Cancel</button>
          </div>
        </div>
      )}

      <div style={sCard}>
        <EntryTable entries={p.expenses} columns={cols} accentColor={C.red} onEdit={openEdit} onDelete={p.deleteExpense} C={C}/>
      </div>

      {editEntry&&<EditModal C={C} title="Edit Expense"
        fields={[
          {label:"Amount (₹)",value:editAmt,onChange:setEditAmt,type:"number"},
          {label:"Category",value:editCat,onChange:setEditCat,options:p.categories},
          {label:"Description",value:editDesc,onChange:setEditDesc},
          {label:"Date",value:editDate,onChange:setEditDate,type:"date"},
          {label:"Payment Mode",value:editMode,onChange:setEditMode,options:PAYMENT_MODES},
          ...(p.appMode==="household"?[{label:"Account",value:editAcc,onChange:setEditAcc,options:["—",...p.accounts]}]:[]),
        ]}
        onSave={()=>{p.updateExpense(editEntry.id,{amount:+editAmt,category:editCat,description:editDesc,date:editDate,mode:editMode,account:editAcc||undefined});setEditEntry(null);}}
        onClose={()=>setEditEntry(null)}
      />}
    </div>
  );
}

function EarningsTab(p: ErProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry|null>(null);
  const [editAmt, setEditAmt] = useState(""); const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState(""); const [editMode, setEditMode] = useState("");
  const [editAcc, setEditAcc] = useState("");

  const openEdit = (e: Entry) => {
    setEditEntry(e); setEditAmt(String(e.amount)); setEditDesc(e.description);
    setEditDate(e.date); setEditMode(e.mode||""); setEditAcc((e as any).account||"");
  };

  const cols = [
    {key:"date" as SortKey, label:"Date", render:(e:Entry)=><span style={{color:C.muted,fontSize:"12px"}}>{e.date}</span>},
    {key:"description" as SortKey, label:"Description", render:(e:Entry)=><span>{e.description||"Income"}</span>},
    ...(p.appMode==="household"?[{key:"account" as SortKey, label:"Account", render:(e:Entry)=><span style={{color:C.muted,fontSize:"12px"}}>{(e as any).account||"—"}</span>}]:[]),
    {key:"mode" as SortKey, label:"Mode", render:(e:Entry)=><span style={{color:C.muted,fontSize:"12px"}}>{e.mode||"—"}</span>},
    {key:"amount" as SortKey, label:"Amount", render:(e:Entry)=><span style={{color:C.green,fontWeight:600}}>+{fmt(e.amount)}</span>},
  ];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
        <div style={{...sCard,padding:"12px 16px",display:"inline-flex",gap:"16px",alignItems:"center"}}>
          <div><div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px"}}>Total</div>
          <div style={{fontSize:"18px",fontWeight:600,color:C.green}}>{fmt(p.totalEarnings)}</div></div>
          <div style={{width:"1px",height:"36px",background:C.border}}/>
          <div><div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px"}}>Entries</div>
          <div style={{fontSize:"18px",fontWeight:600,color:C.text}}>{p.earnings.length}</div></div>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} style={{...btnG,padding:"10px 18px",fontSize:"20px",lineHeight:1}}>+</button>
      </div>

      {showForm&&(
        <div style={{...sCard,marginBottom:"14px"}}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Income</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"10px"}}>
            <FF label="Amount (₹) *" C={C}><input type="number" placeholder="0" value={p.earnAmt} onChange={e=>p.setEarnAmt(e.target.value)} style={sInput}/></FF>
            <FF label="Description" C={C}><input type="text" placeholder="Source of income" value={p.earnDesc} onChange={e=>p.setEarnDesc(e.target.value)} style={sInput}/></FF>
            <FF label="Date" C={C}><input type="date" value={p.earnDate} onChange={e=>p.setEarnDate(e.target.value)} style={sInput}/></FF>
            <FF label="Payment Mode" C={C}><select value={p.earnMode} onChange={e=>p.setEarnMode(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}>{PAYMENT_MODES.map(m=><option key={m} value={m}>{m}</option>)}</select></FF>
            {p.appMode==="household"&&<FF label="Account" C={C}><select value={p.earnAcc} onChange={e=>p.setEarnAcc(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}><option value="">—</option>{p.accounts.map(a=><option key={a} value={a}>{a}</option>)}</select></FF>}
          </div>
          <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
            <button onClick={()=>{p.addEarning();setShowForm(false);}} style={{...btnG,flex:1,padding:"11px"}}>+ Add Income</button>
            <button onClick={()=>setShowForm(false)} style={{...btnB,background:C.cancelBg,color:C.muted,padding:"11px 18px"}}>Cancel</button>
          </div>
        </div>
      )}

      <div style={sCard}>
        <EntryTable entries={p.earnings} columns={cols} accentColor={C.green} onEdit={openEdit} onDelete={p.deleteEarning} C={C}/>
      </div>

      {editEntry&&<EditModal C={C} title="Edit Income"
        fields={[
          {label:"Amount (₹)",value:editAmt,onChange:setEditAmt,type:"number"},
          {label:"Description",value:editDesc,onChange:setEditDesc},
          {label:"Date",value:editDate,onChange:setEditDate,type:"date"},
          {label:"Payment Mode",value:editMode,onChange:setEditMode,options:PAYMENT_MODES},
          ...(p.appMode==="household"?[{label:"Account",value:editAcc,onChange:setEditAcc,options:["—",...p.accounts]}]:[]),
        ]}
        onSave={()=>{p.updateEarning(editEntry.id,{amount:+editAmt,description:editDesc,date:editDate,mode:editMode,account:editAcc||undefined} as any);setEditEntry(null);}}
        onClose={()=>setEditEntry(null)}
      />}
    </div>
  );
}

function SavingsTab(p: SvProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry|null>(null);
  const [editAmt, setEditAmt] = useState(""); const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState(""); const [editMode, setEditMode] = useState("");
  const [editAcc, setEditAcc] = useState("");

  const openEdit = (e: Entry) => {
    setEditEntry(e); setEditAmt(String(e.amount)); setEditDesc(e.description);
    setEditDate(e.date); setEditMode(e.mode||""); setEditAcc((e as any).account||"");
  };

  const cols = [
    {key:"date" as SortKey, label:"Date", render:(e:Entry)=><span style={{color:C.muted,fontSize:"12px"}}>{e.date}</span>},
    {key:"description" as SortKey, label:"Description", render:(e:Entry)=><span>{e.description||"Savings"}</span>},
    ...(p.appMode==="household"?[{key:"account" as SortKey, label:"Account", render:(e:Entry)=><span style={{color:C.muted,fontSize:"12px"}}>{(e as any).account||"—"}</span>}]:[]),
    {key:"mode" as SortKey, label:"Mode", render:(e:Entry)=><span style={{color:C.muted,fontSize:"12px"}}>{e.mode||"—"}</span>},
    {key:"amount" as SortKey, label:"Amount", render:(e:Entry)=><span style={{color:C.amber,fontWeight:600}}>{fmt(e.amount)}</span>},
  ];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
        <div style={{...sCard,padding:"12px 16px",display:"inline-flex",gap:"16px",alignItems:"center"}}>
          <div><div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px"}}>Total</div>
          <div style={{fontSize:"18px",fontWeight:600,color:C.amber}}>{fmt(p.totalSavings)}</div></div>
          <div style={{width:"1px",height:"36px",background:C.border}}/>
          <div><div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px"}}>Entries</div>
          <div style={{fontSize:"18px",fontWeight:600,color:C.text}}>{p.savings.length}</div></div>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} style={{...btnA,padding:"10px 18px",fontSize:"20px",lineHeight:1}}>+</button>
      </div>

      {showForm&&(
        <div style={{...sCard,marginBottom:"14px"}}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Saving</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"10px"}}>
            <FF label="Amount (₹) *" C={C}><input type="number" placeholder="0" value={p.savAmt} onChange={e=>p.setSavAmt(e.target.value)} style={sInput}/></FF>
            <FF label="Description" C={C}><input type="text" placeholder="What are you saving for?" value={p.savDesc} onChange={e=>p.setSavDesc(e.target.value)} style={sInput}/></FF>
            <FF label="Date" C={C}><input type="date" value={p.savDate} onChange={e=>p.setSavDate(e.target.value)} style={sInput}/></FF>
            <FF label="Payment Mode" C={C}><select value={p.savMode} onChange={e=>p.setSavMode(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}>{PAYMENT_MODES.map(m=><option key={m} value={m}>{m}</option>)}</select></FF>
            {p.appMode==="household"&&<FF label="Account" C={C}><select value={p.savAcc} onChange={e=>p.setSavAcc(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}><option value="">—</option>{p.accounts.map(a=><option key={a} value={a}>{a}</option>)}</select></FF>}
          </div>
          <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
            <button onClick={()=>{p.addSaving();setShowForm(false);}} style={{...btnA,flex:1,padding:"11px"}}>+ Add Saving</button>
            <button onClick={()=>setShowForm(false)} style={{...btnB,background:C.cancelBg,color:C.muted,padding:"11px 18px"}}>Cancel</button>
          </div>
        </div>
      )}

      <div style={sCard}>
        <EntryTable entries={p.savings} columns={cols} accentColor={C.amber} onEdit={openEdit} onDelete={p.deleteSaving} C={C}/>
      </div>

      {editEntry&&<EditModal C={C} title="Edit Saving"
        fields={[
          {label:"Amount (₹)",value:editAmt,onChange:setEditAmt,type:"number"},
          {label:"Description",value:editDesc,onChange:setEditDesc},
          {label:"Date",value:editDate,onChange:setEditDate,type:"date"},
          {label:"Payment Mode",value:editMode,onChange:setEditMode,options:PAYMENT_MODES},
          ...(p.appMode==="household"?[{label:"Account",value:editAcc,onChange:setEditAcc,options:["—",...p.accounts]}]:[]),
        ]}
        onSave={()=>{p.updateSaving(editEntry.id,{amount:+editAmt,description:editDesc,date:editDate,mode:editMode,account:editAcc||undefined} as any);setEditEntry(null);}}
        onClose={()=>setEditEntry(null)}
      />}
    </div>
  );
}

function CategoriesTab(p: CaProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };
  return (
    <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
      <div style={sCard}>
        <div style={{...sSecT,marginBottom:"14px"}}>Add Category</div>
        <FF label="Category Name" C={C}><input type="text" placeholder="e.g. Rent, Subscriptions…" value={p.newCategory} onChange={e=>p.setNewCategory(e.target.value)} onKeyDown={e=>e.key==="Enter"&&p.addCategory()} style={sInput}/></FF>
        <button onClick={p.addCategory} style={{...btnP,width:"100%",padding:"11px"}}>+ Add Category</button>
        <p style={{fontSize:"11px",color:C.faint,marginTop:"10px",lineHeight:1.6}}>Default categories cannot be deleted.</p>
      </div>
      <div style={sCard}>
        <div style={sSecT}>{p.categories.length} Categories</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"9px"}}>
          {p.categories.map((cat,i)=>{
            const total=p.expenses.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0);
            const count=p.expenses.filter(e=>e.category===cat).length;
            const color=CAT_COLORS[i%CAT_COLORS.length]; const isDef=DEFAULT_CATS.includes(cat);
            return(
              <div key={cat} style={{background:C.cardAlt,borderRadius:"10px",padding:"12px",border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"7px"}}>
                  <div style={{width:"7px",height:"7px",borderRadius:"50%",background:color,flexShrink:0}}/>
                  <span style={{fontSize:"12px",fontWeight:500,color:C.text,flex:1}}>{cat}</span>
                  {!isDef&&<button onClick={()=>p.deleteCategory(cat)} style={{background:"none",border:"none",color:C.faint,cursor:"pointer",fontSize:"12px",padding:"0 2px"}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.red;}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.faint;}}>✕</button>}
                </div>
                <div style={{fontSize:"16px",fontWeight:600,color:total>0?color:C.faint,marginBottom:"4px"}}>{fmt(total)}</div>
                <div style={{fontSize:"10px",color:C.faint}}>{count} expense{count!==1?"s":""}{isDef&&<span style={{marginLeft:"4px"}}>· default</span>}</div>
                {p.cashFlowOut>0&&total>0&&<>
                  <div style={{background:C.progressTrack,borderRadius:"5px",height:"3px",marginTop:"7px"}}>
                    <div style={{height:"100%",borderRadius:"5px",background:color,width:`${Math.min((total/p.cashFlowOut)*100,100)}%`}}/>
                  </div>
                  <div style={{fontSize:"10px",color:C.faint,marginTop:"3px"}}>{((total/p.cashFlowOut)*100).toFixed(1)}%</div>
                </>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Trends Tab ──────────────────────────────────────────────────────────────
function TrendsTab(p: TrProps) {
  const { C } = p;
  const [view, setView] = useState<"week"|"month">("week");

  const sCard: CSSProperties = { background:C.card, borderRadius:"14px", padding:"20px", border:`1px solid ${C.border}` };
  const fmt = (n:number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);

  // Build day-by-day expense data
  const today = new Date();
  today.setHours(0,0,0,0);

  const days: { label:string; dateStr:string; total:number; byCategory:{[cat:string]:number} }[] = [];

  const numDays = view === "week" ? 7 : 30;
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const mk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const monthData = p.allMonths[mk];
    const dayExpenses = monthData ? monthData.expenses.filter(e => e.date === dateStr) : [];
    const total = dayExpenses.reduce((s,e) => s+e.amount, 0);
    const byCategory: {[cat:string]:number} = {};
    dayExpenses.forEach(e => { byCategory[e.category] = (byCategory[e.category]||0) + e.amount; });

    let label = "";
    if (view === "week") {
      label = d.toLocaleDateString("en-IN",{weekday:"short"});
    } else {
      // for month view show date number, only show every 5th to avoid clutter
      label = i % 5 === 0 || i === 0 ? String(d.getDate()) : "";
    }
    days.push({ label, dateStr, total, byCategory });
  }

  const maxVal = Math.max(...days.map(d => d.total), 1);
  const totalPeriod = days.reduce((s,d) => s+d.total, 0);
  const avgPerDay = totalPeriod / numDays;
  const highestDay = days.reduce((best, d) => d.total > best.total ? d : best, days[0]);
  const activeDays = days.filter(d => d.total > 0).length;

  // Category totals for the period
  const catTotals: {name:string; color:string; total:number}[] = p.categories.map((cat,i) => ({
    name: cat,
    color: CAT_COLORS[i % CAT_COLORS.length],
    total: days.reduce((s,d) => s+(d.byCategory[cat]||0), 0),
  })).filter(c => c.total > 0).sort((a,b) => b.total - a.total);

  const [hovered, setHovered] = useState<number|null>(null);

  const todayStr = today.toISOString().split("T")[0];

  return (
    <div style={{maxWidth:"820px"}}>
      {/* Toggle */}
      <div style={{display:"flex",gap:"6px",marginBottom:"18px"}}>
        {(["week","month"] as const).map(v => (
          <button key={v} onClick={()=>setView(v)} style={{
            padding:"7px 18px", borderRadius:"20px", border:`1px solid ${view===v?C.accent:C.border}`,
            background: view===v ? C.navActive : "transparent",
            color: view===v ? C.accent : C.muted,
            fontWeight: view===v ? 600 : 400,
            fontSize:"13px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
          }}>
            {v === "week" ? "Last 7 Days" : "Last 30 Days"}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginBottom:"16px"}} className="two-col-grid">
        <div style={{...sCard,padding:"14px",borderTop:`3px solid ${C.red}`}}>
          <div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"5px"}}>Total Spent</div>
          <div style={{fontSize:"clamp(15px,2.5vw,20px)",fontWeight:600,color:C.red}}>{fmt(totalPeriod)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{view==="week"?"past 7 days":"past 30 days"}</div>
        </div>
        <div style={{...sCard,padding:"14px",borderTop:`3px solid ${C.amber}`}}>
          <div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"5px"}}>Daily Average</div>
          <div style={{fontSize:"clamp(15px,2.5vw,20px)",fontWeight:600,color:C.amber}}>{fmt(Math.round(avgPerDay))}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{activeDays} active day{activeDays!==1?"s":""}</div>
        </div>
        <div style={{...sCard,padding:"14px",borderTop:`3px solid ${C.accent}`}}>
          <div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"5px"}}>Highest Day</div>
          <div style={{fontSize:"clamp(15px,2.5vw,20px)",fontWeight:600,color:C.accent}}>{fmt(highestDay.total)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>
            {highestDay.total > 0 ? new Date(highestDay.dateStr+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"}) : "No data"}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div style={{...sCard,marginBottom:"16px"}}>
        <div style={{fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"20px",fontWeight:600}}>
          Daily Spending
        </div>
        {totalPeriod === 0 ? (
          <div style={{textAlign:"center",color:C.faint,padding:"40px",fontSize:"13px"}}>No expenses in this period</div>
        ) : (
          <div style={{position:"relative"}}>
            {/* Y-axis guide lines */}
            {[0.25,0.5,0.75,1].map(pct => (
              <div key={pct} style={{position:"absolute",left:0,right:0,top:`${(1-pct)*100}%`,borderTop:`1px dashed ${C.border}`,pointerEvents:"none",zIndex:0}}/>
            ))}
            {/* Bars */}
            <div style={{display:"flex",alignItems:"flex-end",gap:"4px",height:"180px",position:"relative",zIndex:1,paddingBottom:"0"}}>
              {days.map((d,i) => {
                const pct = d.total / maxVal;
                const isToday = d.dateStr === todayStr;
                const isHovered = hovered === i;
                const barColor = isToday ? C.accent : isHovered ? C.accent : C.red;
                return (
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",height:"100%",justifyContent:"flex-end",position:"relative",cursor:"pointer"}}
                    onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}>
                    {/* Tooltip */}
                    {isHovered && d.total > 0 && (
                      <div style={{
                        position:"absolute",bottom:"calc(100% + 6px)",left:"50%",transform:"translateX(-50%)",
                        background:C.text,color:C.bg,borderRadius:"7px",padding:"5px 9px",
                        fontSize:"11px",fontWeight:600,whiteSpace:"nowrap",zIndex:10,
                        boxShadow:"0 2px 8px rgba(0,0,0,0.2)",pointerEvents:"none",
                      }}>
                        {fmt(d.total)}
                      </div>
                    )}
                    {/* Bar */}
                    <div style={{
                      width:"100%", maxWidth:"36px",
                      height: d.total > 0 ? `${Math.max(pct*100,3)}%` : "3px",
                      background: d.total > 0 ? barColor : C.border,
                      borderRadius:"5px 5px 2px 2px",
                      opacity: isHovered || hovered===null ? 1 : 0.5,
                      transition:"all 0.2s ease",
                    }}/>
                  </div>
                );
              })}
            </div>
            {/* X-axis labels */}
            <div style={{display:"flex",gap:"4px",marginTop:"8px"}}>
              {days.map((d,i) => (
                <div key={i} style={{flex:1,textAlign:"center",fontSize:"9px",color:d.dateStr===todayStr?C.accent:C.faint,fontWeight:d.dateStr===todayStr?600:400,overflow:"hidden"}}>
                  {d.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {catTotals.length > 0 && (
        <div style={sCard}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"16px",fontWeight:600}}>
            Breakdown by Category
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            {catTotals.map(cat => {
              const pct = totalPeriod > 0 ? (cat.total/totalPeriod)*100 : 0;
              return (
                <div key={cat.name}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"5px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
                      <div style={{width:"8px",height:"8px",borderRadius:"50%",background:cat.color,flexShrink:0}}/>
                      <span style={{fontSize:"13px",color:C.text,fontWeight:500}}>{cat.name}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                      <span style={{fontSize:"11px",color:C.muted}}>{pct.toFixed(1)}%</span>
                      <span style={{fontSize:"13px",fontWeight:600,color:cat.color}}>{fmt(cat.total)}</span>
                    </div>
                  </div>
                  <div style={{background:C.progressTrack,borderRadius:"6px",height:"6px",overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:"6px",background:cat.color,width:`${pct}%`,transition:"width 0.5s ease"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tutorial Tab ────────────────────────────────────────────────────────────
function TutorialTab({ C }: { C:Theme }) {
  const sCard: CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}`,marginBottom:"14px" };
  const steps = [
    {
      icon:"◎", title:"Overview",
      body:"Your command centre. See Cash Flow In (budget + extra earnings), Cash Flow Out (expenses), Total Savings, and To Spend (what's left). The Daily Averages section shows your ideal spend per day, how much you should spend per day from today to finish the month on track, and your actual average spend so far.",
    },
    {
      icon:"↓", title:"Expenses",
      body:"Log every purchase here — amount, category, description, and date. Use categories to organise spending (Food, Transport, etc.). You can see a breakdown by category on the Overview tab.",
    },
    {
      icon:"↑", title:"Cash In",
      body:"Record any money that comes in beyond your base budget — freelance income, pocket money top-ups, selling something. This adds to your Cash Flow In.",
    },
    {
      icon:"⬡", title:"Savings",
      body:"Track money you're setting aside. Savings are subtracted from your spendable balance so you're not tempted to spend them. The ideal daily average also accounts for your savings goal.",
    },
    {
      icon:"⇄", title:"Credit",
      body:"Track debts and loans. 'They Owe Me' — someone borrowed money from you. 'I Owe Them' — you owe someone. Add the person's name, amount, what it's for, and date. Mark entries as Cleared once settled. Cleared entries are dimmed but kept for your records.",
    },
    {
      icon:"📅", title:"Months",
      body:"Each month is tracked separately. Use the month selector in the sidebar to switch between months. Click '+ New Month' to start a new one. Your budget resets each month — set it once and it carries over as the default.",
    },
    {
      icon:"⚙", title:"Settings",
      body:"Access dark mode, manage categories, export your data as a spreadsheet, delete a month, and log out — all from the Settings panel at the bottom of the sidebar.",
    },
    {
      icon:"☁", title:"Sync",
      body:"If you're signed in with an account, your data syncs across all your devices automatically. Guest mode only saves data in your current browser — create an account to keep your data safe.",
    },
  ];
  return (
    <div style={{maxWidth:"680px"}}>
      <div style={{marginBottom:"20px"}}>
        <h2 style={{fontSize:"20px",fontWeight:600,color:C.text,marginBottom:"6px"}}>How to use Budgetly</h2>
        <p style={{fontSize:"13px",color:C.muted,lineHeight:1.7}}>A quick walkthrough of every feature so you can get the most out of the app.</p>
      </div>
      {steps.map((s,i)=>(
        <div key={i} style={{background:C.card,borderRadius:"14px",padding:"18px 20px",border:`1px solid ${C.border}`,marginBottom:"10px",display:"flex",gap:"14px",alignItems:"flex-start"}}>
          <div style={{width:"36px",height:"36px",borderRadius:"10px",background:C.navActive,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0}}>{s.icon}</div>
          <div>
            <div style={{fontSize:"14px",fontWeight:600,color:C.text,marginBottom:"5px"}}>{s.title}</div>
            <div style={{fontSize:"13px",color:C.muted,lineHeight:1.7}}>{s.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Credit Tab ──────────────────────────────────────────────────────────────
function CreditTab(p: CrProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };

  const owedToMe = p.credits.filter(c=>c.type==="owed_to_me");
  const iOwe     = p.credits.filter(c=>c.type==="i_owe");
  const totalOwedToMe = owedToMe.filter(c=>!c.cleared).reduce((s,c)=>s+c.amount,0);
  const totalIOwe     = iOwe.filter(c=>!c.cleared).reduce((s,c)=>s+c.amount,0);

  return (
    <div>
      {/* Summary pills */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"16px"}}>
        <div style={{...sCard,borderTop:`3px solid ${C.green}`,padding:"14px"}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"5px"}}>People Owe Me</div>
          <div style={{fontSize:"clamp(15px,2.5vw,21px)",fontWeight:600,color:C.green}}>{new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(totalOwedToMe)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{owedToMe.filter(c=>!c.cleared).length} pending</div>
        </div>
        <div style={{...sCard,borderTop:`3px solid ${C.red}`,padding:"14px"}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"5px"}}>I Owe</div>
          <div style={{fontSize:"clamp(15px,2.5vw,21px)",fontWeight:600,color:C.red}}>{new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(totalIOwe)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{iOwe.filter(c=>!c.cleared).length} pending</div>
        </div>
      </div>

      <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
        {/* Add form */}
        <div style={sCard}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Credit Entry</div>
          {/* Type toggle */}
          <div style={{display:"flex",gap:"6px",marginBottom:"14px"}}>
            <button onClick={()=>p.setCrType("owed_to_me")} style={{flex:1,padding:"8px",borderRadius:"8px",border:`1.5px solid ${p.crType==="owed_to_me"?C.green:C.border}`,background:p.crType==="owed_to_me"?C.green+"18":"transparent",color:p.crType==="owed_to_me"?C.green:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
              They Owe Me
            </button>
            <button onClick={()=>p.setCrType("i_owe")} style={{flex:1,padding:"8px",borderRadius:"8px",border:`1.5px solid ${p.crType==="i_owe"?C.red:C.border}`,background:p.crType==="i_owe"?C.red+"18":"transparent",color:p.crType==="i_owe"?C.red:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
              I Owe Them
            </button>
          </div>
          <FF label="Person's Name *" C={C}><input type="text" placeholder="Who?" value={p.crPerson} onChange={e=>p.setCrPerson(e.target.value)} style={sInput}/></FF>
          <FF label="Amount (₹) *" C={C}><input type="number" placeholder="0" value={p.crAmt} onChange={e=>p.setCrAmt(e.target.value)} style={sInput}/></FF>
          <FF label="Description" C={C}><input type="text" placeholder="What for?" value={p.crDesc} onChange={e=>p.setCrDesc(e.target.value)} style={sInput}/></FF>
          <FF label="Date" C={C}><input type="date" value={p.crDate} onChange={e=>p.setCrDate(e.target.value)} style={sInput}/></FF>
          <button onClick={p.addCredit} style={{width:"100%",padding:"11px",borderRadius:"9px",border:"none",background:p.crType==="owed_to_me"?C.green:C.red,color:"#fff",fontWeight:600,fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
            + Add Entry
          </button>
        </div>

        {/* Lists */}
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          {/* They owe me */}
          <div style={sCard}>
            <div style={sSecT}>They Owe Me</div>
            {owedToMe.length===0&&<div style={{textAlign:"center",color:C.faint,padding:"20px",fontSize:"13px"}}>No entries yet</div>}
            {[...owedToMe].reverse().map(c=>(
              <div key={c.id} style={{background:C.cardAlt,borderRadius:"10px",padding:"11px 13px",border:`1px solid ${c.cleared?C.border:C.green+"44"}`,marginBottom:"6px",opacity:c.cleared?0.55:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px",flexWrap:"wrap"}}>
                      <span style={{fontSize:"13px",fontWeight:600,color:C.text}}>{c.person}</span>
                      {c.cleared&&<span style={{fontSize:"10px",padding:"1px 6px",borderRadius:"20px",background:C.green+"22",color:C.green,fontWeight:600}}>Cleared</span>}
                    </div>
                    <div style={{fontSize:"11px",color:C.muted,marginBottom:"2px"}}>{c.description||"—"}</div>
                    <div style={{fontSize:"10px",color:C.faint}}>{c.date}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
                    <span style={{fontSize:"14px",fontWeight:600,color:C.green,whiteSpace:"nowrap"}}>+{new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(c.amount)}</span>
                    <button onClick={()=>p.toggleCleared(c.id)} title={c.cleared?"Mark pending":"Mark cleared"}
                      style={{background:c.cleared?C.green+"22":C.navActive,border:`1px solid ${c.cleared?C.green+"44":C.border}`,borderRadius:"6px",padding:"3px 7px",cursor:"pointer",fontSize:"11px",color:c.cleared?C.green:C.muted}}>
                      {c.cleared?"✓":"○"}
                    </button>
                    <DelBtn id={c.id} confirm={p.deleteConfirm} setConfirm={p.setDeleteConfirm} onDel={p.deleteCredit} C={C}/>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* I owe */}
          <div style={sCard}>
            <div style={sSecT}>I Owe</div>
            {iOwe.length===0&&<div style={{textAlign:"center",color:C.faint,padding:"20px",fontSize:"13px"}}>No entries yet</div>}
            {[...iOwe].reverse().map(c=>(
              <div key={c.id} style={{background:C.cardAlt,borderRadius:"10px",padding:"11px 13px",border:`1px solid ${c.cleared?C.border:C.red+"44"}`,marginBottom:"6px",opacity:c.cleared?0.55:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px",flexWrap:"wrap"}}>
                      <span style={{fontSize:"13px",fontWeight:600,color:C.text}}>{c.person}</span>
                      {c.cleared&&<span style={{fontSize:"10px",padding:"1px 6px",borderRadius:"20px",background:C.green+"22",color:C.green,fontWeight:600}}>Cleared</span>}
                    </div>
                    <div style={{fontSize:"11px",color:C.muted,marginBottom:"2px"}}>{c.description||"—"}</div>
                    <div style={{fontSize:"10px",color:C.faint}}>{c.date}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
                    <span style={{fontSize:"14px",fontWeight:600,color:C.red,whiteSpace:"nowrap"}}>-{new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(c.amount)}</span>
                    <button onClick={()=>p.toggleCleared(c.id)} title={c.cleared?"Mark pending":"Mark cleared"}
                      style={{background:c.cleared?C.green+"22":C.navActive,border:`1px solid ${c.cleared?C.green+"44":C.border}`,borderRadius:"6px",padding:"3px 7px",cursor:"pointer",fontSize:"11px",color:c.cleared?C.green:C.muted}}>
                      {c.cleared?"✓":"○"}
                    </button>
                    <DelBtn id={c.id} confirm={p.deleteConfirm} setConfirm={p.setDeleteConfirm} onDel={p.deleteCredit} C={C}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, dark }: { onAuth:(user:User)=>void; dark:boolean }) {
  const C = makeTheme(dark);
  const [mode,     setMode]     = useState<"login"|"signup">("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
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
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:"20px"}}>
      <div style={{...sCard,maxWidth:"380px",width:"100%"}}>
        <div style={{marginBottom:"24px"}}>
          <div style={{fontSize:"22px",fontWeight:700,color:C.text,marginBottom:"4px"}}><span style={{color:C.accent}}>Budget</span>ly</div>
          <div style={{fontSize:"13px",color:C.muted}}>{mode==="login"?"Welcome back":"Create your account"}</div>
        </div>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={sInput}/>
        <div style={{position:"relative",marginBottom:"12px"}}>
          <input type={showPw?"text":"password"} placeholder="Password" value={password}
            onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}
            style={{...sInput,marginBottom:"0",paddingRight:"48px"}}/>
          <button onClick={()=>setShowPw(v=>!v)}
            style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif"}}>
            {showPw?"Hide":"Show"}
          </button>
        </div>
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
      {/* Install app instructions */}
      <div style={{maxWidth:"380px",width:"100%",marginTop:"16px",background:C.card,borderRadius:"14px",padding:"16px 20px",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:"11px",color:C.accent,fontWeight:600,marginBottom:"8px"}}>📱 Install Budgetly on Android</div>
        {["Open this page in Chrome","Tap ⋮ → Add to Home screen","Tap Add — done"].map((step,i)=>(
          <div key={i} style={{display:"flex",gap:"8px",marginBottom:"5px",alignItems:"flex-start"}}>
            <div style={{width:"16px",height:"16px",borderRadius:"50%",background:C.accent,color:"#fff",fontSize:"9px",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"1px"}}>{i+1}</div>
            <div style={{fontSize:"11px",color:C.muted,lineHeight:1.5}}>{step}</div>
          </div>
        ))}
      </div>
      {/* Credit */}
      <div style={{marginTop:"20px",fontSize:"12px",color:C.faint,textAlign:"center",fontFamily:"'DM Sans',sans-serif"}}>
        Made by <span style={{color:C.muted,fontWeight:500}}>Armaan Gupta</span>
      </div>
    </div>
  );
}

// ─── Migration Modal ──────────────────────────────────────────────────────────
function MigrateModal({ onDecide, C }: { onDecide:(migrate:boolean)=>void; C:Theme }) {
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

// ─── Mode Select Screen ───────────────────────────────────────────────────────
function ModeSelectScreen({ C, onSelect }: { C:Theme; onSelect:(m:AppMode)=>void }) {
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:"20px"}}>
      <div style={{maxWidth:"400px",width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{fontSize:"24px",fontWeight:700,color:C.text,marginBottom:"6px"}}><span style={{color:C.accent}}>Budget</span>ly</div>
          <div style={{fontSize:"14px",color:C.muted}}>How will you use Budgetly?</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          <button onClick={()=>onSelect("student")} style={{background:C.card,border:`2px solid ${C.accent}`,borderRadius:"14px",padding:"22px 20px",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"box-shadow 0.15s"}}>
            <div style={{fontSize:"22px",marginBottom:"8px"}}>🎓</div>
            <div style={{fontSize:"16px",fontWeight:600,color:C.text,marginBottom:"4px"}}>Student</div>
            <div style={{fontSize:"13px",color:C.muted,lineHeight:1.6}}>Monthly budget tracking, expense categories, spending insights. Best for personal finance management.</div>
          </button>
          <button onClick={()=>onSelect("household")} style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:"14px",padding:"22px 20px",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif",transition:"box-shadow 0.15s"}}>
            <div style={{fontSize:"22px",marginBottom:"8px"}}>🏠</div>
            <div style={{fontSize:"16px",fontWeight:600,color:C.text,marginBottom:"4px"}}>Household</div>
            <div style={{fontSize:"13px",color:C.muted,lineHeight:1.6}}>Multi-account tracking, no budget cap. Track transactions across accounts like HDFC, Cash, Joint Account.</div>
          </button>
        </div>
        <div style={{marginTop:"16px",fontSize:"12px",color:C.faint,textAlign:"center"}}>You can change this anytime from Settings</div>
      </div>
    </div>
  );
}

// ─── Accounts Tab (household) ─────────────────────────────────────────────────
function AccountsTab({ C, accounts, expenses, earnings, savings, newAccount, setNewAccount, addAccount, deleteAccount }: {
  C:Theme; accounts:string[]; expenses:Expense[]; earnings:Entry[]; savings:Entry[];
  newAccount:string; setNewAccount:(v:string)=>void; addAccount:()=>void; deleteAccount:(a:string)=>void;
}) {
  const DEFAULT_ACCS = ["Main Account","Cash","Savings Account"];
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };
  return (
    <div style={{maxWidth:"680px"}}>
      <div style={{...sCard,marginBottom:"14px"}}>
        <div style={sSecT}>Add Account</div>
        <FF label="Account Name" C={C}><input type="text" placeholder="e.g. HDFC Savings, Cash…" value={newAccount} onChange={e=>setNewAccount(e.target.value)} style={sInput}/></FF>
        <button onClick={addAccount} style={{...btnP,width:"100%",padding:"11px"}}>+ Add Account</button>
        <div style={{fontSize:"11px",color:C.faint,marginTop:"10px"}}>Default accounts cannot be deleted.</div>
      </div>
      <div style={sCard}>
        <div style={sSecT}>{accounts.length} Accounts</div>
        {accounts.map((acc,i)=>{
          const color = CAT_COLORS[i%CAT_COLORS.length];
          const totalOut = expenses.filter(e=>e.account===acc).reduce((s,e)=>s+e.amount,0);
          const totalIn  = earnings.filter(e=>(e as any).account===acc).reduce((s,e)=>s+e.amount,0);
          const totalSav = savings.filter(e=>(e as any).account===acc).reduce((s,e)=>s+e.amount,0);
          const isDef = DEFAULT_ACCS.includes(acc);
          return (
            <div key={acc} style={{display:"flex",alignItems:"center",gap:"10px",background:C.cardAlt,borderRadius:"10px",padding:"12px 14px",border:`1px solid ${C.border}`,marginBottom:"8px"}}>
              <div style={{width:"10px",height:"10px",borderRadius:"50%",background:color,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:"13px",fontWeight:500,color:C.text}}>{acc}</div>
                <div style={{fontSize:"11px",color:C.faint,marginTop:"2px"}}>
                  Out: {fmt(totalOut)} · In: {fmt(totalIn)} · Saved: {fmt(totalSav)}{isDef?" · default":""}
                </div>
              </div>
              {!isDef&&<button onClick={()=>deleteAccount(acc)} style={{...btnB,background:C.delBg,color:C.red,padding:"5px 10px",fontSize:"11px"}}>✕</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function BudgetTracker() {
  const [dark,          setDark]          = useState<boolean>(() => lsLoad<boolean>("budgetly_dark", false));
  const [appMode,       setAppMode]       = useState<AppMode|null>(() => lsLoad<AppMode|null>("budgetly_mode", null));
  const [showModeSelect,setShowModeSelect]= useState(false);
  const [accounts,      setAccounts]      = useState<string[]>(() => lsLoad<string[]>("budgetly_accounts", DEFAULT_ACCOUNTS));
  const [user,          setUser]          = useState<User|null>(null);
  const [authReady,     setAuthReady]     = useState(false);
  const [showMigrate,   setShowMigrate]   = useState(false); // triggers after login if local data exists
  const [activeTab,     setActiveTab]     = useState<string>("overview");
  const [activeMK,      setActiveMK]      = useState<string>(curMK());
  const [allMonths,     setAllMonthsRaw]  = useState<AllMonths>({});
  const [categories,    setCategories]    = useState<string[]>(DEFAULT_CATS);
  const [editingBudget, setEditingBudget] = useState(false);
  const [tempBudget,    setTempBudget]    = useState("10000");
  const [deleteConfirm, setDeleteConfirm] = useState<number|null>(null);
  const [newCategory,   setNewCategory]   = useState("");
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);
  const [dbLoading,     setDbLoading]     = useState(false);
  const [deleteMonthConfirm, setDeleteMonthConfirm] = useState(false);
  const [swipeOffset,   setSwipeOffset]   = useState(0);   // live drag offset px
  const [swipeAnim,     setSwipeAnim]     = useState<"in-left"|"in-right"|null>(null); // entry animation

  const C = makeTheme(dark);
  const toggleDark = () => {
    const html = document.documentElement;
    html.classList.add("theme-transitioning");
    setTimeout(() => html.classList.remove("theme-transitioning"), 600);
    setDark(d => { lsSave("budgetly_dark", !d); return !d; });
  };

  const switchMode = (m: AppMode) => {
    setAppMode(m);
    lsSave("budgetly_mode", m);
    setShowModeSelect(false);
  };

  const saveAccounts = (acc: string[]) => {
    setAccounts(acc);
    lsSave("budgetly_accounts", acc);
  };

  const today = todayS();
  const [expAmt,   setExpAmt]   = useState("");
  const [expCat,   setExpCat]   = useState(DEFAULT_CATS[0]);
  const [expDesc,  setExpDesc]  = useState("");
  const [expDate,  setExpDate]  = useState(today);
  const [expMode,  setExpMode]  = useState(PAYMENT_MODES[0]);
  const [expAcc,   setExpAcc]   = useState("");
  const [earnMode, setEarnMode] = useState(PAYMENT_MODES[0]);
  const [earnAcc,  setEarnAcc]  = useState("");
  const [savMode,  setSavMode]  = useState(PAYMENT_MODES[0]);
  const [savAcc,   setSavAcc]   = useState("");
  const [earnAmt,  setEarnAmt]  = useState("");
  const [earnDesc, setEarnDesc] = useState("");
  const [earnDate, setEarnDate] = useState(today);
  const [savAmt,   setSavAmt]   = useState("");
  const [savDesc,  setSavDesc]  = useState("");
  const [savDate,  setSavDate]  = useState(today);
  const [newAccount,   setNewAccount]   = useState("");
  const [credits,      setCredits]      = useState<CreditEntry[]>([]);
  const [creditsLoaded, setCreditsLoaded] = useState(false);
  const [crAmt,        setCrAmt]        = useState("");
  const [crPerson,     setCrPerson]     = useState("");
  const [crDesc,       setCrDesc]       = useState("");
  const [crDate,       setCrDate]       = useState(today);
  const [crType,       setCrType]       = useState<"owed_to_me"|"i_owe">("owed_to_me");

  const isGuest = false; // guest mode removed

  // Auth init
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user??null); setAuthReady(true); });
    const { data:{subscription} } = supabase.auth.onAuthStateChange((_,session) => setUser(session?.user??null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;
    loadFromSupabase();
    // If local data exists from a previous guest session, prompt to import
    const lsMonths = lsLoad<AllMonths>("budgetly_months", {});
    if (Object.keys(lsMonths).length > 0) setShowMigrate(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authReady]);

  const loadFromSupabase = useCallback(async () => {
    if (!user) return;
    setDbLoading(true);
    const [{ data, error }, { data: cData, error: cError }] = await Promise.all([
      supabase.from("month_data").select("*").eq("user_id",user.id),
      supabase.from("user_credits").select("*").eq("user_id",user.id),
    ]);
    if (error) { console.error(error); setDbLoading(false); return; }
    const rebuilt: AllMonths = {};
    (data??[]).forEach((row:{month_key:string;budget:number;expenses:Expense[];earnings:Entry[];savings:Entry[]}) => {
      rebuilt[row.month_key]={budget:row.budget,expenses:row.expenses,earnings:row.earnings,savings:row.savings};
    });
    setAllMonthsRaw(rebuilt);
    if (!cError && cData && cData.length > 0) {
      setCredits((cData[0] as {credits:CreditEntry[]}).credits ?? []);
    }
    setCreditsLoaded(true);
    setDbLoading(false);
  }, [user, isGuest]);

  const saveToSupabase = useCallback(async (mk:string, md:MonthData) => {
    if (!user) return;
    await supabase.from("month_data").upsert({ user_id:user.id,month_key:mk,budget:md.budget,expenses:md.expenses,earnings:md.earnings,savings:md.savings,updated_at:new Date().toISOString() },{ onConflict:"user_id,month_key" });
  }, [user, isGuest]);

  const saveCreditsToSupabase = useCallback(async (c: CreditEntry[]) => {
    if (!user) return;
    await supabase.from("user_credits").upsert({ user_id:user.id, credits:c, updated_at:new Date().toISOString() },{ onConflict:"user_id" });
  }, [user, isGuest]);

  const setAllMonths = useCallback((updater: AllMonths|((prev:AllMonths)=>AllMonths)) => {
    setAllMonthsRaw(prev => { const next=typeof updater==="function"?updater(prev):updater; return next; });
  }, [isGuest]);

  const getM = (mk:string): MonthData => allMonths[mk]??emptyMD();
  const setM = useCallback(async (mk:string,d:MonthData) => { setAllMonths(prev=>({...prev,[mk]:d})); await saveToSupabase(mk,d); }, [setAllMonths,saveToSupabase]);

  const md = getM(activeMK);
  const { budget, expenses, earnings, savings } = md;

  // categories stored locally (not synced — custom categories per device is fine)
  useEffect(()=>{
    if (!creditsLoaded) return;
    saveCreditsToSupabase(credits);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credits, creditsLoaded]);

  // Computed
  const totalExpenses     = expenses.reduce((s,e)=>s+e.amount,0);
  const totalEarnings     = earnings.reduce((s,e)=>s+e.amount,0);
  const totalSavings      = savings.reduce ((s,e)=>s+e.amount,0);
  const cashFlowIn        = budget + totalEarnings;
  const cashFlowOut       = totalExpenses;
  const remaining         = cashFlowIn - cashFlowOut - totalSavings;
  const spentPct          = cashFlowIn>0 ? Math.min((cashFlowOut/(cashFlowIn-totalSavings))*100,100) : 0;
  const daysInMonth       = getDays(activeMK);
  const todayDay          = activeMK===curMK() ? new Date().getDate() : daysInMonth;
  const daysLeft          = Math.max(daysInMonth-todayDay,1);
  const moneyLeft         = Math.max(remaining,0);
  const idealPerDay       = Math.round((cashFlowIn-totalSavings)/daysInMonth);
  const idealSpentByToday = idealPerDay*todayDay;
  const actualVsIdeal     = cashFlowOut-idealSpentByToday;
  const currentDailyAvg   = todayDay>0 ? Math.round(cashFlowOut/todayDay) : 0;
  const currentIdealAvg   = Math.round(moneyLeft/daysLeft);
  const allMKs = (() => { const k=Object.keys(allMonths); if(!k.includes(curMK()))k.push(curMK()); return k.sort().reverse(); })();

  // Actions
  const setBudget      = (v:number) => setM(activeMK,{...md,budget:v});
  const saveBudget     = () => { const v=parseFloat(tempBudget); if(!isNaN(v)&&v>0)setBudget(v); setEditingBudget(false); };
  const addExpense     = () => { if(!expAmt||isNaN(+expAmt))return; setM(activeMK,{...md,expenses:[...expenses,{id:Date.now(),amount:+expAmt,category:expCat,description:expDesc,date:expDate,mode:expMode,account:expAcc||undefined}]}); setExpAmt(""); setExpDesc(""); };
  const addEarning     = () => { if(!earnAmt||isNaN(+earnAmt))return; setM(activeMK,{...md,earnings:[...earnings,{id:Date.now(),amount:+earnAmt,description:earnDesc,date:earnDate,mode:earnMode,account:earnAcc||undefined}]}); setEarnAmt(""); setEarnDesc(""); };
  const addSaving      = () => { if(!savAmt||isNaN(+savAmt))return; setM(activeMK,{...md,savings:[...savings,{id:Date.now(),amount:+savAmt,description:savDesc,date:savDate,mode:savMode,account:savAcc||undefined}]}); setSavAmt(""); setSavDesc(""); };
  const deleteExpense  = (id:number) => { setM(activeMK,{...md,expenses:expenses.filter(e=>e.id!==id)}); setDeleteConfirm(null); };
  const deleteEarning  = (id:number) => { setM(activeMK,{...md,earnings:earnings.filter(e=>e.id!==id)}); setDeleteConfirm(null); };
  const deleteSaving   = (id:number) => { setM(activeMK,{...md,savings: savings.filter (e=>e.id!==id)}); setDeleteConfirm(null); };
  const updateExpense  = (id:number,u:Partial<Expense>) => setM(activeMK,{...md,expenses:expenses.map(e=>e.id===id?{...e,...u}:e)});
  const updateEarning  = (id:number,u:Partial<Entry>)   => setM(activeMK,{...md,earnings:earnings.map(e=>e.id===id?{...e,...u}:e)});
  const updateSaving   = (id:number,u:Partial<Entry>)   => setM(activeMK,{...md,savings: savings.map (e=>e.id===id?{...e,...u}:e)});
  const updateCredit   = (id:number,u:Partial<CreditEntry>) => setCredits(prev=>prev.map(c=>c.id===id?{...c,...u}:c));
  const addCategory    = () => { const t=newCategory.trim(); if(!t||categories.includes(t))return; setCategories([...categories,t]); setNewCategory(""); };
  const deleteCategory = (cat:string) => { if(DEFAULT_CATS.includes(cat))return; setCategories(categories.filter(c=>c!==cat)); };
  const addAccount     = () => { const t=newAccount.trim(); if(!t||accounts.includes(t))return; saveAccounts([...accounts,t]); setNewAccount(""); };
  const deleteAccount  = (acc:string) => { if(DEFAULT_ACCOUNTS.includes(acc))return; saveAccounts(accounts.filter(a=>a!==acc)); };
  const addCredit      = () => { if(!crAmt||isNaN(+crAmt)||!crPerson.trim())return; setCredits(prev=>[...prev,{id:Date.now(),person:crPerson.trim(),amount:+crAmt,description:crDesc,date:crDate,type:crType,cleared:false}]); setCrAmt(""); setCrPerson(""); setCrDesc(""); };
  const toggleCleared  = (id:number) => {
    setCredits(prev => prev.map(c => {
      if (c.id !== id) return c;
      const nowCleared = !c.cleared;
      const label = `Credit: ${c.person}${c.description ? ` — ${c.description}` : ""}`;
      if (nowCleared) {
        // clearing: add earning or expense
        if (c.type === "owed_to_me") {
          setM(activeMK, { ...getM(activeMK), earnings: [...getM(activeMK).earnings, { id: Date.now(), amount: c.amount, description: label, date: todayS() }] });
        } else {
          setM(activeMK, { ...getM(activeMK), expenses: [...getM(activeMK).expenses, { id: Date.now(), amount: c.amount, category: "Other", description: label, date: todayS() }] });
        }
      } else {
        // un-clearing: remove the auto-added entry by matching description
        if (c.type === "owed_to_me") {
          setM(activeMK, { ...getM(activeMK), earnings: getM(activeMK).earnings.filter(e => e.description !== label) });
        } else {
          setM(activeMK, { ...getM(activeMK), expenses: getM(activeMK).expenses.filter(e => e.description !== label) });
        }
      }
      return { ...c, cleared: nowCleared };
    }));
  };
  const deleteCredit   = (id:number) => { setCredits(prev=>prev.filter(c=>c.id!==id)); setDeleteConfirm(null); };
  const addNextMonth   = () => { const [y,m]=activeMK.split("-").map(Number); const nd=new Date(y,m,1); const nk=`${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,"0")}`; if(!allMonths[nk])setM(nk,emptyMD()); setActiveMK(nk); };
  const deleteMonth    = async () => { setDeleteMonthConfirm(false); setAllMonths(prev=>{const next={...prev};delete next[activeMK];return next;}); if(user) await supabase.from("month_data").delete().eq("user_id",user.id).eq("month_key",activeMK); setActiveMK(curMK()); };
  const handleMigrate  = async (migrate:boolean) => { setShowMigrate(false); if(!migrate||!user)return; const lsData=lsLoad<AllMonths>("budgetly_months",{}); for(const [mk,d] of Object.entries(lsData)) await saveToSupabase(mk,d); localStorage.removeItem("budgetly_months"); await loadFromSupabase(); };
  const logout         = async () => { await supabase.auth.signOut(); setUser(null); setAllMonthsRaw({}); };

  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };

  if (!authReady) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{fontSize:"13px",color:C.muted}}>Loading…</div>
    </div>
  );
  if (!user) return <AuthScreen onAuth={u=>setUser(u)} dark={dark}/>;
  if (!appMode || showModeSelect) return <ModeSelectScreen C={C} onSelect={switchMode}/>;

  function SidebarInner() {
    return (
      <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
        {/* Logo */}
        <div style={{padding:"0 18px 20px"}}>
          <div style={{fontSize:"20px",fontWeight:700,letterSpacing:"-0.3px",color:C.text}}><span style={{color:C.accent}}>Budget</span>ly</div>
          <div style={{fontSize:"10px",color:dark?C.muted:C.faint,marginTop:"1px"}}>by Armaan Gupta</div>
        </div>

        {/* Month selector */}
        <div style={{padding:"0 12px 14px"}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"5px"}}>Active Month</div>
          <select value={activeMK} onChange={e=>setActiveMK(e.target.value)}
            style={{...sInput,fontSize:"12px",appearance:"none",cursor:"pointer",padding:"8px 11px"}}>
            {allMKs.map(mk=><option key={mk} value={mk}>{fmtMK(mk)}</option>)}
          </select>
        </div>

        {/* To Spend pill */}
        <div style={{margin:"0 12px 16px",background:remaining>=0?C.pillGreen:C.pillRed,borderRadius:"10px",padding:"12px 14px",border:`1px solid ${remaining>=0?C.pillGreenBorder:C.pillRedBorder}`}}>
          <div style={{fontSize:"9px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"3px"}}>To Spend</div>
          <div style={{fontSize:"19px",fontWeight:600,color:remaining>=0?C.green:C.red}}>{fmt(remaining)}</div>
          <div style={{fontSize:"10px",color:C.muted,marginTop:"2px"}}>{fmtMK(activeMK)}</div>
        </div>

        {dbLoading&&<div style={{textAlign:"center",fontSize:"11px",color:C.faint,marginBottom:"10px"}}>Syncing…</div>}

        {/* Nav */}
        <nav style={{flex:1,padding:"0 8px"}}>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>{setActiveTab(item.id);setDrawerOpen(false);}} style={{
              width:"100%",padding:"9px 12px",borderRadius:"9px",border:"none",
              background:activeTab===item.id?C.navActive:"transparent",
              color:activeTab===item.id?C.accent:C.muted,
              fontWeight:activeTab===item.id?600:400,
              fontSize:"13px",cursor:"pointer",textAlign:"left",
              display:"flex",alignItems:"center",gap:"9px",
              marginBottom:"2px",fontFamily:"'DM Sans',sans-serif",
            }}>
              <span style={{fontSize:"14px",width:"18px",textAlign:"center"}}>{item.icon}</span>
              {item.label}
            </button>
          ))}
          {/* Trends — sidebar only */}
          <button onClick={()=>{setActiveTab("trends");setDrawerOpen(false);}} style={{
            width:"100%",padding:"9px 12px",borderRadius:"9px",border:"none",
            background:activeTab==="trends"?C.navActive:"transparent",
            color:activeTab==="trends"?C.accent:C.muted,
            fontWeight:activeTab==="trends"?600:400,
            fontSize:"13px",cursor:"pointer",textAlign:"left",
            display:"flex",alignItems:"center",gap:"9px",
            marginBottom:"2px",fontFamily:"'DM Sans',sans-serif",
          }}>
            <span style={{fontSize:"14px",width:"18px",textAlign:"center",fontStyle:"normal"}}>∿</span>
            Trends
          </button>
        </nav>

        {/* Settings button at bottom */}
        <div style={{padding:"10px 12px 0",borderTop:`1px solid ${C.border}`}}>
          <button onClick={()=>setShowSettings(true)} style={{
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

  // ─── Settings Modal ────────────────────────────────────────────────────────
  // ─── Export CSV ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows: string[][] = [];
    const q = (s: string | number) => `"${String(s).replace(/"/g,'""')}"`;

    // Summary
    rows.push(["BUDGETLY EXPORT"]);
    rows.push(["Month", fmtMK(activeMK)]);
    rows.push(["Exported on", new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})]);
    rows.push([]);
    rows.push(["SUMMARY"]);
    rows.push(["Budget", String(budget)]);
    rows.push(["Total Earnings", String(totalEarnings)]);
    rows.push(["Cash Flow In", String(cashFlowIn)]);
    rows.push(["Total Expenses", String(cashFlowOut)]);
    rows.push(["Total Savings", String(totalSavings)]);
    rows.push(["To Spend (Remaining)", String(remaining)]);
    rows.push([]);

    // Expenses
    rows.push(["EXPENSES"]);
    rows.push(["Date","Category","Description","Amount (INR)"]);
    if (expenses.length === 0) rows.push(["No expenses"]);
    else [...expenses].sort((a,b)=>a.date.localeCompare(b.date)).forEach(e =>
      rows.push([e.date, e.category, e.description||"—", String(e.amount)])
    );
    rows.push([]);

    // Earnings
    rows.push(["CASH IN (EARNINGS)"]);
    rows.push(["Date","Description","Amount (INR)"]);
    if (earnings.length === 0) rows.push(["No earnings"]);
    else [...earnings].sort((a,b)=>a.date.localeCompare(b.date)).forEach(e =>
      rows.push([e.date, e.description||"—", String(e.amount)])
    );
    rows.push([]);

    // Savings
    rows.push(["SAVINGS"]);
    rows.push(["Date","Description","Amount (INR)"]);
    if (savings.length === 0) rows.push(["No savings"]);
    else [...savings].sort((a,b)=>a.date.localeCompare(b.date)).forEach(e =>
      rows.push([e.date, e.description||"—", String(e.amount)])
    );

    const csv = rows.map(r => r.map(c => q(c)).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budgetly-${activeMK}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  function SettingsModal() {
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}
        onClick={e=>{if(e.target===e.currentTarget)setShowSettings(false);}}>
        <div style={{background:C.card,borderRadius:"20px 20px 0 0",padding:"28px 24px 36px",width:"100%",maxWidth:"460px",border:`1px solid ${C.border}`,borderBottom:"none",maxHeight:"90vh",overflowY:"auto"}}>
          {/* Handle bar */}
          <div style={{width:"36px",height:"4px",borderRadius:"4px",background:C.faint,margin:"0 auto 24px"}}/>
          <div style={{fontSize:"17px",fontWeight:600,color:C.text,marginBottom:"20px"}}>Settings</div>

          {/* Account */}
          <div style={{marginBottom:"20px",paddingBottom:"20px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Account</div>
              <>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.cardAlt,padding:"10px 12px",borderRadius:"10px",border:`1px solid ${C.border}`,marginBottom:"10px"}}>
                  <div>
                    <div style={{fontSize:"11px",color:C.muted,marginBottom:"2px"}}>Signed in as</div>
                    <div style={{fontSize:"13px",color:C.text,fontWeight:500}}>{user?.email}</div>
                  </div>
                  <button onClick={()=>{setShowSettings(false);logout();}} style={{...btnB,background:C.delBg,color:C.red,padding:"7px 14px",fontSize:"12px"}}>Log out</button>
                </div>
                <div style={{background:C.green+"14",border:`1px solid ${C.green}33`,borderRadius:"10px",padding:"11px 14px"}}>
                  <div style={{fontSize:"11px",color:C.green,fontWeight:600,marginBottom:"3px"}}>✓ Account active</div>
                  <div style={{fontSize:"11px",color:C.muted,lineHeight:1.7}}>Your data syncs across all devices and is securely stored.</div>
                </div>
              </>
          </div>

          {/* Dark mode */}
          <div style={{marginBottom:"20px",paddingBottom:"20px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Appearance</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.cardAlt,padding:"12px 14px",borderRadius:"10px",border:`1px solid ${C.border}`}}>
              <div>
                <div style={{fontSize:"13px",color:C.text,fontWeight:500}}>{dark?"Dark Mode":"Light Mode"}</div>
                <div style={{fontSize:"11px",color:C.muted,marginTop:"2px"}}>Switch appearance</div>
              </div>
              <button onClick={toggleDark} style={{background:dark?C.accent:"#d1cfe8",border:"none",borderRadius:"20px",width:"44px",height:"24px",cursor:"pointer",position:"relative",flexShrink:0}}>
                <div style={{position:"absolute",top:"3px",left:dark?"23px":"3px",width:"18px",height:"18px",borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.25)"}}/>
              </button>
            </div>
          </div>

          {/* Month management */}
          <div style={{marginBottom:"20px",paddingBottom:"20px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Month</div>
            <button onClick={()=>{addNextMonth();setShowSettings(false);}} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.cardAlt,color:C.accent,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,textAlign:"left",marginBottom:"8px"}}>
              + Add New Month
            </button>
            {deleteMonthConfirm ? (
              <div>
                <div style={{fontSize:"12px",color:C.text,marginBottom:"8px",textAlign:"center"}}>Delete {fmtMK(activeMK)}?</div>
                <div style={{display:"flex",gap:"8px"}}>
                  <button onClick={()=>{deleteMonth();setShowSettings(false);}} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:C.delBg,color:C.red,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Yes, delete</button>
                  <button onClick={()=>setDeleteMonthConfirm(false)} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:C.cancelBg,color:C.muted,cursor:"pointer",fontSize:"12px",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={()=>setDeleteMonthConfirm(true)} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:"transparent",color:C.red,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",textAlign:"left",opacity:0.8}}>
                🗑 Delete {fmtMK(activeMK)}
              </button>
            )}
          </div>

          {/* App */}
          <div style={{marginBottom:"20px",paddingBottom:"20px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>App</div>
            {/* Mode switcher */}
            <div style={{background:C.cardAlt,borderRadius:"10px",padding:"12px 14px",border:`1px solid ${C.border}`,marginBottom:"8px"}}>
              <div style={{fontSize:"12px",color:C.muted,marginBottom:"8px"}}>Current mode: <strong style={{color:C.text}}>{appMode==="student"?"🎓 Student":"🏠 Household"}</strong></div>
              <div style={{display:"flex",gap:"6px"}}>
                <button onClick={()=>switchMode("student")} style={{flex:1,padding:"7px",borderRadius:"8px",border:`1.5px solid ${appMode==="student"?C.accent:C.border}`,background:appMode==="student"?C.navActive:"transparent",color:appMode==="student"?C.accent:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>🎓 Student</button>
                <button onClick={()=>switchMode("household")} style={{flex:1,padding:"7px",borderRadius:"8px",border:`1.5px solid ${appMode==="household"?C.accent:C.border}`,background:appMode==="household"?C.navActive:"transparent",color:appMode==="household"?C.accent:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>🏠 Household</button>
              </div>
            </div>
            <button onClick={()=>{setShowSettings(false);setActiveTab("categories");}} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.cardAlt,color:C.text,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:500,textAlign:"left",marginBottom:"8px",display:"flex",alignItems:"center",gap:"10px"}}>
              <span style={{fontSize:"15px"}}>▦</span> Manage Categories
            </button>
            {appMode==="household"&&<button onClick={()=>{setShowSettings(false);setActiveTab("accounts");}} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.cardAlt,color:C.text,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:500,textAlign:"left",marginBottom:"8px",display:"flex",alignItems:"center",gap:"10px"}}>
              <span style={{fontSize:"15px"}}>🏦</span> Manage Accounts
            </button>}
            <button onClick={()=>{setShowSettings(false);setActiveTab("tutorial");}} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.cardAlt,color:C.text,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:500,textAlign:"left",display:"flex",alignItems:"center",gap:"10px"}}>
              <span style={{fontSize:"15px"}}>?</span> How to use Budgetly
            </button>
          </div>

          {/* Get the App */}
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

          {/* Export */}
          <div style={{marginBottom:"20px",paddingBottom:"20px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Export Data</div>
            <div style={{fontSize:"11px",color:C.muted,lineHeight:1.6,marginBottom:"10px"}}>Download all your data for {fmtMK(activeMK)} as a spreadsheet (.csv) you can open in Excel, Google Sheets, or any spreadsheet app.</div>
            <button onClick={exportCSV} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.cardAlt,color:C.green,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,textAlign:"left"}}>
              ↓ Export {fmtMK(activeMK)} as Spreadsheet
            </button>
          </div>

          {/* Feedback */}
          <div>
            <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Feedback</div>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSdtx7DdVgiihO1C6qGfO8Y_nPjvyMvjQUr9fZMdwuG2C1DlCg/viewform?usp=publish-editor"
              target="_blank" rel="noreferrer" onClick={()=>setShowSettings(false)}
              style={{display:"block",textAlign:"center",padding:"10px",borderRadius:"10px",background:C.navActive,color:C.accent,fontSize:"13px",fontWeight:600,textDecoration:"none"}}>
              💬 Give Feedback
            </a>
          </div>
        </div>
      </div>
    );
  }

  const ovProps: OvProps = { C,budget,cashFlowIn,cashFlowOut,totalEarnings,totalSavings,remaining,spentPct,editingBudget,tempBudget,setEditingBudget,setTempBudget,saveBudget,expenses,savings,categories,accounts,appMode,daysInMonth,todayDay,idealPerDay,idealSpentByToday,actualVsIdeal,moneyLeft,daysLeft,currentDailyAvg,currentIdealAvg };
  const exProps: ExProps = { C,expenses,categories,accounts,appMode,totalExpenses:cashFlowOut,expAmt,expCat,expDesc,expDate,expMode,expAcc,setExpAmt,setExpCat,setExpDesc,setExpDate,setExpMode,setExpAcc,addExpense,deleteConfirm,setDeleteConfirm,deleteExpense,updateExpense };
  const erProps: ErProps = { C,earnings,accounts,appMode,totalEarnings,earnAmt,earnDesc,earnDate,earnMode,earnAcc,setEarnAmt,setEarnDesc,setEarnDate,setEarnMode,setEarnAcc,addEarning,deleteConfirm,setDeleteConfirm,deleteEarning,updateEarning };
  const svProps: SvProps = { C,savings,accounts,appMode,totalSavings,cashFlowIn,savAmt,savDesc,savDate,savMode,savAcc,setSavAmt,setSavDesc,setSavDate,setSavMode,setSavAcc,addSaving,deleteConfirm,setDeleteConfirm,deleteSaving,updateSaving };
  const caProps: CaProps = { C,categories,expenses,cashFlowOut,newCategory,setNewCategory,addCategory,deleteCategory };
  const trProps: TrProps = { C,allMonths,activeMK,categories };
  const crProps: CrProps = { C,credits,crAmt,crPerson,crDesc,crDate,crType,setCrAmt,setCrPerson,setCrDesc,setCrDate,setCrType,addCredit,toggleCleared,deleteCredit,deleteConfirm,setDeleteConfirm };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <link rel="manifest" href="/manifest.json"/>
      <meta name="theme-color" content="#6c5ce7"/>
      <meta name="apple-mobile-web-app-capable" content="yes"/>
      <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
      <meta name="apple-mobile-web-app-title" content="Budgetly"/>
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png"/>
      <script dangerouslySetInnerHTML={{__html:`
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js');
          });
        }
      `}}/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};font-family:'DM Sans',sans-serif;color-scheme:${dark?'dark':'light'};}
        *,*::before,*::after{transition:background-color 0.5s ease,border-color 0.5s ease,color 0.5s ease,box-shadow 0.5s ease!important;}
        input,select,textarea,button{transition:background-color 0.5s ease,border-color 0.5s ease,color 0.5s ease,opacity 0.15s ease,box-shadow 0.5s ease!important;}
        /* Theme toggle switch */

        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-track{background:${C.bg};}
        ::-webkit-scrollbar-thumb{background:${C.faint};border-radius:6px;}
        ::-webkit-scrollbar-thumb:hover{background:${C.muted};}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        input:focus,select:focus{border-color:${C.accent}!important;box-shadow:0 0 0 3px ${C.accent}22;}
        input,select,option{color-scheme:${dark?"dark":"light"};}
        .mob-header{display:none;}
        @keyframes slideInFromRight{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInFromLeft{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:translateX(0)}}
        .mob-nav{display:none;}
        @media(max-width:768px){
          .mob-header{display:flex!important;position:fixed;top:0;left:0;right:0;z-index:100;background:${C.sidebar};border-bottom:1px solid ${C.border};padding:11px 15px;align-items:center;justify-content:space-between;}
          .desk-sidebar{display:none!important;}
          .mob-nav{display:flex!important;position:fixed;bottom:0;left:0;right:0;background:${C.sidebar};border-top:1px solid ${C.border};z-index:50;padding:5px 0 max(8px,env(safe-area-inset-bottom));}
          .main-wrap{padding:64px 12px 72px!important;}
          .two-col-grid{grid-template-columns:1fr!important;}
        }
      `}</style>

      {showMigrate&&<MigrateModal onDecide={handleMigrate} C={C}/>}

      {/* Mobile header */}
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

      {/* Mobile drawer */}
      {drawerOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex"}}>
          <div style={{width:"260px",background:C.sidebar,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"24px 0",overflowY:"auto"}}>
            <SidebarInner/>
          </div>
          <div style={{flex:1,background:"rgba(0,0,0,0.3)"}} onClick={()=>setDrawerOpen(false)}/>
        </div>
      )}

      <div style={{minHeight:"100vh",background:C.bg,display:"flex"}}>
        <aside className="desk-sidebar" style={{width:"210px",minHeight:"100vh",background:C.sidebar,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"24px 0",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
          <SidebarInner/>
        </aside>

        <main className="main-wrap" style={{flex:1,padding:"28px",overflowY:"auto",overflow:"hidden"}}
          onTouchStart={e=>{
            const t=e.touches[0];
            const el=e.currentTarget as HTMLElement;
            el.dataset.touchX=String(t.clientX);
            el.dataset.touchY=String(t.clientY);
            el.dataset.dragging="1";
          }}
          onTouchMove={e=>{
            const el=e.currentTarget as HTMLElement;
            if(!el.dataset.dragging)return;
            const startX=parseFloat(el.dataset.touchX||"0");
            const startY=parseFloat(el.dataset.touchY||"0");
            const dx=e.touches[0].clientX-startX;
            const dy=e.touches[0].clientY-startY;
            // only track if horizontal
            if(Math.abs(dx)>Math.abs(dy)){
              e.preventDefault();
              setSwipeOffset(dx*0.4); // rubber-band feel
            }
          }}
          onTouchEnd={e=>{
            const el=e.currentTarget as HTMLElement;
            el.dataset.dragging="";
            const startX=parseFloat(el.dataset.touchX||"0");
            const startY=parseFloat(el.dataset.touchY||"0");
            const endX=e.changedTouches[0].clientX;
            const endY=e.changedTouches[0].clientY;
            const dx=endX-startX;
            const dy=endY-startY;
            setSwipeOffset(0);
            if(Math.abs(dx)<50||Math.abs(dx)<Math.abs(dy)*1.5)return;
            const idx=SWIPE_TABS.indexOf(activeTab);
            if(dx<0&&idx<SWIPE_TABS.length-1){
              setSwipeAnim("in-left");
              setActiveTab(SWIPE_TABS[idx+1]);
              setTimeout(()=>setSwipeAnim(null),350);
            }
            if(dx>0&&idx>0){
              setSwipeAnim("in-right");
              setActiveTab(SWIPE_TABS[idx-1]);
              setTimeout(()=>setSwipeAnim(null),350);
            }
          }}>
          <div style={{
            transform:`translateX(${swipeOffset}px)`,
            transition:swipeOffset===0?"transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)":"none",
            animation:swipeAnim==="in-left"?"slideInFromRight 0.32s cubic-bezier(0.25,0.46,0.45,0.94)":swipeAnim==="in-right"?"slideInFromLeft 0.32s cubic-bezier(0.25,0.46,0.45,0.94)":"none",
            willChange:"transform",
            overflowY:"auto",
            height:"100%",
          }}>
          <div style={{marginBottom:"18px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"8px"}}>
            <div>
              <h1 style={{fontSize:"clamp(18px,3.5vw,24px)",fontWeight:600,color:C.text,letterSpacing:"-0.3px"}}>
                {activeTab==="categories"?"Categories":activeTab==="tutorial"?"How to use Budgetly":activeTab==="trends"?"Trends":activeTab==="accounts"?"Accounts":NAV.find(n=>n.id===activeTab)?.label}
              </h1>
              <div style={{fontSize:"11px",color:C.muted,marginTop:"3px"}}>
                {fmtMK(activeMK)}{activeMK!==curMK()&&" · past month"}
              </div>
            </div>
            <div style={{fontSize:"11px",color:C.faint,textAlign:"right"}}>
              Day {todayDay} of {daysInMonth}<br/>
              <span style={{color:C.muted}}>{new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}</span>
            </div>
          </div>

          {activeTab==="overview"   &&<OverviewTab   {...ovProps}/>}
          {activeTab==="expenses"   &&<ExpensesTab   {...exProps}/>}
          {activeTab==="earnings"   &&<EarningsTab   {...erProps}/>}
          {activeTab==="savings"    &&<SavingsTab    {...svProps}/>}
          {activeTab==="credit"     &&<CreditTab     {...crProps}/>}
          {activeTab==="categories" &&<CategoriesTab {...caProps}/>}
          {activeTab==="tutorial"   &&<TutorialTab C={C}/>}
          {activeTab==="trends"     &&<TrendsTab     {...trProps}/>}
          {activeTab==="accounts"   &&<AccountsTab C={C} accounts={accounts} expenses={expenses} earnings={earnings} savings={savings} newAccount={newAccount} setNewAccount={setNewAccount} addAccount={addAccount} deleteAccount={deleteAccount}/>}
          </div>{/* end swipe animation wrapper */}
        </main>
      </div>

      {showSettings&&<SettingsModal/>}

      <div className="mob-nav">
        {NAV.map(item=>(
          <button key={item.id} onClick={()=>setActiveTab(item.id)} style={{flex:1,padding:"5px 3px",border:"none",background:"transparent",color:activeTab===item.id?C.accent:C.faint,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",fontFamily:"'DM Sans',sans-serif"}}>
            <span style={{fontSize:"16px"}}>{item.icon}</span>
            <span style={{fontSize:"9px",fontWeight:activeTab===item.id?600:400}}>{item.label}</span>
          </button>
        ))}


      </div>
    </>
  );
}