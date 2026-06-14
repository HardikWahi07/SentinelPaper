
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { collection, query, limit, getDocs } from "firebase/firestore"
import { useAuth, useFirestore } from "@/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Lock, Mail, Loader2, Rocket } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSystemEmpty, setIsSystemEmpty] = useState(false)
  
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function checkUsers() {
      try {
        const snap = await getDocs(query(collection(db, "users"), limit(1)));
        if (snap.empty) {
          setIsSystemEmpty(true);
        }
      } catch (err) {
        console.error("Failed to check user status", err);
      }
    }
    checkUsers();
  }, [db]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "Invalid credentials. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)]" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        <Card className="glass-panel border-white/10">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center glow-primary mb-2">
              <ShieldCheck className="text-white w-7 h-7" />
            </div>
            <CardTitle className="text-2xl font-headline font-bold">Sentinel Access</CardTitle>
            <CardDescription>Enter credentials to access the secure node</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Node Identifier</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@sentinel.sys" 
                    className="pl-10 bg-white/5 border-white/10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Access Key</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    className="pl-10 bg-white/5 border-white/10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize Session"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isSystemEmpty && (
          <Card className="glass-panel border-accent/30 bg-accent/5">
            <CardContent className="p-4 flex flex-col items-center text-center gap-3">
              <div className="flex items-center gap-2 text-accent font-bold text-sm">
                <Rocket className="w-4 h-4" />
                BOOTSTRAP REQUIRED
              </div>
              <p className="text-xs text-muted-foreground">No accounts detected in the master ledger.</p>
              <Button asChild variant="outline" size="sm" className="w-full border-accent/20 hover:bg-accent/10">
                <Link href="/signup">Initialize Admin Account</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
