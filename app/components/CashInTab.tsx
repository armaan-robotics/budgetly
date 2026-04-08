"use client";
import React, { CSSProperties } from "react";
import { ErProps } from "../types";
import { fmt, btnG } from "../constants";
import { FF, EntryRow, DelBtn, EditModal } from "./ui";

export function EarningsTab(p: ErProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };
  return (
    <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
      <div>
        <div style={sCard}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Income</div>
          <FF label="Amount (₹) *" C={C}><input type="number" placeholder="0" value={p.earnAmt} onChange={e=>p.setEarnAmt(e.target.value)} style={sInput}/></FF>
          <FF label="Description" C={C}><input type="text" placeholder="Source of income" value={p.earnDesc} onChange={e=>p.setEarnDesc(e.target.value)} style={sInput}/></FF>
          <FF label="Date" C={C}><input type="date" value={p.earnDate} onChange={e=>p.setEarnDate(e.target.value)} style={sInput}/></FF>
          <button onClick={p.addEarning} style={{...btnG,width:"100%",padding:"11px"}}>+ Add Income</button>
        </div>
        <div style={{...sCard,marginTop:"12px",textAlign:"center"}}>
          <div style={sSecT}>Total Earnings</div>
          <div style={{fontSize:"22px",fontWeight:600,color:C.green}}>{fmt(p.totalEarnings)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{p.earnings.length} entries</div>
        </div>
      </div>
      <div style={sCard}>
        <div style={sSecT}>All Income</div>
        {p.earnings.length===0&&<div style={{textAlign:"center",color:C.faint,padding:"32px",fontSize:"13px"}}>No income yet</div>}
        {(()=>{
          const [editId,setEditId]=React.useState<number|null>(null);
          const [editAmt,setEditAmt]=React.useState("");
          const [editDesc,setEditDesc]=React.useState("");
          const [editDate,setEditDate]=React.useState("");
          return <>
            {[...p.earnings].reverse().map(earn=><EntryRow key={earn.id} C={C}
              left={<><div style={{fontSize:"10px",color:C.faint,marginBottom:"3px"}}>{earn.date}</div><div style={{fontSize:"13px",color:C.text}}>{earn.description||"Income"}</div></>}
              right={<><span style={{fontSize:"14px",fontWeight:600,color:C.green,whiteSpace:"nowrap"}}>+{fmt(earn.amount)}</span>
                <button onClick={()=>{setEditId(earn.id);setEditAmt(String(earn.amount));setEditDesc(earn.description);setEditDate(earn.date);}} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer",fontSize:"11px",borderRadius:"7px",padding:"3px 8px"}}>✎</button>
                <DelBtn id={earn.id} confirm={p.deleteConfirm} setConfirm={p.setDeleteConfirm} onDel={p.deleteEarning} C={C}/></>}
            />)}
            {editId!==null&&<EditModal C={C} title="Edit Income"
              fields={[
                {label:"Amount (₹)",value:editAmt,onChange:setEditAmt,type:"number"},
                {label:"Description",value:editDesc,onChange:setEditDesc},
                {label:"Date",value:editDate,onChange:setEditDate,type:"date"},
              ]}
              onSave={()=>{p.updateEarning(editId,{amount:+editAmt,description:editDesc,date:editDate});setEditId(null);}}
              onClose={()=>setEditId(null)}
            />}
          </>;
        })()}
      </div>
    </div>
  );
}
