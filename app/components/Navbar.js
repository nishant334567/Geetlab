"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BookOpen, Bookmark, Home, PenSquare } from "lucide-react";

function NavItem({ href, icon: Icon, label }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
      }`}
    >
      <Icon className="h-4 w-4 opacity-90" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

export default function Navbar() {
  return (
    <div className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
            <Image
              src="/geetlab_logo.png"
              alt="GeetLab"
              fill
              className="object-cover scale-[1.08]"
              priority
            />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              GeetLab
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Hindi songwriter studio
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavItem href="/" icon={Home} label="Home" />
          <NavItem href="/daily" icon={BookOpen} label="Daily" />
          <NavItem href="/words" icon={Bookmark} label="Words" />
          <NavItem href="/write" icon={PenSquare} label="Write" />
        </nav>
      </div>
    </div>
  );
}

