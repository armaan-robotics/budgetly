"use client";
import { useState } from "react";
import { todayS } from "../constants";

export function useCredits() {
  const [crAmt,    setCrAmt]    = useState("");
  const [crPerson, setCrPerson] = useState("");
  const [crDesc,   setCrDesc]   = useState("");
  const [crDate,   setCrDate]   = useState(() => todayS());
  const [crType,   setCrType]   = useState<"owed_to_me"|"i_owe">("owed_to_me");
  return { crAmt, setCrAmt, crPerson, setCrPerson, crDesc, setCrDesc, crDate, setCrDate, crType, setCrType };
}
