import { fetchAllNews } from "./rss-fetcher";
import { SOURCES } from "./sources";
import AINewsClient from "./components/AINewsClient";

// ISR: refresh every hour
export const revalidate = 3600;

export default async function AINewsPage() {
  const items = await fetchAllNews();
  return <AINewsClient items={items} sources={SOURCES} fetchedAt={new Date().toISOString()} />;
}
