"use client";
import { CSSProperties } from "react";
import { Theme } from "../types";

export function TutorialTab({ C }: { C:Theme }) {
  const sCard: CSSProperties = { background:C.card,borderRadius:"14px",padding:"20px",border:`1px solid ${C.border}`,marginBottom:"14px" };
  const steps = [
    {
      icon:"◎", title:"Overview",
      body:"Your command centre. See Cash Flow In (budget + extra earnings), Cash Flow Out (expenses), Total Savings, and To Spend (what's left). The Daily Averages section shows your ideal spend per day, how much you should spend per day from today to finish the month on track, and your actual average spend so far.",
    },
    {
      icon:"↓", title:"Expenses",
      body:"Log every purchase here — amount, category, description, and date. Use categories to organise spending (Food, Transport, etc.). You can see a breakdown by category on the Overview tab.",
    },
    {
      icon:"↑", title:"Cash In",
      body:"Record any money that comes in beyond your base budget — freelance income, pocket money top-ups, selling something. This adds to your Cash Flow In.",
    },
    {
      icon:"⬡", title:"Savings",
      body:"Track money you're setting aside. Savings are subtracted from your spendable balance so you're not tempted to spend them. The ideal daily average also accounts for your savings goal.",
    },
    {
      icon:"⇄", title:"Credit",
      body:"Track debts and loans. 'They Owe Me' — someone borrowed money from you. 'I Owe Them' — you owe someone. Add the person's name, amount, what it's for, and date. Mark entries as Cleared once settled. Cleared entries are dimmed but kept for your records.",
    },
    {
      icon:"📅", title:"Months",
      body:"Each month is tracked separately. Use the month selector in the sidebar to switch between months. Click '+ New Month' to start a new one. Your budget resets each month — set it once and it carries over as the default.",
    },
    {
      icon:"⚙", title:"Settings",
      body:"Access dark mode, manage categories, export your data as a spreadsheet, delete a month, and log out — all from the Settings panel at the bottom of the sidebar.",
    },
    {
      icon:"☁", title:"Sync",
      body:"If you're signed in with an account, your data syncs across all your devices automatically. Guest mode only saves data in your current browser — create an account to keep your data safe.",
    },
  ];
  return (
    <div style={{maxWidth:"680px"}}>
      <div style={{marginBottom:"20px"}}>
        <h2 style={{fontSize:"20px",fontWeight:600,color:C.text,marginBottom:"6px"}}>How to use Budgetly</h2>
        <p style={{fontSize:"13px",color:C.muted,lineHeight:1.7}}>A quick walkthrough of every feature so you can get the most out of the app.</p>
      </div>
      {steps.map((s,i)=>(
        <div key={i} style={{background:C.card,borderRadius:"14px",padding:"18px 20px",border:`1px solid ${C.border}`,marginBottom:"10px",display:"flex",gap:"14px",alignItems:"flex-start"}}>
          <div style={{width:"36px",height:"36px",borderRadius:"10px",background:C.navActive,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",flexShrink:0}}>{s.icon}</div>
          <div>
            <div style={{fontSize:"14px",fontWeight:600,color:C.text,marginBottom:"5px"}}>{s.title}</div>
            <div style={{fontSize:"13px",color:C.muted,lineHeight:1.7}}>{s.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
