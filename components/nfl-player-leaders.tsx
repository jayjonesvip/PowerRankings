"use client";
import {useEffect,useState} from "react";
import {readLocalData} from "@/lib/local-data";
import type {MvpSnapshot} from "./nfl-league-mvps";
import {PlayerLeaders} from "./player-leaders";
const categories=[['receivingYards','Receiving yards'],['rushingYards','Rushing yards'],['passingYards','Passing yards'],['passingTouchdowns','Passing touchdowns'],['rushingTouchdowns','Rushing touchdowns'],['receivingTouchdowns','Receiving touchdowns'],['fieldGoals','Field goals made']];
export function NflPlayerLeaders({season,completedGames,refreshToken,initialData}:{season:number;completedGames:number;refreshToken:number;initialData?:MvpSnapshot}) {
 const [data,setData]=useState(initialData); const [error,setError]=useState(false);
 useEffect(()=>{const controller=new AbortController();setError(false);readLocalData("mvp-current.json",controller.signal).then(raw=>{const value=raw as MvpSnapshot;if(value.schemaVersion!==1||value.season!==season||!value.leaders)throw new Error("Invalid leaders");setData(value);}).catch(()=>{if(!controller.signal.aborted)setError(true);});return ()=>controller.abort();},[season,refreshToken]);
 if(data?.season!==season||data.completedGames!==completedGames||!data.leaders) return <p role="status">{error ? "Player leaders unavailable. Refresh to retry." : "Loading regular-season player leaders…"}</p>;
 return <PlayerLeaders id="player-leaders" title="NFL player leaders" categories={categories.map(([key,label])=>({label,rows:data.leaders?.[key] ?? []}))} />;
}
