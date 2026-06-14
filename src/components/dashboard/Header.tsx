
"use client"

import { Bell, Search, User, Menu } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SidebarContent } from "./Sidebar"
import { useState } from "react"

export function DashboardHeader({ title }: { title: string }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-background/50 backdrop-blur-sm sticky top-0 z-40 lg:ml-64">
      <div className="flex items-center gap-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="lg:hidden p-2 text-muted-foreground hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-background border-r border-white/5">
            <SidebarContent onLinkClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        
        <div className="flex flex-col">
          <h1 className="font-headline text-lg md:text-2xl font-bold text-white tracking-tight truncate max-w-[150px] md:max-w-none">
            {title}
          </h1>
          <div className="hidden md:flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">System Status: Optimal</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <div className="relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search vault..." 
            className="h-10 w-48 xl:w-64 bg-white/5 border border-white/10 rounded-full pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button className="relative p-2 text-muted-foreground hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full border-2 border-background" />
          </button>
          
          <div className="hidden md:block h-8 w-px bg-white/10" />
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-sm font-medium text-white truncate max-w-[80px]">Chief Admin</span>
              <Badge variant="outline" className="text-[10px] border-accent/20 text-accent py-0">Level 4</Badge>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-primary/20 bg-primary/10 flex items-center justify-center overflow-hidden">
              <User className="text-primary w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
