"use client";
import { CSSProperties } from "react";
import { CrProps } from "../types";
import { btnP } from "../constants";
import { FF, DelBtn } from "./ui";

export function CreditTab(p: CrProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };

  const owedToMe = p.credits.filter(c=>c.type==="owed_to_me");
  const iOwe     = p.credits.filter(c=>c.type==="i_owe");
  const totalOwedToMe = owedToMe.filter(c=>!c.cleared).reduce((s,c)=>s+c.amount,0);
  const totalIOwe     = iOwe.filter(c=>!c.cleared).reduce((s,c)=>s+c.amount,0);

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"16px"}}>
        <div style={{...sCard,borderTop:`3px solid ${C.green}`,padding:"14px"}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"5px"}}>People Owe Me</div>
          <div style={{fontSize:"clamp(15px,2.5vw,21px)",fontWeight:600,color:C.green}}>{new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(totalOwedToMe)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{owedToMe.filter(c=>!c.cleared).length} pending</div>
        </div>
        <div style={{...sCard,borderTop:`3px solid ${C.red}`,padding:"14px"}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"5px"}}>I Owe</div>
          <div style={{fontSize:"clamp(15px,2.5vw,21px)",fontWeight:600,color:C.red}}>{new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(totalIOwe)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{iOwe.filter(c=>!c.cleared).length} pending</div>
        </div>
      </div>

      <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
        <div style={sCard}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Credit Entry</div>
          <div style={{display:"flex",gap:"6px",marginBottom:"14px"}}>
            <button onClick={()=>p.setCrType("owed_to_me")} style={{flex:1,padding:"8px",borderRadius:"8px",border:`1.5px solid ${p.crType==="owed_to_me"?C.green:C.border}`,background:p.crType==="owed_to_me"?C.green+"18":"transparent",color:p.crType==="owed_to_me"?C.green:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
              They Owe Me
            </button>
            <button onClick={()=>p.setCrType("i_owe")} style={{flex:1,padding:"8px",borderRadius:"8px",border:`1.5px solid ${p.crType==="i_owe"?C.red:C.border}`,background:p.crType==="i_owe"?C.red+"18":"transparent",color:p.crType==="i_owe"?C.red:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
              I Owe Them
            </button>
          </div>
          <FF label="Person's Name *" C={C}><input type="text" placeholder="Who?" value={p.crPerson} onChange={e=>p.setCrPerson(e.target.value)} style={sInput}/></FF>
          <FF label="Amount (₹) *" C={C}><input type="number" placeholder="0" value={p.crAmt} onChange={e=>p.setCrAmt(e.target.value)} style={sInput}/></FF>
          <FF label="Description" C={C}><input type="text" placeholder="What for?" value={p.crDesc} onChange={e=>p.setCrDesc(e.target.value)} style={sInput}/></FF>
          <FF label="Date" C={C}><input type="date" value={p.crDate} onChange={e=>p.setCrDate(e.target.value)} style={sInput}/></FF>
          <button onClick={p.addCredit} style={{width:"100%",padding:"11px",borderRadius:"9px",border:"none",background:p.crType==="owed_to_me"?C.green:C.red,color:"#fff",fontWeight:600,fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
            + Add Entry
          </button>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <div style={sCard}>
            <div style={sSecT}>They Owe Me</div>
            {owedToMe.length===0&&<div style={{textAlign:"center",color:C.faint,padding:"20px",fontSize:"13px"}}>No entries yet</div>}
            {[...owedToMe].reverse().map(c=>(
              <div key={c.id} style={{background:C.cardAlt,borderRadius:"10px",padding:"11px 13px",border:`1px solid ${c.cleared?C.border:C.green+"44"}`,marginBottom:"6px",opacity:c.cleared?0.55:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px",flexWrap:"wrap"}}>
                      <span style={{fontSize:"13px",fontWeight:600,color:C.text}}>{c.person}</span>
                      {c.cleared&&<span style={{fontSize:"10px",padding:"1px 6px",borderRadius:"20px",background:C.green+"22",color:C.green,fontWeight:600}}>Cleared</span>}
                    </div>
                    <div style={{fontSize:"11px",color:C.muted,marginBottom:"2px"}}>{c.description||"—"}</div>
                    <div style={{fontSize:"10px",color:C.faint}}>{c.date}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
                    <span style={{fontSize:"14px",fontWeight:600,color:C.green,whiteSpace:"nowrap"}}>+{new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(c.amount)}</span>
                    <button onClick={()=>p.toggleCleared(c.id)} title={c.cleared?"Mark pending":"Mark cleared"}
                      style={{background:c.cleared?C.green+"22":C.navActive,border:`1px solid ${c.cleared?C.green+"44":C.border}`,borderRadius:"6px",padding:"3px 7px",cursor:"pointer",fontSize:"11px",color:c.cleared?C.green:C.muted}}>
                      {c.cleared?"✓":"○"}
                    </button>
                    <DelBtn id={c.id} confirm={p.deleteConfirm} setConfirm={p.setDeleteConfirm} onDel={p.deleteCredit} C={C}/>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={sCard}>
            <div style={sSecT}>I Owe</div>
            {iOwe.length===0&&<div style={{textAlign:"center",color:C.faint,padding:"20px",fontSize:"13px"}}>No entries yet</div>}
            {[...iOwe].reverse().map(c=>(
              <div key={c.id} style={{background:C.cardAlt,borderRadius:"10px",padding:"11px 13px",border:`1px solid ${c.cleared?C.border:C.red+"44"}`,marginBottom:"6px",opacity:c.cleared?0.55:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"2px",flexWrap:"wrap"}}>
                      <span style={{fontSize:"13px",fontWeight:600,color:C.text}}>{c.person}</span>
                      {c.cleared&&<span style={{fontSize:"10px",padding:"1px 6px",borderRadius:"20px",background:C.green+"22",color:C.green,fontWeight:600}}>Cleared</span>}
                    </div>
                    <div style={{fontSize:"11px",color:C.muted,marginBottom:"2px"}}>{c.description||"—"}</div>
                    <div style={{fontSize:"10px",color:C.faint}}>{c.date}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
                    <span style={{fontSize:"14px",fontWeight:600,color:C.red,whiteSpace:"nowrap"}}>-{new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(c.amount)}</span>
                    <button onClick={()=>p.toggleCleared(c.id)} title={c.cleared?"Mark pending":"Mark cleared"}
                      style={{background:c.cleared?C.green+"22":C.navActive,border:`1px solid ${c.cleared?C.green+"44":C.border}`,borderRadius:"6px",padding:"3px 7px",cursor:"pointer",fontSize:"11px",color:c.cleared?C.green:C.muted}}>
                      {c.cleared?"✓":"○"}
                    </button>
                    <DelBtn id={c.id} confirm={p.deleteConfirm} setConfirm={p.setDeleteConfirm} onDel={p.deleteCredit} C={C}/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
