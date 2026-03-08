"use client";

import { useState, useEffect, ReactNode, CSSProperties } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Entry    { id: number; amount: number; description: string; date: string; }
interface Expense extends Entry { category: string; }
interface MonthData { budget: number; expenses: Expense[]; earnings: Entry[]; savings: Entry[]; }
interface AllMonths { [monthKey: string]: MonthData; }

// ── localStorage ──────────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? (JSON.parse(r) as T) : fallback; }
  catch { return fallback; }
}
function save(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES: string[] = ["Food","Transport","College","Entertainment","Health","Shopping","Other"];
const CATEGORY_COLORS: string[]    = ["#F97316","#06B6D4","#8B5CF6","#10B981","#F43F5E","#FBBF24","#6366F1","#EC4899","#14B8A6","#84CC16","#EF4444","#3B82F6"];
const NAV_ITEMS = [
  { id: "overview",   label: "Overview",   icon: "◎" },
  { id: "expenses",   label: "Expenses",   icon: "↓" },
  { id: "earnings",   label: "Cash In",    icon: "↑" },
  { id: "savings",    label: "Savings",    icon: "⬡" },
  { id: "categories", label: "Categories", icon: "▦" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatINR  = (n: number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
const getDays    = (mk: string) => { const [y,m]=mk.split("-").map(Number); return new Date(y,m,0).getDate(); };
const todayStr   = () => new Date().toISOString().split("T")[0];
const currentMK  = () => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`; };
const fmtMK      = (mk: string) => { const [y,m]=mk.split("-"); return new Date(Number(y),Number(m)-1,1).toLocaleDateString("en-IN",{month:"long",year:"numeric"}); };
const emptyMonth = (): MonthData => ({ budget:10000, expenses:[], earnings:[], savings:[] });

// ── Style tokens (outside component — never re-created) ───────────────────────
const SI: CSSProperties = { width:"100%",padding:"10px 14px",borderRadius:"10px",border:"1.5px solid #222236",background:"#0d0d1a",color:"#e8e8f0",fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
const SBP: CSSProperties = { padding:"10px 20px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,#7c3aed,#4f46e5)",color:"#fff",fontWeight:700,fontSize:"14px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif" };
const SBG: CSSProperties = { ...SBP, background:"linear-gradient(135deg,#059669,#10b981)" };
const SBA: CSSProperties = { ...SBP, background:"linear-gradient(135deg,#b45309,#f59e0b)" };
const SC: CSSProperties  = { background:"#11111e",borderRadius:"16px",padding:"22px",border:"1px solid #1c1c2e" };
const SL: CSSProperties  = { display:"block",fontSize:"11px",color:"#5a5a7a",letterSpacing:"1.4px",textTransform:"uppercase",marginBottom:"7px" };
const ST: CSSProperties  = { fontSize:"11px",color:"#5a5a7a",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"14px" };

// ── Primitives outside main component (fixes typing/focus loss bug) ───────────
function FormField({ label, children }: { label: string; children: ReactNode }) {
  return <div style={{marginBottom:"14px"}}><label style={SL}>{label}</label>{children}</div>;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BudgetTracker() {
  const [activeTab,     setActiveTab]     = useState<string>("overview");
  const [activeMK,      setActiveMK]      = useState<string>(currentMK());
  const [allMonths,     setAllMonths]     = useState<AllMonths>(() => load<AllMonths>("budgetly_all_months", {}));
  const [categories,    setCategories]    = useState<string[]>(() => load<string[]>("budgetly_categories", DEFAULT_CATEGORIES));
  const [editingBudget, setEditingBudget] = useState<boolean>(false);
  const [tempBudget,    setTempBudget]    = useState<string>("10000");
  const [deleteConfirm, setDeleteConfirm] = useState<number|null>(null);
  const [newCategory,   setNewCategory]   = useState<string>("");
  const [sidebarOpen,   setSidebarOpen]   = useState<boolean>(false);

  // ── Form state lifted to top level — this is what fixes the typing bug ────
  // (Sub-components defined inside render would re-mount inputs on every keystroke)
  const today = todayStr();
  const [expAmt,   setExpAmt]   = useState("");
  const [expCat,   setExpCat]   = useState(DEFAULT_CATEGORIES[0]);
  const [expDesc,  setExpDesc]  = useState("");
  const [expDate,  setExpDate]  = useState(today);
  const [earnAmt,  setEarnAmt]  = useState("");
  const [earnDesc, setEarnDesc] = useState("");
  const [earnDate, setEarnDate] = useState(today);
  const [savAmt,   setSavAmt]   = useState("");
  const [savDesc,  setSavDesc]  = useState("");
  const [savDate,  setSavDate]  = useState(today);

  // ── Month helpers ─────────────────────────────────────────────────────────
  const getMonth = (mk: string): MonthData => allMonths[mk] ?? emptyMonth();
  const setMonth = (mk: string, data: MonthData) => setAllMonths(prev => ({ ...prev, [mk]: data }));

  const md       = getMonth(activeMK);
  const budget   = md.budget;
  const expenses = md.expenses;
  const earnings = md.earnings;
  const savings  = md.savings;

  // ── Persist ───────────────────────────────────────────────────────────────
  useEffect(() => { save("budgetly_all_months", allMonths); }, [allMonths]);
  useEffect(() => { save("budgetly_categories", categories); }, [categories]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const totalExpenses     = expenses.reduce((s,e)=>s+e.amount,0);
  const totalEarnings     = earnings.reduce((s,e)=>s+e.amount,0);
  const totalSavings      = savings.reduce ((s,e)=>s+e.amount,0);
  const cashFlowIn        = budget + totalEarnings;
  const cashFlowOut       = totalExpenses;
  const remaining         = cashFlowIn - cashFlowOut - totalSavings;
  const spentPercent      = cashFlowIn>0 ? Math.min((cashFlowOut/cashFlowIn)*100,100) : 0;
  const daysInMonth       = getDays(activeMK);
  const todayDay          = activeMK===currentMK() ? new Date().getDate() : daysInMonth;
  const idealPerDay       = Math.round(cashFlowIn/daysInMonth);
  const idealSpentByToday = idealPerDay * todayDay;
  const actualVsIdeal     = cashFlowOut - idealSpentByToday;
  const categoryTotals    = categories.map((cat,i)=>({
    name:cat, color:CATEGORY_COLORS[i%CATEGORY_COLORS.length],
    total:expenses.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0),
    count:expenses.filter(e=>e.category===cat).length,
  }));
  const allMKs = (() => {
    const keys = Object.keys(allMonths);
    if (!keys.includes(currentMK())) keys.push(currentMK());
    return keys.sort().reverse();
  })();

  // ── Actions ───────────────────────────────────────────────────────────────
  const setBudget     = (v: number) => setMonth(activeMK, { ...md, budget:v });
  const addExpense    = () => {
    if (!expAmt||isNaN(Number(expAmt))) return;
    setMonth(activeMK,{...md,expenses:[...expenses,{id:Date.now(),amount:parseFloat(expAmt),category:expCat,description:expDesc,date:expDate}]});
    setExpAmt(""); setExpDesc("");
  };
  const addEarning    = () => {
    if (!earnAmt||isNaN(Number(earnAmt))) return;
    setMonth(activeMK,{...md,earnings:[...earnings,{id:Date.now(),amount:parseFloat(earnAmt),description:earnDesc,date:earnDate}]});
    setEarnAmt(""); setEarnDesc("");
  };
  const addSaving     = () => {
    if (!savAmt||isNaN(Number(savAmt))) return;
    setMonth(activeMK,{...md,savings:[...savings,{id:Date.now(),amount:parseFloat(savAmt),description:savDesc,date:savDate}]});
    setSavAmt(""); setSavDesc("");
  };
  const deleteExpense  = (id:number) => { setMonth(activeMK,{...md,expenses:expenses.filter(e=>e.id!==id)}); setDeleteConfirm(null); };
  const deleteEarning  = (id:number) => { setMonth(activeMK,{...md,earnings:earnings.filter(e=>e.id!==id)}); setDeleteConfirm(null); };
  const deleteSaving   = (id:number) => { setMonth(activeMK,{...md,savings: savings.filter (e=>e.id!==id)}); setDeleteConfirm(null); };
  const addCategory    = () => { const t=newCategory.trim(); if(!t||categories.includes(t))return; setCategories([...categories,t]); setNewCategory(""); };
  const deleteCategory = (cat:string) => { if(DEFAULT_CATEGORIES.includes(cat))return; setCategories(categories.filter(c=>c!==cat)); };
  const saveBudget     = () => { const v=parseFloat(tempBudget); if(!isNaN(v)&&v>0)setBudget(v); setEditingBudget(false); };
  const clearMonth     = () => { if(!window.confirm(`Reset ALL data for ${fmtMK(activeMK)}?`))return; setMonth(activeMK,emptyMonth()); };
  const addNextMonth   = () => {
    const [y,m] = activeMK.split("-").map(Number);
    const nd = new Date(y, m, 1);
    const nk = `${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,"0")}`;
    if (!allMonths[nk]) setMonth(nk, emptyMonth());
    setActiveMK(nk);
  };

  // ── DeleteBtn (inline, not a sub-component to avoid re-mount) ────────────
  const DelBtn = ({ id, onDel }: { id:number; onDel:(id:number)=>void }) =>
    deleteConfirm===id ? (
      <div style={{display:"flex",gap:"6px"}}>
        <button onClick={()=>onDel(id)} style={{background:"#f43f5e22",border:"none",color:"#f43f5e",borderRadius:"8px",padding:"5px 10px",cursor:"pointer",fontSize:"12px",fontWeight:700}}>Del</button>
        <button onClick={()=>setDeleteConfirm(null)} style={{background:"#1e1e30",border:"none",color:"#5a5a7a",borderRadius:"8px",padding:"5px 10px",cursor:"pointer",fontSize:"12px"}}>No</button>
      </div>
    ) : (
      <button onClick={()=>setDeleteConfirm(id)}
        style={{background:"none",border:"1px solid #1e1e30",color:"#3a3a55",cursor:"pointer",fontSize:"12px",borderRadius:"8px",padding:"4px 9px"}}
        onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color="#f43f5e";(e.currentTarget as HTMLButtonElement).style.borderColor="#f43f5e44";}}
        onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color="#3a3a55";(e.currentTarget as HTMLButtonElement).style.borderColor="#1e1e30";}}>✕</button>
    );

  // ── Entry card (unified card style for expenses/earnings/savings lists) ───
  const EntryCard = ({ left, right }: { left: ReactNode; right: ReactNode }) => (
    <div style={{background:"#0d0d1a",borderRadius:"10px",padding:"12px 14px",border:"1px solid #1a1a2a",marginBottom:"6px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"10px"}}>
        <div style={{flex:1,minWidth:0}}>{left}</div>
        <div style={{display:"flex",alignItems:"center",gap:"10px",flexShrink:0}}>{right}</div>
      </div>
    </div>
  );

  // ── Sidebar content (shared between desktop sidebar and mobile drawer) ────
  const SidebarContent = () => (
    <>
      <div style={{padding:"0 20px 22px"}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:"22px",fontWeight:800,letterSpacing:"-0.5px"}}>
          <span style={{color:"#7c3aed"}}>Budget</span><span style={{color:"#e8e8f0"}}>ly</span>
        </div>
      </div>

      {/* Month selector */}
      <div style={{padding:"0 14px 18px"}}>
        <div style={{fontSize:"10px",color:"#5a5a7a",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"6px"}}>Active Month</div>
        <select value={activeMK} onChange={e=>setActiveMK(e.target.value)}
          style={{...SI,fontSize:"13px",appearance:"none",cursor:"pointer",padding:"9px 12px"}}>
          {allMKs.map(mk=><option key={mk} value={mk}>{fmtMK(mk)}</option>)}
        </select>
        <button onClick={addNextMonth}
          style={{width:"100%",marginTop:"8px",padding:"7px",borderRadius:"8px",border:"1px solid #2a2a3a",background:"transparent",color:"#7c3aed",cursor:"pointer",fontSize:"12px",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>
          + New Month
        </button>
      </div>

      {/* Balance */}
      <div style={{margin:"0 14px 20px",background:remaining>=0?"#10b98115":"#f43f5e15",borderRadius:"12px",padding:"12px 14px",border:`1px solid ${remaining>=0?"#10b98130":"#f43f5e30"}`}}>
        <div style={{fontSize:"10px",color:"#5a5a7a",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"4px"}}>Net Balance</div>
        <div style={{fontSize:"20px",fontWeight:800,color:remaining>=0?"#10b981":"#f43f5e",fontFamily:"'Syne',sans-serif"}}>{formatINR(remaining)}</div>
        <div style={{fontSize:"11px",color:"#5a5a7a",marginTop:"2px"}}>{fmtMK(activeMK)}</div>
      </div>

      {/* Nav */}
      <nav style={{flex:1,padding:"0 10px"}}>
        {NAV_ITEMS.map(item=>(
          <button key={item.id} onClick={()=>{setActiveTab(item.id);setSidebarOpen(false);}} style={{
            width:"100%",padding:"11px 14px",borderRadius:"10px",border:"none",
            background:activeTab===item.id?"linear-gradient(135deg,#7c3aed22,#4f46e522)":"transparent",
            color:activeTab===item.id?"#a78bfa":"#5a5a7a",
            fontWeight:activeTab===item.id?700:500,
            fontSize:"14px",cursor:"pointer",textAlign:"left",
            display:"flex",alignItems:"center",gap:"10px",
            marginBottom:"4px",fontFamily:"'DM Sans',sans-serif",
            borderLeft:activeTab===item.id?"2px solid #7c3aed":"2px solid transparent",
          }}>
            <span style={{fontSize:"16px",width:"20px",textAlign:"center"}}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{padding:"16px 20px 0",borderTop:"1px solid #14142a"}}>
        <div style={{fontSize:"11px",color:"#3a3a55",lineHeight:1.6,marginBottom:"10px"}}>Built for college students 🎓</div>
        <button onClick={clearMonth}
          style={{width:"100%",padding:"7px",borderRadius:"8px",border:"1px solid #2a1a1a",background:"transparent",color:"#3a2a2a",cursor:"pointer",fontSize:"11px",fontFamily:"'DM Sans',sans-serif"}}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#f43f5e44";(e.currentTarget as HTMLButtonElement).style.color="#f43f5e";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#2a1a1a";(e.currentTarget as HTMLButtonElement).style.color="#3a2a2a";}}>
          ↺ Reset this month
        </button>
      </div>
    </>
  );

  // ── Tab content ───────────────────────────────────────────────────────────
  const twoCol: CSSProperties = { display:"grid", gridTemplateColumns:"clamp(260px,30%,320px) 1fr", gap:"18px" };

  const OverviewTab = () => (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"12px",marginBottom:"14px"}}>
        {([
          {label:"Cash Flow In", value:formatINR(cashFlowIn),  color:"#10b981", sub:`Budget + ${formatINR(totalEarnings)} earned`},
          {label:"Cash Flow Out",value:formatINR(cashFlowOut), color:"#f43f5e", sub:`${expenses.length} expense${expenses.length!==1?"s":""}`},
          {label:"Total Savings",value:formatINR(totalSavings),color:"#f59e0b", sub:`${savings.length} entr${savings.length!==1?"ies":"y"}`},
          {label:"Net Balance",  value:formatINR(remaining),   color:remaining>=0?"#10b981":"#f43f5e", sub:remaining>=0?"On track 👍":"Over budget ⚠"},
        ] as {label:string;value:string;color:string;sub:string}[]).map(s=>(
          <div key={s.label} style={{...SC,borderLeft:`3px solid ${s.color}`,padding:"16px"}}>
            <div style={{fontSize:"10px",color:"#5a5a7a",letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"6px"}}>{s.label}</div>
            <div style={{fontSize:"clamp(16px,2.5vw,24px)",fontWeight:800,color:s.color,fontFamily:"'Syne',sans-serif",lineHeight:1.1}}>{s.value}</div>
            <div style={{fontSize:"11px",color:"#3a3a55",marginTop:"4px"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{...SC,marginBottom:"14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px",flexWrap:"wrap",gap:"10px"}}>
          <div>
            <div style={ST}>Monthly Budget</div>
            {editingBudget ? (
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                <input value={tempBudget} onChange={e=>setTempBudget(e.target.value)} style={{...SI,width:"130px"}} type="number"/>
                <button onClick={saveBudget} style={SBP}>Save</button>
                <button onClick={()=>setEditingBudget(false)} style={{...SBP,background:"#1e1e30"}}>✕</button>
              </div>
            ):(
              <div style={{display:"flex",alignItems:"baseline",gap:"10px"}}>
                <span style={{fontSize:"clamp(20px,3.5vw,30px)",fontWeight:800,fontFamily:"'Syne',sans-serif"}}>{formatINR(budget)}</span>
                <button onClick={()=>{setEditingBudget(true);setTempBudget(String(budget));}}
                  style={{background:"none",border:"1px solid #2a2a3a",color:"#7c3aed",cursor:"pointer",borderRadius:"8px",padding:"4px 10px",fontSize:"12px",fontWeight:600}}>Edit</button>
              </div>
            )}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={ST}>Spent</div>
            <div style={{fontSize:"clamp(20px,3.5vw,30px)",fontWeight:800,fontFamily:"'Syne',sans-serif",color:spentPercent>80?"#f43f5e":"#e8e8f0"}}>{spentPercent.toFixed(1)}%</div>
          </div>
        </div>
        <div style={{background:"#1a1a2e",borderRadius:"8px",height:"10px",overflow:"hidden",marginBottom:"8px"}}>
          <div style={{height:"100%",borderRadius:"8px",transition:"width 0.6s ease",background:spentPercent>80?"linear-gradient(90deg,#f43f5e,#ff6b6b)":"linear-gradient(90deg,#7c3aed,#4f46e5)",width:`${spentPercent}%`}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:"12px",color:"#5a5a7a"}}>Spent: {formatINR(cashFlowOut)}</span>
          <span style={{fontSize:"12px",color:"#5a5a7a"}}>of {formatINR(cashFlowIn)}</span>
        </div>
      </div>

      <div style={{...SC,marginBottom:"14px"}}>
        <div style={ST}>Daily Average</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",textAlign:"center",marginBottom:"12px"}}>
          {([
            {label:"Ideal / day", value:formatINR(idealPerDay),       color:"#7c3aed", sub:""},
            {label:`Day ${todayDay}/${daysInMonth}`, value:formatINR(idealSpentByToday), color:"#e8e8f0", sub:"ideal by now"},
            {label:"vs Ideal",    value:(actualVsIdeal>0?"+":"")+formatINR(actualVsIdeal), color:actualVsIdeal>0?"#f43f5e":"#10b981", sub:""},
          ] as {label:string;value:string;color:string;sub:string}[]).map((d,i)=>(
            <div key={i} style={{padding:"8px",borderLeft:i>0?"1px solid #1c1c2e":"none"}}>
              <div style={{fontSize:"10px",color:"#5a5a7a",marginBottom:"6px"}}>{d.label}</div>
              <div style={{fontSize:"clamp(13px,2vw,19px)",fontWeight:800,color:d.color,fontFamily:"'Syne',sans-serif"}}>{d.value}</div>
              {d.sub&&<div style={{fontSize:"10px",color:"#3a3a55",marginTop:"3px"}}>{d.sub}</div>}
            </div>
          ))}
        </div>
        <div style={{background:actualVsIdeal>0?"#f43f5e11":"#10b98111",borderRadius:"10px",padding:"10px 14px",textAlign:"center"}}>
          <span style={{fontSize:"12px",color:actualVsIdeal>0?"#f43f5e":"#10b981",fontWeight:600}}>
            {actualVsIdeal>0?`⚠ ${formatINR(actualVsIdeal)} over pace`:`✓ ${formatINR(Math.abs(actualVsIdeal))} under pace`}
          </span>
        </div>
      </div>

      {categoryTotals.filter(c=>c.total>0).length>0&&(
        <div style={SC}>
          <div style={ST}>Spending by Category</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"10px"}}>
            {categoryTotals.filter(c=>c.total>0).map(cat=>(
              <div key={cat.name} style={{background:"#0d0d1a",borderRadius:"12px",padding:"14px",border:`1px solid ${cat.color}22`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
                    <div style={{width:"8px",height:"8px",borderRadius:"50%",background:cat.color}}/>
                    <span style={{fontSize:"12px",fontWeight:600,color:"#c0c0d8"}}>{cat.name}</span>
                  </div>
                  <span style={{fontSize:"10px",color:"#5a5a7a"}}>{cat.count}</span>
                </div>
                <div style={{fontSize:"17px",fontWeight:800,color:cat.color,marginBottom:"6px"}}>{formatINR(cat.total)}</div>
                <div style={{background:"#1a1a2e",borderRadius:"6px",height:"4px"}}>
                  <div style={{height:"100%",borderRadius:"6px",background:cat.color,width:`${cashFlowOut>0?Math.min((cat.total/cashFlowOut)*100,100):0}%`}}/>
                </div>
                <div style={{fontSize:"10px",color:"#3a3a55",marginTop:"4px"}}>{cashFlowOut>0?((cat.total/cashFlowOut)*100).toFixed(1):0}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const ExpensesTab = () => (
    <div style={twoCol}>
      <div>
        <div style={SC}>
          <div style={{...ST,marginBottom:"16px"}}>Add Expense</div>
          <FormField label="Amount (₹) *"><input type="number" placeholder="0" value={expAmt} onChange={e=>setExpAmt(e.target.value)} style={SI}/></FormField>
          <FormField label="Category">
            <select value={expCat} onChange={e=>setExpCat(e.target.value)} style={{...SI,appearance:"none",cursor:"pointer"}}>
              {categories.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Description"><input type="text" placeholder="What did you spend on?" value={expDesc} onChange={e=>setExpDesc(e.target.value)} style={SI}/></FormField>
          <FormField label="Date"><input type="date" value={expDate} onChange={e=>setExpDate(e.target.value)} style={SI}/></FormField>
          <button onClick={addExpense} style={{...SBP,width:"100%",padding:"13px"}}>+ Add Expense</button>
        </div>
        <div style={{...SC,marginTop:"14px",textAlign:"center"}}>
          <div style={ST}>Total Expenses</div>
          <div style={{fontSize:"26px",fontWeight:800,color:"#f43f5e",fontFamily:"'Syne',sans-serif"}}>{formatINR(totalExpenses)}</div>
          <div style={{fontSize:"12px",color:"#3a3a55",marginTop:"4px"}}>{expenses.length} entries</div>
        </div>
      </div>
      <div style={SC}>
        <div style={ST}>All Expenses</div>
        {expenses.length===0&&<div style={{textAlign:"center",color:"#3a3a55",padding:"40px"}}>No expenses yet</div>}
        {[...expenses].reverse().map(exp=>{
          const ci=categories.indexOf(exp.category);
          const col=CATEGORY_COLORS[ci>=0?ci%CATEGORY_COLORS.length:0];
          return(
            <EntryCard key={exp.id}
              left={<>
                <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"4px",flexWrap:"wrap"}}>
                  <span style={{fontSize:"11px",padding:"2px 8px",borderRadius:"20px",background:col+"22",color:col,fontWeight:600}}>{exp.category}</span>
                  <span style={{fontSize:"11px",color:"#3a3a55"}}>{exp.date}</span>
                </div>
                <div style={{fontSize:"13px",color:"#c0c0d8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{exp.description||"—"}</div>
              </>}
              right={<><div style={{fontSize:"15px",fontWeight:800,color:"#f43f5e"}}>-{formatINR(exp.amount)}</div><DelBtn id={exp.id} onDel={deleteExpense}/></>}
            />
          );
        })}
      </div>
    </div>
  );

  const EarningsTab = () => (
    <div style={twoCol}>
      <div>
        <div style={SC}>
          <div style={{...ST,marginBottom:"16px"}}>Add Income</div>
          <FormField label="Amount (₹) *"><input type="number" placeholder="0" value={earnAmt} onChange={e=>setEarnAmt(e.target.value)} style={SI}/></FormField>
          <FormField label="Description"><input type="text" placeholder="Source of income" value={earnDesc} onChange={e=>setEarnDesc(e.target.value)} style={SI}/></FormField>
          <FormField label="Date"><input type="date" value={earnDate} onChange={e=>setEarnDate(e.target.value)} style={SI}/></FormField>
          <button onClick={addEarning} style={{...SBG,width:"100%",padding:"13px"}}>+ Add Income</button>
        </div>
        <div style={{...SC,marginTop:"14px",textAlign:"center"}}>
          <div style={ST}>Total Earnings</div>
          <div style={{fontSize:"26px",fontWeight:800,color:"#10b981",fontFamily:"'Syne',sans-serif"}}>{formatINR(totalEarnings)}</div>
          <div style={{fontSize:"12px",color:"#3a3a55",marginTop:"4px"}}>{earnings.length} entries</div>
        </div>
      </div>
      <div style={SC}>
        <div style={ST}>All Income</div>
        {earnings.length===0&&<div style={{textAlign:"center",color:"#3a3a55",padding:"40px"}}>No income yet</div>}
        {[...earnings].reverse().map(earn=>(
          <EntryCard key={earn.id}
            left={<><div style={{fontSize:"11px",color:"#3a3a55",marginBottom:"3px"}}>{earn.date}</div><div style={{fontSize:"13px",color:"#c0c0d8"}}>{earn.description||"Income"}</div></>}
            right={<><div style={{fontSize:"15px",fontWeight:800,color:"#10b981"}}>+{formatINR(earn.amount)}</div><DelBtn id={earn.id} onDel={deleteEarning}/></>}
          />
        ))}
      </div>
    </div>
  );

  const SavingsTab = () => (
    <div style={twoCol}>
      <div>
        <div style={SC}>
          <div style={{...ST,marginBottom:"16px"}}>Add Saving</div>
          <FormField label="Amount (₹) *"><input type="number" placeholder="0" value={savAmt} onChange={e=>setSavAmt(e.target.value)} style={SI}/></FormField>
          <FormField label="Description"><input type="text" placeholder="What are you saving for?" value={savDesc} onChange={e=>setSavDesc(e.target.value)} style={SI}/></FormField>
          <FormField label="Date"><input type="date" value={savDate} onChange={e=>setSavDate(e.target.value)} style={SI}/></FormField>
          <button onClick={addSaving} style={{...SBA,width:"100%",padding:"13px"}}>+ Add Saving</button>
        </div>
        <div style={{...SC,marginTop:"14px",textAlign:"center",background:"linear-gradient(135deg,#1a1008,#11111e)",border:"1px solid #2a1f08"}}>
          <div style={ST}>Total Saved</div>
          <div style={{fontSize:"26px",fontWeight:800,color:"#f59e0b",fontFamily:"'Syne',sans-serif"}}>{formatINR(totalSavings)}</div>
          <div style={{fontSize:"12px",color:"#3a3a55",marginTop:"4px"}}>{cashFlowIn>0?((totalSavings/cashFlowIn)*100).toFixed(1):0}% of cash flow in</div>
        </div>
      </div>
      <div style={SC}>
        <div style={ST}>All Savings</div>
        {savings.length===0&&<div style={{textAlign:"center",color:"#3a3a55",padding:"40px"}}>No savings yet</div>}
        {[...savings].reverse().map(sav=>(
          <EntryCard key={sav.id}
            left={<><div style={{fontSize:"11px",color:"#3a3a55",marginBottom:"3px"}}>{sav.date}</div><div style={{fontSize:"13px",color:"#c0c0d8"}}>{sav.description||"Savings"}</div></>}
            right={<><div style={{fontSize:"15px",fontWeight:800,color:"#f59e0b"}}>{formatINR(sav.amount)}</div><DelBtn id={sav.id} onDel={deleteSaving}/></>}
          />
        ))}
      </div>
    </div>
  );

  const CategoriesTab = () => (
    <div style={twoCol}>
      <div style={SC}>
        <div style={{...ST,marginBottom:"16px"}}>Add Category</div>
        <FormField label="Category Name">
          <input type="text" placeholder="e.g. Rent, Subscriptions…" value={newCategory}
            onChange={e=>setNewCategory(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCategory()} style={SI}/>
        </FormField>
        <button onClick={addCategory} style={{...SBP,width:"100%",padding:"13px"}}>+ Add Category</button>
        <p style={{fontSize:"12px",color:"#3a3a55",marginTop:"12px",lineHeight:1.6}}>Default categories cannot be deleted.</p>
      </div>
      <div style={SC}>
        <div style={ST}>{categories.length} Categories</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"10px"}}>
          {categories.map((cat,i)=>{
            const total=expenses.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0);
            const count=expenses.filter(e=>e.category===cat).length;
            const color=CATEGORY_COLORS[i%CATEGORY_COLORS.length];
            const isDef=DEFAULT_CATEGORIES.includes(cat);
            return(
              <div key={cat} style={{background:"#0d0d1a",borderRadius:"12px",padding:"14px",border:`1px solid ${color}22`}}>
                <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"8px"}}>
                  <div style={{width:"8px",height:"8px",borderRadius:"50%",background:color,flexShrink:0}}/>
                  <span style={{fontSize:"13px",fontWeight:700,color:"#e8e8f0",flex:1}}>{cat}</span>
                  {!isDef&&<button onClick={()=>deleteCategory(cat)} style={{background:"none",border:"none",color:"#3a3a55",cursor:"pointer",fontSize:"12px"}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color="#f43f5e";}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color="#3a3a55";}}>✕</button>}
                </div>
                <div style={{fontSize:"18px",fontWeight:800,color:total>0?color:"#2a2a3a",marginBottom:"4px"}}>{formatINR(total)}</div>
                <div style={{fontSize:"11px",color:"#3a3a55"}}>{count} expense{count!==1?"s":""}{isDef&&<span style={{marginLeft:"5px",color:"#2a2a3a"}}>· default</span>}</div>
                {cashFlowOut>0&&total>0&&<>
                  <div style={{background:"#1a1a2e",borderRadius:"6px",height:"4px",marginTop:"8px"}}>
                    <div style={{height:"100%",borderRadius:"6px",background:color,width:`${Math.min((total/cashFlowOut)*100,100)}%`}}/>
                  </div>
                  <div style={{fontSize:"10px",color:"#3a3a55",marginTop:"3px"}}>{((total/cashFlowOut)*100).toFixed(1)}%</div>
                </>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box;}
        body{margin:0;background:#09090f;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        /* Mobile overrides */
        @media(max-width:768px){
          .layout{flex-direction:column!important;}
          .desktop-sidebar{display:none!important;}
          .mobile-header{display:flex!important;}
          .mobile-bottom-nav{display:flex!important;}
          .main-content{padding:72px 14px 80px!important;}
          .two-col-grid{grid-template-columns:1fr!important;}
        }
        @media(min-width:769px){
          .mobile-header{display:none!important;}
          .mobile-bottom-nav{display:none!important;}
          .mobile-overlay{display:none!important;}
        }
        .mobile-header{display:none;position:fixed;top:0;left:0;right:0;z-index:100;background:#0b0b18;border-bottom:1px solid #14142a;padding:12px 16px;align-items:center;justify-content:space-between;}
        .mobile-bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:#0b0b18;border-top:1px solid #14142a;z-index:50;padding:6px 0 max(10px,env(safe-area-inset-bottom));}
      `}</style>

      {/* Mobile header */}
      <div className="mobile-header">
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:"20px",fontWeight:800}}>
          <span style={{color:"#7c3aed"}}>Budget</span><span style={{color:"#e8e8f0"}}>ly</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <span style={{fontSize:"14px",fontWeight:700,color:remaining>=0?"#10b981":"#f43f5e"}}>{formatINR(remaining)}</span>
          <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"1px solid #2a2a3a",color:"#e8e8f0",cursor:"pointer",borderRadius:"8px",padding:"6px 10px",fontSize:"15px"}}>☰</button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen&&(
        <div className="mobile-overlay" style={{position:"fixed",inset:0,zIndex:200,display:"flex"}}>
          <div style={{width:"260px",background:"#0b0b18",borderRight:"1px solid #14142a",display:"flex",flexDirection:"column",padding:"28px 0",overflowY:"auto"}}>
            <SidebarContent/>
          </div>
          <div style={{flex:1,background:"rgba(0,0,0,0.6)"}} onClick={()=>setSidebarOpen(false)}/>
        </div>
      )}

      <div className="layout" style={{minHeight:"100vh",background:"#09090f",color:"#e8e8f0",fontFamily:"'DM Sans',sans-serif",display:"flex"}}>

        {/* Desktop sidebar */}
        <aside className="desktop-sidebar" style={{width:"220px",minHeight:"100vh",background:"#0b0b18",borderRight:"1px solid #14142a",display:"flex",flexDirection:"column",padding:"28px 0",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
          <SidebarContent/>
        </aside>

        {/* Main content */}
        <main className="main-content" style={{flex:1,padding:"32px 36px",overflowY:"auto"}}>
          <div style={{marginBottom:"20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"10px"}}>
            <div>
              <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(20px,4vw,28px)",fontWeight:800,margin:0,letterSpacing:"-0.5px"}}>
                {NAV_ITEMS.find(n=>n.id===activeTab)?.label}
              </h1>
              <div style={{fontSize:"12px",color:"#5a5a7a",marginTop:"4px"}}>
                {fmtMK(activeMK)}{activeMK!==currentMK()&&" · viewing past month"}
              </div>
            </div>
            <div style={{fontSize:"12px",color:"#3a3a55",textAlign:"right"}}>
              Day {todayDay} of {daysInMonth}<br/>
              <span style={{color:"#5a5a7a"}}>{new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}</span>
            </div>
          </div>

          <div className="two-col-grid">
            {activeTab==="overview"   &&<OverviewTab/>}
            {activeTab==="expenses"   &&<ExpensesTab/>}
            {activeTab==="earnings"   &&<EarningsTab/>}
            {activeTab==="savings"    &&<SavingsTab/>}
            {activeTab==="categories" &&<CategoriesTab/>}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-bottom-nav">
        {NAV_ITEMS.map(item=>(
          <button key={item.id} onClick={()=>setActiveTab(item.id)} style={{flex:1,padding:"6px 4px",border:"none",background:"transparent",color:activeTab===item.id?"#a78bfa":"#5a5a7a",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",fontFamily:"'DM Sans',sans-serif"}}>
            <span style={{fontSize:"18px"}}>{item.icon}</span>
            <span style={{fontSize:"9px",fontWeight:activeTab===item.id?700:400}}>{item.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
