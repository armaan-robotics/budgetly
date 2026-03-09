"use client";

import { useState, useEffect, useCallback, ReactNode, CSSProperties } from "react";
import { createClient, User } from "@supabase/supabase-js";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface Entry    { id: number; amount: number; description: string; date: string; }
interface Expense extends Entry { category: string; }
interface MonthData { budget: number; expenses: Expense[]; earnings: Entry[]; savings: Entry[]; }
interface AllMonths { [mk: string]: MonthData; }
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
const CAT_COLORS: string[]   = ["#f97316","#06b6d4","#8b5cf6","#10b981","#f43f5e","#eab308","#6366f1","#ec4899","#14b8a6","#84cc16","#ef4444","#3b82f6"];
const NAV = [
  { id:"overview",   label:"Overview",   icon:"◎" },
  { id:"expenses",   label:"Expenses",   icon:"↓" },
  { id:"earnings",   label:"Cash In",    icon:"↑" },
  { id:"savings",    label:"Savings",    icon:"⬡" },
  { id:"categories", label:"Categories", icon:"▦" },
] as const;

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
  expenses:Expense[]; savings:Entry[]; categories:string[];
  daysInMonth:number; todayDay:number; idealPerDay:number;
  idealSpentByToday:number; actualVsIdeal:number;
  moneyLeft:number; daysLeft:number; currentDailyAvg:number; currentIdealAvg:number;
}
interface ExProps { C:Theme; expenses:Expense[];categories:string[];totalExpenses:number;expAmt:string;expCat:string;expDesc:string;expDate:string;setExpAmt:(v:string)=>void;setExpCat:(v:string)=>void;setExpDesc:(v:string)=>void;setExpDate:(v:string)=>void;addExpense:()=>void;deleteConfirm:number|null;setDeleteConfirm:(v:number|null)=>void;deleteExpense:(id:number)=>void; }
interface ErProps { C:Theme; earnings:Entry[];totalEarnings:number;earnAmt:string;earnDesc:string;earnDate:string;setEarnAmt:(v:string)=>void;setEarnDesc:(v:string)=>void;setEarnDate:(v:string)=>void;addEarning:()=>void;deleteConfirm:number|null;setDeleteConfirm:(v:number|null)=>void;deleteEarning:(id:number)=>void; }
interface SvProps { C:Theme; savings:Entry[];totalSavings:number;cashFlowIn:number;savAmt:string;savDesc:string;savDate:string;setSavAmt:(v:string)=>void;setSavDesc:(v:string)=>void;setSavDate:(v:string)=>void;addSaving:()=>void;deleteConfirm:number|null;setDeleteConfirm:(v:number|null)=>void;deleteSaving:(id:number)=>void; }
interface CaProps { C:Theme; categories:string[];expenses:Expense[];cashFlowOut:number;newCategory:string;setNewCategory:(v:string)=>void;addCategory:()=>void;deleteCategory:(cat:string)=>void; }

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

      <div style={{...sCard,marginBottom:"12px"}}>
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
      </div>

      <div style={{...sCard,marginBottom:"12px"}}>
        <div style={sSecT}>Daily Averages</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)"}}>
          {([
            {label:"Ideal monthly avg",  val:fmt(p.idealPerDay),     color:C.accent, note:"(cash in − savings) ÷ days"},
            {label:"Daily avg to spend", val:fmt(p.currentIdealAvg), color:p.currentIdealAvg<p.idealPerDay?C.green:C.red, note:"to spend ÷ days remaining"},
            {label:"Spent per day",      val:fmt(p.currentDailyAvg), color:C.muted,  note:"spent ÷ days passed"},
          ] as {label:string;val:string;color:string;note:string}[]).map((d,i)=>(
            <div key={i} style={{padding:"10px 8px",borderLeft:i>0?`1px solid ${C.border}`:"none",textAlign:"center"}}>
              <div style={{fontSize:"9px",color:C.muted,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:"6px",lineHeight:1.3}}>{d.label}</div>
              <div style={{fontSize:"clamp(13px,2vw,18px)",fontWeight:600,color:d.color}}>{d.val}</div>
              <div style={{fontSize:"9px",color:C.faint,marginTop:"4px",lineHeight:1.3}}>{d.note}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:"12px",background:p.actualVsIdeal>0?C.pillRed:C.pillGreen,borderRadius:"8px",padding:"8px 12px",textAlign:"center",border:`1px solid ${p.actualVsIdeal>0?C.pillRedBorder:C.pillGreenBorder}`}}>
          <span style={{fontSize:"12px",color:p.actualVsIdeal>0?C.red:C.green,fontWeight:500}}>
            {p.actualVsIdeal>0?`⚠ ${fmt(p.actualVsIdeal)} over daily pace`:`✓ ${fmt(Math.abs(p.actualVsIdeal))} under daily pace`}
          </span>
        </div>
      </div>

      {catTotals.length>0&&(
        <div style={sCard}>
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

function ExpensesTab(p: ExProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };
  return (
    <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
      <div>
        <div style={sCard}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Expense</div>
          <FF label="Amount (₹) *" C={C}><input type="number" placeholder="0" value={p.expAmt} onChange={e=>p.setExpAmt(e.target.value)} style={sInput}/></FF>
          <FF label="Category" C={C}><select value={p.expCat} onChange={e=>p.setExpCat(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}>{p.categories.map(c=><option key={c} value={c}>{c}</option>)}</select></FF>
          <FF label="Description" C={C}><input type="text" placeholder="What did you spend on?" value={p.expDesc} onChange={e=>p.setExpDesc(e.target.value)} style={sInput}/></FF>
          <FF label="Date" C={C}><input type="date" value={p.expDate} onChange={e=>p.setExpDate(e.target.value)} style={sInput}/></FF>
          <button onClick={p.addExpense} style={{...btnP,width:"100%",padding:"11px"}}>+ Add Expense</button>
        </div>
        <div style={{...sCard,marginTop:"12px",textAlign:"center"}}>
          <div style={sSecT}>Total Expenses</div>
          <div style={{fontSize:"22px",fontWeight:600,color:C.red}}>{fmt(p.totalExpenses)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{p.expenses.length} entries</div>
        </div>
      </div>
      <div style={sCard}>
        <div style={sSecT}>All Expenses</div>
        {p.expenses.length===0&&<div style={{textAlign:"center",color:C.faint,padding:"32px",fontSize:"13px"}}>No expenses yet</div>}
        {[...p.expenses].reverse().map(exp=>{
          const ci=p.categories.indexOf(exp.category); const col=CAT_COLORS[ci>=0?ci%CAT_COLORS.length:0];
          return <EntryRow key={exp.id} C={C}
            left={<><div style={{display:"flex",gap:"6px",marginBottom:"3px",flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:"10px",padding:"2px 7px",borderRadius:"20px",background:col+"22",color:col,fontWeight:600}}>{exp.category}</span><span style={{fontSize:"10px",color:C.faint}}>{exp.date}</span></div><div style={{fontSize:"13px",color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{exp.description||"—"}</div></>}
            right={<><span style={{fontSize:"14px",fontWeight:600,color:C.red,whiteSpace:"nowrap"}}>-{fmt(exp.amount)}</span><DelBtn id={exp.id} confirm={p.deleteConfirm} setConfirm={p.setDeleteConfirm} onDel={p.deleteExpense} C={C}/></>}
          />;
        })}
      </div>
    </div>
  );
}

function EarningsTab(p: ErProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };
  return (
    <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
      <div>
        <div style={sCard}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Income</div>
          <FF label="Amount (₹) *" C={C}><input type="number" placeholder="0" value={p.earnAmt} onChange={e=>p.setEarnAmt(e.target.value)} style={sInput}/></FF>
          <FF label="Description" C={C}><input type="text" placeholder="Source of income" value={p.earnDesc} onChange={e=>p.setEarnDesc(e.target.value)} style={sInput}/></FF>
          <FF label="Date" C={C}><input type="date" value={p.earnDate} onChange={e=>p.setEarnDate(e.target.value)} style={sInput}/></FF>
          <button onClick={p.addEarning} style={{...btnG,width:"100%",padding:"11px"}}>+ Add Income</button>
        </div>
        <div style={{...sCard,marginTop:"12px",textAlign:"center"}}>
          <div style={sSecT}>Total Earnings</div>
          <div style={{fontSize:"22px",fontWeight:600,color:C.green}}>{fmt(p.totalEarnings)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{p.earnings.length} entries</div>
        </div>
      </div>
      <div style={sCard}>
        <div style={sSecT}>All Income</div>
        {p.earnings.length===0&&<div style={{textAlign:"center",color:C.faint,padding:"32px",fontSize:"13px"}}>No income yet</div>}
        {[...p.earnings].reverse().map(earn=><EntryRow key={earn.id} C={C}
          left={<><div style={{fontSize:"10px",color:C.faint,marginBottom:"3px"}}>{earn.date}</div><div style={{fontSize:"13px",color:C.text}}>{earn.description||"Income"}</div></>}
          right={<><span style={{fontSize:"14px",fontWeight:600,color:C.green,whiteSpace:"nowrap"}}>+{fmt(earn.amount)}</span><DelBtn id={earn.id} confirm={p.deleteConfirm} setConfirm={p.setDeleteConfirm} onDel={p.deleteEarning} C={C}/></>}
        />)}
      </div>
    </div>
  );
}

function SavingsTab(p: SvProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };
  return (
    <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
      <div>
        <div style={sCard}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Saving</div>
          <FF label="Amount (₹) *" C={C}><input type="number" placeholder="0" value={p.savAmt} onChange={e=>p.setSavAmt(e.target.value)} style={sInput}/></FF>
          <FF label="Description" C={C}><input type="text" placeholder="What are you saving for?" value={p.savDesc} onChange={e=>p.setSavDesc(e.target.value)} style={sInput}/></FF>
          <FF label="Date" C={C}><input type="date" value={p.savDate} onChange={e=>p.setSavDate(e.target.value)} style={sInput}/></FF>
          <button onClick={p.addSaving} style={{...btnA,width:"100%",padding:"11px"}}>+ Add Saving</button>
        </div>
        <div style={{...sCard,marginTop:"12px",textAlign:"center"}}>
          <div style={sSecT}>Total Saved</div>
          <div style={{fontSize:"22px",fontWeight:600,color:C.amber}}>{fmt(p.totalSavings)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{p.cashFlowIn>0?((p.totalSavings/p.cashFlowIn)*100).toFixed(1):0}% of cash flow in</div>
        </div>
      </div>
      <div style={sCard}>
        <div style={sSecT}>All Savings</div>
        {p.savings.length===0&&<div style={{textAlign:"center",color:C.faint,padding:"32px",fontSize:"13px"}}>No savings yet</div>}
        {[...p.savings].reverse().map(sav=><EntryRow key={sav.id} C={C}
          left={<><div style={{fontSize:"10px",color:C.faint,marginBottom:"3px"}}>{sav.date}</div><div style={{fontSize:"13px",color:C.text}}>{sav.description||"Savings"}</div></>}
          right={<><span style={{fontSize:"14px",fontWeight:600,color:C.amber,whiteSpace:"nowrap"}}>{fmt(sav.amount)}</span><DelBtn id={sav.id} confirm={p.deleteConfirm} setConfirm={p.setDeleteConfirm} onDel={p.deleteSaving} C={C}/></>}
        />)}
      </div>
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

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, dark }: { onAuth:(user:User)=>void; dark:boolean }) {
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
        <div style={{textAlign:"center",marginTop:"20px",paddingTop:"16px",borderTop:`1px solid ${C.border}`}}>
          <div style={{fontSize:"11px",color:C.faint,marginBottom:"8px"}}>Just want to try it?</div>
          <button onClick={()=>onAuth({id:"guest"} as unknown as User)}
            style={{...btnB,background:C.cancelBg,color:C.muted,width:"100%",padding:"10px"}}>Continue as Guest</button>
        </div>
      </div>
    </div>
  );
}

// ─── Migration Modal ──────────────────────────────────────────────────────────
function MigrateModal({ onDecide, C }: { onDecide:(migrate:boolean)=>void; C:Theme }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{background:C.card,borderRadius:"14px",padding:"28px",maxWidth:"380px",width:"90%",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:"18px",fontWeight:600,color:C.text,marginBottom:"8px"}}>You have existing data</div>
        <div style={{fontSize:"13px",color:C.muted,lineHeight:1.7,marginBottom:"20px"}}>We found budget data saved locally. Import it into your account so it syncs across devices?</div>
        <div style={{display:"flex",gap:"10px"}}>
          <button onClick={()=>onDecide(true)}  style={{...btnP,flex:1,padding:"11px"}}>Yes, import</button>
          <button onClick={()=>onDecide(false)} style={{...btnB,flex:1,padding:"11px",background:C.cancelBg,color:C.muted}}>Start fresh</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function BudgetTracker() {
  const [dark,          setDark]          = useState<boolean>(() => lsLoad<boolean>("budgetly_dark", false));
  const [user,          setUser]          = useState<User|null>(null);
  const [authReady,     setAuthReady]     = useState(false);
  const [showMigrate,   setShowMigrate]   = useState(false);
  const [activeTab,     setActiveTab]     = useState<string>("overview");
  const [activeMK,      setActiveMK]      = useState<string>(curMK());
  const [allMonths,     setAllMonthsRaw]  = useState<AllMonths>({});
  const [categories,    setCategories]    = useState<string[]>(DEFAULT_CATS);
  const [editingBudget, setEditingBudget] = useState(false);
  const [tempBudget,    setTempBudget]    = useState("10000");
  const [deleteConfirm, setDeleteConfirm] = useState<number|null>(null);
  const [newCategory,   setNewCategory]   = useState("");
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [dbLoading,     setDbLoading]     = useState(false);
  const [deleteMonthConfirm, setDeleteMonthConfirm] = useState(false);

  const C = makeTheme(dark);
  const toggleDark = () => { setDark(d => { lsSave("budgetly_dark", !d); return !d; }); };

  const today = todayS();
  const [expAmt,   setExpAmt]   = useState("");
  const [expCat,   setExpCat]   = useState(DEFAULT_CATS[0]);
  const [expDesc,  setExpDesc]  = useState("");
  const [expDate,  setExpDate]  = useState(today);
  const [earnAmt,  setEarnAmt]  = useState("");
  const [earnDesc, setEarnDesc] = useState("");
  const [earnDate, setEarnDate] = useState(today);
  const [savAmt,   setSavAmt]   = useState("");
  const [savDesc,  setSavDesc]  = useState("");
  const [savDate,  setSavDate]  = useState(today);

  const isGuest = !user || (user as {id:string}).id==="guest";

  // Auth init
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user??null); setAuthReady(true); });
    const { data:{subscription} } = supabase.auth.onAuthStateChange((_,session) => setUser(session?.user??null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (isGuest) { setAllMonthsRaw(lsLoad<AllMonths>("budgetly_months",{})); setCategories(lsLoad<string[]>("budgetly_cats",DEFAULT_CATS)); return; }
    loadFromSupabase();
    if (Object.keys(lsLoad<AllMonths>("budgetly_months",{})).length>0) setShowMigrate(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authReady]);

  const loadFromSupabase = useCallback(async () => {
    if (!user||isGuest) return;
    setDbLoading(true);
    const { data, error } = await supabase.from("month_data").select("*").eq("user_id",user.id);
    if (error) { console.error(error); setDbLoading(false); return; }
    const rebuilt: AllMonths = {};
    (data??[]).forEach((row:{month_key:string;budget:number;expenses:Expense[];earnings:Entry[];savings:Entry[]}) => {
      rebuilt[row.month_key]={budget:row.budget,expenses:row.expenses,earnings:row.earnings,savings:row.savings};
    });
    setAllMonthsRaw(rebuilt); setDbLoading(false);
  }, [user, isGuest]);

  const saveToSupabase = useCallback(async (mk:string, md:MonthData) => {
    if (!user||isGuest) return;
    await supabase.from("month_data").upsert({ user_id:user.id,month_key:mk,budget:md.budget,expenses:md.expenses,earnings:md.earnings,savings:md.savings,updated_at:new Date().toISOString() },{ onConflict:"user_id,month_key" });
  }, [user, isGuest]);

  const setAllMonths = useCallback((updater: AllMonths|((prev:AllMonths)=>AllMonths)) => {
    setAllMonthsRaw(prev => { const next=typeof updater==="function"?updater(prev):updater; if(isGuest)lsSave("budgetly_months",next); return next; });
  }, [isGuest]);

  const getM = (mk:string): MonthData => allMonths[mk]??emptyMD();
  const setM = useCallback(async (mk:string,d:MonthData) => { setAllMonths(prev=>({...prev,[mk]:d})); await saveToSupabase(mk,d); }, [setAllMonths,saveToSupabase]);

  const md = getM(activeMK);
  const { budget, expenses, earnings, savings } = md;

  useEffect(()=>{ if(isGuest) lsSave("budgetly_cats",categories); }, [categories,isGuest]);

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
  const addExpense     = () => { if(!expAmt||isNaN(+expAmt))return; setM(activeMK,{...md,expenses:[...expenses,{id:Date.now(),amount:+expAmt,category:expCat,description:expDesc,date:expDate}]}); setExpAmt(""); setExpDesc(""); };
  const addEarning     = () => { if(!earnAmt||isNaN(+earnAmt))return; setM(activeMK,{...md,earnings:[...earnings,{id:Date.now(),amount:+earnAmt,description:earnDesc,date:earnDate}]}); setEarnAmt(""); setEarnDesc(""); };
  const addSaving      = () => { if(!savAmt||isNaN(+savAmt))return; setM(activeMK,{...md,savings:[...savings,{id:Date.now(),amount:+savAmt,description:savDesc,date:savDate}]}); setSavAmt(""); setSavDesc(""); };
  const deleteExpense  = (id:number) => { setM(activeMK,{...md,expenses:expenses.filter(e=>e.id!==id)}); setDeleteConfirm(null); };
  const deleteEarning  = (id:number) => { setM(activeMK,{...md,earnings:earnings.filter(e=>e.id!==id)}); setDeleteConfirm(null); };
  const deleteSaving   = (id:number) => { setM(activeMK,{...md,savings: savings.filter (e=>e.id!==id)}); setDeleteConfirm(null); };
  const addCategory    = () => { const t=newCategory.trim(); if(!t||categories.includes(t))return; setCategories([...categories,t]); setNewCategory(""); };
  const deleteCategory = (cat:string) => { if(DEFAULT_CATS.includes(cat))return; setCategories(categories.filter(c=>c!==cat)); };
  const addNextMonth   = () => { const [y,m]=activeMK.split("-").map(Number); const nd=new Date(y,m,1); const nk=`${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,"0")}`; if(!allMonths[nk])setM(nk,emptyMD()); setActiveMK(nk); };
  const deleteMonth    = async () => { setDeleteMonthConfirm(false); setAllMonths(prev=>{const next={...prev};delete next[activeMK];return next;}); if(!isGuest&&user) await supabase.from("month_data").delete().eq("user_id",user.id).eq("month_key",activeMK); setActiveMK(curMK()); };
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

  function SidebarInner() {
    return (
      <>
        {/* Logo + dark toggle */}
        <div style={{padding:"0 18px 20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:"20px",fontWeight:700,letterSpacing:"-0.3px",color:C.text}}><span style={{color:C.accent}}>Budget</span>ly</div>
            <div style={{fontSize:"10px",color:C.faint,marginTop:"1px"}}>by Armaan Gupta</div>
          </div>
          {/* Dark mode toggle */}
          <button onClick={toggleDark} title={dark?"Switch to light mode":"Switch to dark mode"}
            style={{background:C.navActive,border:`1px solid ${C.border}`,borderRadius:"8px",padding:"5px 8px",cursor:"pointer",fontSize:"14px",lineHeight:1,marginTop:"2px"}}>
            {dark?"☀️":"🌙"}
          </button>
        </div>

        {/* User info */}
        <div style={{margin:"0 12px 16px",padding:"10px 12px",background:C.cardAlt,borderRadius:"10px",border:`1px solid ${C.border}`}}>
          {isGuest ? (
            <div style={{fontSize:"11px",color:C.muted}}>👤 Guest · <button onClick={()=>setUser(null)} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:"11px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,padding:0}}>Sign in</button></div>
          ) : (
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:"11px",color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"130px"}}>{user.email}</div>
              <button onClick={logout} style={{background:"none",border:"none",color:C.faint,cursor:"pointer",fontSize:"11px",fontFamily:"'DM Sans',sans-serif"}}
                onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.red;}}
                onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.faint;}}>Log out</button>
            </div>
          )}
        </div>

        {/* Month selector */}
        <div style={{padding:"0 12px 14px"}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"5px"}}>Active Month</div>
          <select value={activeMK} onChange={e=>setActiveMK(e.target.value)}
            style={{...sInput,fontSize:"12px",appearance:"none",cursor:"pointer",padding:"8px 11px"}}>
            {allMKs.map(mk=><option key={mk} value={mk}>{fmtMK(mk)}</option>)}
          </select>
          <button onClick={addNextMonth} style={{width:"100%",marginTop:"7px",padding:"6px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"transparent",color:C.accent,cursor:"pointer",fontSize:"11px",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
            + New Month
          </button>
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
        </nav>

        {/* Upcoming features */}
        <div style={{margin:"12px 12px 10px",padding:"11px",background:C.upcomingBg,borderRadius:"10px",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:"9px",color:C.faint,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"6px"}}>Upcoming Features</div>
          {["Export as Excel","Import from Excel"].map(f=>(
            <div key={f} style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"3px"}}>
              <div style={{width:"4px",height:"4px",borderRadius:"50%",background:C.faint,flexShrink:0}}/>
              <span style={{fontSize:"10px",color:C.faint}}>{f}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{padding:"10px 12px 0",borderTop:`1px solid ${C.border}`}}>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSdtx7DdVgiihO1C6qGfO8Y_nPjvyMvjQUr9fZMdwuG2C1DlCg/viewform?usp=publish-editor"
            target="_blank" rel="noreferrer"
            style={{display:"block",textAlign:"center",padding:"7px",borderRadius:"8px",background:C.navActive,color:C.accent,fontSize:"12px",fontWeight:600,textDecoration:"none",marginBottom:"7px"}}>
            💬 Give Feedback
          </a>
          {deleteMonthConfirm ? (
            <div style={{marginBottom:"7px"}}>
              <div style={{fontSize:"11px",color:C.text,marginBottom:"6px",textAlign:"center"}}>Delete {fmtMK(activeMK)}?</div>
              <div style={{display:"flex",gap:"6px"}}>
                <button onClick={deleteMonth} style={{flex:1,padding:"6px",borderRadius:"7px",border:"none",background:C.delBg,color:C.red,cursor:"pointer",fontSize:"11px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Yes, delete</button>
                <button onClick={()=>setDeleteMonthConfirm(false)} style={{flex:1,padding:"6px",borderRadius:"7px",border:"none",background:C.cancelBg,color:C.muted,cursor:"pointer",fontSize:"11px",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setDeleteMonthConfirm(true)}
              style={{width:"100%",padding:"6px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"transparent",color:C.faint,cursor:"pointer",fontSize:"10px",fontFamily:"'DM Sans',sans-serif",marginBottom:"6px"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.red;(e.currentTarget as HTMLButtonElement).style.borderColor=C.red+"66";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.faint;(e.currentTarget as HTMLButtonElement).style.borderColor=C.border;}}>
              🗑 Delete this month
            </button>
          )}
        </div>
      </>
    );
  }

  const ovProps: OvProps = { C,budget,cashFlowIn,cashFlowOut,totalEarnings,totalSavings,remaining,spentPct,editingBudget,tempBudget,setEditingBudget,setTempBudget,saveBudget,expenses,savings,categories,daysInMonth,todayDay,idealPerDay,idealSpentByToday,actualVsIdeal,moneyLeft,daysLeft,currentDailyAvg,currentIdealAvg };
  const exProps: ExProps = { C,expenses,categories,totalExpenses:cashFlowOut,expAmt,expCat,expDesc,expDate,setExpAmt,setExpCat,setExpDesc,setExpDate,addExpense,deleteConfirm,setDeleteConfirm,deleteExpense };
  const erProps: ErProps = { C,earnings,totalEarnings,earnAmt,earnDesc,earnDate,setEarnAmt,setEarnDesc,setEarnDate,addEarning,deleteConfirm,setDeleteConfirm,deleteEarning };
  const svProps: SvProps = { C,savings,totalSavings,cashFlowIn,savAmt,savDesc,savDate,setSavAmt,setSavDesc,setSavDate,addSaving,deleteConfirm,setDeleteConfirm,deleteSaving };
  const caProps: CaProps = { C,categories,expenses,cashFlowOut,newCategory,setNewCategory,addCategory,deleteCategory };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};font-family:'DM Sans',sans-serif;transition:background 0.2s;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        input:focus,select:focus{border-color:${C.accent}!important;box-shadow:0 0 0 3px ${C.accent}22;}
        input,select,option{color-scheme:${dark?"dark":"light"};}
        .mob-header{display:none;}
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
          <button onClick={toggleDark} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:"7px",padding:"4px 7px",cursor:"pointer",fontSize:"13px"}}>{dark?"☀️":"🌙"}</button>
          <span style={{fontSize:"13px",fontWeight:600,color:remaining>=0?C.green:C.red}}>{fmt(remaining)}</span>
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

        <main className="main-wrap" style={{flex:1,padding:"28px",overflowY:"auto"}}>
          <div style={{marginBottom:"18px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"8px"}}>
            <div>
              <h1 style={{fontSize:"clamp(18px,3.5vw,24px)",fontWeight:600,color:C.text,letterSpacing:"-0.3px"}}>
                {NAV.find(n=>n.id===activeTab)?.label}
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
          {activeTab==="categories" &&<CategoriesTab {...caProps}/>}
        </main>
      </div>

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
