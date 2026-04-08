"use client";
import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { CreditEntry, AppMode } from "../components/types";
import { supabase } from "../lib/supabase";

export function useCredits(user: User | null, appMode: AppMode | null) {
  const [credits, setCredits] = useState<CreditEntry[]>([]);
  const [creditsLoaded, setCreditsLoaded] = useState(false);

  // Reload credits when mode switches — cancels stale fetches so modes never bleed
  useEffect(() => {
    if (!user || !appMode) return;
    const field = appMode === "household" ? "household_credits" : "credits";
    console.log("Loading credits for mode:", appMode);
    let cancelled = false;
    setCreditsLoaded(false);
    setCredits([]);
    supabase.from("user_credits").select(field).eq("user_id", user.id).then(({ data }) => {
      if (cancelled) return;
      if (data && data.length > 0) {
        const row = data[0] as any;
        const loaded = row[field] ?? [];
        console.log(`[credits] loaded ${loaded.length} entries from column "${field}"`);
        setCredits(loaded);
      } else {
        console.log(`[credits] no row found in user_credits — starting empty (column "${field}")`);
      }
      setCreditsLoaded(true);
    });
    return () => { cancelled = true; };
  }, [appMode, user]);

  // Explicit reload (e.g. after migration) — uses current appMode so correct field is always read
  const reloadCredits = useCallback(async () => {
    if (!user || !appMode) return;
    const field = appMode === "household" ? "household_credits" : "credits";
    console.log("Loading credits for mode:", appMode);
    setCreditsLoaded(false);
    setCredits([]);
    const { data } = await supabase.from("user_credits").select(field).eq("user_id", user.id);
    if (data && data.length > 0) {
      const row = data[0] as any;
      const loaded = row[field] ?? [];
      console.log(`[credits] reloadCredits loaded ${loaded.length} entries from column "${field}"`);
      setCredits(loaded);
    } else {
      console.log(`[credits] reloadCredits — no row found (column "${field}")`);
    }
    setCreditsLoaded(true);
  }, [user, appMode]);

  return { credits, setCredits, creditsLoaded, setCreditsLoaded, reloadCredits };
}
