import { fetchAllNews } from "./rss-fetcher";
import { SOURCES } from "./sources";
import AINewsClient from "./components/AINewsClient";

// ISR: refresh every 24 hours
export const revalidate = 86400;

export default async function AINewsPage() {
  const items = await fetchAllNews();
  return <AINewsClient items={items} sources={SOURCES} fetchedAt={new Date().toISOString()} />;
}
