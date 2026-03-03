import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JSON Tools — PandaApps",
  description:
    "All-in-one JSON toolkit: click-to-build JSONPath from an interactive tree, JSONPath tester, formatter/minifier, and string escaper. Everything runs in your browser.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
