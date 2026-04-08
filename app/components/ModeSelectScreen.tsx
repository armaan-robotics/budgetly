"use client";
import { Theme, AppMode, btnP } from "./types";

interface ModeSelectScreenProps {
  C: Theme;
  onSelect: (m: AppMode) => void;
}

export default function ModeSelectScreen({ C, onSelect }: ModeSelectScreenProps) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", padding: "20px" }}>
      <div style={{ maxWidth: "420px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "24px", fontWeight: 700, color: C.text, marginBottom: "6px" }}><span style={{ color: C.accent }}>Budget</span>ly</div>
          <div style={{ fontSize: "14px", color: C.muted }}>Choose how you want to use Budgetly</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <button onClick={() => onSelect("student")} style={{ background: C.card, border: `2px solid ${C.accent}`, borderRadius: "14px", padding: "22px 20px", cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans',sans-serif" }}>
            <div style={{ fontSize: "22px", marginBottom: "8px" }}>🎓</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: C.text, marginBottom: "6px" }}>Student</div>
            <div style={{ fontSize: "13px", color: C.muted, lineHeight: 1.7, marginBottom: "10px" }}>Set a monthly budget and track every rupee you spend. Get daily spend targets, budget progress, and category breakdowns so you always know where your money went.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {["✓ Monthly budget with daily averages", "✓ Spending categories (Food, Transport, etc.)", "✓ Trends and spending insights", "✓ Credit tracker — who owes who"].map((f, i) => (
                <div key={i} style={{ fontSize: "12px", color: C.green }}>{f}</div>
              ))}
            </div>
          </button>
          <button onClick={() => onSelect("household")} style={{ background: C.card, border: `2px solid ${C.border}`, borderRadius: "14px", padding: "22px 20px", cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans',sans-serif" }}>
            <div style={{ fontSize: "22px", marginBottom: "8px" }}>🏠</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: C.text, marginBottom: "6px" }}>Household</div>
            <div style={{ fontSize: "13px", color: C.muted, lineHeight: 1.7, marginBottom: "10px" }}>Manage your family's finances across multiple bank accounts. Track electricity bills, groceries, rent, and more. See exactly how much each account is spending — no budget limits.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {["✓ Multiple accounts (HDFC, Cash, Joint, etc.)", "✓ Household categories (Electricity, Rent, etc.)", "✓ Track income and expenses per account", "✓ No budget cap — pure transaction tracking"].map((f, i) => (
                <div key={i} style={{ fontSize: "12px", color: C.accent }}>{f}</div>
              ))}
            </div>
          </button>
        </div>
        <div style={{ marginTop: "16px", fontSize: "12px", color: C.faint, textAlign: "center" }}>You can switch modes anytime from Settings · Your data stays separate per mode</div>
      </div>
    </div>
  );
}
