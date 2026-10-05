"use client";
import { BarChart3, ListOrdered, Trophy, Swords, Shield, type LucideIcon } from "lucide-react";
const icons = { dashboard: BarChart3, rankings: ListOrdered, standings: Trophy, hitting: Swords, pitching: Shield, scoring: Swords, goaltending: Shield };
export function LeagueTabs<V extends keyof typeof icons>({ tabs, view, onChange, label }: { tabs: {view:V;label:string}[]; view:V; onChange:(view:V)=>void; label:string }) {
  tabs=[...tabs].sort((a,b)=>["dashboard","standings","hitting","scoring","pitching","goaltending","rankings"].indexOf(a.view)-["dashboard","standings","hitting","scoring","pitching","goaltending","rankings"].indexOf(b.view));
  return <nav className="view-tabs league-tabs" role="tablist" aria-label={label}>{tabs.map((tab,index)=>{
    const Icon: LucideIcon=icons[tab.view];
    return <button key={tab.view} id={`${tab.view}-tab`} role="tab" aria-selected={view===tab.view} aria-controls={`${tab.view}-panel`} tabIndex={view===tab.view ? 0 : -1} className={view===tab.view ? "active" : ""} onClick={()=>onChange(tab.view)} onKeyDown={event=>{
      const next=event.key==="ArrowRight" ? (index+1)%tabs.length : event.key==="ArrowLeft" ? (index+tabs.length-1)%tabs.length : event.key==="Home" ? 0 : event.key==="End" ? tabs.length-1 : null;
      if(next!==null) { event.preventDefault(); onChange(tabs[next].view); (event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[next])?.focus(); }
    }}><Icon />{tab.label}</button>;
  })}</nav>;
}
