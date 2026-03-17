"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/generatif-vs-jepa", label: "01 — Génératif vs JEPA" },
  { href: "/masking",           label: "02 — I-JEPA Masking" },
  { href: "/world-model",       label: "03 — World Model" },
  { href: "/espace-latent",     label: "04 — Espace Latent" },
  { href: "/papers",            label: "Papiers" },
  { href: "/notes",             label: "Notes" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#111] border-b border-white/20 flex items-stretch">

      {/* Logo */}
      <Link
        href="/"
        className="flex items-center px-4 sm:px-8 md:px-16 border-r border-white/20 text-xs uppercase tracking-widest text-white font-bold hover:bg-white/5 transition-colors shrink-0"
      >
        JEPA<span className="text-white/40 font-normal ml-1">/ World Models</span>
      </Link>

      {/* Links — desktop : chaque lien est h-full avec border-r, les traits touchent top et bottom */}
      <div className="hidden md:flex items-stretch">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center px-5 border-r border-white/20 text-[11px] uppercase tracking-widest transition-colors ${
                active
                  ? "text-white bg-white/8"
                  : "text-gray-500 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Theme toggle — right side */}
      <div className="ml-auto flex items-stretch">
        <ThemeToggle />
      </div>

    </nav>
  );
}
