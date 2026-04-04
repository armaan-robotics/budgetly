"use client";

import { useState, useEffect, useCallback, ReactNode, CSSProperties } from "react";
import { createClient, User } from "@supabase/supabase-js";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface Entry    { id: number; amount: number; description: string; date: string; mode?: string; account?: string; }
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
const DEFAULT_HOUSEHOLD_CATS: string[] = ["Groceries","Electricity","Water","Gas","Rent","Internet","Transport","Medical","School Fees","Dining Out","Shopping","Maintenance","Salaries","Kitchen","Bills","Other"];
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
    bg:             "#141418",
    sidebar:        "#1a1a20",
    card:           "#202028",
    cardAlt:        "#18181e",
    border:         "#2e2e38",
    text:           "#e4e4ec",
    muted:          "#ffffff",
    faint:          "#cccccc",
    accent:         "#8878d0",
    green:          "#4db888",
    red:            "#c86868",
    amber:          "#c89840",
    inputBg:        "#16161c",
    progressTrack:  "#282830",
    navActive:      "#222230",
    pillGreen:      "#102018",
    pillGreenBorder:"#203828",
    pillRed:        "#221010",
    pillRedBorder:  "#3c1c1c",
    delBg:          "#221010",
    cancelBg:       "#1e1e28",
    upcomingBg:     "#16161c",
  } : {
    bg:             "#f0eff8",
    sidebar:        "#faf9ff",
    card:           "#ffffff",
    cardAlt:        "#f5f4fc",
    border:         "#e0def4",
    text:           "#1c1b2e",
    muted:          "#000000",
    faint:          "#333333",
    accent:         "#7c6ee0",
    green:          "#3aaa80",
    red:            "#e06060",
    amber:          "#d4900a",
    inputBg:        "#f5f4fc",
    progressTrack:  "#e8e6f6",
    navActive:      "#eceaff",
    pillGreen:      "#e8f8f2",
    pillGreenBorder:"#a8dcc8",
    pillRed:        "#fce8e8",
    pillRedBorder:  "#f0b4b4",
    delBg:          "#fce8e8",
    cancelBg:       "#eceaff",
    upcomingBg:     "#f5f4fc",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt     = (n: number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
const todayS  = () => new Date().toISOString().split("T")[0];
const curMK   = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const modeMK  = (mk:string, mode:AppMode|null) => mode==="household" ? `h:${mk}` : mk;
const stripMK = (mk:string) => mk.startsWith("h:") ? mk.slice(2) : mk;
const fmtMK   = (mk:string) => { const clean=mk.startsWith("h:")?mk.slice(2):mk; const [y,m]=clean.split("-"); return new Date(+y,+m-1,1).toLocaleDateString("en-IN",{month:"long",year:"numeric"}); };
const getDays = (mk:string) => { const clean=mk.startsWith("h:")?mk.slice(2):mk; const [y,m]=clean.split("-").map(Number); return new Date(y,m,0).getDate(); };
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
  expenses:Expense[]; earnings:Entry[]; savings:Entry[]; categories:string[]; accounts:string[]; appMode:AppMode;
  daysInMonth:number; todayDay:number; idealPerDay:number;
  idealSpentByToday:number; actualVsIdeal:number;
  moneyLeft:number; daysLeft:number; currentDailyAvg:number; currentIdealAvg:number;
}
interface ExProps { C:Theme; expenses:Expense[];categories:string[];accounts:string[];appMode:AppMode;totalExpenses:number;expAmt:string;expCat:string;expDesc:string;expDate:string;expMode:string;expAcc:string;setExpAmt:(v:string)=>void;setExpCat:(v:string)=>void;setExpDesc:(v:string)=>void;setExpDate:(v:string)=>void;setExpMode:(v:string)=>void;setExpAcc:(v:string)=>void;addExpense:()=>void;deleteConfirm:number|null;setDeleteConfirm:(v:number|null)=>void;deleteExpense:(id:number)=>void;deleteManyExpenses:(ids:number[])=>void;updateExpense:(id:number,u:Partial<Expense>)=>void; }
interface ErProps { C:Theme; earnings:Entry[];accounts:string[];appMode:AppMode;totalEarnings:number;earnAmt:string;earnDesc:string;earnDate:string;earnMode:string;earnAcc:string;setEarnAmt:(v:string)=>void;setEarnDesc:(v:string)=>void;setEarnDate:(v:string)=>void;setEarnMode:(v:string)=>void;setEarnAcc:(v:string)=>void;addEarning:()=>void;deleteConfirm:number|null;setDeleteConfirm:(v:number|null)=>void;deleteEarning:(id:number)=>void;deleteManyEarnings:(ids:number[])=>void;updateEarning:(id:number,u:Partial<Entry>)=>void; }
interface SvProps { C:Theme; savings:Entry[];accounts:string[];appMode:AppMode;totalSavings:number;cashFlowIn:number;savAmt:string;savDesc:string;savDate:string;savMode:string;savAcc:string;setSavAmt:(v:string)=>void;setSavDesc:(v:string)=>void;setSavDate:(v:string)=>void;setSavMode:(v:string)=>void;setSavAcc:(v:string)=>void;addSaving:()=>void;deleteConfirm:number|null;setDeleteConfirm:(v:number|null)=>void;deleteSaving:(id:number)=>void;deleteManySavings:(ids:number[])=>void;updateSaving:(id:number,u:Partial<Entry>)=>void; }
interface CaProps { C:Theme; categories:string[];expenses:Expense[];cashFlowOut:number;newCategory:string;setNewCategory:(v:string)=>void;addCategory:()=>void;deleteCategory:(cat:string)=>void; }
interface CreditEntry { id:number; person:string; amount:number; description:string; date:string; type:"owed_to_me"|"i_owe"; cleared:boolean; }
interface CrProps { C:Theme; credits:CreditEntry[];crAmt:string;crPerson:string;crDesc:string;crDate:string;crType:"owed_to_me"|"i_owe";setCrAmt:(v:string)=>void;setCrPerson:(v:string)=>void;setCrDesc:(v:string)=>void;setCrDate:(v:string)=>void;setCrType:(v:"owed_to_me"|"i_owe")=>void;addCredit:()=>void;toggleCleared:(id:number)=>void;deleteCredit:(id:number)=>void;updateCredit:(id:number,u:Partial<CreditEntry>)=>void;deleteConfirm:number|null;setDeleteConfirm:(v:number|null)=>void; }
interface TrProps { C:Theme; allMonths:AllMonths; activeMK:string; categories:string[]; appMode:AppMode; }

// ─── Primitives (module-level) ────────────────────────────────────────────────
function FF({ label, children, C }: { label:string; children:ReactNode; C:Theme }) {
  return (
    <div style={{marginBottom:"18px"}}>
      <label style={{display:"block",fontSize:"11px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"8px",fontWeight:600}}>{label}</label>
      {children}
    </div>
  );
}

function EntryRow({ left, right, C }: { left:ReactNode; right:ReactNode; C:Theme }) {
  return (
    <div style={{background:C.cardAlt,borderRadius:"10px",padding:"14px 16px",border:`1px solid ${C.border}`,marginBottom:"8px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"10px"}}>
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
      <div style={{background:C.card,borderRadius:"16px",padding:"32px",width:"100%",maxWidth:"420px",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:"16px",fontWeight:600,color:C.text,marginBottom:"18px"}}>{title}</div>
        {fields.map((f,i) => (
          <div key={i} style={{marginBottom:"18px"}}>
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
    </div>
  );
}

// ─── Entry List Sub-components (with edit) ───────────────────────────────────
// ─── Tab components (module-level — stable references, no typing bug) ─────────
function OverviewTab(p: OvProps) {
  const { C } = p;
  const sCard: CSSProperties = { background:C.card,borderRadius:"16px",padding:"32px",border:`1px solid ${C.border}` };
  const sSecT: CSSProperties = { fontSize:"11px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"16px",fontWeight:800 };
  const catTotals = p.categories.map((cat,i)=>({
    name:cat,color:CAT_COLORS[i%CAT_COLORS.length],
    total:p.expenses.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0),
    count:p.expenses.filter(e=>e.category===cat).length,
  })).filter(c=>c.total>0);
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"14px",marginBottom:"18px"}}>
        {(()=>{
          const studentCards = [
            {label:"Cash Flow In", val:fmt(p.cashFlowIn),  color:C.green,  sub:""},
            {label:"Cash Flow Out",val:fmt(p.cashFlowOut), color:C.red,    sub:""},
            {label:"Total Savings",val:fmt(p.totalSavings),color:C.amber,  sub:""},
            {label:"To Spend",     val:fmt(p.remaining),   color:p.remaining>=0?C.green:C.red, sub:p.remaining>=0?"On track":"Over budget ⚠"},
          ];
          const householdCards = [
            {label:"Cash Flow In", val:fmt(p.cashFlowIn),  color:C.green, sub:""},
            {label:"Cash Flow Out",val:fmt(p.cashFlowOut), color:C.red,   sub:""},
            {label:"Total Savings",val:fmt(p.totalSavings),color:C.amber, sub:""},
            {label:"Net",          val:fmt(p.cashFlowIn-p.cashFlowOut), color:(p.cashFlowIn-p.cashFlowOut)>=0?C.green:C.red, sub:(p.cashFlowIn-p.cashFlowOut)>=0?"Surplus":"Deficit"},
          ];
          const cards = p.appMode==="household" ? householdCards : studentCards;
          return cards.map(s=>(
            <div key={s.label} style={{...sCard,borderTop:`3px solid ${s.color}`,padding:"20px"}}>
              <div style={{fontSize:"11px",color:C.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px",fontWeight:700}}>{s.label}</div>
              <div style={{fontSize:"clamp(20px,3vw,28px)",fontWeight:800,color:s.color}}>{s.val}</div>
              {s.sub&&<div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{s.sub}</div>}
            </div>
          ));
        })()}
      </div>

      {p.appMode==="student"&&<div style={{...sCard,marginBottom:"18px"}}>
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
                <span style={{fontSize:"clamp(22px,3vw,30px)",fontWeight:800,color:C.text}}>{fmt(p.budget)}</span>
                <button onClick={()=>{p.setEditingBudget(true);p.setTempBudget(String(p.budget));}}
                  style={{...btnB,background:C.navActive,color:C.accent,padding:"3px 10px",fontSize:"12px"}}>Edit</button>
              </div>
            )}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={sSecT}>Spent</div>
            <div style={{fontSize:"clamp(22px,3vw,30px)",fontWeight:800,color:p.spentPct>80?C.red:C.text}}>{p.spentPct.toFixed(1)}%</div>
          </div>
        </div>
        <div style={{background:C.progressTrack,borderRadius:"8px",height:"8px",overflow:"hidden",marginBottom:"7px"}}>
          <div style={{height:"100%",borderRadius:"8px",background:p.spentPct>80?C.red:C.accent,width:`${p.spentPct}%`,transition:"width 0.5s ease"}}/>
        </div>

      </div>}

      {p.appMode==="student"&&<div style={{...sCard,marginBottom:"18px"}}>
        <div style={sSecT}>Daily Averages</div>
        <div style={{display:"flex",flexWrap:"nowrap"}}>
          {([
            {label:"Ideal monthly avg",  val:fmt(p.idealPerDay),     color:C.accent, note:""},
            {label:"Daily avg to spend", val:fmt(p.currentIdealAvg), color:p.currentIdealAvg<p.idealPerDay?C.green:C.red, note:""},
            {label:"Spent per day",      val:fmt(p.currentDailyAvg), color:C.muted,  note:""},
          ] as {label:string;val:string;color:string;note:string}[]).map((d,i)=>(
            <div key={i} style={{flex:1,minWidth:0,padding:"8px 4px",borderLeft:i>0?`1px solid ${C.border}`:"none",textAlign:"center"}}>
              <div style={{fontSize:"8px",color:C.muted,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"5px",lineHeight:1.3}}>{d.label}</div>
              <div style={{fontSize:"clamp(13px,3.5vw,22px)",fontWeight:800,color:d.color}}>{d.val}</div>
              <div style={{fontSize:"8px",color:C.muted,marginTop:"3px",lineHeight:1.3}}>{d.note}</div>
            </div>
          ))}
        </div>

      </div>}

      {catTotals.length>0&&(
        <div style={{...sCard,marginBottom:"18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
            <div style={sSecT}>Spending by Category</div>
            <div style={{fontSize:"12px",color:C.muted,fontWeight:600}}>{fmt(p.cashFlowOut)} total</div>
          </div>
          <div style={{display:"flex",gap:"32px",alignItems:"center",flexWrap:"wrap"}}>
            {(()=>{
              const total = p.cashFlowOut;
              if(total===0) return <div style={{fontSize:"13px",color:C.faint,padding:"20px"}}>No expenses yet</div>;
              const size=180, cx=90, cy=90, r=82, innerR=42;
              let startAngle = -Math.PI/2;
              const slices = catTotals.map(cat=>{
                const pct=cat.total/total;
                const angle=pct*2*Math.PI;
                const endAngle=startAngle+angle;
                const x1=cx+r*Math.cos(startAngle), y1=cy+r*Math.sin(startAngle);
                const x2=cx+r*Math.cos(endAngle),   y2=cy+r*Math.sin(endAngle);
                const ix1=cx+innerR*Math.cos(startAngle), iy1=cy+innerR*Math.sin(startAngle);
                const ix2=cx+innerR*Math.cos(endAngle),   iy2=cy+innerR*Math.sin(endAngle);
                const largeArc=angle>Math.PI?1:0;
                const path=`M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
                startAngle=endAngle;
                return {...cat,path,pct};
              });
              return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flexShrink:0,filter:"drop-shadow(0 2px 12px rgba(0,0,0,0.10))"}}>
                  {slices.map((s,i)=>(
                    <path key={i} d={s.path} fill={s.color} stroke={C.card} strokeWidth="2.5">
                      <title>{s.name}: {fmt(s.total)} ({(s.pct*100).toFixed(1)}%)</title>
                    </path>
                  ))}
                  <text x={cx} y={cy-7} textAnchor="middle" fontSize="10" fill={C.muted} fontFamily="DM Sans,sans-serif">{catTotals.length} categories</text>
                  <text x={cx} y={cy+10} textAnchor="middle" fontSize="14" fontWeight="800" fill={C.text} fontFamily="DM Sans,sans-serif">{fmt(total)}</text>
                </svg>
              );
            })()}
            <div style={{flex:1,minWidth:"160px",display:"flex",flexDirection:"column",gap:"12px"}}>
              {catTotals.map(cat=>{
                const pct=p.cashFlowOut>0?(cat.total/p.cashFlowOut*100):0;
                return (
                  <div key={cat.name} style={{display:"flex",alignItems:"center",gap:"10px"}}>
                    <div style={{width:"12px",height:"12px",borderRadius:"3px",background:cat.color,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                        <span style={{fontSize:"13px",fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cat.name}</span>
                        <span style={{fontSize:"13px",fontWeight:700,color:cat.color,marginLeft:"8px",flexShrink:0}}>{fmt(cat.total)}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"6px",marginTop:"3px"}}>
                        <div style={{flex:1,height:"4px",borderRadius:"4px",background:C.progressTrack,overflow:"hidden"}}>
                          <div style={{height:"100%",borderRadius:"4px",background:cat.color,width:`${pct}%`}}/>
                        </div>
                        <span style={{fontSize:"11px",color:C.muted,flexShrink:0}}>{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {p.appMode==="household"&&(()=>{
        const accTotals=p.accounts.map((acc,i)=>({
          name:acc,color:CAT_COLORS[i%CAT_COLORS.length],
          totalOut:p.expenses.filter(e=>e.account===acc).reduce((s,e)=>s+e.amount,0),
          count:p.expenses.filter(e=>e.account===acc).length,
        })).filter(a=>a.totalOut>0);
        if(accTotals.length===0)return null;
        return(
          <div style={{...sCard,marginBottom:"18px"}}>
            <div style={sSecT}>By Account</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"14px"}}>
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


// ─── Entry Table (sortable, clickable rows) ───────────────────────────────────
type SortKey = "date"|"amount"|"description"|"category"|"mode"|"account";
function EntryTable<T extends Entry>({entries, columns, accentColor, onEdit, onDelete, onDeleteMany, C}: {
  entries: T[];
  columns: {key: SortKey; label: string; render: (e:T)=>React.ReactNode; sortable?: boolean}[];
  accentColor: string;
  onEdit: (e:T)=>void;
  onDelete: (id:number)=>void;
  onDeleteMany: (ids:number[])=>void;
  C: Theme;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [expandId, setExpandId] = useState<number|null>(null);
  const [deleteId, setDeleteId] = useState<number|null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterAmtMin, setFilterAmtMin] = useState("");
  const [filterAmtMax, setFilterAmtMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const allCategories = [...new Set(entries.map(e=>(e as any).category).filter(Boolean))];

  const filtered = entries.filter(e=>{
    if(filterText && !e.description?.toLowerCase().includes(filterText.toLowerCase())) return false;
    if(filterFrom && e.date < filterFrom) return false;
    if(filterTo && e.date > filterTo) return false;
    if(filterCat && (e as any).category !== filterCat) return false;
    if(filterAmtMin && e.amount < parseFloat(filterAmtMin)) return false;
    if(filterAmtMax && e.amount > parseFloat(filterAmtMax)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a,b)=>{
    let av: any = (a as any)[sortKey]??"";
    let bv: any = (b as any)[sortKey]??"";
    if(sortKey==="amount"){av=+(av);bv=+(bv);}
    if(av<bv)return sortDir==="asc"?-1:1;
    if(av>bv)return sortDir==="asc"?1:-1;
    return 0;
  });

  const sInput: CSSProperties = {padding:"7px 11px",borderRadius:"8px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"13px",outline:"none",fontFamily:"'DM Sans',sans-serif"};
  const activeFilters = (filterText?1:0)+(filterFrom?1:0)+(filterTo?1:0)+(filterCat?1:0)+(filterAmtMin?1:0)+(filterAmtMax?1:0);

  const toggleSort = (key: SortKey) => {
    if(sortKey===key) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const thStyle: CSSProperties = {
    padding:"10px 12px", fontSize:"10px", color:C.muted, textTransform:"uppercase",
    letterSpacing:"1.2px", fontWeight:600, cursor:"pointer", userSelect:"none",
    borderBottom:`1px solid ${C.border}`, textAlign:"left", whiteSpace:"nowrap",
  };
  const tdStyle: CSSProperties = {
    padding:"12px 12px", fontSize:"13px", color:C.text, borderBottom:`1px solid ${C.border}`,
    verticalAlign:"middle",
  };

  return (
    <div>
      {/* Filter controls */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px",gap:"10px",flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
          <input placeholder="Search description…" value={filterText} onChange={e=>setFilterText(e.target.value)} style={{...sInput,width:"180px"}}/>
          <button onClick={()=>setShowFilters(v=>!v)} style={{...sInput,cursor:"pointer",background:showFilters||activeFilters>0?C.navActive:C.inputBg,color:activeFilters>0?accentColor:C.muted,whiteSpace:"nowrap"}}>
            ⚡ Filter{activeFilters>0?` (${activeFilters})`:""}
          </button>
          {activeFilters>0&&<button onClick={()=>{setFilterText("");setFilterFrom("");setFilterTo("");setFilterCat("");setFilterAmtMin("");setFilterAmtMax("");}} style={{...sInput,cursor:"pointer",background:C.delBg,color:C.red}}>✕ Clear</button>}
          <button onClick={()=>{setSelectMode(v=>!v);setSelectedIds(new Set());}} style={{...sInput,cursor:"pointer",background:selectMode?C.navActive:C.inputBg,color:selectMode?accentColor:C.muted,whiteSpace:"nowrap"}}>
            ☑ Select
          </button>
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          {selectMode&&selectedIds.size>0&&(
            <button onClick={()=>setBulkDeleteConfirm(true)} style={{...sInput,cursor:"pointer",background:C.delBg,color:C.red,whiteSpace:"nowrap"}}>
              ✕ Delete {selectedIds.size}
            </button>
          )}
          <div style={{fontSize:"12px",color:C.muted}}>{sorted.length} of {entries.length} entries</div>
        </div>
      </div>
      {showFilters&&(
        <div style={{display:"flex",gap:"10px",marginBottom:"10px",flexWrap:"wrap",background:C.cardAlt,padding:"16px",borderRadius:"12px",border:`1px solid ${C.border}`}}>
          <div><label style={{display:"block",fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>From</label>
          <input type="date" value={filterFrom} onChange={e=>setFilterFrom(e.target.value)} style={sInput}/></div>
          <div><label style={{display:"block",fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>To</label>
          <input type="date" value={filterTo} onChange={e=>setFilterTo(e.target.value)} style={sInput}/></div>
          {allCategories.length>0&&<div><label style={{display:"block",fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>Category</label>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer",minWidth:"120px"}}>
            <option value="">All</option>
            {allCategories.map(c=><option key={c} value={c}>{c}</option>)}
          </select></div>}
          <div><label style={{display:"block",fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>Min ₹</label>
          <input type="number" placeholder="0" value={filterAmtMin} onChange={e=>setFilterAmtMin(e.target.value)} style={{...sInput,width:"90px"}}/></div>
          <div><label style={{display:"block",fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>Max ₹</label>
          <input type="number" placeholder="∞" value={filterAmtMax} onChange={e=>setFilterAmtMax(e.target.value)} style={{...sInput,width:"90px"}}/></div>
        </div>
      )}
    <div style={{overflowX:"auto",maxWidth:"100%"}}>
      <table style={{width:"100%",tableLayout:"auto",borderCollapse:"collapse",fontFamily:"'DM Sans',sans-serif"}}>
        <thead>
          <tr style={{background:C.cardAlt}}>
            {selectMode&&<th style={{...thStyle,width:"36px",paddingRight:0}}>
              <input type="checkbox"
                checked={sorted.length>0&&sorted.every(e=>selectedIds.has(e.id))}
                onChange={e=>{
                  if(e.target.checked) setSelectedIds(new Set(sorted.map(e=>e.id)));
                  else setSelectedIds(new Set());
                }}
                onClick={ev=>ev.stopPropagation()}
                style={{cursor:"pointer",width:"14px",height:"14px",accentColor:accentColor}}
              />
            </th>}
            {columns.map(col=>(
              <th key={col.key} className={col.key==="date"||col.key==="mode"||col.key==="account"?"col-hide-mobile":""} style={thStyle} onClick={()=>col.sortable!==false&&toggleSort(col.key)}>
                {col.label}{sortKey===col.key?(sortDir==="asc"?" ↑":" ↓"):""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length===0&&(
            <tr><td colSpan={columns.length+(selectMode?1:0)} style={{...tdStyle,textAlign:"center",color:C.faint,padding:"32px"}}>No entries yet</td></tr>
          )}
          {sorted.map(entry=>(
            <>
              <tr key={entry.id} style={{cursor:"pointer",transition:"background 0.1s",background:selectedIds.has(entry.id)?accentColor+"18":""}}
                onClick={()=>setExpandId(expandId===entry.id?null:entry.id)}
                onMouseEnter={e=>{if(!selectedIds.has(entry.id))(e.currentTarget as HTMLTableRowElement).style.background=C.cardAlt;}}
                onMouseLeave={e=>{(e.currentTarget as HTMLTableRowElement).style.background=selectedIds.has(entry.id)?accentColor+"18":""}}>
                {selectMode&&<td style={{...tdStyle,width:"36px",paddingRight:0}} onClick={e=>e.stopPropagation()}>
                  <input type="checkbox"
                    checked={selectedIds.has(entry.id)}
                    onChange={e=>{
                      const next=new Set(selectedIds);
                      if(e.target.checked) next.add(entry.id); else next.delete(entry.id);
                      setSelectedIds(next);
                    }}
                    style={{cursor:"pointer",width:"14px",height:"14px",accentColor:accentColor}}
                  />
                </td>}
                {columns.map(col=>(
                  <td key={col.key} className={col.key==="date"||col.key==="mode"||col.key==="account"?"col-hide-mobile":""} style={tdStyle}>{col.render(entry)}</td>
                ))}
              </tr>
              {expandId===entry.id&&(
                <tr key={entry.id+"_exp"}>
                  <td colSpan={columns.length+(selectMode?1:0)} style={{background:C.cardAlt,padding:"16px 18px",borderBottom:`1px solid ${C.border}`}}>
                    <div style={{display:"flex",gap:"16px",flexWrap:"wrap",fontSize:"12px",color:C.muted,marginBottom:"8px"}}>
                      <span><strong style={{color:C.text}}>Date:</strong> {entry.date}</span>
                      <span><strong style={{color:C.text}}>Mode:</strong> {entry.mode||"—"}</span>
                      {(entry as any).category&&<span><strong style={{color:C.text}}>Category:</strong> {(entry as any).category}</span>}
                      {(entry as any).account&&<span><strong style={{color:C.text}}>Account:</strong> {(entry as any).account}</span>}
                      <span><strong style={{color:C.text}}>Description:</strong> {entry.description||"—"}</span>
                    </div>
                    <div className="row-expand-mobile" style={{display:"flex",gap:"6px"}}>
                      <button onClick={e=>{e.stopPropagation();onEdit(entry);setExpandId(null);}} style={{...btnB,background:C.navActive,color:C.accent,padding:"5px 12px",fontSize:"12px"}}>✎ Edit</button>
                      <button onClick={e=>{e.stopPropagation();setDeleteId(entry.id);setExpandId(null);}} style={{...btnB,background:C.delBg,color:C.red,padding:"5px 12px",fontSize:"12px"}}>✕ Delete</button>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
    {deleteId!==null&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setDeleteId(null)}>
        <div style={{background:C.card,borderRadius:"16px",padding:"24px",width:"280px",border:`1px solid ${C.border}`,boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:"15px",fontWeight:600,color:C.text,marginBottom:"8px"}}>Delete entry?</div>
          <div style={{fontSize:"13px",color:C.muted,marginBottom:"20px"}}>This cannot be undone.</div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>{onDelete(deleteId);setDeleteId(null);}} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:C.delBg,color:C.red,cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Delete</button>
            <button onClick={()=>setDeleteId(null)} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:C.cancelBg,color:C.muted,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
          </div>
        </div>
      </div>
    )}
    {bulkDeleteConfirm&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setBulkDeleteConfirm(false)}>
        <div style={{background:C.card,borderRadius:"16px",padding:"24px",width:"300px",border:`1px solid ${C.border}`,boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:"15px",fontWeight:600,color:C.text,marginBottom:"8px"}}>Delete {selectedIds.size} entries?</div>
          <div style={{fontSize:"13px",color:C.muted,marginBottom:"20px"}}>This cannot be undone.</div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>{onDeleteMany([...selectedIds]);setSelectedIds(new Set());setSelectMode(false);setBulkDeleteConfirm(false);}} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:C.delBg,color:C.red,cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Delete all</button>
            <button onClick={()=>setBulkDeleteConfirm(false)} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:C.cancelBg,color:C.muted,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

function ExpensesTab(p: ExProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"16px",padding:"32px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"11px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"16px",fontWeight:800 };
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
    {key:"amount" as SortKey, label:"Amount", render:(e:Expense)=><span style={{color:C.red,fontWeight:600}}>-{fmt(e.amount)}</span>},
  ];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px",flexWrap:"wrap",gap:"8px"}}>
        <div style={{...sCard,padding:"12px 16px",display:"inline-flex",gap:"16px",alignItems:"center"}}>
          <div><div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px"}}>Total</div>
          <div style={{fontSize:"22px",fontWeight:800,color:C.red}}>{fmt(p.totalExpenses)}</div></div>
          <div style={{width:"1px",height:"36px",background:C.border}}/>
          <div><div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px"}}>Entries</div>
          <div style={{fontSize:"22px",fontWeight:800,color:C.text}}>{p.expenses.length}</div></div>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} style={{...btnP,padding:"10px 18px",fontSize:"20px",lineHeight:1}}>+</button>
      </div>

      {showForm&&(
        <div style={{...sCard,marginBottom:"14px"}}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Expense</div>
          <div className="form-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"14px"}}>
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
        <EntryTable entries={p.expenses} columns={cols} accentColor={C.red} onEdit={openEdit} onDelete={p.deleteExpense} onDeleteMany={p.deleteManyExpenses} C={C}/>
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
  const sCard:  CSSProperties = { background:C.card,borderRadius:"16px",padding:"32px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"11px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"16px",fontWeight:800 };
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
    {key:"amount" as SortKey, label:"Amount", render:(e:Entry)=><span style={{color:C.green,fontWeight:600}}>+{fmt(e.amount)}</span>},
  ];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px",flexWrap:"wrap",gap:"8px"}}>
        <div style={{...sCard,padding:"12px 16px",display:"inline-flex",gap:"16px",alignItems:"center"}}>
          <div><div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px"}}>Total</div>
          <div style={{fontSize:"22px",fontWeight:800,color:C.green}}>{fmt(p.totalEarnings)}</div></div>
          <div style={{width:"1px",height:"36px",background:C.border}}/>
          <div><div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px"}}>Entries</div>
          <div style={{fontSize:"22px",fontWeight:800,color:C.text}}>{p.earnings.length}</div></div>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} style={{...btnG,padding:"10px 18px",fontSize:"20px",lineHeight:1}}>+</button>
      </div>

      {showForm&&(
        <div style={{...sCard,marginBottom:"14px"}}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Income</div>
          <div className="form-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"14px"}}>
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
        <EntryTable entries={p.earnings} columns={cols} accentColor={C.green} onEdit={openEdit} onDelete={p.deleteEarning} onDeleteMany={p.deleteManyEarnings} C={C}/>
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
  const sCard:  CSSProperties = { background:C.card,borderRadius:"16px",padding:"32px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"11px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"16px",fontWeight:800 };
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
    {key:"amount" as SortKey, label:"Amount", render:(e:Entry)=><span style={{color:C.amber,fontWeight:600}}>{fmt(e.amount)}</span>},
  ];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px",flexWrap:"wrap",gap:"8px"}}>
        <div style={{...sCard,padding:"12px 16px",display:"inline-flex",gap:"16px",alignItems:"center"}}>
          <div><div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px"}}>Total</div>
          <div style={{fontSize:"22px",fontWeight:800,color:C.amber}}>{fmt(p.totalSavings)}</div></div>
          <div style={{width:"1px",height:"36px",background:C.border}}/>
          <div><div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px"}}>Entries</div>
          <div style={{fontSize:"22px",fontWeight:800,color:C.text}}>{p.savings.length}</div></div>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} style={{...btnA,padding:"10px 18px",fontSize:"20px",lineHeight:1}}>+</button>
      </div>

      {showForm&&(
        <div style={{...sCard,marginBottom:"14px"}}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Saving</div>
          <div className="form-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"14px"}}>
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
        <EntryTable entries={p.savings} columns={cols} accentColor={C.amber} onEdit={openEdit} onDelete={p.deleteSaving} onDeleteMany={p.deleteManySavings} C={C}/>
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
  const sCard:  CSSProperties = { background:C.card,borderRadius:"16px",padding:"32px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"11px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"16px",fontWeight:800 };
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
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"14px"}}>
          {p.categories.map((cat,i)=>{
            const total=p.expenses.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0);
            const count=p.expenses.filter(e=>e.category===cat).length;
            const color=CAT_COLORS[i%CAT_COLORS.length]; const isDef=DEFAULT_CATS.includes(cat)||DEFAULT_HOUSEHOLD_CATS.includes(cat);
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
    const modeKey = p.appMode==="household" ? `h:${mk}` : mk;
    const monthData = p.allMonths[modeKey];
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"10px",marginBottom:"16px"}} className="two-col-grid">
        <div style={{...sCard,padding:"14px",borderTop:`3px solid ${C.red}`}}>
          <div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"5px"}}>Total Spent</div>
          <div style={{fontSize:"clamp(18px,2.5vw,24px)",fontWeight:800,color:C.red}}>{fmt(totalPeriod)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{view==="week"?"past 7 days":"past 30 days"}</div>
        </div>
        <div style={{...sCard,padding:"14px",borderTop:`3px solid ${C.amber}`}}>
          <div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"5px"}}>Daily Average</div>
          <div style={{fontSize:"clamp(18px,2.5vw,24px)",fontWeight:800,color:C.amber}}>{fmt(Math.round(avgPerDay))}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{activeDays} active day{activeDays!==1?"s":""}</div>
        </div>
        <div style={{...sCard,padding:"14px",borderTop:`3px solid ${C.accent}`}}>
          <div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"5px"}}>Highest Day</div>
          <div style={{fontSize:"clamp(18px,2.5vw,24px)",fontWeight:800,color:C.accent}}>{fmt(highestDay.total)}</div>
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
          <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
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
function TutorialTab({ C, appMode }: { C:Theme; appMode:AppMode }) {
  const sCard: CSSProperties = { background:C.card,borderRadius:"14px",padding:"18px 20px",border:`1px solid ${C.border}`,marginBottom:"10px" };
  const tag = (txt:string, color:string) => (
    <span style={{background:color+"22",color,fontSize:"11px",padding:"2px 8px",borderRadius:"20px",fontWeight:700,marginRight:"4px"}}>{txt}</span>
  );
  const row = (icon:string, title:string, desc:string, tags:React.ReactNode, tips:string[]) => (
    <div style={sCard}>
      <div style={{display:"flex",gap:"12px",alignItems:"flex-start",marginBottom:"10px"}}>
        <div style={{width:"38px",height:"38px",borderRadius:"10px",background:C.navActive,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",flexShrink:0}}>{icon}</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:"17px",color:C.text,marginBottom:"6px"}}>{title}</div>
          <div style={{fontSize:"13px",color:C.muted,lineHeight:1.6,marginBottom:"6px"}}>{desc}</div>
          <div>{tags}</div>
        </div>
      </div>
      {tips.length>0&&<div style={{borderTop:`1px solid ${C.border}`,paddingTop:"8px",display:"flex",flexDirection:"column",gap:"4px"}}>
        {tips.map((t,i)=><div key={i} style={{fontSize:"12px",color:C.muted,display:"flex",gap:"6px"}}><span style={{color:C.accent,flexShrink:0}}>→</span>{t}</div>)}
      </div>}
    </div>
  );
  return (
    <div style={{maxWidth:"680px"}}>
      <div style={{marginBottom:"16px"}}>
        <div style={{fontSize:"24px",fontWeight:800,color:C.text,marginBottom:"6px"}}>How to use Budgetly</div>
        <div style={{fontSize:"13px",color:C.muted}}>Quick guide · {appMode==="student"?"🎓 Student mode":"🏠 Household mode"}</div>
      </div>
      {row("◎","Overview","Your financial snapshot for the month.",
        <>{tag("Stats","#6c5ce7")}{tag("Trends","#00b894")}{appMode==="student"&&tag("Budget","#e0a800")}</>,
        appMode==="student"
          ? ["4 cards: Cash In, Cash Out, Savings, To Spend","Progress bar shows % of budget used","Daily Averages: ideal vs actual spend per day","Category cards show where money is going"]
          : ["Cash In = total income logged","Net = Income − Expenses","Account breakdown shows per-account spend","No budget limit — pure tracking"]
      )}
      {row("↓","Expenses","Log every payment you make.",
        <>{tag("Table","#e17055")}{tag("Sortable","#06b6d4")}{tag("Filterable","#8b5cf6")}</>,
        ["Tap + to open the add form","Click any row to see full details (mode, account)","Sort by any column header","Search or filter by date range using the filter bar","✎ to edit any entry"]
      )}
      {row("↑","Cash In","Record money you receive.",
        <>{tag("Income","#00b894")}{tag("Auto-UPI","#6c5ce7")}</>,
        ["Manual entry or auto-detected from UPI SMS (Android app)","Each entry has date, description, payment mode",appMode==="household"?"Tag to an account to track per-account income":"Adds to Cash Flow In on Overview"]
      )}
      {row("⬡","Savings","Lock away money you don't want to spend.",
        <>{tag("Savings","#e0a800")}</>,
        ["Savings are deducted from To Spend immediately","Add a savings entry at the start of the month as a commitment","View % of income saved on Overview"]
      )}
      {row("⇄","Credit","Track who owes who.",
        <>{tag("They Owe Me","#00b894")}{tag("I Owe","#e17055")}</>,
        ["Mark as Cleared when settled — auto-adds to Cash In or Expenses","Pending entries stay highlighted","Table view — sort, filter, edit same as other tabs"]
      )}
      {row("∿","Trends","See your spending patterns.",
        <>{tag("7 days","#6c5ce7")}{tag("30 days","#8b5cf6")}</>,
        ["Bar chart of daily spending","Switch between 7-day and 30-day view","Category breakdown shows % of spend per category","Today's bar is highlighted"]
      )}
      {row("⚙","Settings","Customise Budgetly.",
        <>{tag("Mode","#6c5ce7")}{tag("Categories","#e0a800")}{appMode==="household"&&tag("Accounts","#06b6d4")}</>,
        ["Switch between Student and Household mode anytime","Manage Categories — add or remove spending categories",appMode==="household"?"Manage Accounts — add bank accounts, wallets, cash":"Export month data as CSV spreadsheet","Dark mode toggle"]
      )}
    </div>
  );
}


// ─── Credit Tab ──────────────────────────────────────────────────────────────
function CreditTab(p: CrProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"16px",padding:"32px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"11px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"16px",fontWeight:800 };

  const owedToMe = p.credits.filter(c=>c.type==="owed_to_me");
  const iOwe     = p.credits.filter(c=>c.type==="i_owe");
  const totalOwedToMe = owedToMe.filter(c=>!c.cleared).reduce((s,c)=>s+c.amount,0);
  const totalIOwe     = iOwe.filter(c=>!c.cleared).reduce((s,c)=>s+c.amount,0);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<CreditEntry|null>(null);
  const [editPerson, setEditPerson] = useState("");
  const [editAmt, setEditAmt] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");

  const [sortKey, setSortKey] = useState<"date"|"amount"|"person">("date");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [filterText, setFilterText] = useState("");
  const [filterType, setFilterType] = useState<"all"|"owed_to_me"|"i_owe">("all");
  const [filterStatus, setFilterStatus] = useState<"all"|"pending"|"cleared">("all");
  const [expandId, setExpandId] = useState<number|null>(null);
  const [deleteId, setDeleteId] = useState<number|null>(null);

  const openEdit = (c: CreditEntry) => {
    setEditEntry(c); setEditPerson(c.person); setEditAmt(String(c.amount));
    setEditDesc(c.description); setEditDate(c.date);
  };

  const allCredits = [...p.credits]
    .filter(c => {
      if(filterType!=="all" && c.type!==filterType) return false;
      if(filterStatus==="pending" && c.cleared) return false;
      if(filterStatus==="cleared" && !c.cleared) return false;
      if(filterText && !c.person.toLowerCase().includes(filterText.toLowerCase()) && !c.description.toLowerCase().includes(filterText.toLowerCase())) return false;
      return true;
    })
    .sort((a,b)=>{
      let av:any=sortKey==="amount"?a.amount:sortKey==="person"?a.person:a.date;
      let bv:any=sortKey==="amount"?b.amount:sortKey==="person"?b.person:b.date;
      if(av<bv)return sortDir==="asc"?-1:1;
      if(av>bv)return sortDir==="asc"?1:-1;
      return 0;
    });

  const thS: CSSProperties = {padding:"8px 10px",fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1.2px",fontWeight:600,cursor:"pointer",userSelect:"none",borderBottom:`1px solid ${C.border}`,textAlign:"left",whiteSpace:"nowrap",background:C.cardAlt};
  const tdS: CSSProperties = {padding:"9px 10px",fontSize:"13px",color:C.text,borderBottom:`1px solid ${C.border}`,verticalAlign:"middle"};
  const sortH = (k:"date"|"amount"|"person") => { if(sortKey===k)setSortDir(d=>d==="asc"?"desc":"asc"); else{setSortKey(k);setSortDir("desc");} };

  return (
    <div>
      {/* Summary */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"22px"}}>
        <div style={{...sCard,borderTop:`3px solid ${C.green}`,padding:"14px"}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"5px"}}>People Owe Me</div>
          <div style={{fontSize:"clamp(20px,3vw,28px)",fontWeight:800,color:C.green}}>{fmt(totalOwedToMe)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{owedToMe.filter(c=>!c.cleared).length} pending</div>
        </div>
        <div style={{...sCard,borderTop:`3px solid ${C.red}`,padding:"14px"}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"5px"}}>I Owe</div>
          <div style={{fontSize:"clamp(20px,3vw,28px)",fontWeight:800,color:C.red}}>{fmt(totalIOwe)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{iOwe.filter(c=>!c.cleared).length} pending</div>
        </div>
      </div>

      {/* Add form */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px",flexWrap:"wrap",gap:"8px"}}>
        <div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
          <input placeholder="Search person or note…" value={filterText} onChange={e=>setFilterText(e.target.value)}
            style={{padding:"7px 11px",borderRadius:"8px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"13px",outline:"none",fontFamily:"'DM Sans',sans-serif",width:"180px"}}/>
          {(["all","owed_to_me","i_owe"] as const).map(t=>(
            <button key={t} onClick={()=>setFilterType(t)} style={{padding:"6px 12px",borderRadius:"20px",border:`1px solid ${filterType===t?C.accent:C.border}`,background:filterType===t?C.navActive:"transparent",color:filterType===t?C.accent:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
              {t==="all"?"All":t==="owed_to_me"?"They Owe Me":"I Owe"}
            </button>
          ))}
          {(["all","pending","cleared"] as const).map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)} style={{padding:"6px 12px",borderRadius:"20px",border:`1px solid ${filterStatus===s?C.accent:C.border}`,background:filterStatus===s?C.navActive:"transparent",color:filterStatus===s?C.accent:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
              {s==="all"?"All Status":s==="pending"?"Pending":"Cleared"}
            </button>
          ))}
        </div>
        <button onClick={()=>setShowForm(v=>!v)} style={{...{borderRadius:"9px",border:"none",fontWeight:700,fontSize:"20px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"8px 16px",lineHeight:1,transition:"opacity 0.15s"},background:"#6c5ce7",color:"#fff"}}>+</button>
      </div>

      {showForm&&(
        <div style={{...sCard,marginBottom:"14px"}}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Credit Entry</div>
          <div style={{display:"flex",gap:"6px",marginBottom:"14px"}}>
            <button onClick={()=>p.setCrType("owed_to_me")} style={{flex:1,padding:"8px",borderRadius:"8px",border:`1.5px solid ${p.crType==="owed_to_me"?C.green:C.border}`,background:p.crType==="owed_to_me"?C.green+"18":"transparent",color:p.crType==="owed_to_me"?C.green:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>They Owe Me</button>
            <button onClick={()=>p.setCrType("i_owe")} style={{flex:1,padding:"8px",borderRadius:"8px",border:`1.5px solid ${p.crType==="i_owe"?C.red:C.border}`,background:p.crType==="i_owe"?C.red+"18":"transparent",color:p.crType==="i_owe"?C.red:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>I Owe Them</button>
          </div>
          <div className="form-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"14px"}}>
            <FF label="Person's Name *" C={C}><input type="text" placeholder="Who?" value={p.crPerson} onChange={e=>p.setCrPerson(e.target.value)} style={sInput}/></FF>
            <FF label="Amount (₹) *" C={C}><input type="number" placeholder="0" value={p.crAmt} onChange={e=>p.setCrAmt(e.target.value)} style={sInput}/></FF>
            <FF label="Description" C={C}><input type="text" placeholder="What for?" value={p.crDesc} onChange={e=>p.setCrDesc(e.target.value)} style={sInput}/></FF>
            <FF label="Date" C={C}><input type="date" value={p.crDate} onChange={e=>p.setCrDate(e.target.value)} style={sInput}/></FF>
          </div>
          <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
            <button onClick={()=>{p.addCredit();setShowForm(false);}} style={{flex:1,padding:"11px",borderRadius:"9px",border:"none",background:p.crType==="owed_to_me"?C.green:C.red,color:"#fff",fontWeight:700,fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>+ Add Entry</button>
            <button onClick={()=>setShowForm(false)} style={{...{borderRadius:"9px",border:"none",fontWeight:600,fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"11px 18px"},background:C.cancelBg,color:C.muted}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={sCard}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
          <div style={sSecT}>All Credit Entries</div>
          <div style={{fontSize:"12px",color:C.muted}}>{allCredits.length} of {p.credits.length} entries</div>
        </div>
        <div style={{overflowX:"auto",maxWidth:"100%"}}>
          <table style={{width:"100%",tableLayout:"auto",borderCollapse:"collapse",fontFamily:"'DM Sans',sans-serif"}}>
            <thead>
              <tr>
                <th style={thS} onClick={()=>sortH("person")}>Name{sortKey==="person"?(sortDir==="asc"?" ↑":" ↓"):""}</th>
                <th style={thS} onClick={()=>sortH("amount")}>Amount{sortKey==="amount"?(sortDir==="asc"?" ↑":" ↓"):""}</th>
              </tr>
            </thead>
            <tbody>
              {allCredits.length===0&&<tr><td colSpan={2} style={{...tdS,textAlign:"center",color:C.faint,padding:"32px"}}>No entries yet</td></tr>}
              {allCredits.map(c=>(
                <>
                  <tr key={c.id} style={{cursor:"pointer",opacity:c.cleared?0.6:1}}
                    onClick={()=>setExpandId(expandId===c.id?null:c.id)}
                    onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background=C.cardAlt}
                    onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background=""}>
                    <td style={{...tdS,fontWeight:700}}>
                      <div>{c.person}</div>
                      <div style={{fontSize:"11px",marginTop:"2px"}}>
                        <span style={{background:(c.type==="owed_to_me"?C.green:C.red)+"22",color:c.type==="owed_to_me"?C.green:C.red,padding:"1px 6px",borderRadius:"20px",fontSize:"10px",fontWeight:700,marginRight:"4px"}}>{c.type==="owed_to_me"?"They Owe":"I Owe"}</span>
                        <span style={{background:c.cleared?C.green+"22":C.amber+"22",color:c.cleared?C.green:C.amber,padding:"1px 6px",borderRadius:"20px",fontSize:"10px",fontWeight:700}}>{c.cleared?"Cleared":"Pending"}</span>
                      </div>
                    </td>
                    <td style={{...tdS,fontWeight:700,color:c.type==="owed_to_me"?C.green:C.red,whiteSpace:"nowrap"}}>
                      {c.type==="owed_to_me"?"+":"-"}{fmt(c.amount)}
                    </td>
                  </tr>
                  {expandId===c.id&&(
                    <tr key={c.id+"_exp"}>
                      <td colSpan={2} style={{background:C.cardAlt,padding:"10px 14px",borderBottom:`1px solid ${C.border}`,fontSize:"12px",color:C.muted}}>
                        <div style={{display:"flex",gap:"16px",flexWrap:"wrap",marginBottom:"8px"}}>
                          <span><strong style={{color:C.text}}>Date:</strong> {c.date}</span>
                          <span><strong style={{color:C.text}}>Note:</strong> {c.description||"—"}</span>
                          <span><strong style={{color:C.text}}>Type:</strong> {c.type==="owed_to_me"?"They Owe Me":"I Owe Them"}</span>
                          <span><strong style={{color:C.text}}>Status:</strong> {c.cleared?"Cleared":"Pending"}</span>
                        </div>
                        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                          <button onClick={e=>{e.stopPropagation();p.toggleCleared(c.id);}} style={{...{borderRadius:"7px",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"5px 12px",fontSize:"12px"},background:c.cleared?C.green+"22":C.navActive,color:c.cleared?C.green:C.muted}}>{c.cleared?"✓ Cleared":"○ Mark Cleared"}</button>
                          <button onClick={e=>{e.stopPropagation();openEdit(c);setExpandId(null);}} style={{...{borderRadius:"7px",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"5px 12px",fontSize:"12px"},background:C.navActive,color:C.accent}}>✎ Edit</button>
                          <button onClick={e=>{e.stopPropagation();p.deleteCredit(c.id);}} style={{...{borderRadius:"7px",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"5px 12px",fontSize:"12px"},background:C.delBg,color:C.red}}>✕ Delete</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editEntry&&<EditModal C={C} title="Edit Credit Entry"
        fields={[
          {label:"Person's Name",value:editPerson,onChange:setEditPerson},
          {label:"Amount (₹)",value:editAmt,onChange:setEditAmt,type:"number"},
          {label:"Description",value:editDesc,onChange:setEditDesc},
          {label:"Date",value:editDate,onChange:setEditDate,type:"date"},
        ]}
        onSave={()=>{
          if(editEntry) p.updateCredit(editEntry.id,{person:editPerson,amount:+editAmt,description:editDesc,date:editDate});
          setEditEntry(null);
        }}
        onClose={()=>setEditEntry(null)}
      />}
    </div>
  );
}


// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, dark: _dark }: { onAuth:(user:User)=>void; dark:boolean }) {
  // Always light mode on login page
  const C = makeTheme(false);
  const ACCENT = "#6c5ce7";
  const [mode,     setMode]     = useState<"login"|"signup">("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  const sInput: CSSProperties = {
    width:"100%", padding:"10px 14px", borderRadius:"9px",
    border:"1.5px solid #e0ddf8", background:"#f5f3ff",
    color:"#1a1a2e", fontSize:"14px", outline:"none",
    boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif", marginBottom:"10px",
  };

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

  const pageStyle: CSSProperties = {
    height:"100vh", background:"#f7f6ff",
    display:"flex", flexDirection:"column",
    alignItems:"center", justifyContent:"center",
    fontFamily:"'DM Sans',sans-serif",
    padding:"16px", boxSizing:"border-box", overflow:"hidden",
  };

  if (done) return (
    <div style={pageStyle}>
      <div style={{maxWidth:"360px",width:"100%",textAlign:"center"}}>
        <div style={{fontSize:"36px",marginBottom:"18px"}}>📧</div>
        <div style={{fontSize:"18px",fontWeight:700,color:"#1a1a2e",marginBottom:"8px"}}>Check your email</div>
        <div style={{fontSize:"13px",color:"#555",lineHeight:1.6,marginBottom:"20px"}}>We sent a confirmation link to <strong>{email}</strong>. Click it then come back and log in.</div>
        <button onClick={()=>{setDone(false);setMode("login");}} style={{...btnP,width:"100%",padding:"11px"}}>Back to Login</button>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      <div style={{maxWidth:"360px",width:"100%",display:"flex",flexDirection:"column",gap:"0"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:"20px"}}>
          <div style={{fontSize:"26px",fontWeight:800,color:"#1a1a2e",letterSpacing:"-0.5px"}}>
            <span style={{color:ACCENT}}>Budget</span>ly
          </div>
          <div style={{fontSize:"12px",color:"#888",marginTop:"3px"}}>
            {mode==="login"?"Welcome back":"Create your account"}
          </div>
        </div>

        {/* Email/password */}
        <input type="email" placeholder="Email" value={email}
          onChange={e=>setEmail(e.target.value)} style={sInput}/>
        <div style={{position:"relative",marginBottom:"10px"}}>
          <input type={showPw?"text":"password"} placeholder="Password" value={password}
            onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}
            style={{...sInput,marginBottom:"0",paddingRight:"52px"}}/>
          <button onClick={()=>setShowPw(v=>!v)}
            style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#888",cursor:"pointer",fontSize:"12px",fontFamily:"'DM Sans',sans-serif"}}>
            {showPw?"Hide":"Show"}
          </button>
        </div>
        {error&&<div style={{fontSize:"12px",color:"#c0392b",marginBottom:"8px",padding:"8px 10px",background:"#fdecea",borderRadius:"7px"}}>{error}</div>}
        <button onClick={handle} disabled={loading}
          style={{...btnP,width:"100%",padding:"11px",fontSize:"14px",opacity:loading?0.7:1,marginBottom:"18px"}}>
          {loading?"...":(mode==="login"?"Log In":"Sign Up")}
        </button>
        <div style={{textAlign:"center",fontSize:"12px",color:"#888"}}>
          {mode==="login"?"Don't have an account? ":"Already have an account? "}
          <button onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");}}
            style={{background:"none",border:"none",color:ACCENT,cursor:"pointer",fontWeight:700,fontSize:"12px",fontFamily:"'DM Sans',sans-serif"}}>
            {mode==="login"?"Sign Up":"Log In"}
          </button>
        </div>

        {/* Divider */}
        <div style={{borderTop:"1px solid #e0ddf8",margin:"16px 0"}}/>

        {/* Install instructions */}
        <div style={{background:"#ede9f8",borderRadius:"10px",padding:"12px 14px"}}>
          <div style={{fontSize:"11px",color:ACCENT,fontWeight:700,marginBottom:"6px"}}>📱 Install on Android</div>
          {["Open this page in Chrome","Tap ⋮ → Add to Home screen","Tap Add — done"].map((step,i)=>(
            <div key={i} style={{display:"flex",gap:"7px",marginBottom:"3px",alignItems:"flex-start"}}>
              <div style={{width:"14px",height:"14px",borderRadius:"50%",background:ACCENT,color:"#fff",fontSize:"8px",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"1px"}}>{i+1}</div>
              <div style={{fontSize:"11px",color:"#555",lineHeight:1.4}}>{step}</div>
            </div>
          ))}
        </div>

        {/* Credit */}
        <div style={{textAlign:"center",fontSize:"11px",color:"#aaa",marginTop:"12px"}}>
          Made by <span style={{color:"#888",fontWeight:600}}>Armaan Gupta</span>
        </div>
      </div>
    </div>
  );
}

// ─── Migration Modal ──────────────────────────────────────────────────────────
function MigrateModal({ onDecide, C }: { onDecide:(migrate:boolean)=>void; C:Theme }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{background:C.card,borderRadius:"16px",padding:"36px",maxWidth:"380px",width:"90%",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:"22px",fontWeight:800,color:C.text,marginBottom:"8px"}}>Import your existing data?</div>
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
      <div style={{maxWidth:"420px",width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{fontSize:"24px",fontWeight:700,color:C.text,marginBottom:"6px"}}><span style={{color:C.accent}}>Budget</span>ly</div>
          <div style={{fontSize:"14px",color:C.muted}}>Choose how you want to use Budgetly</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <button onClick={()=>onSelect("student")} style={{background:C.card,border:`2px solid ${C.accent}`,borderRadius:"14px",padding:"22px 20px",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{fontSize:"22px",marginBottom:"8px"}}>🎓</div>
            <div style={{fontSize:"16px",fontWeight:700,color:C.text,marginBottom:"6px"}}>Student</div>
            <div style={{fontSize:"13px",color:C.muted,lineHeight:1.7,marginBottom:"10px"}}>Set a monthly budget and track every rupee you spend. Get daily spend targets, budget progress, and category breakdowns so you always know where your money went.</div>
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              {["✓ Monthly budget with daily averages","✓ Spending categories (Food, Transport, etc.)","✓ Trends and spending insights","✓ Credit tracker — who owes who"].map((f,i)=>(
                <div key={i} style={{fontSize:"12px",color:C.green}}>{f}</div>
              ))}
            </div>
          </button>
          <button onClick={()=>onSelect("household")} style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:"14px",padding:"22px 20px",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{fontSize:"22px",marginBottom:"8px"}}>🏠</div>
            <div style={{fontSize:"16px",fontWeight:700,color:C.text,marginBottom:"6px"}}>Household</div>
            <div style={{fontSize:"13px",color:C.muted,lineHeight:1.7,marginBottom:"10px"}}>Manage your family's finances across multiple bank accounts. Track electricity bills, groceries, rent, and more. See exactly how much each account is spending — no budget limits.</div>
            <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
              {["✓ Multiple accounts (HDFC, Cash, Joint, etc.)","✓ Household categories (Electricity, Rent, etc.)","✓ Track income and expenses per account","✓ No budget cap — pure transaction tracking"].map((f,i)=>(
                <div key={i} style={{fontSize:"12px",color:C.accent}}>{f}</div>
              ))}
            </div>
          </button>
        </div>
        <div style={{marginTop:"16px",fontSize:"12px",color:C.faint,textAlign:"center"}}>You can switch modes anytime from Settings · Your data stays separate per mode</div>
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
  const sCard:  CSSProperties = { background:C.card,borderRadius:"16px",padding:"32px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"11px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"16px",fontWeight:800 };
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
  const [tutorialVisits,setTutorialVisits]= useState<number>(() => lsLoad<number>("budgetly_tutorial_visits", 0));
  const [appMode,       setAppMode]       = useState<AppMode|null>(() => lsLoad<AppMode|null>("budgetly_mode", null));
  const [showModeSelect,setShowModeSelect]= useState(false);
  const [accounts,      setAccounts]      = useState<string[]>(() => lsLoad<string[]>("budgetly_accounts", DEFAULT_ACCOUNTS));
  const [user,          setUser]          = useState<User|null>(null);
  const [authReady,     setAuthReady]     = useState(false);
  const [showMigrate,   setShowMigrate]   = useState(false); // triggers after login if local data exists
  const [activeTab,     setActiveTab]     = useState<string>("overview");
  const [activeMKRaw,   setActiveMKRaw]   = useState<string>(curMK());
  const activeMK = modeMK(activeMKRaw, appMode);
  const setActiveMK = (mk:string) => setActiveMKRaw(stripMK(mk));
  const [allMonths,     setAllMonthsRaw]  = useState<AllMonths>({});
  const [categories,    setCategories]    = useState<string[]>(() => {
    const saved = lsLoad<string[]>("budgetly_cats", null as any);
    if (saved && saved.length > 0) return saved;
    // No saved cats — use defaults based on current mode
    const mode = lsLoad<AppMode|null>("budgetly_mode", null);
    return mode==="household" ? DEFAULT_HOUSEHOLD_CATS : DEFAULT_CATS;
  });
  const [editingBudget, setEditingBudget] = useState(false);
  const [tempBudget,    setTempBudget]    = useState("10000");
  const [deleteConfirm, setDeleteConfirm] = useState<number|null>(null);
  const [newCategory,   setNewCategory]   = useState("");
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);
  const [dbLoading,     setDbLoading]     = useState(false);
  const [deleteMonthConfirm, setDeleteMonthConfirm] = useState(false);
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(false);
  const [deleteAccountText, setDeleteAccountText] = useState("");
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
    // Auto-switch categories to match mode defaults if still on defaults
    const currentDef = appMode==="household" ? DEFAULT_HOUSEHOLD_CATS : DEFAULT_CATS;
    const newDef = m==="household" ? DEFAULT_HOUSEHOLD_CATS : DEFAULT_CATS;
    if (JSON.stringify(categories.slice().sort()) === JSON.stringify(currentDef.slice().sort())) {
      setCategories(newDef);
    }
    setShowModeSelect(false);
  };


  const incrementTutorialVisits = () => {
    setTutorialVisits(v => { const n=v+1; lsSave("budgetly_tutorial_visits", n); return n; });
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
      const row = cData[0] as {credits?:CreditEntry[];household_credits?:CreditEntry[];categories?:string[];accounts?:string[]};
      const modeCredits = appMode==="household" ? (row.household_credits??[]) : (row.credits??[]);
      setCredits(modeCredits);
      // Restore categories and accounts from server (more reliable than localStorage)
      if (row.categories && row.categories.length > 0) {
        setCategories(row.categories);
        lsSave("budgetly_cats", row.categories);
      }
      if (row.accounts && row.accounts.length > 0) {
        setAccounts(row.accounts);
        lsSave("budgetly_accounts", row.accounts);
      }
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
    const field = appMode==="household" ? "household_credits" : "credits";
    await supabase.from("user_credits").upsert({ user_id:user.id, [field]:c, updated_at:new Date().toISOString() },{ onConflict:"user_id" });
  }, [user, isGuest, appMode]);

  const saveUserPrefs = useCallback(async (cats: string[], accs: string[]) => {
    if (!user) return;
    await supabase.from("user_credits").upsert({ user_id:user.id, categories:cats, accounts:accs, updated_at:new Date().toISOString() },{ onConflict:"user_id" });
  }, [user]);

  const setAllMonths = useCallback((updater: AllMonths|((prev:AllMonths)=>AllMonths)) => {
    setAllMonthsRaw(prev => { const next=typeof updater==="function"?updater(prev):updater; return next; });
  }, [isGuest]);

  // Reload credits when mode switches
  useEffect(() => {
    if (!user || !appMode) return;
    setCreditsLoaded(false);
    setCredits([]);
    supabase.from("user_credits").select("*").eq("user_id",user.id).then(({data}) => {
      if (data && data.length > 0) {
        const row = data[0] as any;
        setCredits(appMode==="household" ? (row.household_credits??[]) : (row.credits??[]));
      }
      setCreditsLoaded(true);
    });
  }, [appMode, user]);

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
  const cashFlowIn        = appMode==="household" ? totalEarnings : budget + totalEarnings;
  const cashFlowOut       = totalExpenses;
  const remaining         = cashFlowIn - cashFlowOut - totalSavings;
  const spentPct          = cashFlowIn>0 ? Math.min((cashFlowOut/(cashFlowIn-totalSavings))*100,100) : 0;
  const daysInMonth       = getDays(activeMK);
  const todayDay          = activeMK===curMK() ? new Date().getDate() : daysInMonth;
  const daysLeft          = Math.max(daysInMonth-todayDay+1,1);
  const moneyLeft         = Math.max(remaining,0);
  const idealPerDay       = Math.round((cashFlowIn-totalSavings)/daysInMonth);
  const idealSpentByToday = idealPerDay*todayDay;
  const actualVsIdeal     = cashFlowOut-idealSpentByToday;
  const currentDailyAvg   = todayDay>0 ? Math.round(cashFlowOut/todayDay) : 0;
  const currentIdealAvg   = Math.round(remaining/daysLeft);
  const modePrefix = appMode==="household" ? "h:" : "";
  const allMKs = (() => {
    const k=Object.keys(allMonths).filter(mk=>appMode==="household"?mk.startsWith("h:"):!mk.startsWith("h:"));
    if(!k.includes(activeMK))k.push(activeMK);
    return k.sort().reverse();
  })();

  // Actions
  const setBudget      = (v:number) => setM(activeMK,{...md,budget:v});
  const saveBudget     = () => { const v=parseFloat(tempBudget); if(!isNaN(v)&&v>0)setBudget(v); setEditingBudget(false); };
  const addExpense     = () => { if(!expAmt||isNaN(+expAmt))return; setM(activeMK,{...md,expenses:[...expenses,{id:Date.now(),amount:+expAmt,category:expCat,description:expDesc,date:expDate,mode:expMode,account:expAcc||undefined}]}); setExpAmt(""); setExpDesc(""); };
  const addEarning     = () => { if(!earnAmt||isNaN(+earnAmt))return; setM(activeMK,{...md,earnings:[...earnings,{id:Date.now(),amount:+earnAmt,description:earnDesc,date:earnDate,mode:earnMode,account:earnAcc||undefined}]}); setEarnAmt(""); setEarnDesc(""); };
  const addSaving      = () => { if(!savAmt||isNaN(+savAmt))return; setM(activeMK,{...md,savings:[...savings,{id:Date.now(),amount:+savAmt,description:savDesc,date:savDate,mode:savMode,account:savAcc||undefined}]}); setSavAmt(""); setSavDesc(""); };
  const deleteExpense       = (id:number)       => { setM(activeMK,{...md,expenses:expenses.filter(e=>e.id!==id)}); setDeleteConfirm(null); };
  const deleteEarning       = (id:number)       => { setM(activeMK,{...md,earnings:earnings.filter(e=>e.id!==id)}); setDeleteConfirm(null); };
  const deleteSaving        = (id:number)       => { setM(activeMK,{...md,savings: savings.filter (e=>e.id!==id)}); setDeleteConfirm(null); };
  const deleteManyExpenses  = (ids:number[])    => { setM(activeMK,{...md,expenses:expenses.filter(e=>!ids.includes(e.id))}); };
  const deleteManyEarnings  = (ids:number[])    => { setM(activeMK,{...md,earnings:earnings.filter(e=>!ids.includes(e.id))}); };
  const deleteManySavings   = (ids:number[])    => { setM(activeMK,{...md,savings: savings.filter (e=>!ids.includes(e.id))}); };
  const updateExpense  = (id:number,u:Partial<Expense>) => setM(activeMK,{...md,expenses:expenses.map(e=>e.id===id?{...e,...u}:e)});
  const updateEarning  = (id:number,u:Partial<Entry>)   => setM(activeMK,{...md,earnings:earnings.map(e=>e.id===id?{...e,...u}:e)});
  const updateSaving   = (id:number,u:Partial<Entry>)   => setM(activeMK,{...md,savings: savings.map (e=>e.id===id?{...e,...u}:e)});
  const updateCredit   = (id:number,u:Partial<CreditEntry>) => setCredits(prev=>prev.map(c=>c.id===id?{...c,...u}:c));
  const addCategory    = () => { const t=newCategory.trim(); if(!t||categories.includes(t))return; const n=[...categories,t]; setCategories(n); lsSave("budgetly_cats",n); saveUserPrefs(n,accounts); setNewCategory(""); };
  const deleteCategory = (cat:string) => {
    const def = appMode==="household" ? DEFAULT_HOUSEHOLD_CATS : DEFAULT_CATS;
    if(def.includes(cat))return; const n=categories.filter(c=>c!==cat); setCategories(n); lsSave("budgetly_cats",n); saveUserPrefs(n,accounts);
  };
  const addAccount     = () => { const t=newAccount.trim(); if(!t||accounts.includes(t))return; const n=[...accounts,t]; saveAccounts(n); saveUserPrefs(categories,n); setNewAccount(""); };
  const deleteAccount  = (acc:string) => { if(DEFAULT_ACCOUNTS.includes(acc))return; const n=accounts.filter(a=>a!==acc); saveAccounts(n); saveUserPrefs(categories,n); };
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
  const addNextMonth   = () => {
    const clean=stripMK(activeMK); const [y,m]=clean.split("-").map(Number);
    const nd=new Date(y,m,1); const rawNk=`${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,"0")}`;
    const nk=modeMK(rawNk,appMode); if(!allMonths[nk])setM(nk,emptyMD()); setActiveMK(nk);
  };
  const deleteMonth    = async () => { setDeleteMonthConfirm(false); setAllMonths(prev=>{const next={...prev};delete next[activeMK];return next;}); if(user) await supabase.from("month_data").delete().eq("user_id",user.id).eq("month_key",activeMK); setActiveMK(curMK()); };
  const handleMigrate  = async (migrate:boolean) => { setShowMigrate(false); if(!migrate||!user)return; const lsData=lsLoad<AllMonths>("budgetly_months",{}); for(const [mk,d] of Object.entries(lsData)) await saveToSupabase(mk,d); localStorage.removeItem("budgetly_months"); await loadFromSupabase(); };
  const logout         = async () => { await supabase.auth.signOut(); setUser(null); setAllMonthsRaw({}); };
  const deleteUserAccount = async () => { if (!user) return; await supabase.rpc("delete_user"); await supabase.auth.signOut(); setUser(null); setAllMonthsRaw({}); };

  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"16px",padding:"32px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"11px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"16px",fontWeight:800 };

  if (!authReady) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{fontSize:"13px",color:C.muted}}>Loading…</div>
    </div>
  );
  if (!user) return <AuthScreen onAuth={u=>setUser(u)} dark={dark}/>;
  if (!appMode || showModeSelect) return <ModeSelectScreen C={C} onSelect={switchMode}/>;

  const showTutorialStrip = tutorialVisits < 5;

  function SidebarInner() {
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
          <button onClick={()=>setShowSettings(true)} style={{
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
        <div className="settings-modal" style={{background:C.card,borderRadius:"20px 20px 0 0",padding:"28px 24px 36px",width:"100%",maxWidth:"460px",border:`1px solid ${C.border}`,borderBottom:"none",maxHeight:"90vh",overflowY:"auto"}}>
          {/* Handle bar */}
          <div style={{width:"36px",height:"4px",borderRadius:"4px",background:C.faint,margin:"0 auto 24px"}}/>
          <div style={{fontSize:"17px",fontWeight:600,color:C.text,marginBottom:"20px"}}>Settings</div>

          {/* Account */}
          <div style={{marginBottom:"26px",paddingBottom:"26px",borderBottom:`1px solid ${C.border}`}}>
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

          {/* Dark mode + Bold */}
          <div style={{marginBottom:"26px",paddingBottom:"26px",borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Appearance</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.cardAlt,padding:"12px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,marginBottom:"8px"}}>
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
          <div style={{marginBottom:"26px",paddingBottom:"26px",borderBottom:`1px solid ${C.border}`}}>
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
          <div style={{marginBottom:"26px",paddingBottom:"26px",borderBottom:`1px solid ${C.border}`}}>
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
          <div style={{marginBottom:"26px",paddingBottom:"26px",borderBottom:`1px solid ${C.border}`}}>
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
          <div style={{marginBottom:"26px",paddingBottom:"26px",borderBottom:`1px solid ${C.border}`}}>
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

          {/* Legal */}
          <div style={{marginTop:"20px",paddingTop:"20px",borderTop:`1px solid ${C.border}`}}>
            <a href="/privacy-policy" target="_blank" rel="noreferrer" onClick={()=>setShowSettings(false)}
              style={{display:"block",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.cardAlt,color:C.muted,fontSize:"13px",fontWeight:500,textDecoration:"none",textAlign:"left"}}>
              🔒 Privacy Policy
            </a>
          </div>

          {/* Danger Zone */}
          <div style={{marginTop:"8px",paddingTop:"20px",borderTop:`1px solid ${C.red}44`}}>
            <div style={{fontSize:"10px",color:C.red,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Danger Zone</div>
            {!deleteAccountConfirm ? (
              <button onClick={()=>{setDeleteAccountConfirm(true);setDeleteAccountText("");}}
                style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.red}66`,background:C.delBg,color:C.red,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,textAlign:"left"}}>
                Delete Account
              </button>
            ) : (
              <div style={{background:C.delBg,border:`1px solid ${C.red}66`,borderRadius:"12px",padding:"14px"}}>
                <div style={{fontSize:"12px",color:C.text,marginBottom:"10px",lineHeight:1.5}}>This will permanently delete your account and all your data. This cannot be undone. Type <strong>DELETE</strong> to confirm.</div>
                <input
                  value={deleteAccountText}
                  onChange={e=>setDeleteAccountText(e.target.value)}
                  placeholder="Type DELETE"
                  style={{width:"100%",padding:"8px 12px",borderRadius:"8px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"13px",outline:"none",fontFamily:"'DM Sans',sans-serif",marginBottom:"10px",boxSizing:"border-box"}}
                />
                <div style={{display:"flex",gap:"8px"}}>
                  <button
                    onClick={()=>{if(deleteAccountText==="DELETE"){setShowSettings(false);deleteUserAccount();}}}
                    disabled={deleteAccountText!=="DELETE"}
                    style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:deleteAccountText==="DELETE"?C.red:C.delBg,color:deleteAccountText==="DELETE"?"#fff":C.muted,cursor:deleteAccountText==="DELETE"?"pointer":"not-allowed",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif",opacity:deleteAccountText==="DELETE"?1:0.6}}>
                    Delete Account
                  </button>
                  <button onClick={()=>{setDeleteAccountConfirm(false);setDeleteAccountText("");}} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:C.cancelBg,color:C.muted,cursor:"pointer",fontSize:"12px",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const ovProps: OvProps = { C,budget,cashFlowIn,cashFlowOut,totalEarnings,totalSavings,remaining,spentPct,editingBudget,tempBudget,setEditingBudget,setTempBudget,saveBudget,expenses,earnings,savings,categories,accounts,appMode,daysInMonth,todayDay,idealPerDay,idealSpentByToday,actualVsIdeal,moneyLeft,daysLeft,currentDailyAvg,currentIdealAvg };
  const exProps: ExProps = { C,expenses,categories,accounts,appMode,totalExpenses:cashFlowOut,expAmt,expCat,expDesc,expDate,expMode,expAcc,setExpAmt,setExpCat,setExpDesc,setExpDate,setExpMode,setExpAcc,addExpense,deleteConfirm,setDeleteConfirm,deleteExpense,deleteManyExpenses,updateExpense };
  const erProps: ErProps = { C,earnings,accounts,appMode,totalEarnings,earnAmt,earnDesc,earnDate,earnMode,earnAcc,setEarnAmt,setEarnDesc,setEarnDate,setEarnMode,setEarnAcc,addEarning,deleteConfirm,setDeleteConfirm,deleteEarning,deleteManyEarnings,updateEarning };
  const svProps: SvProps = { C,savings,accounts,appMode,totalSavings,cashFlowIn,savAmt,savDesc,savDate,savMode,savAcc,setSavAmt,setSavDesc,setSavDate,setSavMode,setSavAcc,addSaving,deleteConfirm,setDeleteConfirm,deleteSaving,deleteManySavings,updateSaving };
  const caProps: CaProps = { C,categories,expenses,cashFlowOut,newCategory,setNewCategory,addCategory,deleteCategory };
  const trProps: TrProps = { C,allMonths,activeMK,categories,appMode };
  const crProps: CrProps = { C,credits,crAmt,crPerson,crDesc,crDate,crType,setCrAmt,setCrPerson,setCrDesc,setCrDate,setCrType,addCredit,toggleCleared,deleteCredit,updateCredit,deleteConfirm,setDeleteConfirm };

  return (
    <>
      <title>{appMode ? `Budgetly · ${appMode==="household"?"Household":"Student"}` : "Budgetly"}</title>
      <link rel="icon" type="image/svg+xml" href={`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%237c6ee0'/><text x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-family='sans-serif' font-weight='700' font-size='18' fill='white'>B</text></svg>`}/>
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
        html,body{overflow-x:hidden;max-width:100vw;}
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
        @keyframes slideInLeft{from{transform:translateX(-100%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateY(32px);opacity:0}to{transform:translateY(0);opacity:1}}
        .drawer-panel{animation:slideInLeft 0.25s cubic-bezier(0.32,0.72,0,1)}
        .drawer-overlay{animation:fadeIn 0.2s ease}
        .settings-modal{animation:slideUp 0.25s cubic-bezier(0.32,0.72,0,1)}
        @media(max-width:768px){
          .mob-header{display:flex!important;position:fixed;top:0;left:0;right:0;z-index:100;background:${C.sidebar};border-bottom:1px solid ${C.border};padding:14px 18px;align-items:center;justify-content:space-between;}
          .desk-sidebar{display:none!important;}
          .mob-nav{display:flex!important;position:fixed;bottom:0;left:0;right:0;background:${C.sidebar};border-top:1px solid ${C.border};z-index:50;padding:5px 0 max(8px,env(safe-area-inset-bottom));}
          .main-wrap{padding:72px 16px 80px!important;overflow-x:hidden;max-width:100vw;}
          .two-col-grid{grid-template-columns:1fr!important;}
          .col-hide-mobile{display:none!important;}
          .col-actions-mobile{display:none!important;}
          .col-date-mobile{display:none!important;}
          .col-mode-mobile{display:none!important;}
          @keyframes fadeIn{from{opacity:0}to{opacity:1}}
          @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        }
        @media(max-width:640px){
          table{table-layout:auto;width:100%;max-width:100%;}
          th,td{padding:8px 6px!important;font-size:11px!important;}
          .form-grid{grid-template-columns:1fr!important;}
          .table-scroll{overflow-x:auto;max-width:100%;}
        }
      `}</style>

      {showMigrate&&<MigrateModal onDecide={handleMigrate} C={C}/>}

      {/* Mobile header */}
      <div className="mob-header">
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{fontSize:"20px",fontWeight:900,color:C.text,letterSpacing:"-0.5px"}}><span style={{color:C.accent}}>Budget</span>ly</div>
          <span style={{fontSize:"9px",background:C.navActive,color:C.accent,padding:"2px 7px",borderRadius:"20px",fontWeight:700,letterSpacing:"0.5px",textTransform:"uppercase"}}>
            {appMode==="household"?"🏠 HH":"🎓 STU"}
          </span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
<button onClick={toggleDark} style={{background:C.navActive,border:`1px solid ${C.border}`,borderRadius:"20px",padding:"4px 8px",cursor:"pointer",display:"flex",alignItems:"center",gap:"5px"}}>
            <div style={{width:"28px",height:"16px",borderRadius:"16px",background:dark?C.accent:"#d1cfe8",position:"relative",flexShrink:0}}>
              <div style={{position:"absolute",top:"2px",left:dark?"14px":"2px",width:"12px",height:"12px",borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
            </div>
            <span style={{fontSize:"12px"}}>{dark?"☀️":"🌙"}</span>
          </button>
          <button onClick={()=>setDrawerOpen(true)} style={{background:"none",border:`1px solid ${C.border}`,color:C.text,cursor:"pointer",borderRadius:"7px",padding:"5px 9px",fontSize:"14px"}}>☰</button>
        </div>
      </div>

      {/* Mobile drawer — animated */}
      <div style={{
        position:"fixed",inset:0,zIndex:200,display:"flex",
        pointerEvents:drawerOpen?"auto":"none",
        transition:"background 0.25s ease",
        background:drawerOpen?"rgba(0,0,0,0.35)":"rgba(0,0,0,0)",
      }} onClick={()=>setDrawerOpen(false)}>
        <div style={{
          width:"260px",background:C.sidebar,borderRight:`1px solid ${C.border}`,
          display:"flex",flexDirection:"column",padding:"24px 0",overflowY:"auto",
          transform:drawerOpen?"translateX(0)":"translateX(-100%)",
          transition:"transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          pointerEvents:"auto",
        }} onClick={e=>e.stopPropagation()}>
          <SidebarInner/>
        </div>
      </div>

      <div style={{minHeight:"100vh",background:C.bg,display:"flex"}}>
        <aside className="desk-sidebar" style={{width:"210px",minHeight:"100vh",background:C.sidebar,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"24px 0",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
          <SidebarInner/>
        </aside>

        <main className="main-wrap" style={{flex:1,padding:"36px 32px",overflowX:"hidden",overflowY:"auto",minWidth:0}}
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
            overflowX:"hidden",
            overflowY:"auto",
            maxWidth:"100%",
            height:"100%",
          }}>
          <div style={{marginBottom:"28px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"8px"}}>
            <div>
              <h1 style={{fontSize:"clamp(26px,4vw,36px)",fontWeight:900,color:C.text,letterSpacing:"-0.8px",lineHeight:1.1}}>
                {activeTab==="categories"?"Categories":activeTab==="tutorial"?"How to use Budgetly":activeTab==="trends"?"Trends":activeTab==="accounts"?"Accounts":NAV.find(n=>n.id===activeTab)?.label}
              </h1>
              <div style={{fontSize:"12px",color:C.muted,marginTop:"5px",fontWeight:500}}>
                {fmtMK(activeMK)}{activeMK!==curMK()&&" · past month"}
              </div>
            </div>
            <div style={{fontSize:"11px",color:C.faint,textAlign:"right"}}>
              Day {todayDay} of {daysInMonth}<br/>
              <span style={{color:C.muted}}>{new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}</span>
            </div>
          </div>

          {showTutorialStrip&&activeTab!=="tutorial"&&(
            <div style={{background:C.navActive,borderRadius:"10px",padding:"14px 18px",marginBottom:"20px",display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${C.border}`,gap:"10px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"14px"}}>💡</span>
                <span style={{fontSize:"12px",color:C.muted,lineHeight:1.5}}>New to Budgetly? Check out tips and tricks to get the most out of the app.</span>
              </div>
              <div style={{display:"flex",gap:"6px",flexShrink:0}}>
                <button onClick={()=>{setActiveTab("tutorial");incrementTutorialVisits();}}
                  style={{...btnP,padding:"5px 12px",fontSize:"12px",whiteSpace:"nowrap"}}>How to use →</button>
                <button onClick={incrementTutorialVisits}
                  style={{background:"none",border:"none",color:C.faint,cursor:"pointer",fontSize:"16px",padding:"0 4px"}} title="Dismiss">✕</button>
              </div>
            </div>
          )}
          {activeTab==="overview"   &&<OverviewTab   {...ovProps}/>}
          {activeTab==="expenses"   &&<ExpensesTab   {...exProps}/>}
          {activeTab==="earnings"   &&<EarningsTab   {...erProps}/>}
          {activeTab==="savings"    &&<SavingsTab    {...svProps}/>}
          {activeTab==="credit"     &&<CreditTab     {...crProps}/>}
          {activeTab==="categories" &&<CategoriesTab {...caProps}/>}
          {activeTab==="tutorial"   &&<TutorialTab C={C} appMode={appMode}/>}
          {activeTab==="trends"     &&<TrendsTab     {...trProps}/>}
          {activeTab==="accounts"   &&<AccountsTab C={C} accounts={accounts} expenses={expenses} earnings={earnings} savings={savings} newAccount={newAccount} setNewAccount={setNewAccount} addAccount={addAccount} deleteAccount={deleteAccount}/>}
          </div>{/* end swipe animation wrapper */}
        </main>
      </div>

      {showSettings&&SettingsModal()}

      <div className="mob-nav">
        {NAV.map(item=>(
          <button key={item.id} onClick={()=>setActiveTab(item.id)} style={{flex:1,padding:"8px 3px",border:"none",background:"transparent",color:activeTab===item.id?C.accent:C.faint,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",fontFamily:"'DM Sans',sans-serif"}}>
            <span style={{fontSize:"16px"}}>{item.icon}</span>
            <span style={{fontSize:"9px",fontWeight:activeTab===item.id?600:400}}>{item.label}</span>
          </button>
        ))}


      </div>
    </>
  );
}
