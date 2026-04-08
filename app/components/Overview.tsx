"use client";
import { CSSProperties } from "react";
import { OvProps } from "../types";
import { CAT_COLORS, fmt, btnP, btnB } from "../constants";

export function OverviewTab(p: OvProps) {
  const { C } = p;
  const sCard: CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT: CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };
  const catTotals = p.categories.map((cat,i)=>({
    name:cat,color:CAT_COLORS[i%CAT_COLORS.length],
    total:p.expenses.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0),
    count:p.expenses.filter(e=>e.category===cat).length,
  })).filter(c=>c.total>0);
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"10px",marginBottom:"12px"}}>
        {([
          {label:"Cash Flow In", val:fmt(p.cashFlowIn),  color:C.green,  sub:`Budget + ${fmt(p.totalEarnings)} earned`},
          {label:"Cash Flow Out",val:fmt(p.cashFlowOut), color:C.red,    sub:`${p.expenses.length} expense${p.expenses.length!==1?"s":""}`},
          {label:"Total Savings",val:fmt(p.totalSavings),color:C.amber,  sub:`${p.savings.length} entr${p.savings.length!==1?"ies":"y"}`},
          {label:"To Spend",     val:fmt(p.remaining),   color:p.remaining>=0?C.green:C.red, sub:p.remaining>=0?"On track":"Over budget ⚠"},
        ] as {label:string;val:string;color:string;sub:string}[]).map(s=>(
          <div key={s.label} style={{...sCard,borderTop:`3px solid ${s.color}`,padding:"14px"}}>
            <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"5px"}}>{s.label}</div>
            <div style={{fontSize:"clamp(15px,2.5vw,21px)",fontWeight:600,color:s.color}}>{s.val}</div>
            <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{...sCard,marginBottom:"12px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px",flexWrap:"wrap",gap:"8px"}}>
          <div>
            <div style={sSecT}>Monthly Budget</div>
            {p.editingBudget ? (
              <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
                <input value={p.tempBudget} onChange={e=>p.setTempBudget(e.target.value)}
                  style={{width:"120px",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif"}}
                  type="number"/>
                <button onClick={p.saveBudget} style={btnP}>Save</button>
                <button onClick={()=>p.setEditingBudget(false)} style={{...btnB,background:C.cancelBg,color:C.muted}}>✕</button>
              </div>
            ):(
              <div style={{display:"flex",alignItems:"baseline",gap:"9px"}}>
                <span style={{fontSize:"clamp(18px,3vw,26px)",fontWeight:600,color:C.text}}>{fmt(p.budget)}</span>
                <button onClick={()=>{p.setEditingBudget(true);p.setTempBudget(String(p.budget));}}
                  style={{...btnB,background:C.navActive,color:C.accent,padding:"3px 10px",fontSize:"12px"}}>Edit</button>
              </div>
            )}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={sSecT}>Spent</div>
            <div style={{fontSize:"clamp(18px,3vw,26px)",fontWeight:600,color:p.spentPct>80?C.red:C.text}}>{p.spentPct.toFixed(1)}%</div>
          </div>
        </div>
        <div style={{background:C.progressTrack,borderRadius:"8px",height:"8px",overflow:"hidden",marginBottom:"7px"}}>
          <div style={{height:"100%",borderRadius:"8px",background:p.spentPct>80?C.red:C.accent,width:`${p.spentPct}%`,transition:"width 0.5s ease"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{fontSize:"11px",color:C.muted}}>Spent {fmt(p.cashFlowOut)}</span>
          <span style={{fontSize:"11px",color:C.muted}}>of {fmt(p.cashFlowIn)}</span>
        </div>
      </div>

      <div style={{...sCard,marginBottom:"12px"}}>
        <div style={sSecT}>Daily Averages</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)"}}>
          {([
            {label:"Ideal monthly avg",  val:fmt(p.idealPerDay),     color:C.accent, note:""},
            {label:"Daily avg to spend", val:fmt(p.currentIdealAvg), color:p.currentIdealAvg<p.idealPerDay?C.green:C.red, note:""},
            {label:"Spent per day",      val:fmt(p.currentDailyAvg), color:C.muted,  note:""},
          ] as {label:string;val:string;color:string;note:string}[]).map((d,i)=>(
            <div key={i} style={{padding:"10px 8px",borderLeft:i>0?`1px solid ${C.border}`:"none",textAlign:"center"}}>
              <div style={{fontSize:"9px",color:C.muted,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:"6px",lineHeight:1.3}}>{d.label}</div>
              <div style={{fontSize:"clamp(13px,2vw,18px)",fontWeight:600,color:d.color}}>{d.val}</div>
              <div style={{fontSize:"9px",color:C.muted,marginTop:"4px",lineHeight:1.3}}>{d.note}</div>
            </div>
          ))}
        </div>
      </div>

      {catTotals.length>0&&(
        <div style={sCard}>
          <div style={sSecT}>Spending by Category</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"9px"}}>
            {catTotals.map(cat=>(
              <div key={cat.name} style={{background:C.cardAlt,borderRadius:"10px",padding:"12px",border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                    <div style={{width:"7px",height:"7px",borderRadius:"50%",background:cat.color}}/>
                    <span style={{fontSize:"12px",fontWeight:500,color:C.text}}>{cat.name}</span>
                  </div>
                  <span style={{fontSize:"10px",color:C.faint}}>{cat.count}</span>
                </div>
                <div style={{fontSize:"16px",fontWeight:600,color:cat.color,marginBottom:"5px"}}>{fmt(cat.total)}</div>
                <div style={{background:C.progressTrack,borderRadius:"5px",height:"3px"}}>
                  <div style={{height:"100%",borderRadius:"5px",background:cat.color,width:`${p.cashFlowOut>0?Math.min((cat.total/p.cashFlowOut)*100,100):0}%`}}/>
                </div>
                <div style={{fontSize:"10px",color:C.faint,marginTop:"3px"}}>{p.cashFlowOut>0?((cat.total/p.cashFlowOut)*100).toFixed(1):0}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
