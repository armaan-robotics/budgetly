"use client";

import { CSSProperties } from "react";
import { OvProps, CAT_COLORS, fmt, btnB, btnP } from "./types";

export default function OverviewTab(p: OvProps) {
  const { C } = p;
  const sCard: CSSProperties = { background:C.card,borderRadius:"16px",padding:"32px",border:`1px solid ${C.border}` };
  const sSecT: CSSProperties = { fontSize:"11px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"16px",fontWeight:800 };
  const catTotals = p.categories.map((cat,i)=>({
    name:cat,color:CAT_COLORS[i%CAT_COLORS.length],
    total:p.expenses.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0),
    count:p.expenses.filter(e=>e.category===cat).length,
  })).filter(c=>c.total>0);
  return (
    <div>
      <div className="stat-grid-desk" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"14px",marginBottom:"18px"}}>
        {(()=>{
          const studentCards = [
            {label:"Cash Flow In", val:fmt(p.cashFlowIn),  color:C.green,  sub:""},
            {label:"Cash Flow Out",val:fmt(p.cashFlowOut), color:C.red,    sub:""},
            {label:"Total Savings",val:fmt(p.totalSavings),color:C.amber,  sub:""},
            {label:"To Spend",     val:fmt(p.remaining),   color:p.remaining>=0?C.green:C.red, sub:p.remaining>=0?"On track":"Over budget ⚠"},
          ];
          const householdCards = [
            {label:"Cash Flow In", val:fmt(p.cashFlowIn),  color:C.green, sub:""},
            {label:"Cash Flow Out",val:fmt(p.cashFlowOut), color:C.red,   sub:""},
            {label:"Total Savings",val:fmt(p.totalSavings),color:C.amber, sub:""},
            {label:"Net",          val:fmt(p.cashFlowIn-p.cashFlowOut), color:(p.cashFlowIn-p.cashFlowOut)>=0?C.green:C.red, sub:(p.cashFlowIn-p.cashFlowOut)>=0?"Surplus":"Deficit"},
          ];
          const cards = p.appMode==="household" ? householdCards : studentCards;
          const tabMap: Record<string,string> = {"Cash Flow In":"earnings","Cash Flow Out":"expenses","Total Savings":"savings"};
          return cards.map(s=>{
            const tab = tabMap[s.label];
            return (
              <div key={s.label} onClick={tab?()=>p.setActiveTab(tab):undefined} style={{...sCard,borderTop:`3px solid ${s.color}`,padding:"20px",cursor:tab?"pointer":undefined}}>
                <div style={{fontSize:"11px",color:C.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px",fontWeight:700}}>{s.label}</div>
                <div style={{fontSize:"clamp(20px,3vw,28px)",fontWeight:800,color:s.color}}>{s.val}</div>
                {s.sub&&<div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{s.sub}</div>}
              </div>
            );
          });
        })()}
      </div>

      {p.appMode==="student"&&<div style={{...sCard,marginBottom:"18px"}}>
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
                <span style={{fontSize:"clamp(22px,3vw,30px)",fontWeight:800,color:C.text}}>{fmt(p.budget)}</span>
                <button onClick={()=>{p.setEditingBudget(true);p.setTempBudget(String(p.budget));}}
                  style={{...btnB,background:C.navActive,color:C.accent,padding:"3px 10px",fontSize:"12px"}}>Edit</button>
              </div>
            )}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={sSecT}>Spent</div>
            <div style={{fontSize:"clamp(22px,3vw,30px)",fontWeight:800,color:p.spentPct>80?C.red:C.text}}>{p.spentPct.toFixed(1)}%</div>
          </div>
        </div>
        <div style={{background:C.progressTrack,borderRadius:"8px",height:"8px",overflow:"hidden",marginBottom:"7px"}}>
          <div style={{height:"100%",borderRadius:"8px",background:p.spentPct>80?C.red:C.accent,width:`${p.spentPct}%`,transition:"width 0.5s ease"}}/>
        </div>

      </div>}

      {p.appMode==="student"&&<div style={{...sCard,marginBottom:"18px"}}>
        <div style={sSecT}>Daily Averages</div>
        <div style={{display:"flex",flexWrap:"nowrap"}}>
          {([
            {label:"Ideal monthly avg",  val:fmt(p.idealPerDay),     color:C.accent, note:""},
            {label:"Daily avg to spend", val:fmt(p.currentIdealAvg), color:p.currentIdealAvg<p.idealPerDay?C.green:C.red, note:""},
            {label:"Spent per day",      val:fmt(p.currentDailyAvg), color:C.muted,  note:""},
          ] as {label:string;val:string;color:string;note:string}[]).map((d,i)=>(
            <div key={i} style={{flex:1,minWidth:0,padding:"8px 4px",borderLeft:i>0?`1px solid ${C.border}`:"none",textAlign:"center"}}>
              <div style={{fontSize:"8px",color:C.muted,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:"5px",lineHeight:1.3}}>{d.label}</div>
              <div style={{fontSize:"clamp(13px,3.5vw,22px)",fontWeight:800,color:d.color}}>{d.val}</div>
              <div style={{fontSize:"8px",color:C.muted,marginTop:"3px",lineHeight:1.3}}>{d.note}</div>
            </div>
          ))}
        </div>

      </div>}

      {catTotals.length>0&&(
        <div style={{...sCard,marginBottom:"18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
            <div style={sSecT}>Spending by Category</div>
            <div style={{fontSize:"12px",color:C.muted,fontWeight:600}}>{fmt(p.cashFlowOut)} total</div>
          </div>
          <div className="ov-chart-wrap" style={{display:"flex",gap:"32px",alignItems:"center",flexWrap:"wrap"}}>
            {(()=>{
              const total = p.cashFlowOut;
              if(total===0) return <div style={{fontSize:"13px",color:C.faint,padding:"20px"}}>No expenses yet</div>;
              const size=180, cx=90, cy=90, r=82, innerR=42;
              let startAngle = -Math.PI/2;
              const slices = catTotals.map(cat=>{
                const pct=cat.total/total;
                const angle=pct*2*Math.PI;
                const endAngle=startAngle+angle;
                const x1=cx+r*Math.cos(startAngle), y1=cy+r*Math.sin(startAngle);
                const x2=cx+r*Math.cos(endAngle),   y2=cy+r*Math.sin(endAngle);
                const ix1=cx+innerR*Math.cos(startAngle), iy1=cy+innerR*Math.sin(startAngle);
                const ix2=cx+innerR*Math.cos(endAngle),   iy2=cy+innerR*Math.sin(endAngle);
                const largeArc=angle>Math.PI?1:0;
                const path=`M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
                startAngle=endAngle;
                return {...cat,path,pct};
              });
              return (
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{flexShrink:0,filter:"drop-shadow(0 2px 12px rgba(0,0,0,0.10))"}}>
                  {slices.map((s,i)=>(
                    <path key={i} d={s.path} fill={s.color} stroke={C.card} strokeWidth="2.5">
                      <title>{s.name}: {fmt(s.total)} ({(s.pct*100).toFixed(1)}%)</title>
                    </path>
                  ))}
                  <text x={cx} y={cy-7} textAnchor="middle" fontSize="10" fill={C.muted} fontFamily="DM Sans,sans-serif">{catTotals.length} categories</text>
                  <text x={cx} y={cy+10} textAnchor="middle" fontSize="14" fontWeight="800" fill={C.text} fontFamily="DM Sans,sans-serif">{fmt(total)}</text>
                </svg>
              );
            })()}
            <div style={{flex:1,minWidth:"160px",display:"flex",flexDirection:"column",gap:"12px"}}>
              {catTotals.map(cat=>{
                const pct=p.cashFlowOut>0?(cat.total/p.cashFlowOut*100):0;
                return (
                  <div key={cat.name} style={{display:"flex",alignItems:"center",gap:"10px"}}>
                    <div style={{width:"12px",height:"12px",borderRadius:"3px",background:cat.color,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                        <span style={{fontSize:"13px",fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cat.name}</span>
                        <span style={{fontSize:"13px",fontWeight:700,color:cat.color,marginLeft:"8px",flexShrink:0}}>{fmt(cat.total)}</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:"6px",marginTop:"3px"}}>
                        <div style={{flex:1,height:"4px",borderRadius:"4px",background:C.progressTrack,overflow:"hidden"}}>
                          <div style={{height:"100%",borderRadius:"4px",background:cat.color,width:`${pct}%`}}/>
                        </div>
                        <span style={{fontSize:"11px",color:C.muted,flexShrink:0}}>{pct.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {p.appMode==="household"&&(()=>{
        const accTotals=p.accounts.map((acc,i)=>({
          name:acc,color:CAT_COLORS[i%CAT_COLORS.length],
          totalOut:p.expenses.filter(e=>e.account===acc).reduce((s,e)=>s+e.amount,0),
          count:p.expenses.filter(e=>e.account===acc).length,
        })).filter(a=>a.totalOut>0);
        if(accTotals.length===0)return null;
        return(
          <div style={{...sCard,marginBottom:"18px"}}>
            <div style={sSecT}>By Account</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"14px"}}>
              {accTotals.map(acc=>(
                <div key={acc.name} style={{background:C.cardAlt,borderRadius:"10px",padding:"12px",border:`1px solid ${C.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"}}>
                    <div style={{width:"7px",height:"7px",borderRadius:"50%",background:acc.color}}/>
                    <span style={{fontSize:"12px",fontWeight:500,color:C.text}}>{acc.name}</span>
                  </div>
                  <div style={{fontSize:"14px",fontWeight:600,color:acc.color}}>{fmt(acc.totalOut)}</div>
                  <div style={{fontSize:"10px",color:C.faint,marginTop:"2px"}}>{acc.count} transactions</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {(()=>{
        const peopleOweMe = p.credits.filter(c=>c.type==="owed_to_me"&&!c.cleared).reduce((s,c)=>s+c.amount,0);
        const iOwePeople  = p.credits.filter(c=>c.type==="i_owe"&&!c.cleared).reduce((s,c)=>s+c.amount,0);
        return(
          <div style={{...sCard,marginBottom:"18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
              <div style={sSecT}>Credits</div>
              <button onClick={()=>p.setActiveTab("credit")} style={{background:"none",border:"none",color:C.accent,fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"0"}}>View Credits →</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
              <div style={{background:C.cardAlt,borderRadius:"10px",padding:"14px",border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.green}`}}>
                <div style={{fontSize:"11px",color:C.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"6px",fontWeight:700}}>People owe me</div>
                <div style={{fontSize:"clamp(16px,3vw,22px)",fontWeight:800,color:C.green}}>{fmt(peopleOweMe)}</div>
              </div>
              <div style={{background:C.cardAlt,borderRadius:"10px",padding:"14px",border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.red}`}}>
                <div style={{fontSize:"11px",color:C.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"6px",fontWeight:700}}>I owe people</div>
                <div style={{fontSize:"clamp(16px,3vw,22px)",fontWeight:800,color:C.red}}>{fmt(iOwePeople)}</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
