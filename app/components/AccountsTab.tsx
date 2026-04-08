"use client";
import { CSSProperties } from "react";
import { FF } from "./primitives";
import { CAT_COLORS, DEFAULT_ACCOUNTS, Theme, Expense, Entry, btnB, btnP, fmt } from "./types";

interface AccountsTabProps {
  C: Theme;
  accounts: string[];
  expenses: Expense[];
  earnings: Entry[];
  savings: Entry[];
  newAccount: string;
  setNewAccount: (v: string) => void;
  addAccount: () => void;
  deleteAccount: (a: string) => void;
}

export default function AccountsTab({ C, accounts, expenses, earnings, savings, newAccount, setNewAccount, addAccount, deleteAccount }: AccountsTabProps) {
  const DEFAULT_ACCS = DEFAULT_ACCOUNTS;
  const sInput: CSSProperties = { width: "100%", padding: "9px 13px", borderRadius: "9px", border: `1.5px solid ${C.border}`, background: C.inputBg, color: C.text, fontSize: "14px", outline: "none", boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background: C.card, borderRadius: "16px", padding: "32px", border: `1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize: "11px", color: C.muted, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "16px", fontWeight: 800 };
  return (
    <div style={{ maxWidth: "680px" }}>
      <div style={{ ...sCard, marginBottom: "14px" }}>
        <div style={sSecT}>Add Account</div>
        <FF label="Account Name" C={C}><input type="text" placeholder="e.g. HDFC Savings, Cash…" value={newAccount} onChange={e => setNewAccount(e.target.value)} style={sInput} /></FF>
        <button onClick={addAccount} style={{ ...btnP, width: "100%", padding: "11px" }}>+ Add Account</button>
        <div style={{ fontSize: "11px", color: C.faint, marginTop: "10px" }}>Default accounts cannot be deleted.</div>
      </div>
      <div style={sCard}>
        <div style={sSecT}>{accounts.length} Accounts</div>
        {accounts.map((acc, i) => {
          const color = CAT_COLORS[i % CAT_COLORS.length];
          const totalOut = expenses.filter(e => e.account === acc).reduce((s, e) => s + e.amount, 0);
          const totalIn  = earnings.filter(e => (e as any).account === acc).reduce((s, e) => s + e.amount, 0);
          const totalSav = savings.filter(e => (e as any).account === acc).reduce((s, e) => s + e.amount, 0);
          const isDef = DEFAULT_ACCS.includes(acc);
          return (
            <div key={acc} style={{ display: "flex", alignItems: "center", gap: "10px", background: C.cardAlt, borderRadius: "10px", padding: "12px 14px", border: `1px solid ${C.border}`, marginBottom: "8px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 500, color: C.text }}>{acc}</div>
                <div style={{ fontSize: "11px", color: C.faint, marginTop: "2px" }}>
                  Out: {fmt(totalOut)} · In: {fmt(totalIn)} · Saved: {fmt(totalSav)}{isDef ? " · default" : ""}
                </div>
              </div>
              {!isDef && <button onClick={() => deleteAccount(acc)} style={{ ...btnB, background: C.delBg, color: C.red, padding: "5px 10px", fontSize: "11px" }}>✕</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
