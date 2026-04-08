import { CSSProperties } from "react";

export interface Entry    { id: number; amount: number; description: string; date: string; }
export interface Expense extends Entry { category: string; }
export interface MonthData { budget: number; expenses: Expense[]; earnings: Entry[]; savings: Entry[]; }
export interface AllMonths { [mk: string]: MonthData; }
export interface Theme {
  bg: string; sidebar: string; card: string; cardAlt: string;
  border: string; text: string; muted: string; faint: string;
  accent: string; green: string; red: string; amber: string;
  inputBg: string; progressTrack: string; navActive: string;
  pillGreen: string; pillGreenBorder: string; pillRed: string; pillRedBorder: string;
  delBg: string; cancelBg: string; upcomingBg: string;
}
export interface CreditEntry { id: number; person: string; amount: number; description: string; date: string; type: "owed_to_me" | "i_owe"; cleared: boolean; }

export interface OvProps {
  C: Theme; budget: number; cashFlowIn: number; cashFlowOut: number; totalEarnings: number;
  totalSavings: number; remaining: number; spentPct: number;
  editingBudget: boolean; tempBudget: string;
  setEditingBudget: (v: boolean) => void; setTempBudget: (v: string) => void; saveBudget: () => void;
  expenses: Expense[]; savings: Entry[]; categories: string[];
  daysInMonth: number; todayDay: number; idealPerDay: number;
  idealSpentByToday: number; actualVsIdeal: number;
  moneyLeft: number; daysLeft: number; currentDailyAvg: number; currentIdealAvg: number;
}
export interface ExProps {
  C: Theme; expenses: Expense[]; categories: string[]; totalExpenses: number;
  expAmt: string; expCat: string; expDesc: string; expDate: string;
  setExpAmt: (v: string) => void; setExpCat: (v: string) => void;
  setExpDesc: (v: string) => void; setExpDate: (v: string) => void;
  addExpense: () => void; deleteConfirm: number | null;
  setDeleteConfirm: (v: number | null) => void;
  deleteExpense: (id: number) => void;
  updateExpense: (id: number, u: Partial<Expense>) => void;
}
export interface ErProps {
  C: Theme; earnings: Entry[]; totalEarnings: number;
  earnAmt: string; earnDesc: string; earnDate: string;
  setEarnAmt: (v: string) => void; setEarnDesc: (v: string) => void; setEarnDate: (v: string) => void;
  addEarning: () => void; deleteConfirm: number | null;
  setDeleteConfirm: (v: number | null) => void;
  deleteEarning: (id: number) => void;
  updateEarning: (id: number, u: Partial<Entry>) => void;
}
export interface SvProps {
  C: Theme; savings: Entry[]; totalSavings: number; cashFlowIn: number;
  savAmt: string; savDesc: string; savDate: string;
  setSavAmt: (v: string) => void; setSavDesc: (v: string) => void; setSavDate: (v: string) => void;
  addSaving: () => void; deleteConfirm: number | null;
  setDeleteConfirm: (v: number | null) => void;
  deleteSaving: (id: number) => void;
  updateSaving: (id: number, u: Partial<Entry>) => void;
}
export interface CaProps {
  C: Theme; categories: string[]; expenses: Expense[]; cashFlowOut: number;
  newCategory: string; setNewCategory: (v: string) => void;
  addCategory: () => void; deleteCategory: (cat: string) => void;
}
export interface CrProps {
  C: Theme; credits: CreditEntry[]; crAmt: string; crPerson: string; crDesc: string; crDate: string;
  crType: "owed_to_me" | "i_owe"; setCrAmt: (v: string) => void; setCrPerson: (v: string) => void;
  setCrDesc: (v: string) => void; setCrDate: (v: string) => void;
  setCrType: (v: "owed_to_me" | "i_owe") => void;
  addCredit: () => void; toggleCleared: (id: number) => void; deleteCredit: (id: number) => void;
  deleteConfirm: number | null; setDeleteConfirm: (v: number | null) => void;
}
export interface TrProps { C: Theme; allMonths: AllMonths; activeMK: string; categories: string[]; }

// suppress unused import warning — CSSProperties used by consumers of this file
export type { CSSProperties };
