"use client";
import { BarChart3, Trophy, Swords, Shield, type LucideIcon } from "lucide-react";
const icons = { leaders: Trophy, dashboard: BarChart3, standings: Trophy, hitting: Swords, pitching: Shield, scoring: Swords, goaltending: Shield };
export function LeagueTabs<V extends keyof typeof icons>({ tabs, view, onChange, label }: { tabs: {view:V;label:string}[]; view:V; onChange:(view:V)=>void; label:string }) {
  tabs=[...tabs].sort((a,b)=>["dashboard","standings","leaders","hitting","scoring","pitching","goaltending"].indexOf(a.view)-["dashboard","standings","leaders","hitting","scoring","pitching","goaltending"].indexOf(b.view));
  return <nav className="view-tabs league-tabs" role="tablist" aria-label={label}>{tabs.map((tab,index)=>{
    const Icon: LucideIcon=icons[tab.view];
    return <button key={tab.view} id={`${tab.view}-tab`} role="tab" aria-selected={view===tab.view} aria-controls={`${tab.view}-panel`} tabIndex={view===tab.view ? 0 : -1} className={view===tab.view ? "active" : ""} onClick={()=>onChange(tab.view)} onKeyDown={event=>{
      const next=event.key==="ArrowRight" ? (index+1)%tabs.length : event.key==="ArrowLeft" ? (index+tabs.length-1)%tabs.length : event.key==="Home" ? 0 : event.key==="End" ? tabs.length-1 : null;
      if(next!==null) { event.preventDefault(); onChange(tabs[next].view); (event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[next])?.focus(); }
    }}><Icon />{tab.label}</button>;
  })}</nav>;
}
