import { CSSProperties } from "react";
import { Theme, MonthData } from "./types";

// ─── localStorage ─────────────────────────────────────────────────────────────
export function lsLoad<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? (JSON.parse(r) as T) : fallback; }
  catch { return fallback; }
}
export function lsSave(key: string, val: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ }
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const DEFAULT_CATS: string[] = ["Food","Transport","College","Entertainment","Health","Shopping","Other"];
export const DEFAULT_HOUSEHOLD_CATS: string[] = ["Salaries","Groceries","Rent","Bills","Transport","Fees","Medical","Shopping","Entertainment","Misc"];
export const DEFAULT_ACCOUNTS: string[] = ["Main Account","Cash","Savings Account","Joint Account","Current Account"];
export const CAT_COLORS: string[]   = ["#f97316","#06b6d4","#8b5cf6","#10b981","#f43f5e","#eab308","#6366f1","#ec4899","#14b8a6","#84cc16","#ef4444","#3b82f6"];
export const NAV = [
  { id:"overview",   label:"Overview",   icon:"◎" },
  { id:"expenses",   label:"Expenses",   icon:"↓" },
  { id:"earnings",   label:"Cash In",    icon:"↑" },
  { id:"savings",    label:"Savings",    icon:"⬡" },
  { id:"credit",     label:"Credit",     icon:"⇄" },
] as const;
export const SWIPE_TABS = ["overview","expenses","earnings","savings","credit","trends"];

// ─── Theme factory ────────────────────────────────────────────────────────────
export function makeTheme(dark: boolean): Theme {
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
export const fmt     = (n: number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
export const todayS  = () => new Date().toISOString().split("T")[0];
export const curMK   = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
export const fmtMK   = (mk:string) => { const [y,m]=mk.split("-"); return new Date(+y,+m-1,1).toLocaleDateString("en-IN",{month:"long",year:"numeric"}); };
export const getDays = (mk:string) => { const [y,m]=mk.split("-").map(Number); return new Date(y,m,0).getDate(); };
export const emptyMD = (): MonthData => ({ budget:10000, expenses:[], earnings:[], savings:[] });

// ─── Shared button base ───────────────────────────────────────────────────────
export const btnB: CSSProperties = { borderRadius:"9px",border:"none",fontWeight:600,fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"9px 18px",transition:"opacity 0.15s" };
export const btnP: CSSProperties = { ...btnB, background:"#6c5ce7", color:"#fff" };
export const btnG: CSSProperties = { ...btnB, background:"#00b894", color:"#fff" };
export const btnA: CSSProperties = { ...btnB, background:"#e0a800", color:"#fff" };
