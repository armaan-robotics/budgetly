"use client";

import { SettingsProps, AppMode, DEFAULT_CATS, DEFAULT_HOUSEHOLD_CATS, fmtMK, btnB, lsSave } from "./types";

export default function SettingsPage({ C, user, dark, appMode, activeMK, categories, deleteMonthConfirm, deleteAccountConfirm, deleteAccountText, logout, toggleDark, switchMode, setCategories, setActiveTab, addNextMonth, deleteMonth, setDeleteMonthConfirm, setDeleteAccountConfirm, setDeleteAccountText, deleteUserAccount, exportCSV }: SettingsProps) {
  return (
    <div style={{maxWidth:"460px",width:"100%",fontFamily:"'DM Sans',sans-serif",overflowX:"hidden",boxSizing:"border-box"}}>
        {/* Account */}
        <div style={{marginBottom:"26px",paddingBottom:"26px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Account</div>
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.cardAlt,padding:"10px 12px",borderRadius:"10px",border:`1px solid ${C.border}`,marginBottom:"10px"}}>
                <div>
                  <div style={{fontSize:"11px",color:C.muted,marginBottom:"2px"}}>Signed in as</div>
                  <div style={{fontSize:"13px",color:C.text,fontWeight:500}}>{user?.email}</div>
                </div>
                <button onClick={()=>{logout();}} style={{...btnB,background:C.delBg,color:C.red,padding:"7px 14px",fontSize:"12px"}}>Log out</button>
              </div>
              <div style={{background:C.green+"14",border:`1px solid ${C.green}33`,borderRadius:"10px",padding:"11px 14px"}}>
                <div style={{fontSize:"11px",color:C.green,fontWeight:600,marginBottom:"3px"}}>✓ Account active</div>
                <div style={{fontSize:"11px",color:C.muted,lineHeight:1.7}}>Your data syncs across all devices and is securely stored.</div>
              </div>
            </>
        </div>

        {/* Dark mode + Bold */}
        <div style={{marginBottom:"26px",paddingBottom:"26px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Appearance</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.cardAlt,padding:"12px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,marginBottom:"8px"}}>
            <div>
              <div style={{fontSize:"13px",color:C.text,fontWeight:500}}>{dark?"Dark Mode":"Light Mode"}</div>
              <div style={{fontSize:"11px",color:C.muted,marginTop:"2px"}}>Switch appearance</div>
            </div>
            <button onClick={toggleDark} style={{background:dark?C.accent:"#d1cfe8",border:"none",borderRadius:"20px",width:"44px",height:"24px",cursor:"pointer",position:"relative",flexShrink:0}}>
              <div style={{position:"absolute",top:"3px",left:dark?"23px":"3px",width:"18px",height:"18px",borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.25)"}}/>
            </button>
          </div>

        </div>

        {/* Month management */}
        <div style={{marginBottom:"26px",paddingBottom:"26px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Month</div>
          <button onClick={()=>{addNextMonth();setActiveTab("overview");}} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.cardAlt,color:C.accent,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,textAlign:"left",marginBottom:"8px"}}>
            + Add New Month
          </button>
          {deleteMonthConfirm ? (
            <div>
              <div style={{fontSize:"12px",color:C.text,marginBottom:"8px",textAlign:"center"}}>Delete {fmtMK(activeMK)}?</div>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>{deleteMonth();setActiveTab("overview");}} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:C.delBg,color:C.red,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Yes, delete</button>
                <button onClick={()=>setDeleteMonthConfirm(false)} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:C.cancelBg,color:C.muted,cursor:"pointer",fontSize:"12px",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={()=>setDeleteMonthConfirm(true)} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:"transparent",color:C.red,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",textAlign:"left",opacity:0.8}}>
              🗑 Delete {fmtMK(activeMK)}
            </button>
          )}
        </div>

        {/* App */}
        <div style={{marginBottom:"26px",paddingBottom:"26px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>App</div>
          {/* Mode switcher */}
          <div style={{background:C.cardAlt,borderRadius:"10px",padding:"12px 14px",border:`1px solid ${C.border}`,marginBottom:"8px"}}>
            <div style={{fontSize:"12px",color:C.muted,marginBottom:"8px"}}>Current mode: <strong style={{color:C.text}}>{appMode==="student"?"🎓 Student":"🏠 Household"}</strong></div>
            <div style={{display:"flex",gap:"6px"}}>
              <button onClick={()=>switchMode("student")} style={{flex:1,padding:"7px",borderRadius:"8px",border:`1.5px solid ${appMode==="student"?C.accent:C.border}`,background:appMode==="student"?C.navActive:"transparent",color:appMode==="student"?C.accent:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>🎓 Student</button>
              <button onClick={()=>switchMode("household")} style={{flex:1,padding:"7px",borderRadius:"8px",border:`1.5px solid ${appMode==="household"?C.accent:C.border}`,background:appMode==="household"?C.navActive:"transparent",color:appMode==="household"?C.accent:C.muted,cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>🏠 Household</button>
            </div>
          </div>
          <button onClick={()=>{
            // Force-merge any missing defaults for the current mode before opening categories
            const reqDefs = appMode==="household" ? DEFAULT_HOUSEHOLD_CATS : DEFAULT_CATS;
            const missing = reqDefs.filter(d => !categories.includes(d));
            if (missing.length > 0) {
              const merged = [...missing, ...categories];
              setCategories(merged);
              lsSave(appMode==="household" ? "budgetly_cats_household" : "budgetly_cats_student", merged);
            }
            setActiveTab("categories");
          }} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.cardAlt,color:C.text,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:500,textAlign:"left",marginBottom:"8px",display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"15px"}}>▦</span> Manage Categories
          </button>
          {appMode==="household"&&<button onClick={()=>{setActiveTab("accounts");}} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.cardAlt,color:C.text,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:500,textAlign:"left",marginBottom:"8px",display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"15px"}}>🏦</span> Manage Accounts
          </button>}
          <button onClick={()=>{setActiveTab("tutorial");}} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.cardAlt,color:C.text,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:500,textAlign:"left",display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"15px"}}>?</span> How to use Budgetly
          </button>
        </div>

        {/* Get the App */}
        <div style={{marginBottom:"26px",paddingBottom:"26px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Get the App</div>
          <div style={{background:C.navActive,borderRadius:"10px",padding:"14px",border:`1px solid ${C.border}`}}>
            <div style={{fontSize:"12px",color:C.accent,fontWeight:600,marginBottom:"8px"}}>📱 Install on Android</div>
            {[
              "Open budgetly-xldm.vercel.app in Chrome on your phone",
              "Tap the 3-dot menu (⋮) in the top right",
              `Tap "Add to Home screen"`,
              `Tap "Add" — done`,
            ].map((step, i) => (
              <div key={i} style={{display:"flex",gap:"10px",marginBottom:"6px",alignItems:"flex-start"}}>
                <div style={{width:"18px",height:"18px",borderRadius:"50%",background:C.accent,color:"#fff",fontSize:"10px",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"1px"}}>{i+1}</div>
                <div style={{fontSize:"11px",color:C.muted,lineHeight:1.6}}>{step}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Export */}
        <div style={{marginBottom:"26px",paddingBottom:"26px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Export Data</div>
          <div style={{fontSize:"11px",color:C.muted,lineHeight:1.6,marginBottom:"10px"}}>Download all your data for {fmtMK(activeMK)} as a spreadsheet (.csv) you can open in Excel, Google Sheets, or any spreadsheet app.</div>
          <button onClick={exportCSV} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.cardAlt,color:C.green,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,textAlign:"left"}}>
            ↓ Export {fmtMK(activeMK)} as Spreadsheet
          </button>
        </div>

        {/* Feedback */}
        <div>
          <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Feedback</div>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSdtx7DdVgiihO1C6qGfO8Y_nPjvyMvjQUr9fZMdwuG2C1DlCg/viewform?usp=publish-editor"
            target="_blank" rel="noreferrer"
            style={{display:"block",textAlign:"center",padding:"10px",borderRadius:"10px",background:C.navActive,color:C.accent,fontSize:"13px",fontWeight:600,textDecoration:"none",boxSizing:"border-box",maxWidth:"100%"}}>
            💬 Give Feedback
          </a>
        </div>

        {/* Legal */}
        <div style={{marginTop:"20px",paddingTop:"20px",borderTop:`1px solid ${C.border}`}}>
          <a href="/privacy-policy" target="_blank" rel="noreferrer"
            style={{display:"block",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.border}`,background:C.cardAlt,color:C.muted,fontSize:"13px",fontWeight:500,textDecoration:"none",textAlign:"left",boxSizing:"border-box",maxWidth:"100%"}}>
            🔒 Privacy Policy
          </a>
        </div>

        {/* Danger Zone */}
        <div style={{marginTop:"8px",paddingTop:"20px",borderTop:`1px solid ${C.red}44`}}>
          <div style={{fontSize:"10px",color:C.red,letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:"10px",fontWeight:600}}>Danger Zone</div>
          {!deleteAccountConfirm ? (
            <button onClick={()=>{setDeleteAccountConfirm(true);setDeleteAccountText("");}}
              style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1px solid ${C.red}66`,background:C.delBg,color:C.red,cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,textAlign:"left"}}>
              Delete Account
            </button>
          ) : (
            <div style={{background:C.delBg,border:`1px solid ${C.red}66`,borderRadius:"12px",padding:"14px"}}>
              <div style={{fontSize:"12px",color:C.text,marginBottom:"10px",lineHeight:1.5}}>This will permanently delete your account and all your data. This cannot be undone. Type <strong>DELETE</strong> to confirm.</div>
              <input
                value={deleteAccountText}
                onChange={e=>setDeleteAccountText(e.target.value)}
                placeholder="Type DELETE"
                style={{width:"100%",padding:"8px 12px",borderRadius:"8px",border:`1.5px solid ${C.border}`,background:C.inputBg,color:C.text,fontSize:"13px",outline:"none",fontFamily:"'DM Sans',sans-serif",marginBottom:"10px",boxSizing:"border-box"}}
              />
              <div style={{display:"flex",gap:"8px"}}>
                <button
                  onClick={()=>{if(deleteAccountText==="DELETE"){deleteUserAccount();}}}
                  disabled={deleteAccountText!=="DELETE"}
                  style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:deleteAccountText==="DELETE"?C.red:C.delBg,color:deleteAccountText==="DELETE"?"#fff":C.muted,cursor:deleteAccountText==="DELETE"?"pointer":"not-allowed",fontSize:"12px",fontWeight:600,fontFamily:"'DM Sans',sans-serif",opacity:deleteAccountText==="DELETE"?1:0.6}}>
                  Delete Account
                </button>
                <button onClick={()=>{setDeleteAccountConfirm(false);setDeleteAccountText("");}} style={{flex:1,padding:"9px",borderRadius:"9px",border:"none",background:C.cancelBg,color:C.muted,cursor:"pointer",fontSize:"12px",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
