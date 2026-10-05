"use client";
import { Fragment, useState, type ReactNode } from "react";
export type StatsColumn = { key: string; label: string; lowerFirst?: boolean; format?: (value: number) => string };
export type StatsRow = { id: string; name: string; [key: string]: string | number | null };
export function SortableStats({ id, title, columns, rows, defaultKey, details }: { id: string; title: string; columns: StatsColumn[]; rows: StatsRow[]; defaultKey: string; details?: (id: string) => ReactNode }) {
  const [sort, setSort] = useState({ key: defaultKey, direction: columns.find(c => c.key === defaultKey)?.lowerFirst ? "ascending" : "descending" });
  const [expanded, setExpanded] = useState<string[]>([]);
  const next = (column: StatsColumn) => sort.key === column.key ? sort.direction === "ascending" ? "descending" : "ascending" : column.key === "name" || column.lowerFirst ? "ascending" : "descending";
  const sorted = [...rows].sort((a,b) => {
    const av = a[sort.key], bv = b[sort.key];
    if (av === null || bv === null) return av === bv ? a.name.localeCompare(b.name) : av === null ? 1 : -1;
    const diff = typeof av === "string" ? av.localeCompare(String(bv)) : Number(av) - Number(bv);
    return (sort.direction === "ascending" ? diff : -diff) || a.name.localeCompare(b.name);
  });
  return <section className="rankings-card mlb-team-stats" id={id}><div className="section-heading"><h2>{title}</h2><span>Sort: {columns.find(c => c.key === sort.key)?.label} · {sort.direction === "ascending" ? "Ascending" : "Descending"}</span></div>
    <div className="nhl-table-wrap"><table className="nhl-table"><thead><tr>{columns.map(c => <th scope="col" key={c.key} aria-sort={sort.key === c.key ? sort.direction as "ascending" | "descending" : "none"}><button className="mlb-sort-button" aria-label={`Sort by ${c.label}, ${next(c)}`} onClick={() => setSort({key:c.key,direction:next(c)})}>{c.label} <span aria-hidden="true">{sort.key === c.key ? sort.direction === "ascending" ? "↑" : "↓" : "↕"}</span></button></th>)}</tr></thead>
    <tbody>{sorted.map(row => <Fragment key={row.id}><tr>{columns.map(c => c.key === "name" ? <th scope="row" key={c.key}>{row.name}</th> : <td key={c.key}>{c.key === "points" && details ? <button className="nhl-points-expand" aria-expanded={expanded.includes(row.id)} aria-controls={`${id}-${row.id}`} aria-label={`${expanded.includes(row.id) ? "Hide" : "Show"} ${row.name} player points`} onClick={() => setExpanded(current => current.includes(row.id) ? current.filter(v => v !== row.id) : [...current,row.id])}>{row[c.key]} <span aria-hidden="true">{expanded.includes(row.id) ? "−" : "+"}</span></button> : row[c.key] === null ? "—" : c.format ? c.format(Number(row[c.key])) : row[c.key]}</td>)}</tr>{details && <tr id={`${id}-${row.id}`} hidden={!expanded.includes(row.id)}><td colSpan={columns.length}>{details(row.id)}</td></tr>}</Fragment>)}</tbody></table></div></section>;
}
