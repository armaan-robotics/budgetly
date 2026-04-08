"use client";

import React, { useState, ReactNode, CSSProperties } from "react";
import { Theme, Entry, btnB } from "./types";

export type SortKey = "date"|"amount"|"description"|"category"|"mode"|"account";

export function FF({ label, children, C }: { label:string; children:ReactNode; C:Theme }) {
  return (
    <div style={{marginBottom:"18px"}}>
      <label style={{display:"block",fontSize:"11px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"8px",fontWeight:600}}>{label}</label>
      {children}
    </div>
  );
}

export function EntryRow({ left, right, C }: { left:ReactNode; right:ReactNode; C:Theme }) {
  return (
    <div style={{background:C.cardAlt,borderRadius:"10px",padding:"14px 16px",border:`1px solid ${C.border}`,marginBottom:"8px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"10px"}}>
      <div style={{flex:1,minWidth:0}}>{left}</div>
      <div style={{display:"flex",alignItems:"center",gap:"9px",flexShrink:0}}>{right}</div>
    </div>
  );
}

export function DelBtn({ id,confirm,setConfirm,onDel,C }: { id:number;confirm:number|null;setConfirm:(v:number|null)=>void;onDel:(id:number)=>void;C:Theme }) {
  if (confirm===id) return (
    <div style={{display:"flex",gap:"5px"}}>
      <button onClick={()=>onDel(id)} style={{background:C.delBg,border:"none",color:C.red,borderRadius:"7px",padding:"4px 9px",cursor:"pointer",fontSize:"12px",fontWeight:600}}>Del</button>
      <button onClick={()=>setConfirm(null)} style={{background:C.cancelBg,border:"none",color:C.muted,borderRadius:"7px",padding:"4px 9px",cursor:"pointer",fontSize:"12px"}}>No</button>
    </div>
  );
  return (
    <button onClick={()=>setConfirm(id)}
      style={{background:"none",border:`1px solid ${C.border}`,color:C.faint,cursor:"pointer",fontSize:"11px",borderRadius:"7px",padding:"3px 8px"}}
      onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.red;(e.currentTarget as HTMLButtonElement).style.borderColor=C.red+"66";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.faint;(e.currentTarget as HTMLButtonElement).style.borderColor=C.border;}}>✕</button>
  );
}

export function EditModal({ C, title, fields, onSave, onClose }: {
  C: Theme;
  title: string;
  fields: { label: string; value: string; onChange: (v: string) => void; type?: string; options?: string[] }[];
  onSave: () => void;
  onClose: () => void;
}) {
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",padding:"16px"}}>
      <div style={{background:C.card,borderRadius:"16px",padding:"32px",width:"100%",maxWidth:"420px",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:"16px",fontWeight:600,color:C.text,marginBottom:"18px"}}>{title}</div>
        {fields.map((f,i) => (
          <div key={i} style={{marginBottom:"18px"}}>
            <label style={{display:"block",fontSize:"11px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"6px",fontWeight:500}}>{f.label}</label>
            {f.options ? (
              <select value={f.value} onChange={e=>f.onChange(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer"}}>
                {f.options.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type={f.type||"text"} value={f.value} onChange={e=>f.onChange(e.target.value)} style={sInput}/>
            )}
          </div>
        ))}
        <div style={{display:"flex",gap:"10px",marginTop:"8px"}}>
          <button onClick={onSave} style={{...{borderRadius:"9px",border:"none",fontWeight:600,fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"10px 18px",transition:"opacity 0.15s"},background:"#6c5ce7",color:"#fff",flex:1}}>Save</button>
          <button onClick={onClose} style={{...{borderRadius:"9px",border:"none",fontWeight:600,fontSize:"13px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"10px 18px",transition:"opacity 0.15s"},background:C.cancelBg,color:C.muted,flex:1}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function EntryTable<T extends Entry>({entries, columns, accentColor, onEdit, onDelete, onDeleteMany, C}: {
  entries: T[];
  columns: {key: SortKey; label: string; render: (e:T)=>ReactNode; sortable?: boolean}[];
  accentColor: string;
  onEdit: (e:T)=>void;
  onDelete: (id:number)=>void;
  onDeleteMany: (ids:number[])=>void;
  C: Theme;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [expandId, setExpandId] = useState<number|null>(null);
  const [deleteId, setDeleteId] = useState<number|null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterAmtMin, setFilterAmtMin] = useState("");
  const [filterAmtMax, setFilterAmtMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const allCategories = [...new Set(entries.map(e=>(e as any).category).filter(Boolean))];

  const filtered = entries.filter(e=>{
    if(filterText && !e.description?.toLowerCase().includes(filterText.toLowerCase())) return false;
    if(filterFrom && e.date < filterFrom) return false;
    if(filterTo && e.date > filterTo) return false;
    if(filterCat && (e as any).category !== filterCat) return false;
    if(filterAmtMin && e.amount < parseFloat(filterAmtMin)) return false;
    if(filterAmtMax && e.amount > parseFloat(filterAmtMax)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a,b)=>{
    let av: any = (a as any)[sortKey]??"";
    let bv: any = (b as any)[sortKey]??"";
    if(sortKey==="amount"){av=+(av);bv=+(bv);}
    if(av<bv)return sortDir==="asc"?-1:1;
    if(av>bv)return sortDir==="asc"?1:-1;
    return 0;
  });

  const sInput: CSSProperties = {padding:"7px 11px",borderRadius:"8px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"13px",outline:"none",fontFamily:"'DM Sans',sans-serif"};
  const activeFilters = (filterText?1:0)+(filterFrom?1:0)+(filterTo?1:0)+(filterCat?1:0)+(filterAmtMin?1:0)+(filterAmtMax?1:0);

  const toggleSort = (key: SortKey) => {
    if(sortKey===key) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const thStyle: CSSProperties = {
    padding:"10px 12px", fontSize:"10px", color:C.muted, textTransform:"uppercase",
    letterSpacing:"1.2px", fontWeight:600, cursor:"pointer", userSelect:"none",
    borderBottom:`1px solid ${C.border}`, textAlign:"left", whiteSpace:"nowrap",
  };
  const tdStyle: CSSProperties = {
    padding:"12px 12px", fontSize:"13px", color:C.text, borderBottom:`1px solid ${C.border}`,
    verticalAlign:"middle",
  };

  return (
    <div>
      {/* Filter controls */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:showFilters?"10px":"14px",gap:"8px",flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={()=>setShowFilters(v=>!v)} style={{padding:"7px 14px",borderRadius:"20px",border:`1.5px solid ${activeFilters>0?accentColor:C.border}`,background:activeFilters>0?C.navActive:"transparent",color:activeFilters>0?accentColor:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:"5px"}}>
            <span>⚡ Filter</span>
            {activeFilters>0&&<span style={{background:accentColor,color:"#fff",borderRadius:"20px",padding:"1px 6px",fontSize:"10px",fontWeight:700}}>ON</span>}
            <span style={{fontSize:"10px",opacity:0.6}}>{showFilters?"▲":"▼"}</span>
          </button>
          <button onClick={()=>{setSelectMode(v=>!v);setSelectedIds(new Set());}} style={{padding:"7px 14px",borderRadius:"20px",border:`1px solid ${selectMode?accentColor:C.border}`,background:selectMode?C.navActive:"transparent",color:selectMode?accentColor:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
            ☑ Select
          </button>
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          {selectMode&&selectedIds.size>0&&(
            <button onClick={()=>setBulkDeleteConfirm(true)} style={{padding:"7px 12px",borderRadius:"20px",border:`1px solid ${C.border}`,background:C.delBg,color:C.red,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>
              ✕ Delete {selectedIds.size}
            </button>
          )}
          <div style={{fontSize:"12px",color:C.muted}}>{sorted.length} of {entries.length}</div>
        </div>
      </div>
      {showFilters&&(
        <div style={{display:"flex",gap:"10px",marginBottom:"10px",flexWrap:"wrap",background:C.cardAlt,padding:"16px",borderRadius:"12px",border:`1px solid ${C.border}`}}>
          <div style={{width:"100%",marginBottom:"4px"}}><input placeholder="Search description…" value={filterText} onChange={e=>setFilterText(e.target.value)} style={{...sInput,width:"100%",maxWidth:"280px"}}/></div>
          <div><label style={{display:"block",fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>From</label>
          <input type="date" value={filterFrom} onChange={e=>setFilterFrom(e.target.value)} style={sInput}/></div>
          <div><label style={{display:"block",fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>To</label>
          <input type="date" value={filterTo} onChange={e=>setFilterTo(e.target.value)} style={sInput}/></div>
          {allCategories.length>0&&<div><label style={{display:"block",fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>Category</label>
          <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{...sInput,appearance:"none",cursor:"pointer",minWidth:"120px"}}>
            <option value="">All</option>
            {allCategories.map(c=><option key={c} value={c}>{c}</option>)}
          </select></div>}
          <div><label style={{display:"block",fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>Min ₹</label>
          <input type="number" placeholder="0" value={filterAmtMin} onChange={e=>setFilterAmtMin(e.target.value)} style={{...sInput,width:"90px"}}/></div>
          <div><label style={{display:"block",fontSize:"10px",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"4px"}}>Max ₹</label>
          <input type="number" placeholder="∞" value={filterAmtMax} onChange={e=>setFilterAmtMax(e.target.value)} style={{...sInput,width:"90px"}}/></div>
          {activeFilters>0&&<button onClick={()=>{setFilterText("");setFilterFrom("");setFilterTo("");setFilterCat("");setFilterAmtMin("");setFilterAmtMax("");}} style={{padding:"6px 12px",borderRadius:"20px",border:`1px solid ${C.border}`,background:"transparent",color:C.red,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif",alignSelf:"flex-end"}}>✕ Clear</button>}
        </div>
      )}
    <div style={{overflowX:"auto",maxWidth:"100%"}}>
      <table style={{width:"100%",tableLayout:"auto",borderCollapse:"collapse",fontFamily:"'DM Sans',sans-serif"}}>
        <thead>
          <tr style={{background:C.cardAlt}}>
            {selectMode&&<th style={{...thStyle,width:"36px",paddingRight:0}}>
              <input type="checkbox"
                checked={sorted.length>0&&sorted.every(e=>selectedIds.has(e.id))}
                onChange={e=>{
                  if(e.target.checked) setSelectedIds(new Set(sorted.map(e=>e.id)));
                  else setSelectedIds(new Set());
                }}
                onClick={ev=>ev.stopPropagation()}
                style={{cursor:"pointer",width:"14px",height:"14px",accentColor:accentColor}}
              />
            </th>}
            {columns.map(col=>(
              <th key={col.key} className={col.key==="date"||col.key==="mode"||col.key==="account"?"col-hide-mobile":""} style={thStyle} onClick={()=>col.sortable!==false&&toggleSort(col.key)}>
                {col.label}{sortKey===col.key?(sortDir==="asc"?" ↑":" ↓"):""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length===0&&(
            <tr><td colSpan={columns.length+(selectMode?1:0)} style={{...tdStyle,textAlign:"center",color:C.faint,padding:"32px"}}>No entries yet</td></tr>
          )}
          {sorted.map(entry=>(
            <React.Fragment key={entry.id}>
              <tr style={{cursor:"pointer",transition:"background 0.1s",background:selectedIds.has(entry.id)?accentColor+"18":""}}
                onClick={()=>setExpandId(expandId===entry.id?null:entry.id)}
                onMouseEnter={e=>{if(!selectedIds.has(entry.id))(e.currentTarget as HTMLTableRowElement).style.background=C.cardAlt;}}
                onMouseLeave={e=>{(e.currentTarget as HTMLTableRowElement).style.background=selectedIds.has(entry.id)?accentColor+"18":""}}>
                {selectMode&&<td style={{...tdStyle,width:"36px",paddingRight:0}} onClick={e=>e.stopPropagation()}>
                  <input type="checkbox"
                    checked={selectedIds.has(entry.id)}
                    onChange={e=>{
                      const next=new Set(selectedIds);
                      if(e.target.checked) next.add(entry.id); else next.delete(entry.id);
                      setSelectedIds(next);
                    }}
                    style={{cursor:"pointer",width:"14px",height:"14px",accentColor:accentColor}}
                  />
                </td>}
                {columns.map(col=>(
                  <td key={col.key} className={col.key==="date"||col.key==="mode"||col.key==="account"?"col-hide-mobile":""} style={tdStyle}>{col.render(entry)}</td>
                ))}
              </tr>
              {expandId===entry.id&&(
                <tr key={entry.id+"_exp"}>
                  <td colSpan={columns.length+(selectMode?1:0)} style={{background:C.cardAlt,padding:"16px 18px",borderBottom:`1px solid ${C.border}`}}>
                    <div style={{display:"flex",gap:"16px",flexWrap:"wrap",fontSize:"12px",color:C.muted,marginBottom:"8px"}}>
                      <span><strong style={{color:C.text}}>Date:</strong> {entry.date}</span>
                      <span><strong style={{color:C.text}}>Mode:</strong> {entry.mode||"—"}</span>
                      {(entry as any).category&&<span><strong style={{color:C.text}}>Category:</strong> {(entry as any).category}</span>}
                      {(entry as any).account&&<span><strong style={{color:C.text}}>Account:</strong> {(entry as any).account}</span>}
                      <span><strong style={{color:C.text}}>Description:</strong> {entry.description||"—"}</span>
                    </div>
                    <div className="row-expand-mobile" style={{display:"flex",gap:"6px"}}>
                      <button onClick={e=>{e.stopPropagation();onEdit(entry);setExpandId(null);}} style={{...btnB,background:C.navActive,color:C.accent,padding:"5px 12px",fontSize:"12px"}}>✎ Edit</button>
                      <button onClick={e=>{e.stopPropagation();setDeleteId(entry.id);setExpandId(null);}} style={{...btnB,background:C.delBg,color:C.red,padding:"5px 12px",fontSize:"12px"}}>✕ Delete</button>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
    {deleteId!==null&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setDeleteId(null)}>
        <div style={{background:C.card,borderRadius:"16px",padding:"24px",width:"280px",border:`1px solid ${C.border}`,boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:"15px",fontWeight:600,color:C.text,marginBottom:"8px"}}>Delete entry?</div>
          <div style={{fontSize:"13px",color:C.muted,marginBottom:"20px"}}>This cannot be undone.</div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>{onDelete(deleteId);setDeleteId(null);}} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:C.delBg,color:C.red,cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Delete</button>
            <button onClick={()=>setDeleteId(null)} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:C.cancelBg,color:C.muted,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
          </div>
        </div>
      </div>
    )}
    {bulkDeleteConfirm&&(
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000}} onClick={()=>setBulkDeleteConfirm(false)}>
        <div style={{background:C.card,borderRadius:"16px",padding:"24px",width:"300px",border:`1px solid ${C.border}`,boxShadow:"0 8px 32px rgba(0,0,0,0.2)"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontSize:"15px",fontWeight:600,color:C.text,marginBottom:"8px"}}>Delete {selectedIds.size} entries?</div>
          <div style={{fontSize:"13px",color:C.muted,marginBottom:"20px"}}>This cannot be undone.</div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>{onDeleteMany([...selectedIds]);setSelectedIds(new Set());setSelectMode(false);setBulkDeleteConfirm(false);}} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:C.delBg,color:C.red,cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Delete all</button>
            <button onClick={()=>setBulkDeleteConfirm(false)} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:C.cancelBg,color:C.muted,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
