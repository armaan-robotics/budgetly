"use client";
import { ReactNode, useState, useEffect, useRef } from "react";
import { Theme, AppMode } from "./types";

interface MobileDrawerProps {
  C: Theme;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
  appMode: AppMode | null;
  children: ReactNode;
}

const ANIM_CSS = `
  @keyframes mdSlideIn {
    from { opacity: 0; transform: translateX(52px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes mdFadeOut {
    from { opacity: 1; }
    to   { opacity: 0; }
  }
  @keyframes mdBgIn {
    from { background-color: rgba(0,0,0,0); }
    to   { background-color: rgba(0,0,0,0.35); }
  }
  @keyframes mdBgOut {
    from { background-color: rgba(0,0,0,0.35); }
    to   { background-color: rgba(0,0,0,0); }
  }

  /* Backdrop fade */
  .mdrawer-overlay-in  { animation: mdBgIn  300ms ease forwards; }
  .mdrawer-overlay-out { animation: mdBgOut 200ms ease forwards; }

  /* Panel close */
  .mdrawer-panel-out { animation: mdFadeOut 200ms ease forwards; }

  /* Nav item staggered fly-in: targets every direct child of <nav> */
  .mdrawer-panel-in nav > * {
    animation: mdSlideIn 400ms cubic-bezier(0, 0.9, 0.57, 1) both;
  }
  .mdrawer-panel-in nav > *:nth-child(1)  { animation-delay:   0ms; }
  .mdrawer-panel-in nav > *:nth-child(2)  { animation-delay:  80ms; }
  .mdrawer-panel-in nav > *:nth-child(3)  { animation-delay: 160ms; }
  .mdrawer-panel-in nav > *:nth-child(4)  { animation-delay: 240ms; }
  .mdrawer-panel-in nav > *:nth-child(5)  { animation-delay: 320ms; }
  .mdrawer-panel-in nav > *:nth-child(6)  { animation-delay: 400ms; }
  .mdrawer-panel-in nav > *:nth-child(7)  { animation-delay: 480ms; }
  .mdrawer-panel-in nav > *:nth-child(8)  { animation-delay: 560ms; }
  .mdrawer-panel-in nav > *:nth-child(9)  { animation-delay: 640ms; }
  .mdrawer-panel-in nav > *:nth-child(10) { animation-delay: 720ms; }
  .mdrawer-panel-in nav > *:nth-child(11) { animation-delay: 800ms; }
  .mdrawer-panel-in nav > *:nth-child(12) { animation-delay: 880ms; }
`;

export default function MobileDrawer({ C, drawerOpen, setDrawerOpen, appMode, children }: MobileDrawerProps) {
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"opening" | "closing" | "idle">("idle");
  const hasOpened = useRef(false);

  useEffect(() => {
    if (drawerOpen) {
      hasOpened.current = true;
      setVisible(true);
      setPhase("opening");
    } else if (hasOpened.current) {
      setPhase("closing");
      const t = setTimeout(() => { setVisible(false); setPhase("idle"); }, 210);
      return () => clearTimeout(t);
    }
  }, [drawerOpen]);

  const overlayClass = phase === "opening" ? "mdrawer-overlay-in" : phase === "closing" ? "mdrawer-overlay-out" : "";
  const panelClass   = phase === "opening" ? "mdrawer-panel-in"   : phase === "closing" ? "mdrawer-panel-out"   : "";

  return (
    <>
      <style>{ANIM_CSS}</style>

      {/* Mobile header */}
      <div className="mob-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ fontSize: "20px", fontWeight: 900, color: C.text, letterSpacing: "-0.5px" }}>
            <span style={{ color: C.accent }}>Budget</span>ly
          </div>
          <span style={{ fontSize: "9px", background: C.navActive, color: C.accent, padding: "2px 7px", borderRadius: "20px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>
            {appMode === "household" ? "🏠 HH" : "🎓 STU"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button onClick={() => setDrawerOpen(true)} style={{ background: "none", border: `1px solid ${C.border}`, color: C.text, cursor: "pointer", borderRadius: "7px", padding: "5px 9px", fontSize: "14px" }}>☰</button>
        </div>
      </div>

      {/* Overlay — mounts/unmounts with the drawer */}
      {visible && (
        <div
          className={overlayClass}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            display: "flex", justifyContent: "flex-end",
            pointerEvents: "auto",
          }}
          onClick={() => setDrawerOpen(false)}
        >
          {/* Drawer panel */}
          <div
            className={panelClass}
            style={{
              width: "260px", background: C.sidebar, borderLeft: `1px solid ${C.border}`,
              display: "flex", flexDirection: "column", padding: "24px 0", overflowY: "auto",
              pointerEvents: "auto",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 16px 12px" }}>
              <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: `1px solid ${C.border}`, color: C.text, cursor: "pointer", borderRadius: "7px", padding: "5px 9px", fontSize: "14px" }}>✕</button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
