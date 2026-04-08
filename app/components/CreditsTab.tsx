"use client";

import React, { useState, CSSProperties } from "react";
import { CrProps, CreditEntry, fmt, btnB, btnP } from "./types";
import { FF, EditModal } from "./primitives";

export default function CreditTab(p: CrProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"16px",padding:"32px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"11px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"16px",fontWeight:800 };

  const owedToMe = p.credits.filter(c=>c.type==="owed_to_me");
  const iOwe     = p.credits.filter(c=>c.type==="i_owe");
  const totalOwedToMe = owedToMe.filter(c=>!c.cleared).reduce((s,c)=>s+c.amount,0);
  const totalIOwe     = iOwe.filter(c=>!c.cleared).reduce((s,c)=>s+c.amount,0);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<CreditEntry|null>(null);
  const [editPerson, setEditPerson] = useState("");
  const [editAmt, setEditAmt] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");

  const [sortKey, setSortKey] = useState<"date"|"amount"|"person">("date");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [filterText, setFilterText] = useState("");
  const [filterType, setFilterType] = useState<"all"|"owed_to_me"|"i_owe">("all");
  const [filterStatus, setFilterStatus] = useState<"all"|"pending"|"cleared">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [expandId, setExpandId] = useState<number|null>(null);
  const [deleteId, setDeleteId] = useState<number|null>(null);
  const hasActiveFilters = filterText || filterType !== "all" || filterStatus !== "all";

  const openEdit = (c: CreditEntry) => {
    setEditEntry(c); setEditPerson(c.person); setEditAmt(String(c.amount));
    setEditDesc(c.description); setEditDate(c.date);
  };

  const allCredits = [...p.credits]
    .filter(c => {
      if(filterType!=="all" && c.type!==filterType) return false;
      if(filterStatus==="pending" && c.cleared) return false;
      if(filterStatus==="cleared" && !c.cleared) return false;
      if(filterText && !c.person.toLowerCase().includes(filterText.toLowerCase()) && !c.description.toLowerCase().includes(filterText.toLowerCase())) return false;
      return true;
    })
    .sort((a,b)=>{
      let av:any=sortKey==="amount"?a.amount:sortKey==="person"?a.person:a.date;
      let bv:any=sortKey==="amount"?b.amount:sortKey==="person"?b.person:b.date;
      if(av<bv)return sortDir==="asc"?-1:1;
      if(av>bv)return sortDir==="asc"?1:-1;
      return 0;
    });

  const thS: CSSProperties = {padding:"8px 10px",fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1.2px",fontWeight:600,cursor:"pointer",userSelect:"none",borderBottom:`1px solid ${C.border}`,textAlign:"left",whiteSpace:"nowrap",background:C.cardAlt};
  const tdS: CSSProperties = {padding:"9px 10px",fontSize:"13px",color:C.text,borderBottom:`1px solid ${C.border}`,verticalAlign:"middle"};
  const sortH = (k:"date"|"amount"|"person") => { if(sortKey===k)setSortDir(d=>d==="asc"?"desc":"asc"); else{setSortKey(k);setSortDir("desc");} };

  return (
    <div>
      {/* Title + Add button row */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:"32px",paddingBottom:"24px",flexWrap:"wrap",gap:"8px"}}>
        <h1 style={{fontSize:"clamp(24px,4vw,38px)",fontWeight:700,color:C.text,letterSpacing:"-0.8px",lineHeight:1.1}}>Credits</h1>
        <button onClick={()=>setShowForm(v=>!v)} style={{...btnP,padding:"8px 16px",fontSize:"13px",fontWeight:700}}>+ Add</button>
      </div>

      {/* Summary */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"16px"}}>
        <div style={{...sCard,borderTop:`3px solid ${C.green}`,padding:"14px"}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"5px"}}>People Owe Me</div>
          <div style={{fontSize:"clamp(20px,3vw,28px)",fontWeight:800,color:C.green}}>{fmt(totalOwedToMe)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{owedToMe.filter(c=>!c.cleared).length} pending</div>
        </div>
        <div style={{...sCard,borderTop:`3px solid ${C.red}`,padding:"14px"}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"5px"}}>I Owe</div>
          <div style={{fontSize:"clamp(20px,3vw,28px)",fontWeight:800,color:C.red}}>{fmt(totalIOwe)}</div>
          <div style={{fontSize:"11px",color:C.faint,marginTop:"3px"}}>{iOwe.filter(c=>!c.cleared).length} pending</div>
        </div>
      </div>

      {/* Filter toggle */}
      <div style={{marginBottom:showFilters?"10px":"16px"}}>
        <button onClick={()=>setShowFilters(v=>!v)} style={{padding:"7px 14px",borderRadius:"20px",border:`1.5px solid ${hasActiveFilters?C.accent:C.border}`,background:hasActiveFilters?C.navActive:"transparent",color:hasActiveFilters?C.accent:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:"5px"}}>
          <span>⚙ Filter</span>
          {hasActiveFilters&&<span style={{background:C.accent,color:"#fff",borderRadius:"20px",padding:"1px 6px",fontSize:"10px",fontWeight:700}}>ON</span>}
          <span style={{fontSize:"10px",opacity:0.6}}>{showFilters?"▲":"▼"}</span>
        </button>
      </div>

      {showFilters&&(
        <div style={{background:C.cardAlt,borderRadius:"12px",border:`1px solid ${C.border}`,padding:"14px",marginBottom:"16px",display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
          <input placeholder="Search person or note…" value={filterText} onChange={e=>setFilterText(e.target.value)}
            style={{padding:"7px 11px",borderRadius:"8px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"13px",outline:"none",fontFamily:"'DM Sans',sans-serif",width:"180px"}}/>
          {(["all","owed_to_me","i_owe"] as const).map(t=>(
            <button key={t} onClick={()=>setFilterType(t)} style={{padding:"6px 12px",borderRadius:"20px",border:`1px solid ${filterType===t?C.accent:C.border}`,background:filterType===t?C.navActive:"transparent",color:filterType===t?C.accent:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
              {t==="all"?"All":t==="owed_to_me"?"They Owe Me":"I Owe"}
            </button>
          ))}
          {(["all","pending","cleared"] as const).map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)} style={{padding:"6px 12px",borderRadius:"20px",border:`1px solid ${filterStatus===s?C.accent:C.border}`,background:filterStatus===s?C.navActive:"transparent",color:filterStatus===s?C.accent:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>
              {s==="all"?"All Status":s==="pending"?"Pending":"Cleared"}
            </button>
          ))}
          {hasActiveFilters&&<button onClick={()=>{setFilterText("");setFilterType("all");setFilterStatus("all");setShowFilters(false);}} style={{padding:"6px 12px",borderRadius:"20px",border:`1px solid ${C.border}`,background:"transparent",color:C.red,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>✕ Clear</button>}
        </div>
      )}

      {showForm&&(
        <div style={{...sCard,marginBottom:"14px"}}>
          <div style={{...sSecT,marginBottom:"14px"}}>Add Credit Entry</div>
          <div style={{display:"flex",gap:"6px",marginBottom:"14px"}}>
            <button onClick={()=>p.setCrType("owed_to_me")} style={{flex:1,padding:"8px",borderRadius:"8px",border:`1.5px solid ${p.crType==="owed_to_me"?C.green:C.border}`,background:p.crType==="owed_to_me"?C.green+"18":"transparent",color:p.crType==="owed_to_me"?C.green:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>They Owe Me</button>
            <button onClick={()=>p.setCrType("i_owe")} style={{flex:1,padding:"8px",borderRadius:"8px",border:`1.5px solid ${p.crType==="i_owe"?C.red:C.border}`,background:p.crType==="i_owe"?C.red+"18":"transparent",color:p.crType==="i_owe"?C.red:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>I Owe Them</button>
          </div>
          <div className="form-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"14px"}}>
            <FF label="Person's Name *" C={C}><input type="text" placeholder="Who?" value={p.crPerson} onChange={e=>p.setCrPerson(e.target.value)} style={sInput}/></FF>
            <FF label="Amount (₹) *" C={C}><input type="number" placeholder="0" value={p.crAmt} onChange={e=>p.setCrAmt(e.target.value)} style={sInput}/></FF>
            <FF label="Description" C={C}><input type="text" placeholder="What for?" value={p.crDesc} onChange={e=>p.setCrDesc(e.target.value)} style={sInput}/></FF>
            <FF label="Date" C={C}><input type="date" value={p.crDate} onChange={e=>p.setCrDate(e.target.value)} style={sInput}/></FF>
          </div>
          <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
            <button onClick={()=>{p.addCredit();setShowForm(false);}} style={{flex:1,padding:"11px",borderRadius:"9px",border:"none",background:p.crType==="owed_to_me"?C.green:C.red,color:"#fff",fontWeight:700,fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>+ Add Entry</button>
            <button onClick={()=>setShowForm(false)} style={{...{borderRadius:"9px",border:"none",fontWeight:600,fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"11px 18px"},background:C.cancelBg,color:C.muted}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={sCard}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
          <div style={sSecT}>All Credit Entries</div>
          <div style={{fontSize:"12px",color:C.muted}}>{allCredits.length} of {p.credits.length} entries</div>
        </div>
        <div style={{overflowX:"auto",maxWidth:"100%"}}>
          <table style={{width:"100%",tableLayout:"auto",borderCollapse:"collapse",fontFamily:"'DM Sans',sans-serif"}}>
            <thead>
              <tr>
                <th style={thS} onClick={()=>sortH("person")}>Name{sortKey==="person"?(sortDir==="asc"?" ↑":" ↓"):""}</th>
                <th style={thS} onClick={()=>sortH("amount")}>Amount{sortKey==="amount"?(sortDir==="asc"?" ↑":" ↓"):""}</th>
              </tr>
            </thead>
            <tbody>
              {allCredits.length===0&&<tr><td colSpan={2} style={{...tdS,textAlign:"center",color:C.faint,padding:"32px"}}>No entries yet</td></tr>}
              {allCredits.map(c=>(
                <React.Fragment key={c.id}>
                  <tr style={{cursor:"pointer",opacity:c.cleared?0.6:1}}
                    onClick={()=>setExpandId(expandId===c.id?null:c.id)}
                    onMouseEnter={e=>(e.currentTarget as HTMLTableRowElement).style.background=C.cardAlt}
                    onMouseLeave={e=>(e.currentTarget as HTMLTableRowElement).style.background=""}>
                    <td style={{...tdS,fontWeight:700}}>
                      <div>{c.person}</div>
                      <div style={{fontSize:"11px",marginTop:"2px"}}>
                        <span style={{background:(c.type==="owed_to_me"?C.green:C.red)+"22",color:c.type==="owed_to_me"?C.green:C.red,padding:"1px 6px",borderRadius:"20px",fontSize:"10px",fontWeight:700,marginRight:"4px"}}>{c.type==="owed_to_me"?"They Owe":"I Owe"}</span>
                        <span style={{background:c.cleared?C.green+"22":C.amber+"22",color:c.cleared?C.green:C.amber,padding:"1px 6px",borderRadius:"20px",fontSize:"10px",fontWeight:700}}>{c.cleared?"Cleared":"Pending"}</span>
                      </div>
                    </td>
                    <td style={{...tdS,fontWeight:700,color:c.type==="owed_to_me"?C.green:C.red,whiteSpace:"nowrap"}}>
                      {c.type==="owed_to_me"?"+":"-"}{fmt(c.amount)}
                    </td>
                  </tr>
                  {expandId===c.id&&(
                    <tr key={c.id+"_exp"}>
                      <td colSpan={2} style={{background:C.cardAlt,padding:"10px 14px",borderBottom:`1px solid ${C.border}`,fontSize:"12px",color:C.muted}}>
                        <div style={{display:"flex",gap:"16px",flexWrap:"wrap",marginBottom:"8px"}}>
                          <span><strong style={{color:C.text}}>Date:</strong> {c.date}</span>
                          <span><strong style={{color:C.text}}>Note:</strong> {c.description||"—"}</span>
                          <span><strong style={{color:C.text}}>Type:</strong> {c.type==="owed_to_me"?"They Owe Me":"I Owe Them"}</span>
                          <span><strong style={{color:C.text}}>Status:</strong> {c.cleared?"Cleared":"Pending"}</span>
                        </div>
                        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                          <button onClick={e=>{e.stopPropagation();p.toggleCleared(c.id);}} style={{...{borderRadius:"7px",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"5px 12px",fontSize:"12px"},background:c.cleared?C.green+"22":C.navActive,color:c.cleared?C.green:C.muted}}>{c.cleared?"✓ Cleared":"○ Mark Cleared"}</button>
                          <button onClick={e=>{e.stopPropagation();openEdit(c);setExpandId(null);}} style={{...{borderRadius:"7px",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"5px 12px",fontSize:"12px"},background:C.navActive,color:C.accent}}>✎ Edit</button>
                          <button onClick={e=>{e.stopPropagation();p.deleteCredit(c.id);}} style={{...{borderRadius:"7px",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"5px 12px",fontSize:"12px"},background:C.delBg,color:C.red}}>✕ Delete</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit modal */}
      {editEntry&&<EditModal C={C} title="Edit Credit Entry"
        fields={[
          {label:"Person's Name",value:editPerson,onChange:setEditPerson},
          {label:"Amount (₹)",value:editAmt,onChange:setEditAmt,type:"number"},
          {label:"Description",value:editDesc,onChange:setEditDesc},
          {label:"Date",value:editDate,onChange:setEditDate,type:"date"},
        ]}
        onSave={()=>{
          if(editEntry) p.updateCredit(editEntry.id,{person:editPerson,amount:+editAmt,description:editDesc,date:editDate});
          setEditEntry(null);
        }}
        onClose={()=>setEditEntry(null)}
      />}
    </div>
  );
}
