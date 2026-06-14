
"use client"

import { useState } from "react"
import { DashboardSidebar } from "@/components/dashboard/Sidebar"
import { DashboardHeader } from "@/components/dashboard/Header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  SearchCode, 
  CheckCircle, 
  FileSearch, 
  Layers,
  Fingerprint,
  Info
} from "lucide-react"
import { traceLeak, LeakTraceOutput } from "@/ai/flows/ai-powered-leak-trace-flow"
import { motion, AnimatePresence } from "framer-motion"
import { useFirestore, useCollection } from "@/firebase"
import { collection, query, limit } from "firebase/firestore"
import { useMemo } from "react"

export default function LeakTracing() {
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<LeakTraceOutput | null>(null)

  const firestore = useFirestore()
  
  const auditQuery = useMemo(() => {
    if (!firestore) return null
    return query(collection(firestore, "audit_vault"), limit(10))
  }, [firestore])
  
  const { data: recentLogs } = useCollection(auditQuery)

  async function handleAnalyze() {
    if (!file) return
    
    setIsAnalyzing(true)
    setProgress(10)
    
    const internalRecords = recentLogs?.length > 0 
      ? recentLogs.map(log => `Event: ${log.event}, Center: ${log.center}, ID: ${log.id}`).join('\n')
      : "No recent audit logs available for correlation."

    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      
      const interval = setInterval(() => {
        setProgress(prev => (prev < 90 ? prev + 15 : prev))
      }, 800)

      try {
        const response = await traceLeak({
          leakedDocumentImage: base64,
          internalRecords: internalRecords
        })
        
        clearInterval(interval)
        setProgress(100)
        setTimeout(() => {
          setResult(response)
          setIsAnalyzing(false)
        }, 500)
      } catch (error) {
        console.error(error)
        setIsAnalyzing(false)
        clearInterval(interval)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <DashboardHeader title="Forensic Leak Tracer" />
      
      <main className="lg:ml-64 p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          
          {/* Upload Section */}
          <div className="space-y-6">
            <Card className="glass-panel border-dashed border-white/20 hover:border-accent/50 transition-all">
              <CardContent className="pt-8 pb-8 md:pt-10 md:pb-10 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 md:w-8 md:h-8 text-accent" />
                </div>
                <h3 className="text-lg md:text-xl font-headline font-bold text-white">Upload Evidence</h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-2 max-w-xs px-4">
                  Drag and drop document imagery for AI-driven watermark analysis.
                </p>
                <div className="mt-6 md:mt-8 flex flex-wrap justify-center gap-3 px-4">
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="border-white/10 hover:bg-white/5 cursor-pointer h-10 px-4 text-xs" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                  <Button 
                    className="bg-accent text-accent-foreground hover:bg-accent/90 h-10 px-4 text-xs" 
                    disabled={!file || isAnalyzing}
                    onClick={handleAnalyze}
                  >
                    {isAnalyzing ? "Analyzing..." : "Start Trace"}
                  </Button>
                </div>
                {file && (
                  <div className="mt-4 flex items-center gap-2 text-[10px] md:text-xs text-accent">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {file.name}
                  </div>
                )}
              </CardContent>
            </Card>

            {isAnalyzing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <div className="flex justify-between text-[10px] font-code text-accent uppercase tracking-widest">
                  <span>Isolating Layers...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 md:h-2 bg-white/5" />
              </motion.div>
            )}

            <Card className="glass-panel border-white/10">
              <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
                <CardTitle className="text-[10px] font-headline uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Info className="w-3.5 h-3.5" />
                  Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-4 p-4 md:p-6 pt-0 md:pt-0">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">01</span>
                  </div>
                  <p>AI detects visible and frequency-domain watermarks embedded during paper synthesis.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">02</span>
                  </div>
                  <p>Use high resolution imagery (300dpi+) for optimal forensic marker isolation.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Result Section */}
          <div className="min-h-[300px] md:min-h-[400px]">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Card className="glass-panel border-accent/30 overflow-hidden">
                    <div className="bg-accent/10 p-4 border-b border-accent/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Fingerprint className="w-5 h-5 text-accent" />
                        <h3 className="font-headline font-bold text-white text-sm">Matches Found</h3>
                      </div>
                      <Badge className="bg-accent text-accent-foreground font-code text-[10px]">
                        Conf: {(result.confidenceScore * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <CardContent className="pt-6 space-y-6 p-4 md:p-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-code uppercase tracking-widest text-muted-foreground">Origin Source</span>
                        <div className="text-xl md:text-2xl font-headline font-bold text-accent break-words">{result.leakSource}</div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-code uppercase tracking-widest text-muted-foreground">Markers</span>
                        <div className="flex flex-wrap gap-2">
                          {result.identifiedWatermarks.map((w, i) => (
                            <Badge key={i} variant="outline" className="font-code border-white/20 text-white text-[9px] px-2 py-0">
                              {w}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 p-3 md:p-4 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-[10px] font-code uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-1">
                          <FileSearch className="w-3 h-3" />
                          Analytical Report
                        </span>
                        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {result.reportDetails}
                        </p>
                      </div>

                      <Button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white gap-2 h-11 text-xs">
                        <Layers className="w-4 h-4" />
                        Full Forensic Report
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center p-8 md:p-12 glass-panel border-white/5 rounded-2xl min-h-[300px]"
                >
                  <SearchCode className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-headline text-base md:text-lg italic text-center">
                    Awaiting evidence cluster...<br/>
                    <span className="text-[10px] md:text-xs font-normal not-italic">Run trace to populate terminal.</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}
