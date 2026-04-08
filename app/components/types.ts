import type { CSSProperties, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Entry    { id: number; amount: number; description: string; date: string; mode?: string; account?: string; }
export interface Expense extends Entry { category: string; account?: string; }
export interface MonthData { budget: number; expenses: Expense[]; earnings: Entry[]; savings: Entry[]; }
export interface AllMonths { [mk: string]: MonthData; }
export type AppMode = "student" | "household";
export interface Theme {
  bg: string; sidebar: string; card: string; cardAlt: string;
  border: string; text: string; muted: string; faint: string;
  accent: string; green: string; red: string; amber: string;
  inputBg: string; progressTrack: string; navActive: string;
  pillGreen: string; pillGreenBorder: string; pillRed: string; pillRedBorder: string;
  delBg: string; cancelBg: string; upcomingBg: string;
}
export interface CreditEntry { id: number; person: string; amount: number; description: string; date: string; type: "owed_to_me" | "i_owe"; cleared: boolean; }

// ─── Props interfaces ─────────────────────────────────────────────────────────
export interface OvProps {
  C: Theme; budget: number; cashFlowIn: number; cashFlowOut: number; totalEarnings: number;
  totalSavings: number; remaining: number; spentPct: number;
  editingBudget: boolean; tempBudget: string;
  setEditingBudget: (v: boolean) => void; setTempBudget: (v: string) => void; saveBudget: () => void;
  expenses: Expense[]; earnings: Entry[]; savings: Entry[]; categories: string[]; accounts: string[]; appMode: AppMode;
  daysInMonth: number; todayDay: number; idealPerDay: number;
  idealSpentByToday: number; actualVsIdeal: number;
  moneyLeft: number; daysLeft: number; currentDailyAvg: number; currentIdealAvg: number;
  credits: CreditEntry[]; setActiveTab: (v: string) => void;
}
export interface ExProps { C: Theme; expenses: Expense[]; categories: string[]; accounts: string[]; appMode: AppMode; totalExpenses: number; expAmt: string; expCat: string; expDesc: string; expDate: string; expMode: string; expAcc: string; setExpAmt: (v: string) => void; setExpCat: (v: string) => void; setExpDesc: (v: string) => void; setExpDate: (v: string) => void; setExpMode: (v: string) => void; setExpAcc: (v: string) => void; addExpense: () => void; deleteConfirm: number | null; setDeleteConfirm: (v: number | null) => void; deleteExpense: (id: number) => void; deleteManyExpenses: (ids: number[]) => void; updateExpense: (id: number, u: Partial<Expense>) => void; onOpenCategories: () => void; onOpenAccounts: () => void; }
export interface ErProps { C: Theme; earnings: Entry[]; accounts: string[]; appMode: AppMode; totalEarnings: number; earnAmt: string; earnDesc: string; earnDate: string; earnMode: string; earnAcc: string; setEarnAmt: (v: string) => void; setEarnDesc: (v: string) => void; setEarnDate: (v: string) => void; setEarnMode: (v: string) => void; setEarnAcc: (v: string) => void; addEarning: () => void; deleteConfirm: number | null; setDeleteConfirm: (v: number | null) => void; deleteEarning: (id: number) => void; deleteManyEarnings: (ids: number[]) => void; updateEarning: (id: number, u: Partial<Entry>) => void; }
export interface SvProps { C: Theme; savings: Entry[]; accounts: string[]; appMode: AppMode; totalSavings: number; cashFlowIn: number; savAmt: string; savDesc: string; savDate: string; savMode: string; savAcc: string; setSavAmt: (v: string) => void; setSavDesc: (v: string) => void; setSavDate: (v: string) => void; setSavMode: (v: string) => void; setSavAcc: (v: string) => void; addSaving: () => void; deleteConfirm: number | null; setDeleteConfirm: (v: number | null) => void; deleteSaving: (id: number) => void; deleteManySavings: (ids: number[]) => void; updateSaving: (id: number, u: Partial<Entry>) => void; }
export interface CaProps { C: Theme; categories: string[]; expenses: Expense[]; cashFlowOut: number; newCategory: string; setNewCategory: (v: string) => void; addCategory: () => void; deleteCategory: (cat: string) => void; appMode: AppMode; }
export interface CrProps { C: Theme; credits: CreditEntry[]; crAmt: string; crPerson: string; crDesc: string; crDate: string; crType: "owed_to_me" | "i_owe"; setCrAmt: (v: string) => void; setCrPerson: (v: string) => void; setCrDesc: (v: string) => void; setCrDate: (v: string) => void; setCrType: (v: "owed_to_me" | "i_owe") => void; addCredit: () => void; toggleCleared: (id: number) => void; deleteCredit: (id: number) => void; updateCredit: (id: number, u: Partial<CreditEntry>) => void; deleteConfirm: number | null; setDeleteConfirm: (v: number | null) => void; }
export interface TrProps { C: Theme; allMonths: AllMonths; activeMK: string; categories: string[]; appMode: AppMode; expenses: Expense[]; cashFlowOut: number; currentDailyAvg: number; todayDay: number; }

export interface SidebarProps {
  C: Theme; appMode: AppMode | null; activeMK: string; allMKs: string[];
  activeTab: string; dbLoading: boolean;
  setActiveMK: (mk: string) => void; setActiveTab: (tab: string) => void; setDrawerOpen: (v: boolean) => void;
}
export interface MobileNavProps {
  C: Theme; activeTab: string; setActiveTab: (tab: string) => void;
}
export interface SettingsProps {
  C: Theme; user: import("@supabase/supabase-js").User | null; dark: boolean; appMode: AppMode | null;
  activeMK: string; categories: string[]; deleteMonthConfirm: boolean;
  deleteAccountConfirm: boolean; deleteAccountText: string;
  logout: () => void; toggleDark: () => void; switchMode: (m: AppMode) => void;
  setCategories: (cats: string[]) => void; setActiveTab: (tab: string) => void;
  addNextMonth: () => void; deleteMonth: () => void; setDeleteMonthConfirm: (v: boolean) => void;
  setDeleteAccountConfirm: (v: boolean) => void; setDeleteAccountText: (v: string) => void;
  deleteUserAccount: () => void; exportCSV: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const DEFAULT_CATS: string[] = ["Food","Transport","College","Entertainment","Health","Shopping","Other"];
export const DEFAULT_HOUSEHOLD_CATS: string[] = ["Salaries","Groceries","Rent","Bills","Transport","Fees","Medical","Shopping","Entertainment","Misc"];
export const OLD_HOUSEHOLD_UTILITY_CATS = ["Water","Gas","Electricity","Internet"];
export const OLD_HOUSEHOLD_DEFAULT_CATS = ["School Fees","Dining Out","Maintenance","Other"];
export const DEFAULT_ACCOUNTS: string[] = ["Main Account","Cash","Savings Account","Joint Account","Current Account"];
export const PAYMENT_MODES: string[] = ["UPI","Cash","Card","Bank Transfer","Other"];
export const CAT_COLORS: string[]   = ["#f97316","#06b6d4","#8b5cf6","#10b981","#f43f5e","#eab308","#6366f1","#ec4899","#14b8a6","#84cc16","#ef4444","#3b82f6"];
export const NAV = [
  { id:"overview",   label:"Overview",   icon:"◎" },
  { id:"expenses",   label:"Expenses",   icon:"↓" },
  { id:"earnings",   label:"Cash In",    icon:"↑" },
  { id:"savings",    label:"Savings",    icon:"⬡" },
  { id:"credit",     label:"Credit",     icon:"⇄" },
] as const;
export const SWIPE_TABS = ["overview","expenses","earnings","credit","settings"];

// ─── localStorage ─────────────────────────────────────────────────────────────
export function lsLoad<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? (JSON.parse(r) as T) : fallback; }
  catch { return fallback; }
}
export function lsSave(key: string, val: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ }
}

// ─── Theme factory ────────────────────────────────────────────────────────────
export function makeTheme(dark: boolean): Theme {
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
export const fmt     = (n: number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
export const todayS  = () => new Date().toISOString().split("T")[0];
export const curMK   = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
export const modeMK  = (mk:string, mode:AppMode|null) => mode==="household" ? `h:${mk}` : mk;
export const stripMK = (mk:string) => mk.startsWith("h:") ? mk.slice(2) : mk;
export const fmtMK   = (mk:string) => { const clean=mk.startsWith("h:")?mk.slice(2):mk; const [y,m]=clean.split("-"); return new Date(+y,+m-1,1).toLocaleDateString("en-IN",{month:"long",year:"numeric"}); };
export const getDays = (mk:string) => { const clean=mk.startsWith("h:")?mk.slice(2):mk; const [y,m]=clean.split("-").map(Number); return new Date(y,m,0).getDate(); };
export const emptyMD = (): MonthData => ({ budget:10000, expenses:[], earnings:[], savings:[] });

// ─── Shared button base ───────────────────────────────────────────────────────
export const btnB: CSSProperties = { borderRadius:"9px",border:"none",fontWeight:600,fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"9px 18px",transition:"opacity 0.15s" };
export const btnP  = { ...btnB, background:"#6c5ce7", color:"#fff" };
export const btnG  = { ...btnB, background:"#00b894", color:"#fff" };
export const btnA  = { ...btnB, background:"#e0a800", color:"#fff" };
