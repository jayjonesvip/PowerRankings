import { WeeklyRankingsPost, rankingPostMetadata } from "@/components/weekly-rankings-post";
export const generateMetadata = () => rankingPostMetadata("nhl");
export default function Page() { return <WeeklyRankingsPost league="nhl" />; }
