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

      {row("◎", "Overview", "Your financial snapshot for the month. Shows Cash Flow In, Cash Flow Out, Savings, and Net" + (appMode === "student" ? "/To Spend" : "") + " cards. A credits summary block also shows money owed to you and money you owe. Tap any stat card to jump directly to that tab.",
        <>{tag("Stats", "#6c5ce7")}{tag("Credits", "#e17055")}{appMode === "student" ? tag("Budget", "#e0a800") : tag("Accounts", "#06b6d4")}</>,
        appMode === "student"
          ? ["Cash Flow In, Cash Flow Out, Savings, To Spend — four main cards", "Budget progress bar shows % of monthly budget used", "Daily averages: ideal vs actual spend per day", "Credits block shows pending amounts owed to/from you", "Click any card to navigate directly to that tab", "Check overview daily to stay on track"]
          : ["Cash Flow In, Cash Flow Out, Savings, Net — four main cards", "Account breakdown shows per-account totals", "Credits block shows pending amounts owed to/from you", "Click any card to navigate directly to that tab", "Check overview daily to stay on track"]
      )}

      {row("↓", "Expenses", "Log every payment you make — amount, description, category, date, and payment mode.",
        <>{tag("Table", "#e17055")}{tag("Sortable", "#06b6d4")}{tag("Filterable", "#8b5cf6")}</>,
        [
          "Default view shows last 7 days — tap Show Full Month to see all entries",
          "Tap any row to expand full details including mode and account",
          "Edit or delete an entry directly from the expanded row",
          "Use the Filter button to search, filter by category, date range, or amount",
          "Tap + to add a new expense",
          appMode === "student"
            ? "Categories: Food, Transport, College, Entertainment, Health, Shopping, Other"
            : "Categories: Salaries, Groceries, Rent, Bills, Transport, Fees, Medical, Shopping, Entertainment, Misc",
          "Add expenses right after spending so you don't forget",
          "Use categories consistently for accurate trend data",
        ]
      )}

      {row("↑", "Cash In", "Record all money you receive — salary, pocket money, transfers, freelance, or any income.",
        <>{tag("Income", "#00b894")}{tag("Filterable", "#8b5cf6")}</>,
        [
          "Default view shows last 7 days — tap Show Full Month to see all entries",
          "Filter by description, date range, or amount",
          appMode === "household" ? "Tag to an account to track per-account income" : "Adds to Cash Flow In on Overview",
          "Log all income sources to get an accurate cash flow picture",
        ]
      )}

      {row("⬡", "Savings", "Track money you set aside each month.",
        <>{tag("Savings", "#e0a800")}</>,
        [
          "Default view shows last 7 days — tap Show Full Month to see all entries",
          "Savings are deducted from To Spend immediately",
          "View % of income saved on Overview",
          "Log savings as soon as you transfer them",
        ]
      )}

      {row("⇄", "Credits", "Track money you lent or borrowed.",
        <>{tag("They Owe Me", "#00b894")}{tag("I Owe", "#e17055")}{tag("Clearable", "#6c5ce7")}</>,
        [
          "They Owe: someone owes you money — I Owe: you owe someone",
          "Mark as Cleared when settled — auto-adds the amount to Cash In or Expenses",
          "Filter by type (They Owe / I Owe), status, or search by name",
          "Student and Household mode have completely separate credits data",
          "Log credits immediately so you never forget who owes what",
        ]
      )}

      {row("∿", "Trends", "See your spending patterns over time.",
        <>{tag("7 days", "#6c5ce7")}{tag("30 days", "#8b5cf6")}</>,
        [
          "Bar chart of daily spending — today's bar is highlighted",
          "Switch between 7-day and 30-day view",
          "See your highest spending day at a glance",
          "Category breakdown shows % of spend per category for the period",
          "Data matches your Overview totals exactly",
          "Check trends weekly to spot spending patterns early",
        ]
      )}

      {row("⚙", "Settings", "Customise Budgetly to match how you track money.",
        <>{tag("Mode", "#6c5ce7")}{tag("Categories", "#e0a800")}{appMode === "household" ? tag("Accounts", "#06b6d4") : tag("Export", "#00b894")}</>,
        [
          "Switch between Student and Household mode anytime",
          "Manage Categories: add or delete custom categories (defaults cannot be deleted)",
          appMode === "household" ? "Manage Accounts: add or delete accounts, defaults cannot be deleted" : "Export CSV: download all your data as a spreadsheet",
          "Add or delete months to manage your history",
          "Dark mode toggle",
          "Delete account: permanently removes all your data",
          "Set up your categories before logging entries for the cleanest data",
        ]
      )}

      {appMode === "student" && row("🎓", "Student Mode", "Budgeting with a monthly spending limit.",
        <>{tag("Student only", "#e0a800")}</>,
        [
          "Set a monthly budget in Settings",
          "Overview shows To Spend amount and daily spend target",
          "Budget progress bar shows how much of your budget is used",
          "Daily averages section: avg per day spent, earned, and saved",
        ]
      )}

      {appMode === "household" && row("🏠", "Household Mode", "Full transaction tracking across multiple accounts — no budget cap.",
        <>{tag("Household only", "#06b6d4")}</>,
        [
          "No budget limit — pure income and expense tracking",
          "Multiple accounts: Main Account, Cash, Savings Account, Joint Account, Current Account",
          "Tag every expense or income to an account for per-account breakdowns",
          "Overview shows account-wise totals",
          "Net surplus or deficit shown instead of To Spend",
        ]
      )}
    </div>
  );
}
