"use client";
import React, { CSSProperties } from "react";
import { ExProps } from "../types";
import { CAT_COLORS, fmt, btnP } from "../constants";
import { FF, EntryRow, DelBtn, EditModal } from "./ui";

export function ExpensesTab(p: ExProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };
  return (
    <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
      <div>
        <div style={sCard}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Expense</div>
          <FF label="Amount (₹) *" C={C}><input type="number" placeholder="0" value={p.expAmt} onChange={e=>p.setExpAmt(e.target.value)} style={sInput}/></FF>
          <FF label="Category" C={C}><select value={p.expCat} onChange={e=>p.setExpCat(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}>{p.categories.map(c=><option key={c} value={c}>{c}</option>)}</select></FF>
          <FF label="Description" C={C}><input type="text" placeholder="What did you spend on?" value={p.expDesc} onChange={e=>p.setExpDesc(e.target.value)} style={sInput}/></FF>
          <FF label="Date" C={C}><input type="date" value={p.expDate} onChange={e=>p.setExpDate(e.target.value)} style={sInput}/></FF>
          <button onClick={p.addExpense} style={{...btnP,width:"100%",padding:"11px"}}>+ Add Expense</button>
        </div>
        <div style={{...sCard,marginTop:"12px",textAlign:"center"}}>
          <div style={sSecT}>Total Expenses</div>
          <div style={{fontSize:"22px",fontWeight:600,color:C.red}}>{fmt(p.totalExpenses)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{p.expenses.length} entries</div>
        </div>
      </div>
      <div style={sCard}>
        <div style={sSecT}>All Expenses</div>
        {p.expenses.length===0&&<div style={{textAlign:"center",color:C.faint,padding:"32px",fontSize:"13px"}}>No expenses yet</div>}
        {(()=>{
          const [editId,setEditId]=React.useState<number|null>(null);
          const [editAmt,setEditAmt]=React.useState("");
          const [editCat,setEditCat]=React.useState("");
          const [editDesc,setEditDesc]=React.useState("");
          const [editDate,setEditDate]=React.useState("");
          return <>
            {[...p.expenses].reverse().map(exp=>{
              const ci=p.categories.indexOf(exp.category); const col=CAT_COLORS[ci>=0?ci%CAT_COLORS.length:0];
              return <EntryRow key={exp.id} C={C}
                left={<><div style={{display:"flex",gap:"6px",marginBottom:"3px",flexWrap:"wrap",alignItems:"center"}}><span style={{fontSize:"10px",padding:"2px 7px",borderRadius:"20px",background:col+"22",color:col,fontWeight:600}}>{exp.category}</span><span style={{fontSize:"10px",color:C.faint}}>{exp.date}</span></div><div style={{fontSize:"13px",color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{exp.description||"—"}</div></>}
                right={<><span style={{fontSize:"14px",fontWeight:600,color:C.red,whiteSpace:"nowrap"}}>-{fmt(exp.amount)}</span>
                  <button onClick={()=>{setEditId(exp.id);setEditAmt(String(exp.amount));setEditCat(exp.category);setEditDesc(exp.description);setEditDate(exp.date);}} style={{background:"none",border:`1px solid ${C.border}`,color:C.muted,cursor:"pointer",fontSize:"11px",borderRadius:"7px",padding:"3px 8px"}}>✎</button>
                  <DelBtn id={exp.id} confirm={p.deleteConfirm} setConfirm={p.setDeleteConfirm} onDel={p.deleteExpense} C={C}/></>}
              />;
            })}
            {editId!==null&&<EditModal C={C} title="Edit Expense"
              fields={[
                {label:"Amount (₹)",value:editAmt,onChange:setEditAmt,type:"number"},
                {label:"Category",value:editCat,onChange:setEditCat,options:p.categories},
                {label:"Description",value:editDesc,onChange:setEditDesc},
                {label:"Date",value:editDate,onChange:setEditDate,type:"date"},
              ]}
              onSave={()=>{p.updateExpense(editId,{amount:+editAmt,category:editCat,description:editDesc,date:editDate});setEditId(null);}}
              onClose={()=>setEditId(null)}
            />}
          </>;
        })()}
      </div>
    </div>
  );
}
