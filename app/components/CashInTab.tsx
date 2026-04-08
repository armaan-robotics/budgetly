"use client";

import { useState, CSSProperties } from "react";
import { ErProps, Entry, PAYMENT_MODES, fmt, btnB, btnG } from "./types";
import { FF, EntryTable, EditModal, SortKey } from "./primitives";

export default function EarningsTab(p: ErProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"16px",padding:"32px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"11px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"16px",fontWeight:800 };
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry|null>(null);
  const [editAmt, setEditAmt] = useState(""); const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState(""); const [editMode, setEditMode] = useState("");
  const [editAcc, setEditAcc] = useState("");

  const openEdit = (e: Entry) => {
    setEditEntry(e); setEditAmt(String(e.amount)); setEditDesc(e.description);
    setEditDate(e.date); setEditMode(e.mode||""); setEditAcc((e as any).account||"");
  };

  const cols = [
    {key:"date" as SortKey, label:"Date", render:(e:Entry)=><span style={{color:C.muted,fontSize:"12px"}}>{e.date}</span>},
    {key:"description" as SortKey, label:"Description", render:(e:Entry)=><span>{e.description||"Income"}</span>},
    {key:"amount" as SortKey, label:"Amount", render:(e:Entry)=><span style={{color:C.green,fontWeight:600}}>+{fmt(e.amount)}</span>},
  ];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:"32px",paddingBottom:"24px",flexWrap:"wrap",gap:"8px"}}>
        <h1 style={{fontSize:"clamp(24px,4vw,38px)",fontWeight:700,color:C.text,letterSpacing:"-0.8px",lineHeight:1.1}}>Cash In</h1>
        <button onClick={()=>setShowForm(v=>!v)} style={{...btnG,padding:"8px 16px",fontSize:"13px",fontWeight:700}}>+ Add</button>
      </div>

      {showForm&&(
        <div style={{...sCard,marginBottom:"14px"}}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Income</div>
          <div className="form-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"14px"}}>
            <FF label="Amount (₹) *" C={C}><input type="number" placeholder="0" value={p.earnAmt} onChange={e=>p.setEarnAmt(e.target.value)} style={sInput}/></FF>
            <FF label="Description" C={C}><input type="text" placeholder="Source of income" value={p.earnDesc} onChange={e=>p.setEarnDesc(e.target.value)} style={sInput}/></FF>
            <FF label="Date" C={C}><input type="date" value={p.earnDate} onChange={e=>p.setEarnDate(e.target.value)} style={sInput}/></FF>
            <FF label="Payment Mode" C={C}><select value={p.earnMode} onChange={e=>p.setEarnMode(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}>{PAYMENT_MODES.map(m=><option key={m} value={m}>{m}</option>)}</select></FF>
            {p.appMode==="household"&&<FF label="Account" C={C}><select value={p.earnAcc} onChange={e=>p.setEarnAcc(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}><option value="">—</option>{p.accounts.map(a=><option key={a} value={a}>{a}</option>)}</select></FF>}
          </div>
          <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
            <button onClick={()=>{p.addEarning();setShowForm(false);}} style={{...btnG,flex:1,padding:"11px"}}>+ Add Income</button>
            <button onClick={()=>setShowForm(false)} style={{...btnB,background:C.cancelBg,color:C.muted,padding:"11px 18px"}}>Cancel</button>
          </div>
        </div>
      )}

      <div style={sCard}>
        <EntryTable entries={p.earnings} columns={cols} accentColor={C.green} onEdit={openEdit} onDelete={p.deleteEarning} onDeleteMany={p.deleteManyEarnings} C={C}/>
      </div>

      {editEntry&&<EditModal C={C} title="Edit Income"
        fields={[
          {label:"Amount (₹)",value:editAmt,onChange:setEditAmt,type:"number"},
          {label:"Description",value:editDesc,onChange:setEditDesc},
          {label:"Date",value:editDate,onChange:setEditDate,type:"date"},
          {label:"Payment Mode",value:editMode,onChange:setEditMode,options:PAYMENT_MODES},
          ...(p.appMode==="household"?[{label:"Account",value:editAcc,onChange:setEditAcc,options:["—",...p.accounts]}]:[]),
        ]}
        onSave={()=>{p.updateEarning(editEntry.id,{amount:+editAmt,description:editDesc,date:editDate,mode:editMode,account:editAcc||undefined} as any);setEditEntry(null);}}
        onClose={()=>setEditEntry(null)}
      />}
    </div>
  );
}
