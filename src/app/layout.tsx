import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Panda Apps — Free Modern Web Apps",
  description:
    "Discover beautifully crafted, high-performance web apps you can use for free. QR Code Generator, and more — all in one place.",
  keywords: ["web apps", "free tools", "qr code generator", "panda apps"],
  openGraph: {
    title: "Panda Apps — Free Modern Web Apps",
    description: "Beautifully crafted, high-performance web apps you can use for free.",
    url: "https://pandaapps.com",
    siteName: "Panda Apps",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('panda-theme');var h=document.documentElement;if(t==='light'){h.classList.remove('dark');h.classList.add('light');}else{h.classList.remove('light');h.classList.add('dark');}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <div className="gradient-bg" />
          <div className="grid-pattern" />
          <Navbar />
          <main className="relative z-10">{children}</main>
          <Footer />
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
