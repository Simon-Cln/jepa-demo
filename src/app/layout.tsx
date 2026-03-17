import type { Metadata } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "JEPA & World Models — Interactive Demo",
  description:
    "Comprendre JEPA (Joint Embedding Predictive Architecture) et les World Models de Yann LeCun à travers des démos interactives.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="dark">
      <body className="antialiased min-h-screen bg-[#111] text-foreground">
        <Nav />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  );
}
