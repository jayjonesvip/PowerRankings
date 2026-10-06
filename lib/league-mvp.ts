export type LeagueMvpPick = { id: string; name: string; team: string; reason: string; stats: {label:string;value:string}[]; limited: boolean };
export type LeagueMvps = { first: LeagueMvpPick[]; second: LeagueMvpPick[]; firstRunnersUp?: LeagueMvpPick[]; secondRunnersUp?: LeagueMvpPick[]; firstLabel: string; secondLabel: string; method: string };
