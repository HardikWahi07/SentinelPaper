
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  ShieldCheck, 
  LayoutDashboard, 
  FileText, 
  SearchCode, 
  MessageSquareCode, 
  History,
  Lock,
  LogOut,
  UserPlus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { Button } from "@/components/ui/button"

const navItems = [
  { name: "Overview", icon: LayoutDashboard, href: "/" },
  { name: "Exam Generation", icon: FileText, href: "/exam-generation" },
  { name: "Leak Tracing", icon: SearchCode, href: "/leak-tracing" },
  { name: "Security Copilot", icon: MessageSquareCode, href: "/security-copilot" },
  { name: "Audit Vault", icon: History, href: "/audit-vault" },
]

export function SidebarContent({ className, onLinkClick }: { className?: string, onLinkClick?: () => void }) {
  const pathname = usePathname()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { user } = useUser()
  
  const profileRef = useMemoFirebase(() => {
    if (!user || !db) return null
    return doc(db, "users", user.uid)
  }, [user, db])
  
  const { data: profile } = useDoc(profileRef as any)

  const handleLogout = async () => {
    await auth.signOut()
    router.push("/login")
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-primary">
          <ShieldCheck className="text-white w-6 h-6" />
        </div>
        <span className="font-headline text-xl font-bold tracking-tighter text-white">
          SENTINEL<span className="text-accent">PAPER</span>
        </span>
      </div>

      <nav className="mt-6 px-4 space-y-2 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-white"
              )} />
              <span className="font-medium text-sm">{item.name}</span>
              {isActive && (
                <div className="absolute right-0 w-1 h-6 bg-primary rounded-l-full glow-primary" />
              )}
            </Link>
          )
        })}

        {profile?.role === 'admin' && (
          <Link
            href="/signup"
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
              pathname === "/signup" 
                ? "bg-accent/10 text-accent" 
                : "text-muted-foreground hover:bg-white/5 hover:text-white"
            )}
          >
            <UserPlus className={cn(
              "w-5 h-5",
              pathname === "/signup" ? "text-accent" : "text-muted-foreground group-hover:text-white"
            )} />
            <span className="font-medium text-sm">Provision User</span>
          </Link>
        )}
      </nav>

      <div className="p-4 space-y-4">
        <div className="rounded-xl bg-accent/5 border border-accent/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-accent" />
            <span className="text-xs font-headline font-bold text-accent uppercase tracking-widest">
              {profile?.role || "SECURE"} NODE
            </span>
          </div>
          <div className="text-[10px] font-code text-muted-foreground truncate">
            {user?.email || "NOT AUTHORIZED"}
          </div>
        </div>

        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-500/10 gap-3"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Terminate Session</span>
        </Button>
      </div>
    </div>
  )
}

export function DashboardSidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass-panel border-r border-white/5 z-50 hidden lg:flex flex-col">
      <SidebarContent />
    </aside>
  )
}
