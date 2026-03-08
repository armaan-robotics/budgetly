"use client";

import { useState, useEffect, ReactNode, CSSProperties } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Entry {
  id: number;
  amount: number;
  description: string;
  date: string;
}
interface Expense extends Entry {
  category: string;
}
interface StyleMap {
  input: CSSProperties;
  btnPrimary: CSSProperties;
  btnGreen: CSSProperties;
  btnAmber: CSSProperties;
  card: CSSProperties;
  label: CSSProperties;
  sectionTitle: CSSProperties;
}

// ── localStorage helpers ──────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES: string[] = ["Food", "Transport", "College", "Entertainment", "Health", "Shopping", "Other"];

const CATEGORY_COLORS: string[] = [
  "#F97316","#06B6D4","#8B5CF6","#10B981","#F43F5E","#FBBF24",
  "#6366F1","#EC4899","#14B8A6","#84CC16","#EF4444","#3B82F6",
];

const NAV_ITEMS = [
  { id: "overview",   label: "Overview",   icon: "◎" },
  { id: "expenses",   label: "Expenses",   icon: "↓" },
  { id: "earnings",   label: "Cash In",    icon: "↑" },
  { id: "savings",    label: "Savings",    icon: "⬡" },
  { id: "categories", label: "Categories", icon: "▦" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatINR = (amount: number): string =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const getDaysInMonth = (): number => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
};
const getCurrentDay = (): number => new Date().getDate();
const todayStr = (): string => new Date().toISOString().split("T")[0];

// ── Main component ────────────────────────────────────────────────────────────
export default function BudgetTrackerDesktop() {
  const [activeTab,     setActiveTab]     = useState<string>("overview");
  const [budget,        setBudget]        = useState<number>(() => load<number>("budgetly_budget", 10000));
  const [editingBudget, setEditingBudget] = useState<boolean>(false);
  const [tempBudget,    setTempBudget]    = useState<string>(() => String(load<number>("budgetly_budget", 10000)));

  const [expenses,   setExpenses]   = useState<Expense[]>(() => load<Expense[]>("budgetly_expenses",  []));
  const [earnings,   setEarnings]   = useState<Entry[]>(  () => load<Entry[]>  ("budgetly_earnings",  []));
  const [savings,    setSavings]    = useState<Entry[]>(  () => load<Entry[]>  ("budgetly_savings",   []));
  const [categories, setCategories] = useState<string[]>( () => load<string[]> ("budgetly_categories", DEFAULT_CATEGORIES));
  const [newCategory,  setNewCategory]  = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const today = todayStr();
  const [expenseForm, setExpenseForm] = useState({ amount: "", category: DEFAULT_CATEGORIES[0], description: "", date: today });
  const [earningForm, setEarningForm] = useState({ amount: "", description: "", date: today });
  const [savingForm,  setSavingForm]  = useState({ amount: "", description: "", date: today });

  // ── Persist ───────────────────────────────────────────────────────────────
  useEffect(() => { save("budgetly_budget",     budget);     }, [budget]);
  useEffect(() => { save("budgetly_expenses",   expenses);   }, [expenses]);
  useEffect(() => { save("budgetly_earnings",   earnings);   }, [earnings]);
  useEffect(() => { save("budgetly_savings",    savings);    }, [savings]);
  useEffect(() => { save("budgetly_categories", categories); }, [categories]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const totalExpenses     = expenses.reduce((s, e) => s + e.amount, 0);
  const totalEarnings     = earnings.reduce((s, e) => s + e.amount, 0);
  const totalSavings      = savings.reduce ((s, e) => s + e.amount, 0);
  const cashFlowIn        = budget + totalEarnings;
  const cashFlowOut       = totalExpenses;
  const remaining         = cashFlowIn - cashFlowOut - totalSavings;
  const spentPercent      = cashFlowIn > 0 ? Math.min((cashFlowOut / cashFlowIn) * 100, 100) : 0;
  const daysInMonth       = getDaysInMonth();
  const idealPerDay       = Math.round(cashFlowIn / daysInMonth);
  const todayDay          = getCurrentDay();
  const idealSpentByToday = idealPerDay * todayDay;
  const actualVsIdeal     = cashFlowOut - idealSpentByToday;

  const categoryTotals = categories.map((cat, i) => ({
    name:  cat,
    total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    count: expenses.filter(e => e.category === cat).length,
  }));

  // ── Actions ───────────────────────────────────────────────────────────────
  const addExpense = () => {
    if (!expenseForm.amount || isNaN(Number(expenseForm.amount))) return;
    setExpenses([...expenses, { id: Date.now(), amount: parseFloat(expenseForm.amount), category: expenseForm.category, description: expenseForm.description, date: expenseForm.date }]);
    setExpenseForm({ amount: "", category: categories[0] ?? DEFAULT_CATEGORIES[0], description: "", date: today });
  };
  const addEarning = () => {
    if (!earningForm.amount || isNaN(Number(earningForm.amount))) return;
    setEarnings([...earnings, { id: Date.now(), amount: parseFloat(earningForm.amount), description: earningForm.description, date: earningForm.date }]);
    setEarningForm({ amount: "", description: "", date: today });
  };
  const addSaving = () => {
    if (!savingForm.amount || isNaN(Number(savingForm.amount))) return;
    setSavings([...savings, { id: Date.now(), amount: parseFloat(savingForm.amount), description: savingForm.description, date: savingForm.date }]);
    setSavingForm({ amount: "", description: "", date: today });
  };
  const deleteExpense  = (id: number) => { setExpenses(expenses.filter(e => e.id !== id));  setDeleteConfirm(null); };
  const deleteEarning  = (id: number) => { setEarnings(earnings.filter(e => e.id !== id));  setDeleteConfirm(null); };
  const deleteSaving   = (id: number) => { setSavings (savings.filter (e => e.id !== id));  setDeleteConfirm(null); };
  const addCategory    = () => {
    const t = newCategory.trim();
    if (!t || categories.includes(t)) return;
    setCategories([...categories, t]);
    setNewCategory("");
  };
  const deleteCategory = (cat: string) => {
    if (DEFAULT_CATEGORIES.includes(cat)) return;
    setCategories(categories.filter(c => c !== cat));
  };
  const saveBudget = () => {
    const val = parseFloat(tempBudget);
    if (!isNaN(val) && val > 0) { setBudget(val); setTempBudget(String(val)); }
    setEditingBudget(false);
  };
  const clearAllData = () => {
    if (!window.confirm("Reset ALL data? This cannot be undone.")) return;
    setBudget(10000); setTempBudget("10000");
    setExpenses([]); setEarnings([]); setSavings([]);
    setCategories(DEFAULT_CATEGORIES);
    ["budgetly_budget","budgetly_expenses","budgetly_earnings","budgetly_savings","budgetly_categories"]
      .forEach(k => localStorage.removeItem(k));
  };

  // ── Style tokens ──────────────────────────────────────────────────────────
  const S: StyleMap = {
    input: {
      width: "100%", padding: "10px 14px", borderRadius: "10px",
      border: "1.5px solid #222236", background: "#0d0d1a", color: "#e8e8f0",
      fontSize: "14px", outline: "none", boxSizing: "border-box",
      fontFamily: "'DM Sans', sans-serif",
    },
    btnPrimary: {
      padding: "10px 20px", borderRadius: "10px", border: "none",
      background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
      color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif",
    },
    btnGreen: {
      padding: "10px 20px", borderRadius: "10px", border: "none",
      background: "linear-gradient(135deg, #059669, #10b981)",
      color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif",
    },
    btnAmber: {
      padding: "10px 20px", borderRadius: "10px", border: "none",
      background: "linear-gradient(135deg, #b45309, #f59e0b)",
      color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif",
    },
    card: {
      background: "#11111e", borderRadius: "16px", padding: "22px",
      border: "1px solid #1c1c2e",
    },
    label: {
      display: "block", fontSize: "11px", color: "#5a5a7a",
      letterSpacing: "1.4px", textTransform: "uppercase", marginBottom: "7px",
    },
    sectionTitle: {
      fontSize: "11px", color: "#5a5a7a", letterSpacing: "2px",
      textTransform: "uppercase", marginBottom: "14px",
    },
  };

  // ── Sub-components ────────────────────────────────────────────────────────
  const StatCard = ({ label, value, color, sub, accent }: { label: string; value: string; color: string; sub?: string; accent?: string }) => (
    <div style={{ ...S.card, borderLeft: `3px solid ${accent ?? color}` }}>
      <div style={{ fontSize: "11px", color: "#5a5a7a", letterSpacing: "1.4px", textTransform: "uppercase", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "26px", fontWeight: 800, color, fontFamily: "'Syne', sans-serif", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: "#3a3a55", marginTop: "6px" }}>{sub}</div>}
    </div>
  );

  const FormField = ({ label, children }: { label: string; children: ReactNode }) => (
    <div style={{ marginBottom: "14px" }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );

  const DeleteBtn = ({ id, onDelete }: { id: number; onDelete: (id: number) => void }) =>
    deleteConfirm === id ? (
      <div style={{ display: "flex", gap: "6px" }}>
        <button onClick={() => onDelete(id)} style={{ background: "#f43f5e22", border: "none", color: "#f43f5e", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}>Delete</button>
        <button onClick={() => setDeleteConfirm(null)} style={{ background: "#1e1e30", border: "none", color: "#5a5a7a", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", fontSize: "12px" }}>Cancel</button>
      </div>
    ) : (
      <button
        onClick={() => setDeleteConfirm(id)}
        style={{ background: "none", border: "1px solid #1e1e30", color: "#3a3a55", cursor: "pointer", fontSize: "13px", borderRadius: "8px", padding: "5px 10px" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#f43f5e44"; (e.currentTarget as HTMLButtonElement).style.color = "#f43f5e"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e1e30"; (e.currentTarget as HTMLButtonElement).style.color = "#3a3a55"; }}
      >✕</button>
    );

  const TableRow = ({ children, isHeader }: { children: ReactNode; isHeader?: boolean }) => (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr 140px 110px 90px",
      gap: "12px", padding: "13px 16px", alignItems: "center",
      background: isHeader ? "transparent" : "#0d0d1a",
      borderRadius: isHeader ? undefined : "10px",
      border: isHeader ? "none" : "1px solid #1a1a2a",
      marginBottom: "6px",
    }}>
      {children}
    </div>
  );

  // ── Overview ──────────────────────────────────────────────────────────────
  const OverviewTab = () => (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
        <StatCard label="Cash Flow In"  value={formatINR(cashFlowIn)}  color="#10b981" accent="#10b981" sub={`Budget + ${formatINR(totalEarnings)} earned`} />
        <StatCard label="Cash Flow Out" value={formatINR(cashFlowOut)} color="#f43f5e" accent="#f43f5e" sub={`${expenses.length} expense${expenses.length !== 1 ? "s" : ""}`} />
        <StatCard label="Total Savings" value={formatINR(totalSavings)} color="#f59e0b" accent="#f59e0b" sub={`${savings.length} entr${savings.length !== 1 ? "ies" : "y"}`} />
        <StatCard label="Net Balance"   value={formatINR(remaining)}   color={remaining >= 0 ? "#10b981" : "#f43f5e"} accent={remaining >= 0 ? "#10b981" : "#f43f5e"} sub={remaining >= 0 ? "You're on track 👍" : "Over budget ⚠"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "16px", marginBottom: "20px" }}>
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <div style={S.sectionTitle}>Monthly Budget</div>
              {editingBudget ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input value={tempBudget} onChange={e => setTempBudget(e.target.value)} style={{ ...S.input, width: "160px" }} type="number" />
                  <button onClick={saveBudget} style={S.btnPrimary}>Save</button>
                  <button onClick={() => setEditingBudget(false)} style={{ ...S.btnPrimary, background: "#1e1e30" }}>✕</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                  <span style={{ fontSize: "32px", fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>{formatINR(budget)}</span>
                  <button onClick={() => { setEditingBudget(true); setTempBudget(String(budget)); }} style={{ background: "none", border: "1px solid #2a2a3a", color: "#7c3aed", cursor: "pointer", borderRadius: "8px", padding: "4px 12px", fontSize: "13px", fontWeight: 600 }}>Edit</button>
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={S.sectionTitle}>Spent</div>
              <div style={{ fontSize: "32px", fontWeight: 800, fontFamily: "'Syne', sans-serif", color: spentPercent > 80 ? "#f43f5e" : "#e8e8f0" }}>{spentPercent.toFixed(1)}%</div>
            </div>
          </div>
          <div style={{ background: "#1a1a2e", borderRadius: "8px", height: "12px", overflow: "hidden", marginBottom: "10px" }}>
            <div style={{ height: "100%", borderRadius: "8px", transition: "width 0.6s ease", background: spentPercent > 80 ? "linear-gradient(90deg,#f43f5e,#ff6b6b)" : "linear-gradient(90deg,#7c3aed,#4f46e5)", width: `${spentPercent}%` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: "#5a5a7a" }}>Spent: {formatINR(cashFlowOut)}</span>
            <span style={{ fontSize: "13px", color: "#5a5a7a" }}>of {formatINR(cashFlowIn)}</span>
          </div>
        </div>

        <div style={{ ...S.card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={S.sectionTitle}>Daily Average</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0", textAlign: "center" }}>
            <div style={{ padding: "8px" }}>
              <div style={{ fontSize: "11px", color: "#5a5a7a", marginBottom: "8px" }}>Ideal / day</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#7c3aed", fontFamily: "'Syne', sans-serif" }}>{formatINR(idealPerDay)}</div>
            </div>
            <div style={{ padding: "8px", borderLeft: "1px solid #1c1c2e", borderRight: "1px solid #1c1c2e" }}>
              <div style={{ fontSize: "11px", color: "#5a5a7a", marginBottom: "8px" }}>Day {todayDay} / {daysInMonth}</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#e8e8f0", fontFamily: "'Syne', sans-serif" }}>{formatINR(idealSpentByToday)}</div>
              <div style={{ fontSize: "11px", color: "#3a3a55", marginTop: "4px" }}>ideal by now</div>
            </div>
            <div style={{ padding: "8px" }}>
              <div style={{ fontSize: "11px", color: "#5a5a7a", marginBottom: "8px" }}>vs Ideal</div>
              <div style={{ fontSize: "22px", fontWeight: 800, color: actualVsIdeal > 0 ? "#f43f5e" : "#10b981", fontFamily: "'Syne', sans-serif" }}>
                {actualVsIdeal > 0 ? "+" : ""}{formatINR(actualVsIdeal)}
              </div>
            </div>
          </div>
          <div style={{ background: actualVsIdeal > 0 ? "#f43f5e11" : "#10b98111", borderRadius: "10px", padding: "10px 14px", textAlign: "center" }}>
            <span style={{ fontSize: "13px", color: actualVsIdeal > 0 ? "#f43f5e" : "#10b981", fontWeight: 600 }}>
              {actualVsIdeal > 0
                ? `⚠ You're ${formatINR(actualVsIdeal)} over your daily pace`
                : `✓ You're ${formatINR(Math.abs(actualVsIdeal))} under your daily pace`}
            </span>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Spending by Category</div>
        {categoryTotals.filter(c => c.total > 0).length === 0 ? (
          <div style={{ color: "#3a3a55", textAlign: "center", padding: "24px" }}>No expenses yet</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
            {categoryTotals.filter(c => c.total > 0).map(cat => (
              <div key={cat.name} style={{ background: "#0d0d1a", borderRadius: "12px", padding: "16px", border: `1px solid ${cat.color}22` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: cat.color }} />
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#c0c0d8" }}>{cat.name}</span>
                  </div>
                  <span style={{ fontSize: "12px", color: "#5a5a7a" }}>{cat.count} item{cat.count !== 1 ? "s" : ""}</span>
                </div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: cat.color, marginBottom: "8px" }}>{formatINR(cat.total)}</div>
                <div style={{ background: "#1a1a2e", borderRadius: "6px", height: "5px" }}>
                  <div style={{ height: "100%", borderRadius: "6px", background: cat.color, width: `${cashFlowOut > 0 ? Math.min((cat.total / cashFlowOut) * 100, 100) : 0}%` }} />
                </div>
                <div style={{ fontSize: "11px", color: "#3a3a55", marginTop: "5px" }}>
                  {cashFlowOut > 0 ? ((cat.total / cashFlowOut) * 100).toFixed(1) : 0}% of spending
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Expenses ──────────────────────────────────────────────────────────────
  const ExpensesTab = () => (
    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px" }}>
      <div>
        <div style={S.card}>
          <div style={{ ...S.sectionTitle, marginBottom: "18px" }}>Add Expense</div>
          <FormField label="Amount (₹) *">
            <input type="number" placeholder="0" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} style={S.input} />
          </FormField>
          <FormField label="Category">
            <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} style={{ ...S.input, appearance: "none", cursor: "pointer" }}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Description">
            <input type="text" placeholder="What did you spend on?" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} style={S.input} />
          </FormField>
          <FormField label="Date">
            <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} style={S.input} />
          </FormField>
          <button onClick={addExpense} style={{ ...S.btnPrimary, width: "100%", padding: "13px" }}>+ Add Expense</button>
        </div>
        <div style={{ ...S.card, marginTop: "14px", textAlign: "center" }}>
          <div style={S.sectionTitle}>Total Expenses</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#f43f5e", fontFamily: "'Syne', sans-serif" }}>{formatINR(totalExpenses)}</div>
          <div style={{ fontSize: "12px", color: "#3a3a55", marginTop: "4px" }}>{expenses.length} entries</div>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.sectionTitle}>All Expenses</div>
        <TableRow isHeader>
          <span style={{ fontSize: "11px", color: "#5a5a7a", letterSpacing: "1px", textTransform: "uppercase" }}>Description</span>
          <span style={{ fontSize: "11px", color: "#5a5a7a", letterSpacing: "1px", textTransform: "uppercase" }}>Category</span>
          <span style={{ fontSize: "11px", color: "#5a5a7a", letterSpacing: "1px", textTransform: "uppercase" }}>Date</span>
          <span style={{ fontSize: "11px", color: "#5a5a7a", letterSpacing: "1px", textTransform: "uppercase", textAlign: "right" }}>Amount</span>
          <span></span>
        </TableRow>
        {expenses.length === 0 && <div style={{ textAlign: "center", color: "#3a3a55", padding: "40px" }}>No expenses yet</div>}
        {[...expenses].reverse().map(exp => {
          const ci = categories.indexOf(exp.category);
          const color = CATEGORY_COLORS[ci >= 0 ? ci % CATEGORY_COLORS.length : 0];
          return (
            <TableRow key={exp.id}>
              <span style={{ fontSize: "14px", color: "#c0c0d8" }}>{exp.description || "—"}</span>
              <span><span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "20px", background: color + "22", color, fontWeight: 600 }}>{exp.category}</span></span>
              <span style={{ fontSize: "13px", color: "#5a5a7a" }}>{exp.date}</span>
              <span style={{ fontSize: "15px", fontWeight: 800, color: "#f43f5e", textAlign: "right" }}>-{formatINR(exp.amount)}</span>
              <div style={{ display: "flex", justifyContent: "flex-end" }}><DeleteBtn id={exp.id} onDelete={deleteExpense} /></div>
            </TableRow>
          );
        })}
      </div>
    </div>
  );

  // ── Earnings ──────────────────────────────────────────────────────────────
  const EarningsTab = () => (
    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px" }}>
      <div>
        <div style={S.card}>
          <div style={{ ...S.sectionTitle, marginBottom: "18px" }}>Add Income</div>
          <FormField label="Amount (₹) *">
            <input type="number" placeholder="0" value={earningForm.amount} onChange={e => setEarningForm({ ...earningForm, amount: e.target.value })} style={S.input} />
          </FormField>
          <FormField label="Description">
            <input type="text" placeholder="Source of income" value={earningForm.description} onChange={e => setEarningForm({ ...earningForm, description: e.target.value })} style={S.input} />
          </FormField>
          <FormField label="Date">
            <input type="date" value={earningForm.date} onChange={e => setEarningForm({ ...earningForm, date: e.target.value })} style={S.input} />
          </FormField>
          <button onClick={addEarning} style={{ ...S.btnGreen, width: "100%", padding: "13px" }}>+ Add Income</button>
        </div>
        <div style={{ ...S.card, marginTop: "14px", textAlign: "center" }}>
          <div style={S.sectionTitle}>Total Earnings</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#10b981", fontFamily: "'Syne', sans-serif" }}>{formatINR(totalEarnings)}</div>
          <div style={{ fontSize: "12px", color: "#3a3a55", marginTop: "4px" }}>{earnings.length} entries</div>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.sectionTitle}>All Income</div>
        <TableRow isHeader>
          <span style={{ fontSize: "11px", color: "#5a5a7a", letterSpacing: "1px", textTransform: "uppercase" }}>Description</span>
          <span></span>
          <span style={{ fontSize: "11px", color: "#5a5a7a", letterSpacing: "1px", textTransform: "uppercase" }}>Date</span>
          <span style={{ fontSize: "11px", color: "#5a5a7a", letterSpacing: "1px", textTransform: "uppercase", textAlign: "right" }}>Amount</span>
          <span></span>
        </TableRow>
        {earnings.length === 0 && <div style={{ textAlign: "center", color: "#3a3a55", padding: "40px" }}>No income entries yet</div>}
        {[...earnings].reverse().map(earn => (
          <TableRow key={earn.id}>
            <span style={{ fontSize: "14px", color: "#c0c0d8", gridColumn: "span 2" }}>{earn.description || "Income"}</span>
            <span style={{ fontSize: "13px", color: "#5a5a7a" }}>{earn.date}</span>
            <span style={{ fontSize: "15px", fontWeight: 800, color: "#10b981", textAlign: "right" }}>+{formatINR(earn.amount)}</span>
            <div style={{ display: "flex", justifyContent: "flex-end" }}><DeleteBtn id={earn.id} onDelete={deleteEarning} /></div>
          </TableRow>
        ))}
      </div>
    </div>
  );

  // ── Savings ───────────────────────────────────────────────────────────────
  const SavingsTab = () => (
    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px" }}>
      <div>
        <div style={S.card}>
          <div style={{ ...S.sectionTitle, marginBottom: "18px" }}>Add Saving</div>
          <FormField label="Amount (₹) *">
            <input type="number" placeholder="0" value={savingForm.amount} onChange={e => setSavingForm({ ...savingForm, amount: e.target.value })} style={S.input} />
          </FormField>
          <FormField label="Description">
            <input type="text" placeholder="What are you saving for?" value={savingForm.description} onChange={e => setSavingForm({ ...savingForm, description: e.target.value })} style={S.input} />
          </FormField>
          <FormField label="Date">
            <input type="date" value={savingForm.date} onChange={e => setSavingForm({ ...savingForm, date: e.target.value })} style={S.input} />
          </FormField>
          <button onClick={addSaving} style={{ ...S.btnAmber, width: "100%", padding: "13px" }}>+ Add Saving</button>
        </div>
        <div style={{ ...S.card, marginTop: "14px", textAlign: "center", background: "linear-gradient(135deg, #1a1008, #11111e)", border: "1px solid #2a1f08" }}>
          <div style={S.sectionTitle}>Total Saved</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#f59e0b", fontFamily: "'Syne', sans-serif" }}>{formatINR(totalSavings)}</div>
          <div style={{ fontSize: "12px", color: "#3a3a55", marginTop: "4px" }}>{cashFlowIn > 0 ? ((totalSavings / cashFlowIn) * 100).toFixed(1) : 0}% of cash flow in</div>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.sectionTitle}>All Savings</div>
        <TableRow isHeader>
          <span style={{ fontSize: "11px", color: "#5a5a7a", letterSpacing: "1px", textTransform: "uppercase" }}>Description</span>
          <span></span>
          <span style={{ fontSize: "11px", color: "#5a5a7a", letterSpacing: "1px", textTransform: "uppercase" }}>Date</span>
          <span style={{ fontSize: "11px", color: "#5a5a7a", letterSpacing: "1px", textTransform: "uppercase", textAlign: "right" }}>Amount</span>
          <span></span>
        </TableRow>
        {savings.length === 0 && <div style={{ textAlign: "center", color: "#3a3a55", padding: "40px" }}>No savings yet</div>}
        {[...savings].reverse().map(sav => (
          <TableRow key={sav.id}>
            <span style={{ fontSize: "14px", color: "#c0c0d8", gridColumn: "span 2" }}>{sav.description || "Savings"}</span>
            <span style={{ fontSize: "13px", color: "#5a5a7a" }}>{sav.date}</span>
            <span style={{ fontSize: "15px", fontWeight: 800, color: "#f59e0b", textAlign: "right" }}>{formatINR(sav.amount)}</span>
            <div style={{ display: "flex", justifyContent: "flex-end" }}><DeleteBtn id={sav.id} onDelete={deleteSaving} /></div>
          </TableRow>
        ))}
      </div>
    </div>
  );

  // ── Categories ────────────────────────────────────────────────────────────
  const CategoriesTab = () => (
    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px" }}>
      <div style={S.card}>
        <div style={{ ...S.sectionTitle, marginBottom: "18px" }}>Add Category</div>
        <FormField label="Category Name">
          <input type="text" placeholder="e.g. Rent, Subscriptions…" value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCategory()} style={S.input} />
        </FormField>
        <button onClick={addCategory} style={{ ...S.btnPrimary, width: "100%", padding: "13px" }}>+ Add Category</button>
        <p style={{ fontSize: "12px", color: "#3a3a55", marginTop: "12px", lineHeight: 1.6 }}>
          Default categories cannot be deleted. Custom ones can be removed if they have no expenses assigned.
        </p>
      </div>
      <div style={S.card}>
        <div style={S.sectionTitle}>{categories.length} Categories</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
          {categories.map((cat, i) => {
            const total = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
            const count = expenses.filter(e => e.category === cat).length;
            const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
            const isDefault = DEFAULT_CATEGORIES.includes(cat);
            return (
              <div key={cat} style={{ background: "#0d0d1a", borderRadius: "12px", padding: "16px", border: `1px solid ${color}22`, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#e8e8f0", flex: 1 }}>{cat}</span>
                  {!isDefault && (
                    <button onClick={() => deleteCategory(cat)}
                      style={{ background: "none", border: "none", color: "#3a3a55", cursor: "pointer", fontSize: "13px" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f43f5e"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#3a3a55"; }}>✕</button>
                  )}
                </div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: total > 0 ? color : "#2a2a3a", marginBottom: "4px" }}>{formatINR(total)}</div>
                <div style={{ fontSize: "11px", color: "#3a3a55" }}>
                  {count} expense{count !== 1 ? "s" : ""}
                  {isDefault && <span style={{ marginLeft: "6px", color: "#2a2a3a" }}>· default</span>}
                </div>
                {cashFlowOut > 0 && total > 0 && (
                  <>
                    <div style={{ background: "#1a1a2e", borderRadius: "6px", height: "4px", marginTop: "10px" }}>
                      <div style={{ height: "100%", borderRadius: "6px", background: color, width: `${Math.min((total / cashFlowOut) * 100, 100)}%` }} />
                    </div>
                    <div style={{ fontSize: "11px", color: "#3a3a55", marginTop: "4px" }}>
                      {((total / cashFlowOut) * 100).toFixed(1)}% of spending
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#09090f", color: "#e8e8f0", fontFamily: "'DM Sans', sans-serif", display: "flex" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside style={{ width: "220px", minHeight: "100vh", background: "#0b0b18", borderRight: "1px solid #14142a", display: "flex", flexDirection: "column", padding: "28px 0", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "0 20px 32px" }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.5px" }}>
            <span style={{ color: "#7c3aed" }}>Budget</span><span style={{ color: "#e8e8f0" }}>ly</span>
          </div>
          <div style={{ fontSize: "11px", color: "#3a3a55", marginTop: "2px", letterSpacing: "1px" }}>
            {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </div>
        </div>

        <div style={{ margin: "0 14px 28px", background: remaining >= 0 ? "#10b98115" : "#f43f5e15", borderRadius: "12px", padding: "14px 16px", border: `1px solid ${remaining >= 0 ? "#10b98130" : "#f43f5e30"}` }}>
          <div style={{ fontSize: "10px", color: "#5a5a7a", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "4px" }}>Net Balance</div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: remaining >= 0 ? "#10b981" : "#f43f5e", fontFamily: "'Syne', sans-serif" }}>{formatINR(remaining)}</div>
        </div>

        <nav style={{ flex: 1, padding: "0 10px" }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} style={{
              width: "100%", padding: "11px 14px", borderRadius: "10px", border: "none",
              background: activeTab === item.id ? "linear-gradient(135deg,#7c3aed22,#4f46e522)" : "transparent",
              color: activeTab === item.id ? "#a78bfa" : "#5a5a7a",
              fontWeight: activeTab === item.id ? 700 : 500,
              fontSize: "14px", cursor: "pointer", textAlign: "left",
              display: "flex", alignItems: "center", gap: "10px",
              marginBottom: "4px", fontFamily: "'DM Sans', sans-serif",
              borderLeft: activeTab === item.id ? "2px solid #7c3aed" : "2px solid transparent",
            }}>
              <span style={{ fontSize: "16px", width: "20px", textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: "20px 20px 0", borderTop: "1px solid #14142a" }}>
          <div style={{ fontSize: "11px", color: "#3a3a55", lineHeight: 1.6, marginBottom: "12px" }}>
            Built for college students 🎓<br />Track · Save · Grow
          </div>
          <button onClick={clearAllData} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #2a1a1a", background: "transparent", color: "#3a2a2a", cursor: "pointer", fontSize: "11px", fontFamily: "'DM Sans', sans-serif" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#f43f5e44"; (e.currentTarget as HTMLButtonElement).style.color = "#f43f5e"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a1a1a"; (e.currentTarget as HTMLButtonElement).style.color = "#3a2a2a"; }}>
            ↺ Reset all data
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", minHeight: "100vh" }}>
        <div style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
              {NAV_ITEMS.find(n => n.id === activeTab)?.label}
            </h1>
            <div style={{ fontSize: "13px", color: "#5a5a7a", marginTop: "4px" }}>
              {activeTab === "overview"   && "Your complete financial snapshot for this month"}
              {activeTab === "expenses"   && "Log and manage every rupee you spend"}
              {activeTab === "earnings"   && "Track all your income and allowances"}
              {activeTab === "savings"    && "Record what you're setting aside"}
              {activeTab === "categories" && "Organise your spending into categories"}
            </div>
          </div>
          <div style={{ fontSize: "13px", color: "#3a3a55", textAlign: "right" }}>
            Day {todayDay} of {daysInMonth}<br />
            <span style={{ color: "#5a5a7a" }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</span>
          </div>
        </div>

        {activeTab === "overview"   && <OverviewTab />}
        {activeTab === "expenses"   && <ExpensesTab />}
        {activeTab === "earnings"   && <EarningsTab />}
        {activeTab === "savings"    && <SavingsTab />}
        {activeTab === "categories" && <CategoriesTab />}
      </main>
    </div>
  );
}
