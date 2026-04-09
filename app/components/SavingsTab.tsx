"use client";

import { useState, CSSProperties } from "react";
import { SvProps, Entry, PAYMENT_MODES, fmt, btnB, btnA } from "./types";
import { FF, EntryTable, EditModal, SortKey } from "./primitives";

export default function SavingsTab(p: SvProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"16px",padding:"32px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"20px",fontWeight:700,color:C.text,marginTop:"24px",marginBottom:"12px" };
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [editEntry, setEditEntry] = useState<Entry|null>(null);
  const [editAmt, setEditAmt] = useState(""); const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState(""); const [editMode, setEditMode] = useState("");
  const [editAcc, setEditAcc] = useState("");

  const todayD = new Date(); todayD.setHours(0,0,0,0);
  const weekAgo = new Date(todayD); weekAgo.setDate(todayD.getDate()-6);
  const cutoff = `${weekAgo.getFullYear()}-${String(weekAgo.getMonth()+1).padStart(2,"0")}-${String(weekAgo.getDate()).padStart(2,"0")}`;
  const visibleSavings = showAll ? p.savings : p.savings.filter(e=>(e.date||"").slice(0,10)>=cutoff);

  const openEdit = (e: Entry) => {
    setEditEntry(e); setEditAmt(String(e.amount)); setEditDesc(e.description);
    setEditDate(e.date); setEditMode(e.mode||""); setEditAcc((e as any).account||"");
  };

  const cols = [
    {key:"date" as SortKey, label:"Date", render:(e:Entry)=><span style={{color:C.muted,fontSize:"12px"}}>{e.date}</span>},
    {key:"description" as SortKey, label:"Description", render:(e:Entry)=><span>{e.description||"Savings"}</span>},
    {key:"amount" as SortKey, label:"Amount", render:(e:Entry)=><span style={{color:C.amber,fontWeight:600}}>{fmt(e.amount)}</span>},
  ];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:"40px",paddingBottom:"12px",flexWrap:"wrap",gap:"10px"}}>
        <h1 style={{fontSize:"36px",fontWeight:800,color:C.text,letterSpacing:"-0.8px",lineHeight:1.1}}>Savings</h1>
        <button onClick={()=>setShowForm(v=>!v)} style={{...btnA,padding:"6px 12px",fontSize:"20px",fontWeight:600,lineHeight:1}}>+</button>
      </div>

      {showForm&&(
        <div style={{...sCard,marginBottom:"14px",marginTop:"16px"}}>
          <div style={sSecT}>Add Saving</div>
          <div className="form-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"14px"}}>
            <FF label="Amount (₹) *" C={C}><input type="number" placeholder="0" value={p.savAmt} onChange={e=>p.setSavAmt(e.target.value)} style={sInput}/></FF>
            <FF label="Description" C={C}><input type="text" placeholder="What are you saving for?" value={p.savDesc} onChange={e=>p.setSavDesc(e.target.value)} style={sInput}/></FF>
            <FF label="Date" C={C}><input type="date" value={p.savDate} onChange={e=>p.setSavDate(e.target.value)} style={sInput}/></FF>
            <FF label="Payment Mode" C={C}><select value={p.savMode} onChange={e=>p.setSavMode(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}>{PAYMENT_MODES.map(m=><option key={m} value={m}>{m}</option>)}</select></FF>
            {p.appMode==="household"&&<FF label="Account" C={C}><select value={p.savAcc} onChange={e=>p.setSavAcc(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}><option value="">—</option>{p.accounts.map(a=><option key={a} value={a}>{a}</option>)}</select></FF>}
          </div>
          <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
            <button onClick={()=>{p.addSaving();setShowForm(false);}} style={{...btnA,flex:1,padding:"11px"}}>+ Add Saving</button>
            <button onClick={()=>setShowForm(false)} style={{...btnB,background:C.cancelBg,color:C.muted,padding:"11px 18px"}}>Cancel</button>
          </div>
        </div>
      )}

      <div style={sCard}>
        <div style={{fontSize:"18px",fontWeight:700,color:C.text,marginTop:"8px",marginBottom:"16px"}}>Recent Entries</div>
        <EntryTable entries={visibleSavings} columns={cols} accentColor={C.amber} onEdit={openEdit} onDelete={p.deleteSaving} onDeleteMany={p.deleteManySavings} C={C}
          toggleButton={<button onClick={()=>setShowAll(v=>!v)} style={{background:"#7C6EE0",color:"#fff",border:"none",borderRadius:"999px",padding:"6px 16px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{showAll?"Show last week":"Show full month"}</button>}
        />
      </div>

      {editEntry&&<EditModal C={C} title="Edit Saving"
        fields={[
          {label:"Amount (₹)",value:editAmt,onChange:setEditAmt,type:"number"},
          {label:"Description",value:editDesc,onChange:setEditDesc},
          {label:"Date",value:editDate,onChange:setEditDate,type:"date"},
          {label:"Payment Mode",value:editMode,onChange:setEditMode,options:PAYMENT_MODES},
          ...(p.appMode==="household"?[{label:"Account",value:editAcc,onChange:setEditAcc,options:["—",...p.accounts]}]:[]),
        ]}
        onSave={()=>{p.updateSaving(editEntry.id,{amount:+editAmt,description:editDesc,date:editDate,mode:editMode,account:editAcc||undefined} as any);setEditEntry(null);}}
        onClose={()=>setEditEntry(null)}
      />}
    </div>
  );
}
