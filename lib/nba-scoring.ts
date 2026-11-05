export type NbaScoring = { freeThrowsMade:number; threePointersMade:number; twoPointersMade:number };
export function basketballScoringBreakdown(scoring:NbaScoring, expectedPoints?:number) {
  if(!scoring || ![scoring.freeThrowsMade,scoring.threePointersMade,scoring.twoPointersMade].every(n=>Number.isSafeInteger(n)&&n>=0)) throw new Error("Invalid NBA scoring types");
  const freeThrows=scoring.freeThrowsMade,threePointers=scoring.threePointersMade*3,twoPointers=scoring.twoPointersMade*2;
  const total=freeThrows+threePointers+twoPointers;
  if(expectedPoints!==undefined && total!==expectedPoints) throw new Error("NBA scoring types do not match points scored");
  return {total,freeThrows,threePointers,twoPointers};
}
export function parseNbaScoring(labels:string[],totals:string[],score:number):NbaScoring {
  const shots=(label:string)=>{
    const index=labels.indexOf(label),value=totals?.[index];
    if(index<0 || typeof value!=="string" || !/^\d+-\d+$/.test(value)) throw new Error(`Missing NBA ${label} shooting total`);
    const [made,attempted]=value.split("-").map(Number);
    if(made>attempted) throw new Error(`Invalid NBA ${label} shooting total`);
    return {made,attempted};
  };
  const fieldGoals=shots("FG"),threes=shots("3PT"),freeThrows=shots("FT");
  if(threes.made>fieldGoals.made || threes.attempted>fieldGoals.attempted || threes.attempted-threes.made>fieldGoals.attempted-fieldGoals.made) throw new Error("Invalid NBA two-point field goals");
  const scoring={freeThrowsMade:freeThrows.made,threePointersMade:threes.made,twoPointersMade:fieldGoals.made-threes.made};
  basketballScoringBreakdown(scoring,score);
  return scoring;
}
