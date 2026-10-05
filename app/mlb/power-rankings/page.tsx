import { WeeklyRankingsPost, rankingPostMetadata } from "@/components/weekly-rankings-post";
export const generateMetadata = () => rankingPostMetadata("mlb");
export default function Page() { return <WeeklyRankingsPost league="mlb" />; }
