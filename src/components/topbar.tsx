"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, ChevronRight, LogOut, Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { cn, getInitials } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SidebarBrand, SidebarNav, SidebarFooter } from "@/components/sidebar"

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/vehicles": "Vehicles",
  "/transactions": "Transactions",
  "/payments": "Payments",
  "/reports": "Reports",
  "/settings": "Settings",
}

function Breadcrumb() {
  const pathname = usePathname()
  let current = PAGE_TITLES[pathname] ?? "Dashboard"
  if (!PAGE_TITLES[pathname]) {
    if (pathname.startsWith("/vehicles/")) current = "Vehicle detail"
  }
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-[13px] text-muted-foreground"
    >
      <Link href="/" className="hover:text-foreground transition-colors">
        JTrak
      </Link>
      <ChevronRight className="size-3.5 text-muted-foreground/50" />
      <span className="text-foreground font-medium">{current}</span>
    </nav>
  )
}

function ThemeToggleSubmenu() {
  const { theme, setTheme } = useTheme()
  const opts: Array<{ value: string; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "System", icon: Monitor },
  ]
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="text-[13px]">
        {theme === "light" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
        <span>Theme</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-36">
        {opts.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "text-[13px]",
              theme === opt.value && "bg-accent text-foreground"
            )}
          >
            <opt.icon className="size-3.5" />
            <span>{opt.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

function UserMenu({ email }: { email: string }) {
  const router = useRouter()
  const userName = email.split("@")[0] || "User"
  const initials = getInitials(userName.replace(/[._]/g, " "))

  async function handleLogout() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error("Sign out failed", { description: error.message })
      return
    }
    toast.success("Signed out")
    router.replace("/login")
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group flex items-center gap-2 rounded-md pl-1 pr-2 py-1 transition-colors",
          "hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        )}
      >
        <span className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-primary/30 to-primary/10 text-[11.5px] font-semibold tracking-tight text-primary ring-1 ring-primary/25">
          {initials.toUpperCase()}
        </span>
        <span className="hidden sm:flex flex-col items-start leading-none">
          <span className="text-[12.5px] font-medium text-foreground">
            {userName}
          </span>
          <span className="text-[10.5px] text-muted-foreground">Owner</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-[13px] font-medium">{userName}</span>
          <span className="text-[11.5px] font-normal text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ThemeToggleSubmenu />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="text-[13px]"
          onClick={handleLogout}
        >
          <LogOut className="size-3.5" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MobileNav({ stats }: { stats?: { outstanding: number; creditLimit: number } }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          "lg:hidden -ml-2 inline-flex size-9 items-center justify-center rounded-md text-foreground",
          "hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        )}
      >
        <Menu className="size-4" />
        <span className="sr-only">Open navigation</span>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[260px] p-0 bg-sidebar border-sidebar-border"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="flex h-full flex-col">
          <SidebarBrand />
          <SidebarNav onNavigate={() => setOpen(false)} />
          <SidebarFooter stats={stats} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function Topbar({
  userEmail,
  stats,
}: {
  userEmail: string
  stats?: { outstanding: number; creditLimit: number }
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/60",
        "bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "px-4 sm:px-6 lg:px-8"
      )}
    >
      <div className="flex items-center gap-3">
        <MobileNav stats={stats} />
        <Breadcrumb />
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/40 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_25%,transparent)]" />
          Live
        </span>
        <UserMenu email={userEmail} />
      </div>
    </header>
  )
}
