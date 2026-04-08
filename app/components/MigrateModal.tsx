"use client";
import { btnP, btnB, Theme } from "./types";

interface MigrateModalProps {
  onDecide: (migrate: boolean) => void;
  C: Theme;
}

export default function MigrateModal({ onDecide, C }: MigrateModalProps) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ background: C.card, borderRadius: "16px", padding: "36px", maxWidth: "380px", width: "90%", border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: "22px", fontWeight: 800, color: C.text, marginBottom: "8px" }}>Import your existing data?</div>
        <div style={{ fontSize: "13px", color: C.muted, lineHeight: 1.7, marginBottom: "20px" }}>We found budget data saved locally on this device from before you had an account. Import it now so it syncs across all your devices?</div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => onDecide(true)}  style={{ ...btnP, flex: 1, padding: "11px" }}>Yes, import</button>
          <button onClick={() => onDecide(false)} style={{ ...btnB, flex: 1, padding: "11px", background: C.cancelBg, color: C.muted }}>Start fresh</button>
        </div>
      </div>
    </div>
  );
}
