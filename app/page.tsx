"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useData } from "./hooks/useData";
import { useCredits } from "./hooks/useCredits";
import { makeTheme, DEFAULT_CATS, curMK, fmtMK, getDays, todayS, lsLoad, SWIPE_TABS, NAV, fmt } from "./constants";
import { AllMonths } from "./types";
import { AuthScreen, MigrateModal } from "./components/AuthScreen";
import { OverviewTab } from "./components/Overview";
import { ExpensesTab } from "./components/ExpensesTab";
import { EarningsTab } from "./components/CashInTab";
import { SavingsTab } from "./components/SavingsTab";
import { CreditTab } from "./components/CreditsTab";
import { TrendsTab } from "./components/TrendsTab";
import { SettingsPage } from "./components/SettingsPage";
import { Sidebar } from "./components/Sidebar";
import { MobileHeader, MobileNav } from "./components/MobileNav";
import { MobileDrawer } from "./components/MobileDrawer";
import { CategoriesTab } from "./components/CategoriesTab";
import { TutorialTab } from "./components/TutorialTab";

export default function BudgetTracker() {
  const [dark,         setDark]         = useState<boolean>(() => lsLoad<boolean>("budgetly_dark", false));
  const [activeTab,    setActiveTab]    = useState<string>("overview");
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [swipeOffset,  setSwipeOffset]  = useState(0);
  const [swipeAnim,    setSwipeAnim]    = useState<"in-left"|"in-right"|null>(null);

  const today = todayS();
  const [expAmt,  setExpAmt]  = useState(""); const [expCat, setExpCat] = useState(DEFAULT_CATS[0]);
  const [expDesc, setExpDesc] = useState(""); const [expDate, setExpDate] = useState(today);
  const [earnAmt, setEarnAmt] = useState(""); const [earnDesc, setEarnDesc] = useState(""); const [earnDate, setEarnDate] = useState(today);
  const [savAmt,  setSavAmt]  = useState(""); const [savDesc, setSavDesc] = useState(""); const [savDate, setSavDate] = useState(today);

  const auth = useAuth();
  const data = useData(auth.user);
  const cr   = useCredits();

  const C = makeTheme(dark);
  const toggleDark = () => {
    const html = document.documentElement;
    html.classList.add("theme-transitioning");
    setTimeout(() => html.classList.remove("theme-transitioning"), 600);
    setDark(d => { const next = !d; try { localStorage.setItem("budgetly_dark", JSON.stringify(next)); } catch {} return next; });
  };

  useEffect(() => {
    if (!auth.authReady || !auth.user) return;
    data.loadFromSupabase();
    const lsMonths = lsLoad<AllMonths>("budgetly_months", {});
    if (Object.keys(lsMonths).length > 0) auth.setShowMigrate(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, auth.authReady]);

  const handleMigrate = async (migrate: boolean) => {
    auth.setShowMigrate(false);
    if (!migrate || !auth.user) return;
    const lsData = lsLoad<AllMonths>("budgetly_months", {});
    for (const [mk, d] of Object.entries(lsData)) await data.saveToSupabase(mk, d);
    localStorage.removeItem("budgetly_months");
    await data.loadFromSupabase();
  };

  const handleLogout = async () => { await auth.logout(); data.clearMonths(); };

  const { budget, expenses, earnings, savings, activeMK, setActiveMK, allMKs, allMonths,
    categories, editingBudget, setEditingBudget, tempBudget, setTempBudget,
    deleteConfirm, setDeleteConfirm, newCategory, setNewCategory,
    deleteMonthConfirm, setDeleteMonthConfirm, dbLoading,
    credits, setCredits, creditsLoaded,
    saveBudget, deleteExpense, deleteEarning, deleteSaving,
    updateExpense, updateEarning, updateSaving, addCategory, deleteCategory,
    toggleCleared, deleteCredit: deleteCreditData, addNextMonth, deleteMonth, getM, setM } = data;

  const totalExpenses  = expenses.reduce((s,e)=>s+e.amount,0);
  const totalEarnings  = earnings.reduce((s,e)=>s+e.amount,0);
  const totalSavings   = savings.reduce ((s,e)=>s+e.amount,0);
  const cashFlowIn     = budget + totalEarnings;
  const cashFlowOut    = totalExpenses;
  const remaining      = cashFlowIn - cashFlowOut - totalSavings;
  const spentPct       = cashFlowIn>0 ? Math.min((cashFlowOut/(cashFlowIn-totalSavings))*100,100) : 0;
  const daysInMonth    = getDays(activeMK);
  const todayDay       = activeMK===curMK() ? new Date().getDate() : daysInMonth;
  const daysLeft       = Math.max(daysInMonth-todayDay,1);
  const moneyLeft      = Math.max(remaining,0);
  const idealPerDay    = Math.round((cashFlowIn-totalSavings)/daysInMonth);
  const idealSpentByToday = idealPerDay*todayDay;
  const actualVsIdeal  = cashFlowOut-idealSpentByToday;
  const currentDailyAvg = todayDay>0 ? Math.round(cashFlowOut/todayDay) : 0;
  const currentIdealAvg  = Math.round(moneyLeft/daysLeft);

  const addExpense = () => { if(!expAmt||isNaN(+expAmt))return; setM(activeMK,{...getM(activeMK),expenses:[...expenses,{id:Date.now(),amount:+expAmt,category:expCat,description:expDesc,date:expDate}]}); setExpAmt(""); setExpDesc(""); };
  const addEarning = () => { if(!earnAmt||isNaN(+earnAmt))return; setM(activeMK,{...getM(activeMK),earnings:[...earnings,{id:Date.now(),amount:+earnAmt,description:earnDesc,date:earnDate}]}); setEarnAmt(""); setEarnDesc(""); };
  const addSaving  = () => { if(!savAmt||isNaN(+savAmt))return; setM(activeMK,{...getM(activeMK),savings:[...savings,{id:Date.now(),amount:+savAmt,description:savDesc,date:savDate}]}); setSavAmt(""); setSavDesc(""); };
  const addCredit  = () => { if(!cr.crAmt||isNaN(+cr.crAmt)||!cr.crPerson.trim())return; setCredits(prev=>[...prev,{id:Date.now(),person:cr.crPerson.trim(),amount:+cr.crAmt,description:cr.crDesc,date:cr.crDate,type:cr.crType,cleared:false}]); cr.setCrAmt(""); cr.setCrPerson(""); cr.setCrDesc(""); };
  const deleteCredit = (id:number) => { deleteCreditData(id); setDeleteConfirm(null); };

  if (!auth.authReady) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{fontSize:"13px",color:C.muted}}>Loading…</div>
    </div>
  );
  if (!auth.user) return <AuthScreen onAuth={u=>auth.setUser(u)} dark={dark}/>;

  const sidebarProps = { C, dark, activeMK, setActiveMK, allMKs, remaining, dbLoading, activeTab, setActiveTab, setDrawerOpen, setShowSettings };
  const ovProps = { C,budget,cashFlowIn,cashFlowOut,totalEarnings,totalSavings,remaining,spentPct,editingBudget,tempBudget,setEditingBudget,setTempBudget,saveBudget,expenses,savings,categories,daysInMonth,todayDay,idealPerDay,idealSpentByToday,actualVsIdeal,moneyLeft,daysLeft,currentDailyAvg,currentIdealAvg };
  const exProps = { C,expenses,categories,totalExpenses:cashFlowOut,expAmt,expCat,expDesc,expDate,setExpAmt,setExpCat,setExpDesc,setExpDate,addExpense,deleteConfirm,setDeleteConfirm,deleteExpense,updateExpense };
  const erProps = { C,earnings,totalEarnings,earnAmt,earnDesc,earnDate,setEarnAmt,setEarnDesc,setEarnDate,addEarning,deleteConfirm,setDeleteConfirm,deleteEarning,updateEarning };
  const svProps = { C,savings,totalSavings,cashFlowIn,savAmt,savDesc,savDate,setSavAmt,setSavDesc,setSavDate,addSaving,deleteConfirm,setDeleteConfirm,deleteSaving,updateSaving };
  const caProps = { C,categories,expenses,cashFlowOut,newCategory,setNewCategory,addCategory,deleteCategory };
  const trProps = { C,allMonths,activeMK,categories };
  const crProps = { C,credits,...cr,addCredit,toggleCleared,deleteCredit,deleteConfirm,setDeleteConfirm };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
      <link rel="manifest" href="/manifest.json"/>
      <meta name="theme-color" content="#6c5ce7"/>
      <meta name="apple-mobile-web-app-capable" content="yes"/>
      <meta name="apple-mobile-web-app-status-bar-style" content="default"/>
      <meta name="apple-mobile-web-app-title" content="Budgetly"/>
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png"/>
      <script dangerouslySetInnerHTML={{__html:`if('serviceWorker'in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js');});}`}}/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};font-family:'DM Sans',sans-serif;color-scheme:${dark?'dark':'light'};}
        *,*::before,*::after{transition:background-color 0.5s ease,border-color 0.5s ease,color 0.5s ease,box-shadow 0.5s ease!important;}
        input,select,textarea,button{transition:background-color 0.5s ease,border-color 0.5s ease,color 0.5s ease,opacity 0.15s ease,box-shadow 0.5s ease!important;}
        ::-webkit-scrollbar{width:6px;height:6px;} ::-webkit-scrollbar-track{background:${C.bg};}
        ::-webkit-scrollbar-thumb{background:${C.faint};border-radius:6px;} ::-webkit-scrollbar-thumb:hover{background:${C.muted};}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        input:focus,select:focus{border-color:${C.accent}!important;box-shadow:0 0 0 3px ${C.accent}22;}
        input,select,option{color-scheme:${dark?"dark":"light"};}
        .mob-header{display:none;}
        @keyframes slideInFromRight{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}
        @keyframes slideInFromLeft{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:translateX(0)}}
        .mob-nav{display:none;}
        @media(max-width:768px){
          .mob-header{display:flex!important;position:fixed;top:0;left:0;right:0;z-index:100;background:${C.sidebar};border-bottom:1px solid ${C.border};padding:11px 15px;align-items:center;justify-content:space-between;}
          .desk-sidebar{display:none!important;}
          .mob-nav{display:flex!important;position:fixed;bottom:0;left:0;right:0;background:${C.sidebar};border-top:1px solid ${C.border};z-index:50;padding:5px 0 max(8px,env(safe-area-inset-bottom));}
          .main-wrap{padding:64px 12px 72px!important;}
          .two-col-grid{grid-template-columns:1fr!important;}
        }
      `}</style>

      {auth.showMigrate&&<MigrateModal onDecide={handleMigrate} C={C}/>}
      <MobileHeader C={C} dark={dark} remaining={remaining} toggleDark={toggleDark} setDrawerOpen={setDrawerOpen}/>
      {drawerOpen&&<MobileDrawer {...sidebarProps}/>}

      <div style={{minHeight:"100vh",background:C.bg,display:"flex"}}>
        <aside className="desk-sidebar" style={{width:"210px",minHeight:"100vh",background:C.sidebar,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:"24px 0",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
          <Sidebar {...sidebarProps}/>
        </aside>

        <main className="main-wrap" style={{flex:1,padding:"28px",overflowY:"auto",overflow:"hidden"}}
          onTouchStart={e=>{const t=e.touches[0];const el=e.currentTarget as HTMLElement;el.dataset.touchX=String(t.clientX);el.dataset.touchY=String(t.clientY);el.dataset.dragging="1";}}
          onTouchMove={e=>{const el=e.currentTarget as HTMLElement;if(!el.dataset.dragging)return;const startX=parseFloat(el.dataset.touchX||"0");const startY=parseFloat(el.dataset.touchY||"0");const dx=e.touches[0].clientX-startX;const dy=e.touches[0].clientY-startY;if(Math.abs(dx)>Math.abs(dy)){e.preventDefault();setSwipeOffset(dx*0.4);}}}
          onTouchEnd={e=>{const el=e.currentTarget as HTMLElement;el.dataset.dragging="";const startX=parseFloat(el.dataset.touchX||"0");const startY=parseFloat(el.dataset.touchY||"0");const endX=e.changedTouches[0].clientX;const endY=e.changedTouches[0].clientY;const dx=endX-startX;const dy=endY-startY;setSwipeOffset(0);if(Math.abs(dx)<50||Math.abs(dx)<Math.abs(dy)*1.5)return;const idx=SWIPE_TABS.indexOf(activeTab);if(dx<0&&idx<SWIPE_TABS.length-1){setSwipeAnim("in-left");setActiveTab(SWIPE_TABS[idx+1]);setTimeout(()=>setSwipeAnim(null),350);}if(dx>0&&idx>0){setSwipeAnim("in-right");setActiveTab(SWIPE_TABS[idx-1]);setTimeout(()=>setSwipeAnim(null),350);}}}>
          <div style={{transform:`translateX(${swipeOffset}px)`,transition:swipeOffset===0?"transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)":"none",animation:swipeAnim==="in-left"?"slideInFromRight 0.32s cubic-bezier(0.25,0.46,0.45,0.94)":swipeAnim==="in-right"?"slideInFromLeft 0.32s cubic-bezier(0.25,0.46,0.45,0.94)":"none",willChange:"transform",overflowY:"auto",height:"100%"}}>
            <div style={{marginBottom:"18px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:"8px"}}>
              <div>
                <h1 style={{fontSize:"clamp(18px,3.5vw,24px)",fontWeight:600,color:C.text,letterSpacing:"-0.3px"}}>
                  {activeTab==="categories"?"Categories":activeTab==="tutorial"?"How to use Budgetly":activeTab==="trends"?"Trends":NAV.find(n=>n.id===activeTab)?.label}
                </h1>
                <div style={{fontSize:"11px",color:C.muted,marginTop:"3px"}}>{fmtMK(activeMK)}{activeMK!==curMK()&&" · past month"}</div>
              </div>
              <div style={{fontSize:"11px",color:C.faint,textAlign:"right"}}>
                Day {todayDay} of {daysInMonth}<br/>
                <span style={{color:C.muted}}>{new Date().toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}</span>
              </div>
            </div>
            {activeTab==="overview"   &&<OverviewTab    {...ovProps}/>}
            {activeTab==="expenses"   &&<ExpensesTab    {...exProps}/>}
            {activeTab==="earnings"   &&<EarningsTab    {...erProps}/>}
            {activeTab==="savings"    &&<SavingsTab     {...svProps}/>}
            {activeTab==="credit"     &&<CreditTab      {...crProps}/>}
            {activeTab==="categories" &&<CategoriesTab  {...caProps}/>}
            {activeTab==="tutorial"   &&<TutorialTab    C={C}/>}
            {activeTab==="trends"     &&<TrendsTab      {...trProps}/>}
          </div>
        </main>
      </div>

      {showSettings&&<SettingsPage C={C} dark={dark} user={auth.user} activeMK={activeMK} budget={budget} totalEarnings={totalEarnings} cashFlowIn={cashFlowIn} cashFlowOut={cashFlowOut} totalSavings={totalSavings} remaining={remaining} expenses={expenses} earnings={earnings} savings={savings} deleteMonthConfirm={deleteMonthConfirm} setDeleteMonthConfirm={setDeleteMonthConfirm} setShowSettings={setShowSettings} toggleDark={toggleDark} addNextMonth={addNextMonth} deleteMonth={deleteMonth} logout={handleLogout} setActiveTab={setActiveTab}/>}
      <MobileNav C={C} activeTab={activeTab} setActiveTab={setActiveTab}/>
    </>
  );
}
