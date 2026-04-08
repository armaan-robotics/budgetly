"use client";
import { CSSProperties, ReactNode } from "react";
import { Theme } from "../types";
import { btnB } from "../constants";

export function FF({ label, children, C }: { label:string; children:ReactNode; C:Theme }) {
  return (
    <div style={{marginBottom:"12px"}}>
      <label style={{display:"block",fontSize:"11px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"6px",fontWeight:500}}>{label}</label>
      {children}
    </div>
  );
}

export function EntryRow({ left, right, C }: { left:ReactNode; right:ReactNode; C:Theme }) {
  return (
    <div style={{background:C.cardAlt,borderRadius:"10px",padding:"11px 13px",border:`1px solid ${C.border}`,marginBottom:"6px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"10px"}}>
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
      <div style={{background:C.card,borderRadius:"16px",padding:"24px",width:"100%",maxWidth:"420px",border:`1px solid ${C.border}`}}>
        <div style={{fontSize:"16px",fontWeight:600,color:C.text,marginBottom:"18px"}}>{title}</div>
        {fields.map((f,i) => (
          <div key={i} style={{marginBottom:"12px"}}>
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
          <button onClick={onClose} style={{...btnB,background:C.cancelBg,color:C.muted,flex:1}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
