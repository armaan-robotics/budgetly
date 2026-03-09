"use client";

import { useState, useEffect, useCallback, ReactNode, CSSProperties } from "react";
import { createClient, User, Session } from "@supabase/supabase-js";

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
  bg:"#f7f6f3", sidebar:"#ffffff", card:"#ffffff", border:"#e8e5e0",
  text:"#2d2926", muted:"#9c9589", faint:"#c8c3bc",
  accent:"#6c5ce7", green:"#00b894", red:"#e17055", amber:"#e0a800",
};

// ─── Style tokens ─────────────────────────────────────────────────────────────
const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:"#faf9f7",color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif",transition:"border-color 0.15s" };
const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
const sLabel: CSSProperties = { display:"block",fontSize:"11px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"6px",fontWeight:500 };
const sSecT:  CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };
const btnB:   CSSProperties = { borderRadius:"9px",border:"none",fontWeight:600,fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"9px 18px",transition:"opacity 0.15s" };
const btnP:   CSSProperties = { ...btnB,background:C.accent,color:"#fff" };
const btnG:   CSSProperties = { ...btnB,background:C.green, color:"#fff" };
const btnA:   CSSProperties = { ...btnB,background:C.amber, color:"#fff" };

// ─── Primitives ───────────────────────────────────────────────────────────────
function FF({ label, children }: { label:string; children:ReactNode }) {
  return <div style={{marginBottom:"12px"}}><label style={sLabel}>{label}</label>{children}</div>;
}
function EntryRow({ left, right }: { left:ReactNode; right:ReactNode }) {
  return (
    <div style={{background:"#faf9f7",borderRadius:"10px",padding:"11px 13px",border:`1px solid ${C.border}`,marginBottom:"6px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"10px"}}>
      <div style={{flex:1,minWidth:0}}>{left}</div>
      <div style={{display:"flex",alignItems:"center",gap:"9px",flexShrink:0}}>{right}</div>
    </div>
  );
}

// ─── DelBtn ───────────────────────────────────────────────────────────────────
function DelBtn({ id,confirm,setConfirm,onDel }: { id:number;confirm:number|null;setConfirm:(v:number|null)=>void;onDel:(id:number)=>void }) {
  if (confirm===id) return (
    <div style={{display:"flex",gap:"5px"}}>
      <button onClick={()=>onDel(id)} style={{background:"#fde8e4",border:"none",color:C.red,borderRadius:"7px",padding:"4px 9px",cursor:"pointer",fontSize:"12px",fontWeight:600}}>Del</button>
      <button onClick={()=>setConfirm(null)} style={{background:"#f0ede8",border:"none",color:C.muted,borderRadius:"7px",padding:"4px 9px",cursor:"pointer",fontSize:"12px"}}>No</button>
    </div>
  );
  return (
    <button onClick={()=>setConfirm(id)} style={{background:"none",border:`1px solid ${C.border}`,color:C.faint,cursor:"pointer",fontSize:"11px",borderRadius:"7px",padding:"3px 8px"}}
      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.red;(e.currentTarget as HTMLButtonElement).style.borderColor="#fca99b";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.faint;(e.currentTarget as HTMLButtonElement).style.borderColor=C.border;}}>✕</button>
  );
}

// ─── Props interfaces ─────────────────────────────────────────────────────────
interface OvProps {
  budget:number;cashFlowIn:number;cashFlowOut:number;totalEarnings:number;
  totalSavings:number;remaining:number;spentPct:number;
  editingBudget:boolean;tempBudget:string;
  setEditingBudget:(v:boolean)=>void;setTempBudget:(v:string)=>void;saveBudget:()=>void;
  expenses:Expense[];savings:Entry[];categories:string[];
  daysInMonth:number;todayDay:number;idealPerDay:number;
  idealSpentByToday:number;actualVsIdeal:number;
  moneyLeft:number;daysLeft:number;currentDailyAvg:number;currentIdealAvg:number;
}
interface ExProps { expenses:Expense[];categories:string[];totalExpenses:number;expAmt:string;expCat:string;expDesc:string;expDate:string;setExpAmt:(v:string)=>void;setExpCat:(v:string)=>void;setExpDesc:(v:string)=>void;setExpDate:(v:string)=>void;addExpense:()=>void;deleteConfirm:number|null;setDeleteConfirm:(v:number|null)=>void;deleteExpense:(id:number)=>void; }
interface ErProps { earnings:Entry[];totalEarnings:number;earnAmt:string;earnDesc:string;earnDate:string;setEarnAmt:(v:string)=>void;setEarnDesc:(v:string)=>void;setEarnDate:(v:string)=>void;addEarning:()=>void;deleteConfirm:number|null;setDeleteConfirm:(v:number|null)=>void;deleteEarning:(id:number)=>void; }
interface SvProps { savings:Entry[];totalSavings:number;cashFlowIn:number;savAmt:string;savDesc:string;savDate:string;setSavAmt:(v:string)=>void;setSavDesc:(v:string)=>void;setSavDate:(v:string)=>void;addSaving:()=>void;deleteConfirm:number|null;setDeleteConfirm:(v:number|null)=>void;deleteSaving:(id:number)=>void; }
interface CaProps { categories:string[];expenses:Expense[];cashFlowOut:number;newCategory:string;setNewCategory:(v:string)=>void;addCategory:()=>void;deleteCategory:(cat:string)=>void; }

// ─── Tab components (module-level — stable references, fixes typing bug) ──────
function OverviewTab(p: OvProps) {
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
            {p.editingBudget?(
              <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
                <input value={p.tempBudget} onChange={e=>p.setTempBudget(e.target.value)} style={{...sInput,width:"120px"}} type="number"/>
                <button onClick={p.saveBudget} style={btnP}>Save</button>
                <button onClick={()=>p.setEditingBudget(false)} style={{...btnB,background:"#f0ede8",color:C.muted}}>✕</button>
              </div>
            ):(
              <div style={{display:"flex",alignItems:"baseline",gap:"9px"}}>
                <span style={{fontSize:"clamp(18px,3vw,26px)",fontWeight:600,color:C.text}}>{fmt(p.budget)}</span>
                <button onClick={()=>{p.setEditingBudget(true);p.setTempBudget(String(p.budget));}} style={{...btnB,background:"#ede9f8",color:C.accent,padding:"3px 10px",fontSize:"12px"}}>Edit</button>
              </div>
            )}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={sSecT}>Spent</div>
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
      <div style={{...sCard,marginBottom:"12px"}}>
        <div style={sSecT}>Daily Averages</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)"}}>
          {([
            {label:"Ideal monthly avg", val:fmt(p.idealPerDay),      color:C.accent, note:"(cash in - savings) ÷ days in month"},
            {label:"Daily avg to spend", val:fmt(p.currentIdealAvg),  color:p.currentIdealAvg<p.idealPerDay?C.green:C.red, note:"to spend ÷ days remaining"},
            {label:"Spent per day",      val:fmt(p.currentDailyAvg),  color:C.muted,  note:"spent ÷ days passed"},
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
      {catTotals.length>0&&(
        <div style={sCard}>
          <div style={sSecT}>Spending by Category</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"9px"}}>
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

function ExpensesTab(p: ExProps) {
  return (
    <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
      <div>
        <div style={sCard}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Expense</div>
          <FF label="Amount (₹) *"><input type="number" placeholder="0" value={p.expAmt} onChange={e=>p.setExpAmt(e.target.value)} style={sInput}/></FF>
          <FF label="Category"><select value={p.expCat} onChange={e=>p.setExpCat(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}>{p.categories.map(c=><option key={c} value={c}>{c}</option>)}</select></FF>
          <FF label="Description"><input type="text" placeholder="What did you spend on?" value={p.expDesc} onChange={e=>p.setExpDesc(e.target.value)} style={sInput}/></FF>
          <FF label="Date"><input type="date" value={p.expDate} onChange={e=>p.setExpDate(e.target.value)} style={sInput}/></FF>
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
          return <EntryRow key={exp.id}
            left={<><div style={{display:"flex",gap:"6px",marginBottom:"3px",flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:"10px",padding:"2px 7px",borderRadius:"20px",background:col+"18",color:col,fontWeight:600}}>{exp.category}</span><span style={{fontSize:"10px",color:C.faint}}>{exp.date}</span></div><div style={{fontSize:"13px",color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{exp.description||"—"}</div></>}
            right={<><span style={{fontSize:"14px",fontWeight:600,color:C.red,whiteSpace:"nowrap"}}>-{fmt(exp.amount)}</span><DelBtn id={exp.id} confirm={p.deleteConfirm} setConfirm={p.setDeleteConfirm} onDel={p.deleteExpense}/></>}
          />;
        })}
      </div>
    </div>
  );
}

function EarningsTab(p: ErProps) {
  return (
    <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
      <div>
        <div style={sCard}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Income</div>
          <FF label="Amount (₹) *"><input type="number" placeholder="0" value={p.earnAmt} onChange={e=>p.setEarnAmt(e.target.value)} style={sInput}/></FF>
          <FF label="Description"><input type="text" placeholder="Source of income" value={p.earnDesc} onChange={e=>p.setEarnDesc(e.target.value)} style={sInput}/></FF>
          <FF label="Date"><input type="date" value={p.earnDate} onChange={e=>p.setEarnDate(e.target.value)} style={sInput}/></FF>
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
        {[...p.earnings].reverse().map(earn=><EntryRow key={earn.id}
          left={<><div style={{fontSize:"10px",color:C.faint,marginBottom:"3px"}}>{earn.date}</div><div style={{fontSize:"13px",color:C.text}}>{earn.description||"Income"}</div></>}
          right={<><span style={{fontSize:"14px",fontWeight:600,color:C.green,whiteSpace:"nowrap"}}>+{fmt(earn.amount)}</span><DelBtn id={earn.id} confirm={p.deleteConfirm} setConfirm={p.setDeleteConfirm} onDel={p.deleteEarning}/></>}
        />)}
      </div>
    </div>
  );
}

function SavingsTab(p: SvProps) {
  return (
    <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
      <div>
        <div style={sCard}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Saving</div>
          <FF label="Amount (₹) *"><input type="number" placeholder="0" value={p.savAmt} onChange={e=>p.setSavAmt(e.target.value)} style={sInput}/></FF>
          <FF label="Description"><input type="text" placeholder="What are you saving for?" value={p.savDesc} onChange={e=>p.setSavDesc(e.target.value)} style={sInput}/></FF>
          <FF label="Date"><input type="date" value={p.savDate} onChange={e=>p.setSavDate(e.target.value)} style={sInput}/></FF>
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
        {[...p.savings].reverse().map(sav=><EntryRow key={sav.id}
          left={<><div style={{fontSize:"10px",color:C.faint,marginBottom:"3px"}}>{sav.date}</div><div style={{fontSize:"13px",color:C.text}}>{sav.description||"Savings"}</div></>}
          right={<><span style={{fontSize:"14px",fontWeight:600,color:C.amber,whiteSpace:"nowrap"}}>{fmt(sav.amount)}</span><DelBtn id={sav.id} confirm={p.deleteConfirm} setConfirm={p.setDeleteConfirm} onDel={p.deleteSaving}/></>}
        />)}
      </div>
    </div>
  );
}

function CategoriesTab(p: CaProps) {
  return (
    <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
      <div style={sCard}>
        <div style={{...sSecT,marginBottom:"14px"}}>Add Category</div>
        <FF label="Category Name"><input type="text" placeholder="e.g. Rent, Subscriptions…" value={p.newCategory} onChange={e=>p.setNewCategory(e.target.value)} onKeyDown={e=>e.key==="Enter"&&p.addCategory()} style={sInput}/></FF>
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

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode,     setMode]     = useState<"login"|"signup">("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  const handle = async () => {
    setError(""); setLoading(true);
    if (mode==="signup") {
      const { error: e } = await supabase.auth.signUp({ email, password });
      if (e) { setError(e.message); setLoading(false); return; }
      setDone(true); setLoading(false); return;
    }
    const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) { setError(e.message); setLoading(false); return; }
    if (data.user) onAuth(data.user);
    setLoading(false);
  };

  const inputStyle: CSSProperties = { ...sInput, marginBottom:"12px", fontSize:"15px", padding:"11px 14px" };

  if (done) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{...sCard,maxWidth:"380px",width:"90%",textAlign:"center",padding:"36px"}}>
        <div style={{fontSize:"32px",marginBottom:"12px"}}>📧</div>
        <div style={{fontSize:"18px",fontWeight:600,color:C.text,marginBottom:"8px"}}>Check your email</div>
        <div style={{fontSize:"13px",color:C.muted,lineHeight:1.6}}>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back and log in.</div>
        <button onClick={()=>{setDone(false);setMode("login");}} style={{...btnP,marginTop:"20px",width:"100%",padding:"11px"}}>Back to Login</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{...sCard,maxWidth:"380px",width:"90%",padding:"32px"}}>
        <div style={{marginBottom:"24px"}}>
          <div style={{fontSize:"22px",fontWeight:700,color:C.text,marginBottom:"4px"}}>
            <span style={{color:C.accent}}>Budget</span>ly
          </div>
          <div style={{fontSize:"13px",color:C.muted}}>{mode==="login"?"Welcome back":"Create your account"}</div>
        </div>

        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle}/>
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handle()} style={inputStyle}/>

        {error&&<div style={{fontSize:"12px",color:C.red,marginBottom:"10px",padding:"8px 10px",background:"#fdecea",borderRadius:"7px"}}>{error}</div>}

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
            style={{...btnB,background:"#f0ede8",color:C.muted,width:"100%",padding:"10px"}}>
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Migration Modal ──────────────────────────────────────────────────────────
function MigrateModal({ onDecide }: { onDecide:(migrate:boolean)=>void }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{...sCard,maxWidth:"380px",width:"90%",padding:"28px"}}>
        <div style={{fontSize:"18px",fontWeight:600,color:C.text,marginBottom:"8px"}}>You have existing data</div>
        <div style={{fontSize:"13px",color:C.muted,lineHeight:1.7,marginBottom:"20px"}}>
          We found budget data saved locally on this device. Would you like to import it into your account so it syncs across devices?
        </div>
        <div style={{display:"flex",gap:"10px"}}>
          <button onClick={()=>onDecide(true)} style={{...btnP,flex:1,padding:"11px"}}>Yes, import it</button>
          <button onClick={()=>onDecide(false)} style={{...btnB,flex:1,padding:"11px",background:"#f0ede8",color:C.muted}}>No, start fresh</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function BudgetTracker() {
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

  const isGuest = !user || (user as {id:string}).id === "guest";

  // ─── Auth init ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ─── Load data when user changes ────────────────────────────────────────
  useEffect(() => {
    if (!authReady) return;
    if (isGuest) {
      setAllMonthsRaw(lsLoad<AllMonths>("budgetly_months", {}));
      setCategories(lsLoad<string[]>("budgetly_cats", DEFAULT_CATS));
      return;
    }
    // Real user — load from Supabase
    loadFromSupabase();
    // Check if localStorage has data → offer migration
    const lsData = lsLoad<AllMonths>("budgetly_months", {});
    if (Object.keys(lsData).length > 0) setShowMigrate(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authReady]);

  const loadFromSupabase = useCallback(async () => {
    if (!user || isGuest) return;
    setDbLoading(true);
    const { data, error } = await supabase
      .from("month_data")
      .select("*")
      .eq("user_id", user.id);
    if (error) { console.error(error); setDbLoading(false); return; }
    const rebuilt: AllMonths = {};
    (data ?? []).forEach((row: {month_key:string;budget:number;expenses:Expense[];earnings:Entry[];savings:Entry[]}) => {
      rebuilt[row.month_key] = { budget:row.budget, expenses:row.expenses, earnings:row.earnings, savings:row.savings };
    });
    setAllMonthsRaw(rebuilt);
    setDbLoading(false);
  }, [user, isGuest]);

  // ─── Save one month to Supabase ──────────────────────────────────────────
  const saveToSupabase = useCallback(async (mk: string, md: MonthData) => {
    if (!user || isGuest) return;
    await supabase.from("month_data").upsert({
      user_id: user.id, month_key: mk,
      budget: md.budget, expenses: md.expenses,
      earnings: md.earnings, savings: md.savings,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,month_key" });
  }, [user, isGuest]);

  // ─── setAllMonths — writes to ls or db ──────────────────────────────────
  const setAllMonths = useCallback((updater: AllMonths | ((prev: AllMonths) => AllMonths)) => {
    setAllMonthsRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (isGuest) lsSave("budgetly_months", next);
      return next;
    });
  }, [isGuest]);

  // ─── Month helpers ───────────────────────────────────────────────────────
  const getM = (mk: string): MonthData => allMonths[mk] ?? emptyMD();
  const setM = useCallback(async (mk: string, d: MonthData) => {
    setAllMonths(prev => ({ ...prev, [mk]: d }));
    await saveToSupabase(mk, d);
  }, [setAllMonths, saveToSupabase]);

  const md       = getM(activeMK);
  const { budget, expenses, earnings, savings } = md;

  // Persist categories (guests only — no db table for categories)
  useEffect(() => { if (isGuest) lsSave("budgetly_cats", categories); }, [categories, isGuest]);

  // ─── Computed ────────────────────────────────────────────────────────────
  const totalExpenses     = expenses.reduce((s,e)=>s+e.amount,0);
  const totalEarnings     = earnings.reduce((s,e)=>s+e.amount,0);
  const totalSavings      = savings.reduce ((s,e)=>s+e.amount,0);
  const cashFlowIn        = budget + totalEarnings;
  const cashFlowOut       = totalExpenses;
  const remaining         = cashFlowIn - cashFlowOut - totalSavings;
  const spentPct          = cashFlowIn>0 ? Math.min((cashFlowOut/(cashFlowIn-totalSavings))*100,100) : 0;
  const daysInMonth       = getDays(activeMK);
  const todayDay          = activeMK===curMK() ? new Date().getDate() : daysInMonth;
  const daysLeft          = Math.max(daysInMonth - todayDay, 1);
  const moneyLeft         = Math.max(remaining, 0);
  const idealPerDay       = Math.round((cashFlowIn - totalSavings) / daysInMonth);
  const idealSpentByToday = idealPerDay * todayDay;
  const actualVsIdeal     = cashFlowOut - idealSpentByToday;
  const currentDailyAvg   = todayDay>0 ? Math.round(cashFlowOut/todayDay) : 0;
  const currentIdealAvg   = Math.round(moneyLeft / daysLeft);

  const allMKs = (() => { const k=Object.keys(allMonths); if(!k.includes(curMK()))k.push(curMK()); return k.sort().reverse(); })();

  // ─── Actions ─────────────────────────────────────────────────────────────
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

  const deleteMonth = async () => {
    setDeleteMonthConfirm(false);
    // Remove from state
    setAllMonths(prev => { const next={...prev}; delete next[activeMK]; return next; });
    // Remove from Supabase if logged in
    if (!isGuest && user) {
      await supabase.from("month_data").delete().eq("user_id", user.id).eq("month_key", activeMK);
    }
    // Switch to current month
    setActiveMK(curMK());
  };

  const handleMigrate = async (migrate: boolean) => {
    setShowMigrate(false);
    if (!migrate || !user) return;
    const lsData = lsLoad<AllMonths>("budgetly_months", {});
    for (const [mk, md] of Object.entries(lsData)) {
      await saveToSupabase(mk, md);
    }
    localStorage.removeItem("budgetly_months");
    await loadFromSupabase();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAllMonthsRaw({});
  };

  // ─── Auth gate ───────────────────────────────────────────────────────────
  if (!authReady) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{fontSize:"13px",color:C.muted}}>Loading…</div>
    </div>
  );

  if (!user) return <AuthScreen onAuth={u => setUser(u)}/>;

  // ─── Sidebar inner ───────────────────────────────────────────────────────
  function SidebarInner() {
    return (
      <>
        <div style={{padding:"0 18px 20px"}}>
          <div style={{fontSize:"20px",fontWeight:700,letterSpacing:"-0.3px",color:C.text}}>
            <span style={{color:C.accent}}>Budget</span>ly
          </div>
          <div style={{fontSize:"10px",color:C.faint,marginTop:"1px"}}>by Armaan Gupta</div>
        </div>

        {/* User info */}
        <div style={{margin:"0 12px 16px",padding:"10px 12px",background:"#faf9f7",borderRadius:"10px",border:`1px solid ${C.border}`}}>
          {isGuest ? (
            <div style={{fontSize:"11px",color:C.muted}}>👤 Guest mode · <button onClick={()=>setUser(null)} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:"11px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,padding:0}}>Sign in</button></div>
          ) : (
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:"11px",color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"130px"}}>{user.email}</div>
              <button onClick={logout} style={{background:"none",border:"none",color:C.faint,cursor:"pointer",fontSize:"11px",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}
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
          <button onClick={addNextMonth}
            style={{width:"100%",marginTop:"7px",padding:"6px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"transparent",color:C.accent,cursor:"pointer",fontSize:"11px",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
            + New Month
          </button>
        </div>

        {/* Balance pill */}
        <div style={{margin:"0 12px 16px",background:remaining>=0?"#edfaf5":"#fdecea",borderRadius:"10px",padding:"12px 14px",border:`1px solid ${remaining>=0?"#b2ead0":"#f5c0b8"}`}}>
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
        <div style={{margin:"12px 12px 10px",padding:"11px",background:"#faf9f7",borderRadius:"10px",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:"9px",color:C.faint,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"6px"}}>Upcoming Features</div>
          {["Dark mode","Import from Excel"].map(f=>(
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
            style={{display:"block",textAlign:"center",padding:"7px",borderRadius:"8px",background:"#ede9f8",color:C.accent,fontSize:"12px",fontWeight:600,textDecoration:"none",marginBottom:"7px"}}>
            💬 Give Feedback
          </a>

          {/* Delete month */}
          {deleteMonthConfirm ? (
            <div style={{marginBottom:"7px"}}>
              <div style={{fontSize:"11px",color:C.text,marginBottom:"6px",textAlign:"center"}}>Delete {fmtMK(activeMK)}?</div>
              <div style={{display:"flex",gap:"6px"}}>
                <button onClick={deleteMonth} style={{flex:1,padding:"6px",borderRadius:"7px",border:"none",background:"#fde8e4",color:C.red,cursor:"pointer",fontSize:"11px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Yes, delete</button>
                <button onClick={()=>setDeleteMonthConfirm(false)} style={{flex:1,padding:"6px",borderRadius:"7px",border:"none",background:"#f0ede8",color:C.muted,cursor:"pointer",fontSize:"11px",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setDeleteMonthConfirm(true)}
              style={{width:"100%",padding:"6px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"transparent",color:C.faint,cursor:"pointer",fontSize:"10px",fontFamily:"'DM Sans',sans-serif",marginBottom:"6px"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.red;(e.currentTarget as HTMLButtonElement).style.borderColor="#fca99b";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.faint;(e.currentTarget as HTMLButtonElement).style.borderColor=C.border;}}>
              🗑 Delete this month
            </button>
          )}
        </div>
      </>
    );
  }

  const ovProps: OvProps = { budget,cashFlowIn,cashFlowOut,totalEarnings,totalSavings,remaining,spentPct,editingBudget,tempBudget,setEditingBudget,setTempBudget,saveBudget,expenses,savings,categories,daysInMonth,todayDay,idealPerDay,idealSpentByToday,actualVsIdeal,moneyLeft,daysLeft,currentDailyAvg,currentIdealAvg };
  const exProps: ExProps = { expenses,categories,totalExpenses:cashFlowOut,expAmt,expCat,expDesc,expDate,setExpAmt,setExpCat,setExpDesc,setExpDate,addExpense,deleteConfirm,setDeleteConfirm,deleteExpense };
  const erProps: ErProps = { earnings,totalEarnings,earnAmt,earnDesc,earnDate,setEarnAmt,setEarnDesc,setEarnDate,addEarning,deleteConfirm,setDeleteConfirm,deleteEarning };
  const svProps: SvProps = { savings,totalSavings,cashFlowIn,savAmt,savDesc,savDate,setSavAmt,setSavDesc,setSavDate,addSaving,deleteConfirm,setDeleteConfirm,deleteSaving };
  const caProps: CaProps = { categories,expenses,cashFlowOut,newCategory,setNewCategory,addCategory,deleteCategory };

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
        @media(max-width:768px){
          .mob-header{display:flex!important;position:fixed;top:0;left:0;right:0;z-index:100;background:${C.card};border-bottom:1px solid ${C.border};padding:11px 15px;align-items:center;justify-content:space-between;}
          .desk-sidebar{display:none!important;}
          .mob-nav{display:flex!important;position:fixed;bottom:0;left:0;right:0;background:${C.card};border-top:1px solid ${C.border};z-index:50;padding:5px 0 max(8px,env(safe-area-inset-bottom));}
          .main-wrap{padding:64px 12px 72px!important;}
          .two-col-grid{grid-template-columns:1fr!important;}
        }
      `}</style>

      {showMigrate&&<MigrateModal onDecide={handleMigrate}/>}

      {/* Mobile header */}
      <div className="mob-header">
        <div style={{fontSize:"18px",fontWeight:700,color:C.text}}><span style={{color:C.accent}}>Budget</span>ly</div>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <span style={{fontSize:"13px",fontWeight:600,color:remaining>=0?C.green:C.red}}>{fmt(remaining)}</span>
          <button onClick={()=>setDrawerOpen(true)} style={{background:"none",border:`1px solid ${C.border}`,color:C.text,cursor:"pointer",borderRadius:"7px",padding:"5px 9px",fontSize:"14px"}}>☰</button>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex"}}>
          <div style={{width:"260px",background:C.card,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"24px 0",overflowY:"auto"}}>
            <SidebarInner/>
          </div>
          <div style={{flex:1,background:"rgba(0,0,0,0.2)"}} onClick={()=>setDrawerOpen(false)}/>
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

          {activeTab==="overview"   &&<OverviewTab    {...ovProps}/>}
          {activeTab==="expenses"   &&<ExpensesTab    {...exProps}/>}
          {activeTab==="earnings"   &&<EarningsTab    {...erProps}/>}
          {activeTab==="savings"    &&<SavingsTab     {...svProps}/>}
          {activeTab==="categories" &&<CategoriesTab  {...caProps}/>}
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
