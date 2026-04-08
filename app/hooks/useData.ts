"use client";
import { useState, useCallback, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AllMonths, CreditEntry, Expense, Entry, MonthData } from "../types";
import { DEFAULT_CATS, curMK, emptyMD, todayS } from "../constants";

export function useData(user: User | null) {
  const isGuest = false; // guest mode removed

  const [allMonths,          setAllMonthsRaw]        = useState<AllMonths>({});
  const [activeMK,           setActiveMK]            = useState<string>(curMK());
  const [categories,         setCategories]          = useState<string[]>(DEFAULT_CATS);
  const [editingBudget,      setEditingBudget]       = useState(false);
  const [tempBudget,         setTempBudget]          = useState("10000");
  const [deleteConfirm,      setDeleteConfirm]       = useState<number|null>(null);
  const [newCategory,        setNewCategory]         = useState("");
  const [deleteMonthConfirm, setDeleteMonthConfirm]  = useState(false);
  const [dbLoading,          setDbLoading]           = useState(false);
  const [credits,            setCredits]             = useState<CreditEntry[]>([]);
  const [creditsLoaded,      setCreditsLoaded]       = useState(false);

  const loadFromSupabase = useCallback(async () => {
    if (!user) return;
    setDbLoading(true);
    const [{ data, error }, { data: cData, error: cError }] = await Promise.all([
      supabase.from("month_data").select("*").eq("user_id",user.id),
      supabase.from("user_credits").select("*").eq("user_id",user.id),
    ]);
    if (error) { console.error(error); setDbLoading(false); return; }
    const rebuilt: AllMonths = {};
    (data??[]).forEach((row:{month_key:string;budget:number;expenses:Expense[];earnings:Entry[];savings:Entry[]}) => {
      rebuilt[row.month_key]={budget:row.budget,expenses:row.expenses,earnings:row.earnings,savings:row.savings};
    });
    setAllMonthsRaw(rebuilt);
    if (!cError && cData && cData.length > 0) {
      setCredits((cData[0] as {credits:CreditEntry[]}).credits ?? []);
    }
    setCreditsLoaded(true);
    setDbLoading(false);
  }, [user, isGuest]);

  const saveToSupabase = useCallback(async (mk:string, md:MonthData) => {
    if (!user) return;
    await supabase.from("month_data").upsert({ user_id:user.id,month_key:mk,budget:md.budget,expenses:md.expenses,earnings:md.earnings,savings:md.savings,updated_at:new Date().toISOString() },{ onConflict:"user_id,month_key" });
  }, [user, isGuest]);

  const saveCreditsToSupabase = useCallback(async (c: CreditEntry[]) => {
    if (!user) return;
    await supabase.from("user_credits").upsert({ user_id:user.id, credits:c, updated_at:new Date().toISOString() },{ onConflict:"user_id" });
  }, [user, isGuest]);

  useEffect(()=>{
    if (!creditsLoaded) return;
    saveCreditsToSupabase(credits);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credits, creditsLoaded]);

  const setAllMonths = useCallback((updater: AllMonths|((prev:AllMonths)=>AllMonths)) => {
    setAllMonthsRaw(prev => { const next=typeof updater==="function"?updater(prev):updater; return next; });
  }, [isGuest]);

  const getM = useCallback((mk:string): MonthData => allMonths[mk]??emptyMD(), [allMonths]);
  const setM = useCallback(async (mk:string,d:MonthData) => { setAllMonths(prev=>({...prev,[mk]:d})); await saveToSupabase(mk,d); }, [setAllMonths,saveToSupabase]);

  const md = getM(activeMK);
  const { budget, expenses, earnings, savings } = md;

  const saveBudget     = () => { const v=parseFloat(tempBudget); if(!isNaN(v)&&v>0)setM(activeMK,{...md,budget:v}); setEditingBudget(false); };
  const deleteExpense  = (id:number) => { setM(activeMK,{...md,expenses:expenses.filter(e=>e.id!==id)}); setDeleteConfirm(null); };
  const deleteEarning  = (id:number) => { setM(activeMK,{...md,earnings:earnings.filter(e=>e.id!==id)}); setDeleteConfirm(null); };
  const deleteSaving   = (id:number) => { setM(activeMK,{...md,savings: savings.filter (e=>e.id!==id)}); setDeleteConfirm(null); };
  const updateExpense  = (id:number,u:Partial<Expense>) => setM(activeMK,{...md,expenses:expenses.map(e=>e.id===id?{...e,...u}:e)});
  const updateEarning  = (id:number,u:Partial<Entry>)   => setM(activeMK,{...md,earnings:earnings.map(e=>e.id===id?{...e,...u}:e)});
  const updateSaving   = (id:number,u:Partial<Entry>)   => setM(activeMK,{...md,savings: savings.map (e=>e.id===id?{...e,...u}:e)});
  const addCategory    = () => { const t=newCategory.trim(); if(!t||categories.includes(t))return; setCategories([...categories,t]); setNewCategory(""); };
  const deleteCategory = (cat:string) => { if(DEFAULT_CATS.includes(cat))return; setCategories(categories.filter(c=>c!==cat)); };
  const toggleCleared  = (id:number) => {
    setCredits(prev => prev.map(c => {
      if (c.id !== id) return c;
      const nowCleared = !c.cleared;
      const label = `Credit: ${c.person}${c.description ? ` — ${c.description}` : ""}`;
      if (nowCleared) {
        if (c.type === "owed_to_me") {
          setM(activeMK, { ...getM(activeMK), earnings: [...getM(activeMK).earnings, { id: Date.now(), amount: c.amount, description: label, date: todayS() }] });
        } else {
          setM(activeMK, { ...getM(activeMK), expenses: [...getM(activeMK).expenses, { id: Date.now(), amount: c.amount, category: "Other", description: label, date: todayS() }] });
        }
      } else {
        if (c.type === "owed_to_me") {
          setM(activeMK, { ...getM(activeMK), earnings: getM(activeMK).earnings.filter(e => e.description !== label) });
        } else {
          setM(activeMK, { ...getM(activeMK), expenses: getM(activeMK).expenses.filter(e => e.description !== label) });
        }
      }
      return { ...c, cleared: nowCleared };
    }));
  };
  const deleteCredit   = (id:number) => { setCredits(prev=>prev.filter(c=>c.id!==id)); setDeleteConfirm(null); };
  const addNextMonth   = () => { const [y,m]=activeMK.split("-").map(Number); const nd=new Date(y,m,1); const nk=`${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,"0")}`; if(!allMonths[nk])setM(nk,emptyMD()); setActiveMK(nk); };
  const deleteMonth    = async () => { setDeleteMonthConfirm(false); setAllMonths(prev=>{const next={...prev};delete next[activeMK];return next;}); if(user) await supabase.from("month_data").delete().eq("user_id",user.id).eq("month_key",activeMK); setActiveMK(curMK()); };
  const clearMonths    = () => setAllMonthsRaw({});
  const allMKs = (() => { const k=Object.keys(allMonths); if(!k.includes(curMK()))k.push(curMK()); return k.sort().reverse(); })();

  return {
    allMonths, activeMK, setActiveMK, categories, setCategories,
    editingBudget, setEditingBudget, tempBudget, setTempBudget,
    deleteConfirm, setDeleteConfirm, newCategory, setNewCategory,
    deleteMonthConfirm, setDeleteMonthConfirm, dbLoading,
    credits, setCredits, creditsLoaded,
    loadFromSupabase, saveToSupabase, setAllMonths, getM, setM, clearMonths,
    md, budget, expenses, earnings, savings, allMKs,
    saveBudget, deleteExpense, deleteEarning, deleteSaving,
    updateExpense, updateEarning, updateSaving,
    addCategory, deleteCategory, toggleCleared, deleteCredit,
    addNextMonth, deleteMonth,
  };
}
