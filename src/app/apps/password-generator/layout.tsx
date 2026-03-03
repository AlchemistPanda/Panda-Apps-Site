import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Password Generator — PandaApps",
  description:
    "Generate strong, secure passwords with customisable length, character types, and strength analysis. Passwords are created entirely in your browser and are never saved, transmitted, or stored anywhere.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
