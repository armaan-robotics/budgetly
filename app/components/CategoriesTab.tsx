"use client";
import { CSSProperties } from "react";
import { CaProps } from "../types";
import { DEFAULT_CATS, CAT_COLORS, fmt, btnP } from "../constants";
import { FF } from "./ui";

export function CategoriesTab(p: CaProps) {
  const { C } = p;
  const sInput: CSSProperties = { width:"100%",padding:"9px 13px",borderRadius:"9px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif" };
  const sCard:  CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}` };
  const sSecT:  CSSProperties = { fontSize:"10px",color:C.muted,letterSpacing:"2px",textTransform:"uppercase",marginBottom:"12px",fontWeight:600 };
  return (
    <div className="two-col-grid" style={{display:"grid",gridTemplateColumns:"clamp(240px,30%,300px) 1fr",gap:"16px"}}>
      <div style={sCard}>
        <div style={{...sSecT,marginBottom:"14px"}}>Add Category</div>
        <FF label="Category Name" C={C}><input type="text" placeholder="e.g. Rent, Subscriptions…" value={p.newCategory} onChange={e=>p.setNewCategory(e.target.value)} onKeyDown={e=>e.key==="Enter"&&p.addCategory()} style={sInput}/></FF>
        <button onClick={p.addCategory} style={{...btnP,width:"100%",padding:"11px"}}>+ Add Category</button>
        <p style={{fontSize:"11px",color:C.faint,marginTop:"10px",lineHeight:1.6}}>Default categories cannot be deleted.</p>
      </div>
      <div style={sCard}>
        <div style={sSecT}>{p.categories.length} Categories</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"9px"}}>
          {p.categories.map((cat,i)=>{
            const total=p.expenses.filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0);
            const count=p.expenses.filter(e=>e.category===cat).length;
            const color=CAT_COLORS[i%CAT_COLORS.length]; const isDef=DEFAULT_CATS.includes(cat);
            return(
              <div key={cat} style={{background:C.cardAlt,borderRadius:"10px",padding:"12px",border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"7px"}}>
                  <div style={{width:"7px",height:"7px",borderRadius:"50%",background:color,flexShrink:0}}/>
                  <span style={{fontSize:"12px",fontWeight:500,color:C.text,flex:1}}>{cat}</span>
                  {!isDef&&<button onClick={()=>p.deleteCategory(cat)} style={{background:"none",border:"none",color:C.faint,cursor:"pointer",fontSize:"12px",padding:"0 2px"}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.red;}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.color=C.faint;}}>✕</button>}
                </div>
                <div style={{fontSize:"16px",fontWeight:600,color:total>0?color:C.faint,marginBottom:"4px"}}>{fmt(total)}</div>
                <div style={{fontSize:"10px",color:C.faint}}>{count} expense{count!==1?"s":""}{isDef&&<span style={{marginLeft:"4px"}}>· default</span>}</div>
                {p.cashFlowOut>0&&total>0&&<>
                  <div style={{background:C.progressTrack,borderRadius:"5px",height:"3px",marginTop:"7px"}}>
                    <div style={{height:"100%",borderRadius:"5px",background:color,width:`${Math.min((total/p.cashFlowOut)*100,100)}%`}}/>
                  </div>
                  <div style={{fontSize:"10px",color:C.faint,marginTop:"3px"}}>{((total/p.cashFlowOut)*100).toFixed(1)}%</div>
                </>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
