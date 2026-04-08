import { Expense, Entry } from "../components/types";
import { fmtMK } from "../components/types";

export function exportCSV(params: {
  activeMK: string;
  budget: number;
  expenses: Expense[];
  earnings: Entry[];
  savings: Entry[];
  cashFlowIn: number;
  cashFlowOut: number;
  totalEarnings: number;
  totalSavings: number;
  remaining: number;
}) {
  const { activeMK, budget, expenses, earnings, savings, cashFlowIn, cashFlowOut, totalEarnings, totalSavings, remaining } = params;
  const rows: string[][] = [];
  const q = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;

  // Summary
  rows.push(["BUDGETLY EXPORT"]);
  rows.push(["Month", fmtMK(activeMK)]);
  rows.push(["Exported on", new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })]);
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
  rows.push(["Date", "Category", "Description", "Amount (INR)"]);
  if (expenses.length === 0) rows.push(["No expenses"]);
  else [...expenses].sort((a, b) => a.date.localeCompare(b.date)).forEach(e =>
    rows.push([e.date, e.category, e.description || "—", String(e.amount)])
  );
  rows.push([]);

  // Earnings
  rows.push(["CASH IN (EARNINGS)"]);
  rows.push(["Date", "Description", "Amount (INR)"]);
  if (earnings.length === 0) rows.push(["No earnings"]);
  else [...earnings].sort((a, b) => a.date.localeCompare(b.date)).forEach(e =>
    rows.push([e.date, e.description || "—", String(e.amount)])
  );
  rows.push([]);

  // Savings
  rows.push(["SAVINGS"]);
  rows.push(["Date", "Description", "Amount (INR)"]);
  if (savings.length === 0) rows.push(["No savings"]);
  else [...savings].sort((a, b) => a.date.localeCompare(b.date)).forEach(e =>
    rows.push([e.date, e.description || "—", String(e.amount)])
  );

  const csv = rows.map(r => r.map(c => q(c)).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `budgetly-${activeMK}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
