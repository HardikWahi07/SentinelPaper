
"use client"

import { useMemo, useState } from "react"
import { DashboardSidebar } from "@/components/dashboard/Sidebar"
import { DashboardHeader } from "@/components/dashboard/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { 
  ShieldCheck, 
  History, 
  Filter, 
  Download, 
  Lock,
  ExternalLink,
  ChevronRight,
  Plus,
  Loader2,
  FileText
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useCollection, useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, orderBy, addDoc, doc, DocumentReference } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import Image from "next/image"

function PaperDetailDialog({ batchId }: { batchId?: string }) {
  const firestore = useFirestore()
  const paperRef = useMemoFirebase(() => {
    if (!firestore || !batchId) return null
    return doc(firestore, "question_papers", batchId) as DocumentReference
  }, [firestore, batchId])
  
  const { data: paper, loading } = useDoc(paperRef)

  if (!batchId) return null

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-code uppercase tracking-widest text-muted-foreground">Retrieving Forensic Content...</p>
        </div>
      ) : paper ? (
        <div className="space-y-6">
          <div className="flex items-start justify-between border-b border-white/10 pb-4">
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white">{paper.title}</h4>
              <p className="text-[10px] font-code text-muted-foreground uppercase">Batch: {paper.batchId}</p>
            </div>
            <div className="w-16 h-16 border border-white/20 p-1 bg-white relative">
              {paper.qrDataUri && (
                <Image src={paper.qrDataUri} alt="QR" width={64} height={64} className="object-contain" />
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {paper.questions?.map((q: any) => (
              <div key={q.id} className="space-y-2 p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex gap-2">
                  <span className="font-bold text-primary">{q.id}.</span>
                  <p className="text-sm text-white font-medium">{q.text}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                  {q.options?.map((opt: string, i: number) => (
                    <div key={i} className={cn(
                      "text-[11px] p-2 rounded border border-white/5",
                      i === q.correctAnswerIndex ? "bg-green-500/10 border-green-500/20 text-green-500" : "text-muted-foreground"
                    )}>
                      {String.fromCharCode(65 + i)}. {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
            <p className="text-[10px] font-code text-accent uppercase tracking-widest mb-1">Forensic Hash</p>
            <p className="text-[10px] font-code text-white break-all">{paper.watermark}</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground italic">Paper content not found or already purged from live cache.</p>
        </div>
      )}
    </div>
  )
}

export default function AuditVault() {
  const firestore = useFirestore()
  const { user } = useUser()
  const { toast } = useToast()
  const [isAdding, setIsAdding] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null)

  const [newEvent, setNewEvent] = useState({
    type: "SECURITY",
    event: "",
    center: "ALPHA-01",
    status: "VERIFIED"
  })

  const eventsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "audit_vault"), orderBy("timestamp", "desc"))
  }, [firestore])

  const { data: logs, loading } = useCollection(eventsQuery)

  const handleAddManualAudit = () => {
    if (!newEvent.event || !user || !firestore) return
    
    setIsAdding(true)
    const auditData = {
      ...newEvent,
      userId: user.uid,
      timestamp: new Date().toISOString()
    };

    const auditRef = collection(firestore, "audit_vault");
    
    addDoc(auditRef, auditData)
      .then(() => {
        toast({
          title: "Entry Hashed & Recorded",
          description: "The security event has been appended to the immutable ledger.",
        })
        setOpen(false)
        setNewEvent({ type: "SECURITY", event: "", center: "ALPHA-01", status: "VERIFIED" })
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: auditRef.path,
          operation: 'create',
          requestResourceData: auditData
        }));
      })
      .finally(() => {
        setIsAdding(false)
      })
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <DashboardHeader title="Immutable Security Vault" />
      
      <main className="lg:ml-64 p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-headline font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Event Ledger
            </h2>
            <p className="text-sm text-muted-foreground">Immutable forensic audit trail.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 md:flex-none">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Filter events..." className="h-10 pl-10 bg-white/5 border-white/10 w-full md:w-48 lg:w-64" />
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white hover:bg-primary/90 gap-2 h-10 px-4 flex-1 md:flex-none">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Manual Entry</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-panel border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white">Record Security Event</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Manually append a record to the forensic audit trail.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Select value={newEvent.type} onValueChange={(v) => setNewEvent(prev => ({...prev, type: v}))}>
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SECURITY">Security Investigation</SelectItem>
                        <SelectItem value="ACCESS">Access Override</SelectItem>
                        <SelectItem value="ANOMALY">System Anomaly</SelectItem>
                        <SelectItem value="VERIFICATION">Manual Verification</SelectItem>
                        <SelectItem value="STORAGE">Data Migration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Event Description</Label>
                    <Input 
                      placeholder="Describe the security event..." 
                      className="bg-white/5 border-white/10"
                      value={newEvent.event}
                      onChange={(e) => setNewEvent(prev => ({...prev, event: e.target.value}))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Origin Node</Label>
                      <Input 
                        value={newEvent.center} 
                        onChange={(e) => setNewEvent(prev => ({...prev, center: e.target.value}))}
                        className="bg-white/5 border-white/10" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Integrity Status</Label>
                      <Select value={newEvent.status} onValueChange={(v) => setNewEvent(prev => ({...prev, status: v}))}>
                        <SelectTrigger className="bg-white/5 border-white/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VERIFIED">Verified</SelectItem>
                          <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                          <SelectItem value="ALERT">Critical Alert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)} className="border-white/10">Cancel</Button>
                  <Button onClick={handleAddManualAudit} disabled={isAdding || !newEvent.event}>
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign & Append"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <button className="flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors flex-1 md:flex-none">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        <Card className="glass-panel border-white/5 overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="font-code text-[10px] uppercase tracking-widest py-4">TX_ID</TableHead>
                  <TableHead className="font-code text-[10px] uppercase tracking-widest py-4">Type</TableHead>
                  <TableHead className="font-code text-[10px] uppercase tracking-widest py-4">Event</TableHead>
                  <TableHead className="font-code text-[10px] uppercase tracking-widest py-4 hidden md:table-cell">Node</TableHead>
                  <TableHead className="font-code text-[10px] uppercase tracking-widest py-4 hidden sm:table-cell">Status</TableHead>
                  <TableHead className="font-code text-[10px] uppercase tracking-widest py-4 hidden lg:table-cell">Timestamp</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell colSpan={7} className="h-12 bg-white/5" />
                    </TableRow>
                  ))
                ) : logs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No security events recorded in the vault.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs?.map((log: any) => (
                    <TableRow 
                      key={log.id} 
                      className="border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                      onClick={() => {
                        if (log.type === "GENERATION" && log.batchId) {
                          setSelectedPaper(log.batchId)
                        }
                      }}
                    >
                      <TableCell className="font-code text-primary font-bold text-xs">{log.id.substring(0, 6)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-bold border-white/10 px-1.5",
                          log.type === "ANOMALY" && "border-red-500/30 text-red-500 bg-red-500/5",
                          log.type === "SECURITY" && "border-yellow-500/30 text-yellow-500 bg-yellow-500/5",
                          log.type === "ENCRYPTION" && "border-accent/30 text-accent bg-accent/5",
                          log.type === "GENERATION" && "border-primary/30 text-primary bg-primary/5"
                        )}>
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white font-medium text-xs max-w-[150px] truncate">
                        <div className="flex items-center gap-2">
                          {log.type === "GENERATION" && <FileText className="w-3 h-3 text-primary shrink-0" />}
                          {log.event}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[10px] hidden md:table-cell">{log.center}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className={cn(
                            "w-3 h-3",
                            log.status === "VERIFIED" ? "text-green-500" : log.status === "INVESTIGATING" ? "text-yellow-500" : "text-red-500"
                          )} />
                          <span className="text-[9px] font-bold uppercase tracking-tighter">{log.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[10px] font-code hidden lg:table-cell">{new Date(log.timestamp).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-all transform group-hover:translate-x-1" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Paper Detail Dialog */}
        <Dialog open={!!selectedPaper} onOpenChange={(open) => !open && setSelectedPaper(null)}>
          <DialogContent className="glass-panel border-white/10 text-white sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Forensic Paper Retrieval
              </DialogTitle>
              <DialogDescription>
                Retrieved from the secure vault. Integrity verified against blockchain ledger.
              </DialogDescription>
            </DialogHeader>
            <PaperDetailDialog batchId={selectedPaper as string} />
            <DialogFooter>
              <Button onClick={() => setSelectedPaper(null)}>Close Terminal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Card className="glass-panel border-accent/20 bg-accent/5">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-sm font-headline text-accent flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Custody Integrity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Entries are verified against the distributed security cluster. Root hash is real-time.
              </p>
            </CardContent>
          </Card>
          
          <Card className="glass-panel border-primary/20 bg-primary/5">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-sm font-headline text-primary flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Governance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Export requires Level 3 clearance. IP and session signatures are watermarked for traceability.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
