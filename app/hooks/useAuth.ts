"use client";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export function useAuth() {
  const [user,        setUser]        = useState<User|null>(null);
  const [authReady,   setAuthReady]   = useState(false);
  const [showMigrate, setShowMigrate] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user??null); setAuthReady(true); });
    const { data:{subscription} } = supabase.auth.onAuthStateChange((_,session) => setUser(session?.user??null));
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => { await supabase.auth.signOut(); setUser(null); };

  return { user, setUser, authReady, showMigrate, setShowMigrate, logout };
}
