import { WeeklyRankingsPost, rankingPostMetadata } from "@/components/weekly-rankings-post";
export const generateMetadata = () => rankingPostMetadata("nba");
export default function Page() { return <WeeklyRankingsPost league="nba" />; }
