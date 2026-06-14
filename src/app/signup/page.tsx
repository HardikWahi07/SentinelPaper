
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, collection, query, limit, getDocs } from "firebase/firestore"
import { useAuth, useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, ShieldAlert, Loader2, Key, Rocket } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DashboardSidebar } from "@/components/dashboard/Sidebar"
import { DashboardHeader } from "@/components/dashboard/Header"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("proctor")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(false)
  const [checkingSystem, setCheckingSystem] = useState(true)
  
  const auth = useAuth()
  const db = useFirestore()
  const { user, loading: authLoading } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !db) return null
    return doc(db, "users", user.uid)
  }, [user, db])
  
  const { data: profile, loading: profileLoading } = useDoc(userProfileRef as any)

  useEffect(() => {
    async function checkSystemState() {
      try {
        const usersSnap = await getDocs(query(collection(db, "users"), limit(1)));
        if (usersSnap.empty) {
          setIsBootstrapping(true);
        } else {
          setIsBootstrapping(false);
        }
      } catch (err) {
        console.error("System check failed", err);
      } finally {
        setCheckingSystem(false);
      }
    }
    checkSystemState();
  }, [db]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isBootstrapping && (!profile || profile.role !== 'admin')) {
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "Only administrative nodes can provision new accounts.",
      })
      return
    }

    setIsLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        role: isBootstrapping ? "admin" : role,
        name,
        createdAt: new Date().toISOString()
      })

      toast({
        title: isBootstrapping ? "System Initialized" : "Account Provisioned",
        description: `New ${isBootstrapping ? 'admin' : role} account created for ${email}.`,
      })
      
      router.push("/")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Provisioning Error",
        description: error.message || "Failed to create new user node.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || (user && profileLoading) || checkingSystem) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-sm font-code text-muted-foreground uppercase tracking-widest">Scanning System Nodes...</p>
        </div>
      </div>
    )
  }

  if (!isBootstrapping && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex flex-col lg:flex-row">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader title="Restricted Area" />
          <main className="lg:ml-64 p-4 md:p-8 flex items-center justify-center flex-1">
            <Card className="glass-panel border-red-500/20 max-w-md w-full text-center p-8 md:p-12">
              <ShieldAlert className="w-12 h-12 md:w-16 md:h-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-xl md:text-2xl font-headline font-bold text-white mb-2">Access Denied</h2>
              <p className="text-sm text-muted-foreground">You do not have administrative clearance to view this node sequencer.</p>
              <Button onClick={() => router.push("/")} className="mt-8 w-full">Return to Dashboard</Button>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {!isBootstrapping && <DashboardSidebar />}
      <div className="flex-1 flex flex-col">
        {!isBootstrapping && <DashboardHeader title="User Provisioning" />}
        
        <main className={cn(
          "flex-1 p-4 md:p-8 flex items-center justify-center",
          !isBootstrapping && "lg:ml-64"
        )}>
          <Card className="glass-panel border-white/10 w-full max-w-xl">
            <CardHeader className="text-center p-4 md:p-6">
              {isBootstrapping ? (
                <div className="mx-auto w-12 h-12 rounded-xl bg-accent flex items-center justify-center glow-accent mb-4">
                  <Rocket className="text-white w-7 h-7" />
                </div>
              ) : (
                <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center glow-primary mb-4">
                  <UserPlus className="text-white w-7 h-7" />
                </div>
              )}
              <CardTitle className="text-xl md:text-2xl font-headline font-bold">
                {isBootstrapping ? "Bootstrap Admin Account" : "Provision New Identity"}
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {isBootstrapping 
                  ? "No users detected. Create the master account to initialize the Sentinel node." 
                  : "Create a new secure node identity."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
              <form onSubmit={handleSignup} className="space-y-4 md:space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Designation (Full Name)</Label>
                  <Input 
                    placeholder="e.g. System Administrator" 
                    className="bg-white/5 border-white/10 h-11"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Node ID (Email)</Label>
                  <Input 
                    type="email" 
                    placeholder="admin@sentinel.sys" 
                    className="bg-white/5 border-white/10 h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {!isBootstrapping && (
                  <div className="space-y-2">
                    <Label className="text-xs md:text-sm">Clearance Level (Role)</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="bg-white/5 border-white/10 h-11">
                        <SelectValue placeholder="Select Clearance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator (Level 4)</SelectItem>
                        <SelectItem value="analyst">Analyst (Level 3)</SelectItem>
                        <SelectItem value="proctor">Proctor (Level 2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs md:text-sm">Access Key</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="password" 
                      className="pl-10 bg-white/5 border-white/10 h-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className={`w-full h-12 font-bold ${isBootstrapping ? 'bg-accent text-accent-foreground hover:bg-accent/90' : 'bg-primary text-white hover:bg-primary/90'}`}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isBootstrapping ? "Initialize Node" : "Provision Identity")}
                </Button>
                
                {isBootstrapping && (
                  <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest mt-2 md:mt-4">
                    Master Admin clearance will be granted
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
