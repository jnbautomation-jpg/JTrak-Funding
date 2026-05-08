"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Car,
  ArrowLeftRight,
  Wallet,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "Vehicles", icon: Car },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/payments", label: "Payments", icon: Wallet },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function SidebarBrand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 px-5 pt-5 pb-6 group"
    >
      <span
        aria-hidden
        className="relative grid size-7 place-items-center rounded-md bg-primary/15 ring-1 ring-primary/30 text-primary"
      >
        <span className="text-[13px] font-semibold tracking-tight">J</span>
        <span className="absolute -inset-px rounded-md bg-primary/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[13.5px] font-semibold tracking-tight text-foreground">
          JTrak <span className="text-primary">Funding</span>
        </span>
        <span className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground/80 mt-1">
          Floorplan OS
        </span>
      </span>
    </Link>
  )
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5 px-3">
      <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/60">
        Workspace
      </p>
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-md pl-3 pr-2 py-1.5 text-[13px] font-medium transition-all",
              "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60",
              active && "text-foreground bg-sidebar-accent"
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full bg-primary transition-all",
                active ? "opacity-100" : "opacity-0 group-hover:opacity-40"
              )}
            />
            <item.icon
              className={cn(
                "size-[15px] shrink-0 transition-colors",
                active ? "text-primary" : "text-muted-foreground/80 group-hover:text-foreground"
              )}
              strokeWidth={active ? 2.25 : 1.75}
            />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function SidebarFooter() {
  return (
    <div className="mt-auto px-5 pb-5 pt-4">
      <div className="rounded-md border border-border/60 bg-card/50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Credit line
          </span>
          <span className="text-[10.5px] tabular-nums text-muted-foreground">
            71.1%
          </span>
        </div>
        <div className="mt-2 h-1 rounded-full bg-muted/70 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: "71.1%" }}
          />
        </div>
        <p className="mt-2 text-[11px] tabular-nums text-foreground/90">
          $284,500 <span className="text-muted-foreground">/ $400,000</span>
        </p>
      </div>
      <p className="mt-3 px-1 text-[10.5px] text-muted-foreground/70">
        v0.1 · Phase 1 preview
      </p>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-[240px] flex-col bg-sidebar border-r border-sidebar-border">
      <SidebarBrand />
      <SidebarNav />
      <SidebarFooter />
    </aside>
  )
}
