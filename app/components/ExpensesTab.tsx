"use client";

import { useState, CSSProperties } from "react";
import { ExProps, CAT_COLORS, PAYMENT_MODES, fmt, btnB, btnP } from "./types";
import { FF, EntryTable, EditModal, SortKey } from "./primitives";

export default function ExpensesTab(p: ExProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"16px",padding:"32px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"20px",fontWeight:700,color:C.text,marginTop:"24px",marginBottom:"12px" };
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [editEntry, setEditEntry] = useState<import("./types").Expense|null>(null);
  const [editAmt, setEditAmt] = useState(""); const [editCat, setEditCat] = useState("");
  const [editDesc, setEditDesc] = useState(""); const [editDate, setEditDate] = useState("");
  const [editMode, setEditMode] = useState(""); const [editAcc, setEditAcc] = useState("");

  const todayD = new Date(); todayD.setHours(0,0,0,0);
  const yest = new Date(todayD); yest.setDate(todayD.getDate()-1);
  const cutoff = `${yest.getFullYear()}-${String(yest.getMonth()+1).padStart(2,"0")}-${String(yest.getDate()).padStart(2,"0")}`;
  const visibleExpenses = showAll ? p.expenses : p.expenses.filter(e=>(e.date||"").slice(0,10)>=cutoff);

  const openEdit = (e: import("./types").Expense) => {
    setEditEntry(e); setEditAmt(String(e.amount)); setEditCat(e.category);
    setEditDesc(e.description); setEditDate(e.date);
    setEditMode(e.mode||""); setEditAcc(e.account||"");
  };

  const cols = [
    {key:"date" as SortKey, label:"Date", render:(e:import("./types").Expense)=><span style={{color:C.muted,fontSize:"12px"}}>{e.date}</span>},
    {key:"description" as SortKey, label:"Description", render:(e:import("./types").Expense)=><span>{e.description||"—"}</span>},
    {key:"category" as SortKey, label:"Category", render:(e:import("./types").Expense)=>{
      const ci=p.categories.indexOf(e.category); const col=CAT_COLORS[ci>=0?ci%CAT_COLORS.length:0];
      return <span style={{background:col+"22",color:col,padding:"2px 8px",borderRadius:"20px",fontSize:"11px",fontWeight:600}}>{e.category}</span>;
    }},
    {key:"amount" as SortKey, label:"Amount", render:(e:import("./types").Expense)=><span style={{color:C.red,fontWeight:600}}>-{fmt(e.amount)}</span>},
  ];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:"36px",paddingBottom:"8px",flexWrap:"wrap",gap:"8px"}}>
        <h1 style={{fontSize:"36px",fontWeight:800,color:C.text,letterSpacing:"-0.8px",lineHeight:1.1}}>Expenses</h1>
        <button onClick={()=>setShowForm(v=>!v)} style={{...btnP,padding:"8px 16px",fontSize:"13px",fontWeight:700}}>+ Add</button>
      </div>

      {showForm&&(
        <div style={{...sCard,marginBottom:"14px",marginTop:"16px"}}>
          <div style={sSecT}>Add Expense</div>
          <div className="form-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"14px"}}>
            <FF label="Amount (₹) *" C={C}><input type="number" placeholder="0" value={p.expAmt} onChange={e=>p.setExpAmt(e.target.value)} style={sInput}/></FF>
            <FF label="Category" C={C}><select value={p.expCat} onChange={e=>{if(e.target.value==="__add_cat__"){e.target.value=p.expCat;p.onOpenCategories();}else{p.setExpCat(e.target.value);}}} style={{...sInput,appearance:"none",cursor:"pointer"}}>{p.categories.map(c=><option key={c} value={c}>{c}</option>)}<option value="__add_cat__">＋ Add Category</option></select></FF>
            <FF label="Description" C={C}><input type="text" placeholder="What did you spend on?" value={p.expDesc} onChange={e=>p.setExpDesc(e.target.value)} style={sInput}/></FF>
            <FF label="Date" C={C}><input type="date" value={p.expDate} onChange={e=>p.setExpDate(e.target.value)} style={sInput}/></FF>
            <FF label="Payment Mode" C={C}><select value={p.expMode} onChange={e=>p.setExpMode(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}>{PAYMENT_MODES.map(m=><option key={m} value={m}>{m}</option>)}</select></FF>
            {p.appMode==="household"&&<FF label="Account" C={C}><select value={p.expAcc} onChange={e=>{if(e.target.value==="__add_acc__"){e.target.value=p.expAcc;p.onOpenAccounts();}else{p.setExpAcc(e.target.value);}}} style={{...sInput,appearance:"none",cursor:"pointer"}}><option value="">—</option>{p.accounts.map(a=><option key={a} value={a}>{a}</option>)}<option value="__add_acc__">＋ Add Account</option></select></FF>}
          </div>
          <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
            <button onClick={()=>{p.addExpense();setShowForm(false);}} style={{...btnP,flex:1,padding:"11px"}}>+ Add Expense</button>
            <button onClick={()=>setShowForm(false)} style={{...btnB,background:C.cancelBg,color:C.muted,padding:"11px 18px"}}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{marginTop:"20px",marginBottom:"12px"}}>
        <button onClick={()=>setShowAll(v=>!v)} style={{background:C.accent,color:"#fff",border:"none",borderRadius:"20px",padding:"8px 20px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
          {showAll?"Show last 2 days":"Show all month"}
        </button>
      </div>

      <div style={sCard}>
        <EntryTable entries={visibleExpenses} columns={cols} accentColor={C.red} onEdit={openEdit} onDelete={p.deleteExpense} onDeleteMany={p.deleteManyExpenses} C={C}/>
      </div>

      {editEntry&&<EditModal C={C} title="Edit Expense"
        fields={[
          {label:"Amount (₹)",value:editAmt,onChange:setEditAmt,type:"number"},
          {label:"Category",value:editCat,onChange:setEditCat,options:p.categories},
          {label:"Description",value:editDesc,onChange:setEditDesc},
          {label:"Date",value:editDate,onChange:setEditDate,type:"date"},
          {label:"Payment Mode",value:editMode,onChange:setEditMode,options:PAYMENT_MODES},
          ...(p.appMode==="household"?[{label:"Account",value:editAcc,onChange:setEditAcc,options:["—",...p.accounts]}]:[]),
        ]}
        onSave={()=>{p.updateExpense(editEntry.id,{amount:+editAmt,category:editCat,description:editDesc,date:editDate,mode:editMode,account:editAcc||undefined});setEditEntry(null);}}
        onClose={()=>setEditEntry(null)}
      />}
    </div>
  );
}
