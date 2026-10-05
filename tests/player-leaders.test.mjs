import {test} from 'node:test';
import assert from 'node:assert/strict';
import {topPlayers,hockeyLeaders} from '../lib/player-leaders.ts';
import {buildMvpSnapshot} from '../scripts/nfl-mvp-model.mjs';
test('top five are totals with stable ties and ascending qualified rates',()=>{
 const rows=Array.from({length:8},(_,i)=>({id:String(i),name:`Player ${i}`,team:'Club',value:i===0?0:i}));
 assert.deepEqual(topPlayers(rows).map(p=>p.value),[7,6,5,4,3]);
 assert.deepEqual(topPlayers(rows,true).map(p=>p.value),[0,1,2,3,4]);
 assert.deepEqual(topPlayers([{...rows[1],name:'Z'}, {...rows[2],name:'A',value:1}]).map(p=>p.name),['A','Z']);
});
test('NHL traded players are combined once across clubs and zero totals excluded',()=>{
 const teams=[{name:'A',players:[{id:'1',name:'Traded',goals:2,assists:1,points:3},{id:'2',name:'Zero',goals:0,assists:0,points:0}]},{name:'B',players:[{id:'1',name:'Traded',goals:1,assists:3,points:4}]}];
 const rows=hockeyLeaders(teams);
 assert.equal(rows.points.length,1);assert.equal(rows.points[0].value,7);assert.equal(rows.assists[0].value,4);assert.equal(rows.goals[0].team,'A / B');
});
test('NFL leaders include one-game totals and field goals without MVP workload filters',()=>{
 const club=(team,id)=>({team:{id:team,displayName:team,abbreviation:team},statistics:[{name:'receiving',keys:['receivingYards'],athletes:[{athlete:{id,displayName:'Receiver'},stats:['85']}]},{name:'kicking',keys:['fieldGoalsMade/fieldGoalAttempts'],athletes:[{athlete:{id:team+'K',displayName:'Kicker'},stats:['3/4']}]}]});
 const result=buildMvpSnapshot({season:2026,updatedAt:'2026-10-05T12:00:00Z',rosters:[],games:[{id:'1',players:[club('A','WR'),club('B','WR')]}]});
 assert.equal(result.offense,null);assert.equal(result.leaders.receivingYards[0].value,170);assert.equal(result.leaders.receivingYards.length,1);assert.equal(result.leaders.fieldGoals[0].value,3);
});
