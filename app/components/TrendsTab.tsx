"use client";
import { useState, CSSProperties } from "react";
import { TrProps } from "../types";
import { CAT_COLORS } from "../constants";

export function TrendsTab(p: TrProps) {
  const { C } = p;
  const [view, setView] = useState<"week"|"month">("week");

  const sCard: CSSProperties = { background:C.card, borderRadius:"14px", padding:"20px", border:`1px solid ${C.border}` };
  const fmt = (n:number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);

  const today = new Date();
  today.setHours(0,0,0,0);

  const days: { label:string; dateStr:string; total:number; byCategory:{[cat:string]:number} }[] = [];

  const numDays = view === "week" ? 7 : 30;
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const mk = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const monthData = p.allMonths[mk];
    const dayExpenses = monthData ? monthData.expenses.filter(e => e.date === dateStr) : [];
    const total = dayExpenses.reduce((s,e) => s+e.amount, 0);
    const byCategory: {[cat:string]:number} = {};
    dayExpenses.forEach(e => { byCategory[e.category] = (byCategory[e.category]||0) + e.amount; });

    let label = "";
    if (view === "week") {
      label = d.toLocaleDateString("en-IN",{weekday:"short"});
    } else {
      label = i % 5 === 0 || i === 0 ? String(d.getDate()) : "";
    }
    days.push({ label, dateStr, total, byCategory });
  }

  const maxVal = Math.max(...days.map(d => d.total), 1);
  const totalPeriod = days.reduce((s,d) => s+d.total, 0);
  const avgPerDay = totalPeriod / numDays;
  const highestDay = days.reduce((best, d) => d.total > best.total ? d : best, days[0]);
  const activeDays = days.filter(d => d.total > 0).length;

  const catTotals: {name:string; color:string; total:number}[] = p.categories.map((cat,i) => ({
    name: cat,
    color: CAT_COLORS[i % CAT_COLORS.length],
    total: days.reduce((s,d) => s+(d.byCategory[cat]||0), 0),
  })).filter(c => c.total > 0).sort((a,b) => b.total - a.total);

  const [hovered, setHovered] = useState<number|null>(null);

  const todayStr = today.toISOString().split("T")[0];

  return (
    <div style={{maxWidth:"820px"}}>
      <div style={{display:"flex",gap:"6px",marginBottom:"18px"}}>
        {(["week","month"] as const).map(v => (
          <button key={v} onClick={()=>setView(v)} style={{
            padding:"7px 18px", borderRadius:"20px", border:`1px solid ${view===v?C.accent:C.border}`,
            background: view===v ? C.navActive : "transparent",
            color: view===v ? C.accent : C.muted,
            fontWeight: view===v ? 600 : 400,
            fontSize:"13px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
          }}>
            {v === "week" ? "Last 7 Days" : "Last 30 Days"}
          </button>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginBottom:"16px"}} className="two-col-grid">
        <div style={{...sCard,padding:"14px",borderTop:`3px solid ${C.red}`}}>
          <div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"5px"}}>Total Spent</div>
          <div style={{fontSize:"clamp(15px,2.5vw,20px)",fontWeight:600,color:C.red}}>{fmt(totalPeriod)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{view==="week"?"past 7 days":"past 30 days"}</div>
        </div>
        <div style={{...sCard,padding:"14px",borderTop:`3px solid ${C.amber}`}}>
          <div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"5px"}}>Daily Average</div>
          <div style={{fontSize:"clamp(15px,2.5vw,20px)",fontWeight:600,color:C.amber}}>{fmt(Math.round(avgPerDay))}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{activeDays} active day{activeDays!==1?"s":""}</div>
        </div>
        <div style={{...sCard,padding:"14px",borderTop:`3px solid ${C.accent}`}}>
          <div style={{fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"5px"}}>Highest Day</div>
          <div style={{fontSize:"clamp(15px,2.5vw,20px)",fontWeight:600,color:C.accent}}>{fmt(highestDay.total)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>
            {highestDay.total > 0 ? new Date(highestDay.dateStr+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"}) : "No data"}
          </div>
        </div>
      </div>

      <div style={{...sCard,marginBottom:"16px"}}>
        <div style={{fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"20px",fontWeight:600}}>Daily Spending</div>
        {totalPeriod === 0 ? (
          <div style={{textAlign:"center",color:C.faint,padding:"40px",fontSize:"13px"}}>No expenses in this period</div>
        ) : (
          <div style={{position:"relative"}}>
            {[0.25,0.5,0.75,1].map(pct => (
              <div key={pct} style={{position:"absolute",left:0,right:0,top:`${(1-pct)*100}%`,borderTop:`1px dashed ${C.border}`,pointerEvents:"none",zIndex:0}}/>
            ))}
            <div style={{display:"flex",alignItems:"flex-end",gap:"4px",height:"180px",position:"relative",zIndex:1,paddingBottom:"0"}}>
              {days.map((d,i) => {
                const pct = d.total / maxVal;
                const isToday = d.dateStr === todayStr;
                const isHovered = hovered === i;
                const barColor = isToday ? C.accent : isHovered ? C.accent : C.red;
                return (
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",height:"100%",justifyContent:"flex-end",position:"relative",cursor:"pointer"}}
                    onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}>
                    {isHovered && d.total > 0 && (
                      <div style={{position:"absolute",bottom:"calc(100% + 6px)",left:"50%",transform:"translateX(-50%)",background:C.text,color:C.bg,borderRadius:"7px",padding:"5px 9px",fontSize:"11px",fontWeight:600,whiteSpace:"nowrap",zIndex:10,boxShadow:"0 2px 8px rgba(0,0,0,0.2)",pointerEvents:"none"}}>
                        {fmt(d.total)}
                      </div>
                    )}
                    <div style={{width:"100%",maxWidth:"36px",height:d.total>0?`${Math.max(pct*100,3)}%`:"3px",background:d.total>0?barColor:C.border,borderRadius:"5px 5px 2px 2px",opacity:isHovered||hovered===null?1:0.5,transition:"all 0.2s ease"}}/>
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:"4px",marginTop:"8px"}}>
              {days.map((d,i) => (
                <div key={i} style={{flex:1,textAlign:"center",fontSize:"9px",color:d.dateStr===todayStr?C.accent:C.faint,fontWeight:d.dateStr===todayStr?600:400,overflow:"hidden"}}>
                  {d.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {catTotals.length > 0 && (
        <div style={sCard}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"16px",fontWeight:600}}>Breakdown by Category</div>
          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            {catTotals.map(cat => {
              const pct = totalPeriod > 0 ? (cat.total/totalPeriod)*100 : 0;
              return (
                <div key={cat.name}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"5px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
                      <div style={{width:"8px",height:"8px",borderRadius:"50%",background:cat.color,flexShrink:0}}/>
                      <span style={{fontSize:"13px",color:C.text,fontWeight:500}}>{cat.name}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                      <span style={{fontSize:"11px",color:C.muted}}>{pct.toFixed(1)}%</span>
                      <span style={{fontSize:"13px",fontWeight:600,color:cat.color}}>{fmt(cat.total)}</span>
                    </div>
                  </div>
                  <div style={{background:C.progressTrack,borderRadius:"6px",height:"6px",overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:"6px",background:cat.color,width:`${pct}%`,transition:"width 0.5s ease"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
