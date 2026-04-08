"use client";
import { CSSProperties, ReactNode } from "react";
import { Theme, AppMode } from "./types";

interface TutorialTabProps {
  C: Theme;
  appMode: AppMode;
}

export default function TutorialTab({ C, appMode }: TutorialTabProps) {
  const sCard: CSSProperties = { background: C.card, borderRadius: "14px", padding: "18px 20px", border: `1px solid ${C.border}`, marginBottom: "10px" };
  const tag = (txt: string, color: string) => (
    <span style={{ background: color + "22", color, fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: 700, marginRight: "4px" }}>{txt}</span>
  );
  const row = (icon: string, title: string, desc: string, tags: ReactNode, tips: string[]) => (
    <div style={sCard}>
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" }}>
        <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: C.navActive, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: "17px", color: C.text, marginBottom: "6px" }}>{title}</div>
          <div style={{ fontSize: "13px", color: C.muted, lineHeight: 1.6, marginBottom: "6px" }}>{desc}</div>
          <div>{tags}</div>
        </div>
      </div>
      {tips.length > 0 && <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {tips.map((t, i) => <div key={i} style={{ fontSize: "12px", color: C.muted, display: "flex", gap: "6px" }}><span style={{ color: C.accent, flexShrink: 0 }}>→</span>{t}</div>)}
      </div>}
    </div>
  );
  return (
    <div style={{ maxWidth: "680px" }}>
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "24px", fontWeight: 800, color: C.text, marginBottom: "6px" }}>How to use Budgetly</div>
        <div style={{ fontSize: "13px", color: C.muted }}>Quick guide · {appMode === "student" ? "🎓 Student mode" : "🏠 Household mode"}</div>
      </div>
      {row("◎", "Overview", "Your financial snapshot for the month.",
        <>{tag("Stats", "#6c5ce7")}{tag("Trends", "#00b894")}{appMode === "student" && tag("Budget", "#e0a800")}</>,
        appMode === "student"
          ? ["4 cards: Cash In, Cash Out, Savings, To Spend", "Progress bar shows % of budget used", "Daily Averages: ideal vs actual spend per day", "Category cards show where money is going"]
          : ["Cash In = total income logged", "Net = Income − Expenses", "Account breakdown shows per-account spend", "No budget limit — pure tracking"]
      )}
      {row("↓", "Expenses", "Log every payment you make.",
        <>{tag("Table", "#e17055")}{tag("Sortable", "#06b6d4")}{tag("Filterable", "#8b5cf6")}</>,
        ["Tap + to open the add form", "Click any row to see full details (mode, account)", "Sort by any column header", "Search or filter by date range using the filter bar", "✎ to edit any entry"]
      )}
      {row("↑", "Cash In", "Record money you receive.",
        <>{tag("Income", "#00b894")}{tag("Auto-UPI", "#6c5ce7")}</>,
        ["Manual entry or auto-detected from UPI SMS (Android app)", "Each entry has date, description, payment mode", appMode === "household" ? "Tag to an account to track per-account income" : "Adds to Cash Flow In on Overview"]
      )}
      {row("⬡", "Savings", "Lock away money you don't want to spend.",
        <>{tag("Savings", "#e0a800")}</>,
        ["Savings are deducted from To Spend immediately", "Add a savings entry at the start of the month as a commitment", "View % of income saved on Overview"]
      )}
      {row("⇄", "Credit", "Track who owes who.",
        <>{tag("They Owe Me", "#00b894")}{tag("I Owe", "#e17055")}</>,
        ["Mark as Cleared when settled — auto-adds to Cash In or Expenses", "Pending entries stay highlighted", "Table view — sort, filter, edit same as other tabs"]
      )}
      {row("∿", "Trends", "See your spending patterns.",
        <>{tag("7 days", "#6c5ce7")}{tag("30 days", "#8b5cf6")}</>,
        ["Bar chart of daily spending", "Switch between 7-day and 30-day view", "Category breakdown shows % of spend per category", "Today's bar is highlighted"]
      )}
      {row("⚙", "Settings", "Customise Budgetly.",
        <>{tag("Mode", "#6c5ce7")}{tag("Categories", "#e0a800")}{appMode === "household" && tag("Accounts", "#06b6d4")}</>,
        ["Switch between Student and Household mode anytime", "Manage Categories — add or remove spending categories", appMode === "household" ? "Manage Accounts — add bank accounts, wallets, cash" : "Export month data as CSV spreadsheet", "Dark mode toggle"]
      )}
    </div>
  );
}
