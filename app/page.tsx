"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth }         from "./hooks/useAuth";
import { useData }         from "./hooks/useData";
import { useCredits }      from "./hooks/useCredits";
import { exportCSV }       from "./lib/exportCSV";
import OverviewTab         from "./components/Overview";
import ExpensesTab         from "./components/ExpensesTab";
import EarningsTab         from "./components/CashInTab";
import SavingsTab          from "./components/SavingsTab";
import CreditTab           from "./components/CreditsTab";
import TrendsTab           from "./components/TrendsTab";
import Sidebar             from "./components/Sidebar";
import MobileNav           from "./components/MobileNav";
import SettingsPage        from "./components/SettingsPage";
import AuthScreen          from "./components/AuthScreen";
import MigrateModal        from "./components/MigrateModal";
import ModeSelectScreen    from "./components/ModeSelectScreen";
import CategoriesTab       from "./components/CategoriesTab";
import AccountsTab         from "./components/AccountsTab";
import TutorialTab         from "./components/TutorialTab";
import MobileDrawer        from "./components/MobileDrawer";
import GlobalStyles        from "./components/GlobalStyles";
import {
  MonthData, AllMonths, AppMode, Expense, Entry, CreditEntry,
  DEFAULT_CATS, DEFAULT_HOUSEHOLD_CATS, OLD_HOUSEHOLD_UTILITY_CATS, OLD_HOUSEHOLD_DEFAULT_CATS,
  DEFAULT_ACCOUNTS, PAYMENT_MODES, SWIPE_TABS, NAV,
  lsLoad, lsSave, makeTheme, todayS, curMK, modeMK, stripMK, emptyMD, getDays,
} from "./components/types";

export default function BudgetTracker() {
  const { user, setUser, authReady, logout: authLogout, deleteUserAccount: authDeleteUser } = useAuth();
  const [dark,    setDark]    = useState(() => lsLoad<boolean>("budgetly_dark", false));
  const [appMode, setAppMode] = useState<AppMode|null>(() => lsLoad<AppMode|null>("budgetly_mode", null));
  const { allMonths, setAllMonthsRaw, dbLoading, categories, setCategories, accounts, saveAccounts, loadFromSupabase, saveToSupabase, saveCreditsToSupabase, saveUserPrefs, deleteMonthFromDB } = useData(user, appMode);
  const { credits, setCredits, creditsLoaded, setCreditsLoaded, reloadCredits } = useCredits(user, appMode);

  const [showModeSelect, setShowModeSelect] = useState(false); const [activeTab, setActiveTab] = useState("overview");
  const [activeMKRaw, setActiveMKRaw] = useState(curMK); const [drawerOpen, setDrawerOpen] = useState(false);
  const [tutorialVisits, setTutorialVisits] = useState(() => lsLoad<number>("budgetly_tutorial_visits", 0));
  const [editingBudget, setEditingBudget] = useState(false); const [tempBudget, setTempBudget] = useState("10000");
  const [deleteConfirm, setDeleteConfirm] = useState<number|null>(null); const [newCategory, setNewCategory] = useState(""); const [newAccount, setNewAccount] = useState("");
  const [deleteMonthConfirm, setDeleteMonthConfirm] = useState(false); const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(false); const [deleteAccountText, setDeleteAccountText] = useState("");
  const [showMigrate, setShowMigrate] = useState(false); const [swipeOffset, setSwipeOffset] = useState(0); const [swipeAnim, setSwipeAnim] = useState<"in-left"|"in-right"|null>(null);

  const C = makeTheme(dark);
  const activeMK = modeMK(activeMKRaw, appMode);
  const setActiveMK = (mk: string) => setActiveMKRaw(stripMK(mk));
  const toggleDark = () => { document.documentElement.classList.add("theme-transitioning"); setTimeout(() => document.documentElement.classList.remove("theme-transitioning"), 600); setDark(d => { lsSave("budgetly_dark", !d); return !d; }); };

  useEffect(() => {
    if (!authReady || !user) return;
    loadFromSupabase();
    if (Object.keys(lsLoad<AllMonths>("budgetly_months", {})).length > 0) setShowMigrate(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authReady]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!creditsLoaded) return; saveCreditsToSupabase(credits); }, [credits, creditsLoaded]);

  const getM = (mk: string): MonthData => allMonths[mk] ?? emptyMD();
  const setM = useCallback(async (mk: string, d: MonthData) => { setAllMonthsRaw(prev => ({...prev,[mk]:d})); await saveToSupabase(mk, d); }, [saveToSupabase]);
  const md = getM(activeMK);
  const { budget, expenses, earnings, savings } = md;
  const today = todayS();

  const [expAmt, setExpAmt] = useState(""); const [expCat, setExpCat] = useState(DEFAULT_CATS[0]);
  const [expDesc, setExpDesc] = useState(""); const [expDate, setExpDate] = useState(today);
  const [expMode, setExpMode] = useState(PAYMENT_MODES[0]); const [expAcc, setExpAcc] = useState("");
  const [earnAmt, setEarnAmt] = useState(""); const [earnDesc, setEarnDesc] = useState("");
  const [earnDate, setEarnDate] = useState(today); const [earnMode, setEarnMode] = useState(PAYMENT_MODES[0]);
  const [earnAcc, setEarnAcc] = useState(""); const [savAmt, setSavAmt] = useState("");
  const [savDesc, setSavDesc] = useState(""); const [savDate, setSavDate] = useState(today);
  const [savMode, setSavMode] = useState(PAYMENT_MODES[0]); const [savAcc, setSavAcc] = useState("");
  const [crAmt, setCrAmt] = useState(""); const [crPerson, setCrPerson] = useState("");
  const [crDesc, setCrDesc] = useState(""); const [crDate, setCrDate] = useState(today);
  const [crType, setCrType] = useState<"owed_to_me"|"i_owe">("owed_to_me");

  const totalExpenses = expenses.reduce((s,e)=>s+e.amount,0), totalEarnings = earnings.reduce((s,e)=>s+e.amount,0), totalSavings = savings.reduce((s,e)=>s+e.amount,0);
  const cashFlowIn = appMode==="household" ? totalEarnings : budget + totalEarnings, cashFlowOut = totalExpenses;
  const remaining = cashFlowIn - cashFlowOut - totalSavings, spentPct = cashFlowIn>0 ? Math.min((cashFlowOut/(cashFlowIn-totalSavings))*100,100) : 0;
  const daysInMonth = getDays(activeMK), todayDay = activeMK===curMK() ? new Date().getDate() : daysInMonth, daysLeft = Math.max(daysInMonth-todayDay+1,1);
  const moneyLeft = Math.max(remaining,0), idealPerDay = Math.round((cashFlowIn-totalSavings)/daysInMonth);
  const idealSpentByToday = idealPerDay*todayDay, actualVsIdeal = cashFlowOut-idealSpentByToday, currentDailyAvg = todayDay>0 ? Math.round(cashFlowOut/todayDay) : 0, currentIdealAvg = Math.round(remaining/daysLeft);
  const allMKs = (()=>{ const k=Object.keys(allMonths).filter(mk=>appMode==="household"?mk.startsWith("h:"):!mk.startsWith("h:")); if(!k.includes(activeMK))k.push(activeMK); return k.sort().reverse(); })();

  const switchMode = (m: AppMode) => {
    setAppMode(m); lsSave("budgetly_mode", m);
    const modeKey = m==="household" ? "budgetly_cats_household" : "budgetly_cats_student";
    let savedCats = lsLoad<string[]>(modeKey, null as any);
    const newDef = m==="household" ? DEFAULT_HOUSEHOLD_CATS : DEFAULT_CATS;
    if (savedCats && savedCats.length > 0 && m==="household") { let mg=savedCats.filter(c=>!OLD_HOUSEHOLD_UTILITY_CATS.includes(c)); mg=mg.filter(c=>!OLD_HOUSEHOLD_DEFAULT_CATS.includes(c)); if(mg.length!==savedCats.length){savedCats=mg;lsSave(modeKey,mg);} }
    setCategories(savedCats && savedCats.length > 0 ? savedCats : newDef); setShowModeSelect(false);
  };
  const incrementTutorialVisits = () => setTutorialVisits(v => { const n=v+1; lsSave("budgetly_tutorial_visits",n); return n; });
  const setBudget      = (v:number) => setM(activeMK,{...md,budget:v});
  const saveBudget     = () => { const v=parseFloat(tempBudget); if(!isNaN(v)&&v>0)setBudget(v); setEditingBudget(false); };
  const addExpense     = () => { if(!expAmt||isNaN(+expAmt))return; setM(activeMK,{...md,expenses:[...expenses,{id:Date.now(),amount:+expAmt,category:expCat,description:expDesc,date:expDate,mode:expMode,account:expAcc||undefined}]}); setExpAmt(""); setExpDesc(""); };
  const addEarning     = () => { if(!earnAmt||isNaN(+earnAmt))return; setM(activeMK,{...md,earnings:[...earnings,{id:Date.now(),amount:+earnAmt,description:earnDesc,date:earnDate,mode:earnMode,account:earnAcc||undefined}]}); setEarnAmt(""); setEarnDesc(""); };
  const addSaving      = () => { if(!savAmt||isNaN(+savAmt))return; setM(activeMK,{...md,savings:[...savings,{id:Date.now(),amount:+savAmt,description:savDesc,date:savDate,mode:savMode,account:savAcc||undefined}]}); setSavAmt(""); setSavDesc(""); };
  const deleteExpense      = (id:number)    => { setM(activeMK,{...md,expenses:expenses.filter(e=>e.id!==id)}); setDeleteConfirm(null); };
  const deleteEarning      = (id:number)    => { setM(activeMK,{...md,earnings:earnings.filter(e=>e.id!==id)}); setDeleteConfirm(null); };
  const deleteSaving       = (id:number)    => { setM(activeMK,{...md,savings: savings.filter(e=>e.id!==id)}); setDeleteConfirm(null); };
  const deleteManyExpenses = (ids:number[]) => setM(activeMK,{...md,expenses:expenses.filter(e=>!ids.includes(e.id))});
  const deleteManyEarnings = (ids:number[]) => setM(activeMK,{...md,earnings:earnings.filter(e=>!ids.includes(e.id))});
  const deleteManySavings  = (ids:number[]) => setM(activeMK,{...md,savings: savings.filter(e=>!ids.includes(e.id))});
  const updateExpense  = (id:number,u:Partial<Expense>)     => setM(activeMK,{...md,expenses:expenses.map(e=>e.id===id?{...e,...u}:e)});
  const updateEarning  = (id:number,u:Partial<Entry>)       => setM(activeMK,{...md,earnings:earnings.map(e=>e.id===id?{...e,...u}:e)});
  const updateSaving   = (id:number,u:Partial<Entry>)       => setM(activeMK,{...md,savings: savings.map(e=>e.id===id?{...e,...u}:e)});
  const updateCredit   = (id:number,u:Partial<CreditEntry>) => setCredits(prev=>prev.map(c=>c.id===id?{...c,...u}:c));
  const addCategory    = () => { const t=newCategory.trim(); if(!t||categories.includes(t))return; const base=appMode==="household"?categories.filter(c=>c!=="Misc"):categories; const n=appMode==="household"?[...base,t,"Misc"]:[...base,t]; setCategories(n); lsSave(appMode==="household"?"budgetly_cats_household":"budgetly_cats_student",n); saveUserPrefs(n,accounts); setNewCategory(""); };
  const deleteCategory = (cat:string) => { const def=appMode==="household"?DEFAULT_HOUSEHOLD_CATS:DEFAULT_CATS; if(def.includes(cat))return; const n=categories.filter(c=>c!==cat); setCategories(n); lsSave(appMode==="household"?"budgetly_cats_household":"budgetly_cats_student",n); saveUserPrefs(n,accounts); };
  const addAccount     = () => { const t=newAccount.trim(); if(!t||accounts.includes(t))return; const n=[...accounts,t]; saveAccounts(n); saveUserPrefs(categories,n); setNewAccount(""); };
  const deleteAccount  = (acc:string) => { if(DEFAULT_ACCOUNTS.includes(acc))return; const n=accounts.filter(a=>a!==acc); saveAccounts(n); saveUserPrefs(categories,n); };
  const addCredit      = () => { if(!crAmt||isNaN(+crAmt)||!crPerson.trim())return; setCredits(prev=>[...prev,{id:Date.now(),person:crPerson.trim(),amount:+crAmt,description:crDesc,date:crDate,type:crType,cleared:false}]); setCrAmt(""); setCrPerson(""); setCrDesc(""); };
  const deleteCredit   = (id:number) => { setCredits(prev=>prev.filter(c=>c.id!==id)); setDeleteConfirm(null); };
  const toggleCleared  = (id:number) => {
    setCredits(prev => prev.map(c => {
      if (c.id !== id) return c;
      const nowCleared = !c.cleared;
      const label = `Credit: ${c.person}${c.description ? ` — ${c.description}` : ""}`;
      if (nowCleared) {
        if (c.type==="owed_to_me") setM(activeMK,{...getM(activeMK),earnings:[...getM(activeMK).earnings,{id:Date.now(),amount:c.amount,description:label,date:todayS()}]});
        else setM(activeMK,{...getM(activeMK),expenses:[...getM(activeMK).expenses,{id:Date.now(),amount:c.amount,category:"Other",description:label,date:todayS()}]});
      } else {
        if (c.type==="owed_to_me") setM(activeMK,{...getM(activeMK),earnings:getM(activeMK).earnings.filter(e=>e.description!==label)});
        else setM(activeMK,{...getM(activeMK),expenses:getM(activeMK).expenses.filter(e=>e.description!==label)});
      }
      return {...c, cleared: nowCleared};
    }));
  };
  const addNextMonth = () => { const [y,m]=stripMK(activeMK).split("-").map(Number); const nd=new Date(y,m,1); const nk=modeMK(`${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,"0")}`,appMode); if(!allMonths[nk])setM(nk,emptyMD()); setActiveMK(nk); };
  const deleteMonth  = async () => { setDeleteMonthConfirm(false); setAllMonthsRaw(prev=>{const n={...prev};delete n[activeMK];return n;}); await deleteMonthFromDB(activeMK); setActiveMK(curMK()); };
  const handleMigrate = async (migrate: boolean) => { setShowMigrate(false); if(!migrate||!user)return; const d=lsLoad<AllMonths>("budgetly_months",{}); for(const[mk,md] of Object.entries(d)) await saveToSupabase(mk,md); localStorage.removeItem("budgetly_months"); await loadFromSupabase(); await reloadCredits(); };
  const logout = async () => { await authLogout(); setUser(null); setAllMonthsRaw({}); };
  const deleteUserAccount = async () => { await authDeleteUser(); setUser(null); setAllMonthsRaw({}); };
  const doExportCSV = () => exportCSV({ activeMK, budget, expenses, earnings, savings, cashFlowIn, cashFlowOut, totalEarnings, totalSavings, remaining });

  if (!authReady) return <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}><div style={{fontSize:"13px",color:C.muted}}>Loading…</div></div>;
  if (!user) return <AuthScreen onAuth={u=>setUser(u)} dark={dark}/>;
  if (!appMode || showModeSelect) return <ModeSelectScreen C={C} onSelect={switchMode}/>;
  const showTutorialStrip = tutorialVisits < 5;

  const ovProps = { C,budget,cashFlowIn,cashFlowOut,totalEarnings,totalSavings,remaining,spentPct,editingBudget,tempBudget,setEditingBudget,setTempBudget,saveBudget,expenses,earnings,savings,categories,accounts,appMode,daysInMonth,todayDay,idealPerDay,idealSpentByToday,actualVsIdeal,moneyLeft,daysLeft,currentDailyAvg,currentIdealAvg,credits,setActiveTab };
  const exProps = { C,expenses,categories,accounts,appMode,totalExpenses:cashFlowOut,expAmt,expCat,expDesc,expDate,expMode,expAcc,setExpAmt,setExpCat,setExpDesc,setExpDate,setExpMode,setExpAcc,addExpense,deleteConfirm,setDeleteConfirm,deleteExpense,deleteManyExpenses,updateExpense,onOpenCategories:()=>setActiveTab("categories"),onOpenAccounts:()=>setActiveTab("accounts") };
  const erProps = { C,earnings,accounts,appMode,totalEarnings,earnAmt,earnDesc,earnDate,earnMode,earnAcc,setEarnAmt,setEarnDesc,setEarnDate,setEarnMode,setEarnAcc,addEarning,deleteConfirm,setDeleteConfirm,deleteEarning,deleteManyEarnings,updateEarning };
  const svProps = { C,savings,accounts,appMode,totalSavings,cashFlowIn,savAmt,savDesc,savDate,savMode,savAcc,setSavAmt,setSavDesc,setSavDate,setSavMode,setSavAcc,addSaving,deleteConfirm,setDeleteConfirm,deleteSaving,deleteManySavings,updateSaving };
  const crProps = { C,credits,crAmt,crPerson,crDesc,crDate,crType,setCrAmt,setCrPerson,setCrDesc,setCrDate,setCrType,addCredit,toggleCleared,deleteCredit,updateCredit,deleteConfirm,setDeleteConfirm };
  const sidebarProps = { C,appMode,activeMK,allMKs,activeTab,dbLoading,setActiveMK,setActiveTab,setDrawerOpen };
  const settingsProps = { C,user,dark,appMode,activeMK,categories,deleteMonthConfirm,deleteAccountConfirm,deleteAccountText,logout,toggleDark,switchMode,setCategories,setActiveTab,addNextMonth,deleteMonth,setDeleteMonthConfirm,setDeleteAccountConfirm,setDeleteAccountText,deleteUserAccount,exportCSV:doExportCSV };

  return (
    <>
      <GlobalStyles C={C} dark={dark} appMode={appMode}/>
      {showMigrate && <MigrateModal onDecide={handleMigrate} C={C}/>}
      <MobileDrawer C={C} drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} appMode={appMode}><Sidebar {...sidebarProps}/></MobileDrawer>
      <div style={{minHeight:"100vh",background:C.bg,display:"flex"}}>
        <aside className="desk-sidebar" style={{width:"210px",minHeight:"100vh",background:C.sidebar,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"24px 0",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
          <Sidebar {...sidebarProps}/>
        </aside>
        <main className="main-wrap" style={{flex:1,padding:"36px 32px",overflowX:"hidden",overflowY:"auto",minWidth:0}}
          onTouchStart={e=>{const t=e.touches[0];const el=e.currentTarget as HTMLElement;el.dataset.touchX=String(t.clientX);el.dataset.touchY=String(t.clientY);el.dataset.dragging="1";}}
          onTouchMove={e=>{const el=e.currentTarget as HTMLElement;if(!el.dataset.dragging)return;const dx=e.touches[0].clientX-parseFloat(el.dataset.touchX||"0");const dy=e.touches[0].clientY-parseFloat(el.dataset.touchY||"0");if(Math.abs(dx)>Math.abs(dy)){e.preventDefault();setSwipeOffset(dx*0.4);}}}
          onTouchEnd={e=>{const el=e.currentTarget as HTMLElement;el.dataset.dragging="";const dx=e.changedTouches[0].clientX-parseFloat(el.dataset.touchX||"0");const dy=e.changedTouches[0].clientY-parseFloat(el.dataset.touchY||"0");setSwipeOffset(0);if(Math.abs(dx)<50||Math.abs(dx)<Math.abs(dy)*1.5)return;const idx=SWIPE_TABS.indexOf(activeTab);if(dx<0&&idx<SWIPE_TABS.length-1){setSwipeAnim("in-left");setActiveTab(SWIPE_TABS[idx+1]);setTimeout(()=>setSwipeAnim(null),350);}if(dx>0&&idx>0){setSwipeAnim("in-right");setActiveTab(SWIPE_TABS[idx-1]);setTimeout(()=>setSwipeAnim(null),350);}}}>
          <div style={{transform:`translateX(${swipeOffset}px)`,transition:swipeOffset===0?"transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)":"none",animation:swipeAnim==="in-left"?"slideInFromRight 0.32s cubic-bezier(0.25,0.46,0.45,0.94)":swipeAnim==="in-right"?"slideInFromLeft 0.32s cubic-bezier(0.25,0.46,0.45,0.94)":"none",willChange:"transform",overflowX:"hidden",overflowY:"auto",maxWidth:"100%",height:"100%"}}>
            {!["expenses","earnings","savings","credit"].includes(activeTab) && (
              <div className="page-title-row" style={{paddingTop:"28px",paddingBottom:"20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"8px"}}>
                <h1 style={{fontSize:"clamp(22px,3vw,32px)",fontWeight:700,color:C.text,letterSpacing:"-0.8px",lineHeight:1.1}}>
                  {activeTab==="categories"?"Categories":activeTab==="tutorial"?"How to use Budgetly":activeTab==="trends"?"Trends":activeTab==="accounts"?"Accounts":activeTab==="settings"?"Settings":NAV.find(n=>n.id===activeTab)?.label}
                </h1>
              </div>
            )}
            {showTutorialStrip && activeTab!=="tutorial" && (
              <div style={{background:C.navActive,borderRadius:"10px",padding:"14px 18px",marginBottom:"20px",display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${C.border}`,gap:"10px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}><span style={{fontSize:"14px"}}>💡</span><span style={{fontSize:"12px",color:C.muted,lineHeight:1.5}}>New to Budgetly? Check out tips and tricks to get the most out of the app.</span></div>
                <div style={{display:"flex",gap:"6px",flexShrink:0}}>
                  <button onClick={()=>{setActiveTab("tutorial");incrementTutorialVisits();}} style={{background:"#6c5ce7",color:"#fff",borderRadius:"9px",border:"none",fontWeight:600,fontSize:"12px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",padding:"5px 12px",whiteSpace:"nowrap"}}>How to use →</button>
                  <button onClick={incrementTutorialVisits} style={{background:"none",border:"none",color:C.faint,cursor:"pointer",fontSize:"16px",padding:"0 4px"}} title="Dismiss">✕</button>
                </div>
              </div>
            )}
            {activeTab==="overview"    && <OverviewTab   {...ovProps}/>}
            {activeTab==="expenses"    && <ExpensesTab   {...exProps}/>}
            {activeTab==="earnings"    && <EarningsTab   {...erProps}/>}
            {activeTab==="savings"     && <SavingsTab    {...svProps}/>}
            {activeTab==="credit"      && <CreditTab     {...crProps}/>}
            {activeTab==="categories"  && <CategoriesTab C={C} categories={categories} expenses={expenses} cashFlowOut={cashFlowOut} newCategory={newCategory} setNewCategory={setNewCategory} addCategory={addCategory} deleteCategory={deleteCategory} appMode={appMode}/>}
            {activeTab==="tutorial"    && <TutorialTab C={C} appMode={appMode}/>}
            {activeTab==="trends"      && <TrendsTab    C={C} allMonths={allMonths} activeMK={activeMK} categories={categories} appMode={appMode} expenses={expenses} cashFlowOut={cashFlowOut} currentDailyAvg={currentDailyAvg} todayDay={todayDay}/>}
            {activeTab==="accounts"    && <AccountsTab C={C} accounts={accounts} expenses={expenses} earnings={earnings} savings={savings} newAccount={newAccount} setNewAccount={setNewAccount} addAccount={addAccount} deleteAccount={deleteAccount}/>}
            {activeTab==="settings"    && <SettingsPage  {...settingsProps}/>}
          </div>
        </main>
      </div>
      <MobileNav C={C} activeTab={activeTab} setActiveTab={setActiveTab}/>
    </>
  );
}
