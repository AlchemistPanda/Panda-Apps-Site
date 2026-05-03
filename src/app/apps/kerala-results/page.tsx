import KeralaResultsClient from "./components/KeralaResultsClient";

// Revalidate every 30 seconds during counting
export const revalidate = 30;

export default function KeralaResultsPage() {
  return <KeralaResultsClient />;
}
