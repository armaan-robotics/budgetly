"use client";
import React, { CSSProperties } from "react";
import { SvProps } from "../types";
import { fmt, btnA } from "../constants";
import { FF, EntryRow, DelBtn, EditModal } from "./ui";

export function SavingsTab(p: SvProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };
  return (
    <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
      <div>
        <div style={sCard}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Saving</div>
          <FF label="Amount (₹) *" C={C}><input type="number" placeholder="0" value={p.savAmt} onChange={e=>p.setSavAmt(e.target.value)} style={sInput}/></FF>
          <FF label="Description" C={C}><input type="text" placeholder="What are you saving for?" value={p.savDesc} onChange={e=>p.setSavDesc(e.target.value)} style={sInput}/></FF>
          <FF label="Date" C={C}><input type="date" value={p.savDate} onChange={e=>p.setSavDate(e.target.value)} style={sInput}/></FF>
          <button onClick={p.addSaving} style={{...btnA,width:"100%",padding:"11px"}}>+ Add Saving</button>
        </div>
        <div style={{...sCard,marginTop:"12px",textAlign:"center"}}>
          <div style={sSecT}>Total Saved</div>
          <div style={{fontSize:"22px",fontWeight:600,color:C.amber}}>{fmt(p.totalSavings)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{p.cashFlowIn>0?((p.totalSavings/p.cashFlowIn)*100).toFixed(1):0}% of cash flow in</div>
        </div>
      </div>
      <div style={sCard}>
        <div style={sSecT}>All Savings</div>
        {p.savings.length===0&&<div style={{textAlign:"center",color:C.faint,padding:"32px",fontSize:"13px"}}>No savings yet</div>}
        {(()=>{
          const [editId,setEditId]=React.useState<number|null>(null);
          const [editAmt,setEditAmt]=React.useState("");
          const [editDesc,setEditDesc]=React.useState("");
          const [editDate,setEditDate]=React.useState("");
          return <>
            {[...p.savings].reverse().map(sav=><EntryRow key={sav.id} C={C}
              left={<><div style={{fontSize:"10px",color:C.faint,marginBottom:"3px"}}>{sav.date}</div><div style={{fontSize:"13px",color:C.text}}>{sav.description||"Savings"}</div></>}
              right={<><span style={{fontSize:"14px",fontWeight:600,color:C.amber,whiteSpace:"nowrap"}}>{fmt(sav.amount)}</span>
                <button onClick={()=>{setEditId(sav.id);setEditAmt(String(sav.amount));setEditDesc(sav.description);setEditDate(sav.date);}} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer",fontSize:"11px",borderRadius:"7px",padding:"3px 8px"}}>✎</button>
                <DelBtn id={sav.id} confirm={p.deleteConfirm} setConfirm={p.setDeleteConfirm} onDel={p.deleteSaving} C={C}/></>}
            />)}
            {editId!==null&&<EditModal C={C} title="Edit Saving"
              fields={[
                {label:"Amount (₹)",value:editAmt,onChange:setEditAmt,type:"number"},
                {label:"Description",value:editDesc,onChange:setEditDesc},
                {label:"Date",value:editDate,onChange:setEditDate,type:"date"},
              ]}
              onSave={()=>{p.updateSaving(editId,{amount:+editAmt,description:editDesc,date:editDate});setEditId(null);}}
              onClose={()=>setEditId(null)}
            />}
          </>;
        })()}
      </div>
    </div>
  );
}
