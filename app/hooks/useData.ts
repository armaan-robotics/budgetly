"use client";
import { useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import {
  AllMonths, MonthData, Expense, Entry, CreditEntry, AppMode,
  DEFAULT_CATS, DEFAULT_HOUSEHOLD_CATS, OLD_HOUSEHOLD_UTILITY_CATS, OLD_HOUSEHOLD_DEFAULT_CATS,
  DEFAULT_ACCOUNTS, lsLoad, lsSave,
} from "../components/types";

export function useData(user: User | null, appMode: AppMode | null) {
  const [allMonths, setAllMonthsRaw] = useState<AllMonths>({});
  const [dbLoading, setDbLoading] = useState(false);

  const [categories, setCategories] = useState<string[]>(() => {
    const mode = lsLoad<AppMode | null>("budgetly_mode", null);
    const modeKey = mode === "household" ? "budgetly_cats_household" : "budgetly_cats_student";
    // Try mode-specific key first, fall back to legacy key for migration
    const saved = lsLoad<string[]>(modeKey, null as any) ?? lsLoad<string[]>("budgetly_cats", null as any);
    if (saved && saved.length > 0) {
      if (mode === "household") {
        let migrated = saved.filter(c => !OLD_HOUSEHOLD_UTILITY_CATS.includes(c));
        migrated = migrated.filter(c => !OLD_HOUSEHOLD_DEFAULT_CATS.includes(c));
        if (migrated.length !== saved.length) lsSave("budgetly_cats_household", migrated);
        return migrated.length > 0 ? migrated : DEFAULT_HOUSEHOLD_CATS;
      }
      return saved;
    }
    return mode === "household" ? DEFAULT_HOUSEHOLD_CATS : DEFAULT_CATS;
  });

  const [accounts, setAccounts] = useState<string[]>(() =>
    lsLoad<string[]>("budgetly_accounts", DEFAULT_ACCOUNTS)
  );

  const saveAccounts = (acc: string[]) => {
    setAccounts(acc);
    lsSave("budgetly_accounts", acc);
  };

  const loadFromSupabase = useCallback(async () => {
    if (!user) return;
    setDbLoading(true);
    const [{ data, error }, { data: cData, error: cError }] = await Promise.all([
      supabase.from("month_data").select("*").eq("user_id", user.id),
      supabase.from("user_credits").select("*").eq("user_id", user.id),
    ]);
    if (error) { console.error(error); setDbLoading(false); return; }
    const rebuilt: AllMonths = {};
    (data ?? []).forEach((row: { month_key: string; budget: number; expenses: Expense[]; earnings: Entry[]; savings: Entry[] }) => {
      rebuilt[row.month_key] = { budget: row.budget, expenses: row.expenses, earnings: row.earnings, savings: row.savings };
    });
    setAllMonthsRaw(rebuilt);
    if (!cError && cData && cData.length > 0) {
      const row = cData[0] as { categories?: string[]; accounts?: string[] };
      // Restore categories and accounts from server (more reliable than localStorage)
      if (row.categories) {
        let modeCats: string[] | null = null;
        if (Array.isArray(row.categories) && row.categories.length > 0) {
          // Legacy format: array stored for current mode only
          modeCats = row.categories;
        } else if (typeof row.categories === "object" && !Array.isArray(row.categories)) {
          // New format: {student: [...], household: [...]}
          const mk = appMode === "household" ? "household" : "student";
          const mc = (row.categories as Record<string, string[]>)[mk];
          modeCats = mc && mc.length > 0 ? mc : null;
        }
        if (modeCats) {
          // Remove old household utility defaults that are no longer in the new defaults
          if (appMode === "household") {
            modeCats = modeCats.filter(c => !OLD_HOUSEHOLD_UTILITY_CATS.includes(c));
            modeCats = modeCats.filter(c => !OLD_HOUSEHOLD_DEFAULT_CATS.includes(c));
            if (modeCats.length === 0) modeCats = DEFAULT_HOUSEHOLD_CATS;
          }
          // Ensure all required defaults for current mode are present.
          // Legacy format may have stored the wrong mode's categories.
          const requiredDefs = appMode === "household" ? DEFAULT_HOUSEHOLD_CATS : DEFAULT_CATS;
          const missing = requiredDefs.filter(d => !modeCats!.includes(d));
          if (missing.length > requiredDefs.length / 2) {
            // More than half the defaults are missing — likely wrong-mode legacy data; use defaults + any extras
            const extras = modeCats.filter(c => !DEFAULT_CATS.includes(c) && !DEFAULT_HOUSEHOLD_CATS.includes(c));
            modeCats = [...requiredDefs, ...extras];
          } else if (missing.length > 0) {
            modeCats = [...missing, ...modeCats];
          }
          // Household: Misc must always be absolute last
          if (appMode === "household" && modeCats.includes("Misc")) {
            modeCats = [...modeCats.filter(c => c !== "Misc"), "Misc"];
          }
          setCategories(modeCats);
          lsSave(appMode === "household" ? "budgetly_cats_household" : "budgetly_cats_student", modeCats);
        }
      }
      if (row.accounts && row.accounts.length > 0) {
        setAccounts(row.accounts);
        lsSave("budgetly_accounts", row.accounts);
      }
    }
    setDbLoading(false);
  }, [user, appMode]);

  const saveToSupabase = useCallback(async (mk: string, md: MonthData) => {
    if (!user) return;
    await supabase.from("month_data").upsert(
      { user_id: user.id, month_key: mk, budget: md.budget, expenses: md.expenses, earnings: md.earnings, savings: md.savings, updated_at: new Date().toISOString() },
      { onConflict: "user_id,month_key" }
    );
  }, [user]);

  const saveCreditsToSupabase = useCallback(async (c: CreditEntry[]) => {
    if (!user) return;
    const field = appMode === "household" ? "household_credits" : "credits";
    console.log(`[credits] saving ${c.length} entries to column "${field}" (appMode: ${appMode})`);
    await supabase.from("user_credits").upsert(
      { user_id: user.id, [field]: c, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  }, [user, appMode]);

  const saveUserPrefs = useCallback(async (cats: string[], accs: string[]) => {
    if (!user) return;
    // Read existing to merge both modes' categories without overwriting the other
    const { data: existing } = await supabase.from("user_credits").select("categories").eq("user_id", user.id).single();
    const existingCats = existing?.categories;
    const baseCats: Record<string, string[]> =
      existingCats && typeof existingCats === "object" && !Array.isArray(existingCats)
        ? (existingCats as Record<string, string[]>)
        : {};
    const updatedCats = { ...baseCats, [appMode ?? "student"]: cats };
    await supabase.from("user_credits").upsert(
      { user_id: user.id, categories: updatedCats, accounts: accs, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  }, [user, appMode]);

  const deleteMonthFromDB = useCallback(async (mk: string) => {
    if (!user) return;
    await supabase.from("month_data").delete().eq("user_id", user.id).eq("month_key", mk);
  }, [user]);

  return {
    allMonths, setAllMonthsRaw, dbLoading,
    categories, setCategories,
    accounts, saveAccounts,
    loadFromSupabase, saveToSupabase, saveCreditsToSupabase, saveUserPrefs, deleteMonthFromDB,
  };
}
