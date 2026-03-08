"use client";

import { useState, useEffect, ReactNode, CSSProperties } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Entry    { id: number; amount: number; description: string; date: string; }
interface Expense extends Entry { category: string; }
interface MonthData { budget: number; expenses: Expense[]; earnings: Entry[]; savings: Entry[]; }
interface AllMonths { [mk: string]: MonthData; }

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt     = (n: number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
const todayS  = () => new Date().toISOString().split("T")[0];
const curMK   = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const fmtMK   = (mk:string) => { const [y,m]=mk.split("-"); return new Date(+y,+m-1,1).toLocaleDateString("en-IN",{month:"long",year:"numeric"}); };
const getDays = (mk:string) => { const [y,m]=mk.split("-").map(Number); return new Date(y,m,0).getDate(); };
const emptyMD = (): MonthData => ({ budget:10000, expenses:[], earnings:[], savings:[] });

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      "#f7f6f3",
  sidebar: "#ffffff",
  card:    "#ffffff",
  border:  "#e8e5e0",
  text:    "#2d2926",
  muted:   "#9c9589",
  faint:   "#c8c3bc",
  accent:  "#6c5ce7",
  green:   "#00b894",
  red:     "#e17055",
  amber:   "#fdcb6e",
  blue:    "#74b9ff",
};

// ─── Shared style objects (module-level — never recreated) ────────────────────
const sInput: CSSProperties = {
  width:"100%", padding:"9px 13px", borderRadius:"9px",
  border:`1.5px solid ${C.border}`, background:"#faf9f7",
  color:C.text, fontSize:"14px", outline:"none",
  boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif",
  transition:"border-color 0.15s",
};
const sCard: CSSProperties = {
  background:C.card, borderRadius:"14px", padding:"20px",
  border:`1px solid ${C.border}`,
};
const sLabel: CSSProperties = {
  display:"block", fontSize:"11px", color:C.muted,
  letterSpacing:"1.2px", textTransform:"uppercase", marginBottom:"6px", fontWeight:500,
};
const sSecTitle: CSSProperties = {
  fontSize:"10px", color:C.muted, letterSpacing:"2px",
  textTransform:"uppercase", marginBottom:"12px", fontWeight:600,
};
const btnBase: CSSProperties = {
  borderRadius:"9px", border:"none", fontWeight:600,
  fontSize:"13px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
  padding:"9px 18px", transition:"opacity 0.15s",
};
const btnPurple: CSSProperties = { ...btnBase, background:C.accent,    color:"#fff" };
const btnGreen:  CSSProperties = { ...btnBase, background:C.green,     color:"#fff" };
const btnAmber:  CSSProperties = { ...btnBase, background:"#e0a800",   color:"#fff" };

// ─── Tiny primitives (outside any component — stable references) ──────────────
function FF({ label, children }: { label:string; children:ReactNode }) {
  return <div style={{marginBottom:"12px"}}><label style={sLabel}>{label}</label>{children}</div>;
}

// ─── Props interfaces for all tab components ──────────────────────────────────
interface OverviewProps {
  budget:number; cashFlowIn:number; cashFlowOut:number; totalEarnings:number;
  totalSavings:number; remaining:number; spentPct:number;
  editingBudget:boolean; tempBudget:string;
  setEditingBudget:(v:boolean)=>void; setTempBudget:(v:string)=>void; saveBudget:()=>void;
  expenses:Expense[]; savings:Entry[]; categories:string[];
  daysInMonth:number; todayDay:number; idealPerDay:number;
  idealSpentByToday:number; actualVsIdeal:number;
  moneyLeft:number; daysLeft:number; currentDailyAvg:number; currentIdealAvg:number;
}
interface ExpensesProps {
  expenses:Expense[]; categories:string[]; totalExpenses:number;
  expAmt:string; expCat:string; expDesc:string; expDate:string;
  setExpAmt:(v:string)=>void; setExpCat:(v:string)=>void;
  setExpDesc:(v:string)=>void; setExpDate:(v:string)=>void;
  addExpense:()=>void;
  deleteConfirm:number|null; setDeleteConfirm:(v:number|null)=>void; deleteExpense:(id:number)=>void;
}
interface EarningsProps {
  earnings:Entry[]; totalEarnings:number;
  earnAmt:string; earnDesc:string; earnDate:string;
  setEarnAmt:(v:string)=>void; setEarnDesc:(v:string)=>void; setEarnDate:(v:string)=>void;
  addEarning:()=>void;
  deleteConfirm:number|null; setDeleteConfirm:(v:number|null)=>void; deleteEarning:(id:number)=>void;
}
interface SavingsProps {
  savings:Entry[]; totalSavings:number; cashFlowIn:number;
  savAmt:string; savDesc:string; savDate:string;
  setSavAmt:(v:string)=>void; setSavDesc:(v:string)=>void; setSavDate:(v:string)=>void;
  addSaving:()=>void;
  deleteConfirm:number|null; setDeleteConfirm:(v:number|null)=>void; deleteSaving:(id:number)=>void;
}
interface CategoriesProps {
  categories:string[]; expenses:Expense[]; cashFlowOut:number;
  newCategory:string; setNewCategory:(v:string)=>void;
  addCategory:()=>void; deleteCategory:(cat:string)=>void;
}

// ─── DeleteBtn (stable — defined at module level) ─────────────────────────────
function DelBtn({ id, confirm, setConfirm, onDel }: {
  id:number; confirm:number|null; setConfirm:(v:number|null)=>void; onDel:(id:number)=>void;
}) {
  if (confirm===id) return (
    <div style={{display:"flex",gap:"5px"}}>
      <button onClick={()=>onDel(id)} style={{background:"#fde8e4",border:"none",color:C.red,borderRadius:"7px",padding:"4px 9px",cursor:"pointer",fontSize:"12px",fontWeight:600}}>Del</button>
      <button onClick={()=>setConfirm(null)} style={{background:"#f0ede8",border:"none",color:C.muted,borderRadius:"7px",padding:"4px 9px",cursor:"pointer",fontSize:"12px"}}>No</button>
    </div>
  );
  return (
    <button onClick={()=>setConfirm(id)}
      style={{background:"none",border:`1px solid ${C.border}`,color:C.faint,cursor:"pointer",fontSize:"11px",borderRadius:"7px",padding:"3px 8px"}}
      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.red;(e.currentTarget as HTMLButtonElement).style.borderColor="#fca99b";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.faint;(e.currentTarget as HTMLButtonElement).style.borderColor=C.border;}}>✕</button>
  );
}

// ─── Entry row ────────────────────────────────────────────────────────────────
function EntryRow({ left, right }: { left:ReactNode; right:ReactNode }) {
  return (
    <div style={{background:"#faf9f7",borderRadius:"10px",padding:"11px 13px",border:`1px solid ${C.border}`,marginBottom:"6px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"10px"}}>
      <div style={{flex:1,minWidth:0}}>{left}</div>
      <div style={{display:"flex",alignItems:"center",gap:"9px",flexShrink:0}}>{right}</div>
    </div>
  );
}

// ─── OverviewTab (module-level) ────────────────────────────────────────────────
function OverviewTab(p: OverviewProps) {
  const catTotals = p.categories.map((cat,i)=>({
    name:cat, color:CAT_COLORS[i%CAT_COLORS.length],
    total:p.expenses.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0),
    count:p.expenses.filter(e=>e.category===cat).length,
  })).filter(c=>c.total>0);

  return (
    <div>
      {/* Stat cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"10px",marginBottom:"12px"}}>
        {([
          {label:"Cash Flow In", val:fmt(p.cashFlowIn),  color:C.green, sub:`Budget + ${fmt(p.totalEarnings)} earned`},
          {label:"Cash Flow Out",val:fmt(p.cashFlowOut), color:C.red,   sub:`${p.expenses.length} expense${p.expenses.length!==1?"s":""}`},
          {label:"Total Savings",val:fmt(p.totalSavings),color:"#e0a800",sub:`${p.savings.length} entr${p.savings.length!==1?"ies":"y"}`},
          {label:"Net Balance",  val:fmt(p.remaining),   color:p.remaining>=0?C.green:C.red, sub:p.remaining>=0?"On track":"Over budget ⚠"},
        ] as {label:string;val:string;color:string;sub:string}[]).map(s=>(
          <div key={s.label} style={{...sCard,borderTop:`3px solid ${s.color}`,padding:"14px"}}>
            <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"5px"}}>{s.label}</div>
            <div style={{fontSize:"clamp(15px,2.5vw,21px)",fontWeight:600,color:s.color}}>{s.val}</div>
            <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Budget + progress */}
      <div style={{...sCard,marginBottom:"12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px",flexWrap:"wrap",gap:"8px"}}>
          <div>
            <div style={sSecTitle}>Monthly Budget</div>
            {p.editingBudget ? (
              <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
                <input value={p.tempBudget} onChange={e=>p.setTempBudget(e.target.value)} style={{...sInput,width:"120px"}} type="number"/>
                <button onClick={p.saveBudget} style={btnPurple}>Save</button>
                <button onClick={()=>p.setEditingBudget(false)} style={{...btnBase,background:"#f0ede8",color:C.muted}}>✕</button>
              </div>
            ):(
              <div style={{display:"flex",alignItems:"baseline",gap:"9px"}}>
                <span style={{fontSize:"clamp(18px,3vw,26px)",fontWeight:600,color:C.text}}>{fmt(p.budget)}</span>
                <button onClick={()=>{p.setEditingBudget(true);p.setTempBudget(String(p.budget));}}
                  style={{...btnBase,background:"#ede9f8",color:C.accent,padding:"3px 10px",fontSize:"12px"}}>Edit</button>
              </div>
            )}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={sSecTitle}>Spent</div>
            <div style={{fontSize:"clamp(18px,3vw,26px)",fontWeight:600,color:p.spentPct>80?C.red:C.text}}>{p.spentPct.toFixed(1)}%</div>
          </div>
        </div>
        <div style={{background:"#f0ede8",borderRadius:"8px",height:"8px",overflow:"hidden",marginBottom:"7px"}}>
          <div style={{height:"100%",borderRadius:"8px",background:p.spentPct>80?C.red:C.accent,width:`${p.spentPct}%`,transition:"width 0.5s ease"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:"11px",color:C.muted}}>Spent {fmt(p.cashFlowOut)}</span>
          <span style={{fontSize:"11px",color:C.muted}}>of {fmt(p.cashFlowIn)}</span>
        </div>
      </div>

      {/* Daily averages — 3 metrics */}
      <div style={{...sCard,marginBottom:"12px"}}>
        <div style={sSecTitle}>Daily Averages</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0"}}>
          {([
            { label:"Ideal monthly avg",  val:fmt(p.idealPerDay),       color:C.accent,  note:"cash in ÷ days in month" },
            { label:"Current avg",        val:fmt(p.currentDailyAvg),   color:p.currentDailyAvg>p.idealPerDay?C.red:C.green, note:"spent ÷ days passed" },
            { label:"Current ideal avg",  val:fmt(p.currentIdealAvg),   color:"#e0a800", note:"left ÷ days remaining" },
          ] as {label:string;val:string;color:string;note:string}[]).map((d,i)=>(
            <div key={i} style={{padding:"10px 8px",borderLeft:i>0?`1px solid ${C.border}`:"none",textAlign:"center"}}>
              <div style={{fontSize:"9px",color:C.muted,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:"6px",lineHeight:1.3}}>{d.label}</div>
              <div style={{fontSize:"clamp(13px,2vw,18px)",fontWeight:600,color:d.color}}>{d.val}</div>
              <div style={{fontSize:"9px",color:C.faint,marginTop:"4px",lineHeight:1.3}}>{d.note}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:"12px",background:p.actualVsIdeal>0?"#fdecea":"#edfaf5",borderRadius:"8px",padding:"8px 12px",textAlign:"center"}}>
          <span style={{fontSize:"12px",color:p.actualVsIdeal>0?C.red:C.green,fontWeight:500}}>
            {p.actualVsIdeal>0?`⚠ ${fmt(p.actualVsIdeal)} over daily pace`:`✓ ${fmt(Math.abs(p.actualVsIdeal))} under daily pace`}
          </span>
        </div>
      </div>

      {/* Category breakdown */}
      {catTotals.length>0&&(
        <div style={sCard}>
          <div style={sSecTitle}>Spending by Category</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:"9px"}}>
            {catTotals.map(cat=>(
              <div key={cat.name} style={{background:"#faf9f7",borderRadius:"10px",padding:"12px",border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                    <div style={{width:"7px",height:"7px",borderRadius:"50%",background:cat.color}}/>
                    <span style={{fontSize:"12px",fontWeight:500,color:C.text}}>{cat.name}</span>
                  </div>
                  <span style={{fontSize:"10px",color:C.faint}}>{cat.count}</span>
                </div>
                <div style={{fontSize:"16px",fontWeight:600,color:cat.color,marginBottom:"5px"}}>{fmt(cat.total)}</div>
                <div style={{background:"#e8e5e0",borderRadius:"5px",height:"3px"}}>
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

// ─── ExpensesTab ───────────────────────────────────────────────────────────────
function ExpensesTab(p: ExpensesProps) {
  return (
    <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
      <div>
        <div style={sCard}>
          <div style={{...sSecTitle,marginBottom:"14px"}}>Add Expense</div>
          <FF label="Amount (₹) *"><input type="number" placeholder="0" value={p.expAmt} onChange={e=>p.setExpAmt(e.target.value)} style={sInput}/></FF>
          <FF label="Category">
            <select value={p.expCat} onChange={e=>p.setExpCat(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}>
              {p.categories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </FF>
          <FF label="Description"><input type="text" placeholder="What did you spend on?" value={p.expDesc} onChange={e=>p.setExpDesc(e.target.value)} style={sInput}/></FF>
          <FF label="Date"><input type="date" value={p.expDate} onChange={e=>p.setExpDate(e.target.value)} style={sInput}/></FF>
          <button onClick={p.addExpense} style={{...btnPurple,width:"100%",padding:"11px"}}>+ Add Expense</button>
        </div>
        <div style={{...sCard,marginTop:"12px",textAlign:"center"}}>
          <div style={sSecTitle}>Total Expenses</div>
          <div style={{fontSize:"22px",fontWeight:600,color:C.red}}>{fmt(p.totalExpenses)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{p.expenses.length} entries</div>
        </div>
      </div>
      <div style={sCard}>
        <div style={sSecTitle}>All Expenses</div>
        {p.expenses.length===0&&<div style={{textAlign:"center",color:C.faint,padding:"32px",fontSize:"13px"}}>No expenses yet</div>}
        {[...p.expenses].reverse().map(exp=>{
          const ci=p.categories.indexOf(exp.category);
          const col=CAT_COLORS[ci>=0?ci%CAT_COLORS.length:0];
          return(
            <EntryRow key={exp.id}
              left={<>
                <div style={{display:"flex",gap:"6px",marginBottom:"3px",flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontSize:"10px",padding:"2px 7px",borderRadius:"20px",background:col+"18",color:col,fontWeight:600}}>{exp.category}</span>
                  <span style={{fontSize:"10px",color:C.faint}}>{exp.date}</span>
                </div>
                <div style={{fontSize:"13px",color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{exp.description||"—"}</div>
              </>}
              right={<><span style={{fontSize:"14px",fontWeight:600,color:C.red,whiteSpace:"nowrap"}}>-{fmt(exp.amount)}</span><DelBtn id={exp.id} confirm={p.deleteConfirm} setConfirm={p.setDeleteConfirm} onDel={p.deleteExpense}/></>}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── EarningsTab ───────────────────────────────────────────────────────────────
function EarningsTab(p: EarningsProps) {
  return (
    <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
      <div>
        <div style={sCard}>
          <div style={{...sSecTitle,marginBottom:"14px"}}>Add Income</div>
          <FF label="Amount (₹) *"><input type="number" placeholder="0" value={p.earnAmt} onChange={e=>p.setEarnAmt(e.target.value)} style={sInput}/></FF>
          <FF label="Description"><input type="text" placeholder="Source of income" value={p.earnDesc} onChange={e=>p.setEarnDesc(e.target.value)} style={sInput}/></FF>
          <FF label="Date"><input type="date" value={p.earnDate} onChange={e=>p.setEarnDate(e.target.value)} style={sInput}/></FF>
          <button onClick={p.addEarning} style={{...btnGreen,width:"100%",padding:"11px"}}>+ Add Income</button>
        </div>
        <div style={{...sCard,marginTop:"12px",textAlign:"center"}}>
          <div style={sSecTitle}>Total Earnings</div>
          <div style={{fontSize:"22px",fontWeight:600,color:C.green}}>{fmt(p.totalEarnings)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{p.earnings.length} entries</div>
        </div>
      </div>
      <div style={sCard}>
        <div style={sSecTitle}>All Income</div>
        {p.earnings.length===0&&<div style={{textAlign:"center",color:C.faint,padding:"32px",fontSize:"13px"}}>No income yet</div>}
        {[...p.earnings].reverse().map(earn=>(
          <EntryRow key={earn.id}
            left={<><div style={{fontSize:"10px",color:C.faint,marginBottom:"3px"}}>{earn.date}</div><div style={{fontSize:"13px",color:C.text}}>{earn.description||"Income"}</div></>}
            right={<><span style={{fontSize:"14px",fontWeight:600,color:C.green,whiteSpace:"nowrap"}}>+{fmt(earn.amount)}</span><DelBtn id={earn.id} confirm={p.deleteConfirm} setConfirm={p.setDeleteConfirm} onDel={p.deleteEarning}/></>}
          />
        ))}
      </div>
    </div>
  );
}

// ─── SavingsTab ────────────────────────────────────────────────────────────────
function SavingsTab(p: SavingsProps) {
  return (
    <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
      <div>
        <div style={sCard}>
          <div style={{...sSecTitle,marginBottom:"14px"}}>Add Saving</div>
          <FF label="Amount (₹) *"><input type="number" placeholder="0" value={p.savAmt} onChange={e=>p.setSavAmt(e.target.value)} style={sInput}/></FF>
          <FF label="Description"><input type="text" placeholder="What are you saving for?" value={p.savDesc} onChange={e=>p.setSavDesc(e.target.value)} style={sInput}/></FF>
          <FF label="Date"><input type="date" value={p.savDate} onChange={e=>p.setSavDate(e.target.value)} style={sInput}/></FF>
          <button onClick={p.addSaving} style={{...btnAmber,width:"100%",padding:"11px"}}>+ Add Saving</button>
        </div>
        <div style={{...sCard,marginTop:"12px",textAlign:"center"}}>
          <div style={sSecTitle}>Total Saved</div>
          <div style={{fontSize:"22px",fontWeight:600,color:"#e0a800"}}>{fmt(p.totalSavings)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{p.cashFlowIn>0?((p.totalSavings/p.cashFlowIn)*100).toFixed(1):0}% of cash flow in</div>
        </div>
      </div>
      <div style={sCard}>
        <div style={sSecTitle}>All Savings</div>
        {p.savings.length===0&&<div style={{textAlign:"center",color:C.faint,padding:"32px",fontSize:"13px"}}>No savings yet</div>}
        {[...p.savings].reverse().map(sav=>(
          <EntryRow key={sav.id}
            left={<><div style={{fontSize:"10px",color:C.faint,marginBottom:"3px"}}>{sav.date}</div><div style={{fontSize:"13px",color:C.text}}>{sav.description||"Savings"}</div></>}
            right={<><span style={{fontSize:"14px",fontWeight:600,color:"#e0a800",whiteSpace:"nowrap"}}>{fmt(sav.amount)}</span><DelBtn id={sav.id} confirm={p.deleteConfirm} setConfirm={p.setDeleteConfirm} onDel={p.deleteSaving}/></>}
          />
        ))}
      </div>
    </div>
  );
}

// ─── CategoriesTab ─────────────────────────────────────────────────────────────
function CategoriesTab(p: CategoriesProps) {
  return (
    <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
      <div style={sCard}>
        <div style={{...sSecTitle,marginBottom:"14px"}}>Add Category</div>
        <FF label="Category Name">
          <input type="text" placeholder="e.g. Rent, Subscriptions…" value={p.newCategory}
            onChange={e=>p.setNewCategory(e.target.value)} onKeyDown={e=>e.key==="Enter"&&p.addCategory()} style={sInput}/>
        </FF>
        <button onClick={p.addCategory} style={{...btnPurple,width:"100%",padding:"11px"}}>+ Add Category</button>
        <p style={{fontSize:"11px",color:C.faint,marginTop:"10px",lineHeight:1.6}}>Default categories cannot be deleted.</p>
      </div>
      <div style={sCard}>
        <div style={sSecTitle}>{p.categories.length} Categories</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(165px,1fr))",gap:"9px"}}>
          {p.categories.map((cat,i)=>{
            const total=p.expenses.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0);
            const count=p.expenses.filter(e=>e.category===cat).length;
            const color=CAT_COLORS[i%CAT_COLORS.length];
            const isDef=DEFAULT_CATS.includes(cat);
            return(
              <div key={cat} style={{background:"#faf9f7",borderRadius:"10px",padding:"12px",border:`1px solid ${C.border}`}}>
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
                  <div style={{background:"#e8e5e0",borderRadius:"5px",height:"3px",marginTop:"7px"}}>
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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function BudgetTracker() {
  const [activeTab,     setActiveTab]     = useState<string>("overview");
  const [activeMK,      setActiveMK]      = useState<string>(curMK());
  const [allMonths,     setAllMonths]     = useState<AllMonths>(() => lsLoad<AllMonths>("budgetly_months", {}));
  const [categories,    setCategories]    = useState<string[]>(() => lsLoad<string[]>("budgetly_cats", DEFAULT_CATS));
  const [editingBudget, setEditingBudget] = useState<boolean>(false);
  const [tempBudget,    setTempBudget]    = useState<string>("10000");
  const [deleteConfirm, setDeleteConfirm] = useState<number|null>(null);
  const [newCategory,   setNewCategory]   = useState<string>("");
  const [drawerOpen,    setDrawerOpen]    = useState<boolean>(false);

  // All form state at top level (the ONLY correct fix for the typing bug)
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

  // Month helpers
  const getM  = (mk:string): MonthData => allMonths[mk] ?? emptyMD();
  const setM  = (mk:string, d:MonthData) => setAllMonths(p=>({...p,[mk]:d}));
  const md    = getM(activeMK);
  const { budget, expenses, earnings, savings } = md;

  // Persist
  useEffect(()=>{ lsSave("budgetly_months", allMonths); }, [allMonths]);
  useEffect(()=>{ lsSave("budgetly_cats",   categories); }, [categories]);

  // Computed
  const totalExpenses     = expenses.reduce((s,e)=>s+e.amount,0);
  const totalEarnings     = earnings.reduce((s,e)=>s+e.amount,0);
  const totalSavings      = savings.reduce ((s,e)=>s+e.amount,0);
  const cashFlowIn        = budget + totalEarnings;
  const cashFlowOut       = totalExpenses;
  const remaining         = cashFlowIn - cashFlowOut - totalSavings;
  const spentPct          = cashFlowIn>0 ? Math.min((cashFlowOut/cashFlowIn)*100,100) : 0;
  const daysInMonth       = getDays(activeMK);
  const todayDay          = activeMK===curMK() ? new Date().getDate() : daysInMonth;
  const daysLeft          = Math.max(daysInMonth - todayDay, 1);
  const moneyLeft         = Math.max(remaining, 0);
  const idealPerDay       = Math.round(cashFlowIn / daysInMonth);
  const idealSpentByToday = idealPerDay * todayDay;
  const actualVsIdeal     = cashFlowOut - idealSpentByToday;
  const currentDailyAvg   = todayDay > 0 ? Math.round(cashFlowOut / todayDay) : 0;
  const currentIdealAvg   = Math.round(moneyLeft / daysLeft);

  // All month keys
  const allMKs = (() => { const k=Object.keys(allMonths); if(!k.includes(curMK()))k.push(curMK()); return k.sort().reverse(); })();

  // Actions
  const setBudget      = (v:number) => setM(activeMK,{...md,budget:v});
  const saveBudget     = () => { const v=parseFloat(tempBudget); if(!isNaN(v)&&v>0)setBudget(v); setEditingBudget(false); };
  const addExpense     = () => { if(!expAmt||isNaN(+expAmt))return; setM(activeMK,{...md,expenses:[...expenses,{id:Date.now(),amount:+expAmt,category:expCat,description:expDesc,date:expDate}]}); setExpAmt(""); setExpDesc(""); };
  const addEarning     = () => { if(!earnAmt||isNaN(+earnAmt))return; setM(activeMK,{...md,earnings:[...earnings,{id:Date.now(),amount:+earnAmt,description:earnDesc,date:earnDate}]}); setEarnAmt(""); setEarnDesc(""); };
  const addSaving      = () => { if(!savAmt||isNaN(+savAmt))return;  setM(activeMK,{...md,savings: [...savings, {id:Date.now(),amount:+savAmt, description:savDesc, date:savDate }]}); setSavAmt(""); setSavDesc(""); };
  const deleteExpense  = (id:number) => { setM(activeMK,{...md,expenses:expenses.filter(e=>e.id!==id)}); setDeleteConfirm(null); };
  const deleteEarning  = (id:number) => { setM(activeMK,{...md,earnings:earnings.filter(e=>e.id!==id)}); setDeleteConfirm(null); };
  const deleteSaving   = (id:number) => { setM(activeMK,{...md,savings: savings.filter (e=>e.id!==id)}); setDeleteConfirm(null); };
  const addCategory    = () => { const t=newCategory.trim(); if(!t||categories.includes(t))return; setCategories([...categories,t]); setNewCategory(""); };
  const deleteCategory = (cat:string) => { if(DEFAULT_CATS.includes(cat))return; setCategories(categories.filter(c=>c!==cat)); };
  const addNextMonth   = () => { const [y,m]=activeMK.split("-").map(Number); const nd=new Date(y,m,1); const nk=`${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,"0")}`; if(!allMonths[nk])setM(nk,emptyMD()); setActiveMK(nk); };
  const clearMonth     = () => { if(!window.confirm(`Reset all data for ${fmtMK(activeMK)}?`))return; setM(activeMK,emptyMD()); };

  // Sidebar inner content
  function SidebarInner() {
    return (
      <>
        {/* Logo */}
        <div style={{padding:"0 18px 20px"}}>
          <div style={{fontSize:"20px",fontWeight:700,letterSpacing:"-0.3px",color:C.text}}>
            <span style={{color:C.accent}}>Budget</span>ly
          </div>
          <div style={{fontSize:"10px",color:C.faint,marginTop:"1px",letterSpacing:"0.5px"}}>by Armaan Gupta</div>
        </div>

        {/* Month selector */}
        <div style={{padding:"0 12px 16px"}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"5px"}}>Active Month</div>
          <select value={activeMK} onChange={e=>setActiveMK(e.target.value)}
            style={{...sInput,fontSize:"12px",appearance:"none",cursor:"pointer",padding:"8px 11px"}}>
            {allMKs.map(mk=><option key={mk} value={mk}>{fmtMK(mk)}</option>)}
          </select>
          <button onClick={addNextMonth}
            style={{width:"100%",marginTop:"7px",padding:"6px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"transparent",color:C.accent,cursor:"pointer",fontSize:"11px",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
            + New Month
          </button>
        </div>

        {/* Balance pill */}
        <div style={{margin:"0 12px 18px",background:remaining>=0?"#edfaf5":"#fdecea",borderRadius:"10px",padding:"12px 14px",border:`1px solid ${remaining>=0?"#b2ead0":"#f5c0b8"}`}}>
          <div style={{fontSize:"9px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"3px"}}>Net Balance</div>
          <div style={{fontSize:"19px",fontWeight:600,color:remaining>=0?C.green:C.red}}>{fmt(remaining)}</div>
          <div style={{fontSize:"10px",color:C.muted,marginTop:"2px"}}>{fmtMK(activeMK)}</div>
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:"0 8px"}}>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>{setActiveTab(item.id);setDrawerOpen(false);}} style={{
              width:"100%",padding:"9px 12px",borderRadius:"9px",border:"none",
              background:activeTab===item.id?"#ede9f8":"transparent",
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
        <div style={{margin:"14px 12px 12px",padding:"12px",background:"#faf9f7",borderRadius:"10px",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:"9px",color:C.faint,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"7px"}}>Upcoming Features</div>
          {["Account creation","Import from Excel"].map(f=>(
            <div key={f} style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"4px"}}>
              <div style={{width:"4px",height:"4px",borderRadius:"50%",background:C.faint,flexShrink:0}}/>
              <span style={{fontSize:"10px",color:C.faint}}>{f}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{padding:"12px 14px 0",borderTop:`1px solid ${C.border}`}}>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSdtx7DdVgiihO1C6qGfO8Y_nPjvyMvjQUr9fZMdwuG2C1DlCg/viewform?usp=publish-editor"
            target="_blank" rel="noreferrer"
            style={{display:"block",textAlign:"center",padding:"8px",borderRadius:"8px",background:"#ede9f8",color:C.accent,fontSize:"12px",fontWeight:600,textDecoration:"none",marginBottom:"8px"}}>
            💬 Give Feedback
          </a>
          <button onClick={clearMonth}
            style={{width:"100%",padding:"6px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"transparent",color:C.faint,cursor:"pointer",fontSize:"10px",fontFamily:"'DM Sans',sans-serif"}}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.red;(e.currentTarget as HTMLButtonElement).style.borderColor="#fca99b";}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.faint;(e.currentTarget as HTMLButtonElement).style.borderColor=C.border;}}>
            ↺ Reset this month
          </button>
        </div>
      </>
    );
  }

  const overviewProps: OverviewProps = {
    budget, cashFlowIn, cashFlowOut, totalEarnings, totalSavings, remaining, spentPct,
    editingBudget, tempBudget, setEditingBudget, setTempBudget, saveBudget,
    expenses, savings, categories, daysInMonth, todayDay, idealPerDay,
    idealSpentByToday, actualVsIdeal, moneyLeft, daysLeft, currentDailyAvg, currentIdealAvg,
  };
  const expensesProps: ExpensesProps = { expenses, categories, totalExpenses: cashFlowOut, expAmt, expCat, expDesc, expDate, setExpAmt, setExpCat, setExpDesc, setExpDate, addExpense, deleteConfirm, setDeleteConfirm, deleteExpense };
  const earningsProps: EarningsProps = { earnings, totalEarnings, earnAmt, earnDesc, earnDate, setEarnAmt, setEarnDesc, setEarnDate, addEarning, deleteConfirm, setDeleteConfirm, deleteEarning };
  const savingsProps:  SavingsProps  = { savings, totalSavings, cashFlowIn, savAmt, savDesc, savDate, setSavAmt, setSavDesc, setSavDate, addSaving, deleteConfirm, setDeleteConfirm, deleteSaving };
  const catsProps:     CategoriesProps = { categories, expenses, cashFlowOut, newCategory, setNewCategory, addCategory, deleteCategory };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};font-family:'DM Sans',sans-serif;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        input:focus,select:focus{border-color:${C.accent}!important;box-shadow:0 0 0 3px ${C.accent}18;}
        .mob-header{display:none;}
        .mob-nav{display:none;}
        .desk-sidebar{display:flex;}
        @media(max-width:768px){
          .mob-header{display:flex!important;position:fixed;top:0;left:0;right:0;z-index:100;background:${C.card};border-bottom:1px solid ${C.border};padding:11px 15px;align-items:center;justify-content:space-between;}
          .desk-sidebar{display:none!important;}
          .mob-nav{display:flex!important;position:fixed;bottom:0;left:0;right:0;background:${C.card};border-top:1px solid ${C.border};z-index:50;padding:5px 0 max(8px,env(safe-area-inset-bottom));}
          .main-wrap{padding:64px 12px 70px!important;}
          .two-col-grid{grid-template-columns:1fr!important;}
        }
      `}</style>

      {/* Mobile header */}
      <div className="mob-header">
        <div style={{fontSize:"18px",fontWeight:700,color:C.text}}><span style={{color:C.accent}}>Budget</span>ly</div>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <span style={{fontSize:"13px",fontWeight:600,color:remaining>=0?C.green:C.red}}>{fmt(remaining)}</span>
          <button onClick={()=>setDrawerOpen(true)} style={{background:"none",border:`1px solid ${C.border}`,color:C.text,cursor:"pointer",borderRadius:"7px",padding:"5px 9px",fontSize:"14px"}}>☰</button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {drawerOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex"}}>
          <div style={{width:"260px",background:C.card,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"24px 0",overflowY:"auto"}}>
            <SidebarInner/>
          </div>
          <div style={{flex:1,background:"rgba(0,0,0,0.25)"}} onClick={()=>setDrawerOpen(false)}/>
        </div>
      )}

      {/* Layout */}
      <div style={{minHeight:"100vh",background:C.bg,display:"flex"}}>

        {/* Desktop sidebar */}
        <aside className="desk-sidebar" style={{width:"210px",minHeight:"100vh",background:C.sidebar,borderRight:`1px solid ${C.border}`,flexDirection:"column",padding:"24px 0",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
          <SidebarInner/>
        </aside>

        {/* Main */}
        <main className="main-wrap" style={{flex:1,padding:"28px 28px",overflowY:"auto"}}>
          {/* Page header */}
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

          {activeTab==="overview"   &&<OverviewTab    {...overviewProps}/>}
          {activeTab==="expenses"   &&<ExpensesTab    {...expensesProps}/>}
          {activeTab==="earnings"   &&<EarningsTab    {...earningsProps}/>}
          {activeTab==="savings"    &&<SavingsTab     {...savingsProps}/>}
          {activeTab==="categories" &&<CategoriesTab  {...catsProps}/>}
        </main>
      </div>

      {/* Mobile bottom nav */}
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
