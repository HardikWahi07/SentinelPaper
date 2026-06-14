
"use client"

import { useState, useRef } from "react"
import { DashboardSidebar } from "@/components/dashboard/Sidebar"
import { DashboardHeader } from "@/components/dashboard/Header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Cpu, 
  ShieldCheck, 
  QrCode, 
  Lock, 
  Sparkles,
  Download,
  Settings2,
  Printer,
  Loader2
} from "lucide-react"
import { generateExam, ExamGenerationOutput } from "@/ai/flows/generate-exam-flow"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { useFirestore, useUser } from "@/firebase"
import { collection, doc, setDoc, addDoc } from "firebase/firestore"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export default function ExamGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exam, setExam] = useState<ExamGenerationOutput | null>(null)
  const { toast } = useToast()
  const { user } = useUser()
  const firestore = useFirestore()
  const paperRef = useRef<HTMLDivElement>(null)
  
  const [config, setConfig] = useState({
    subject: "Advanced Computing",
    difficulty: "Adaptive Intelligent",
    questionCount: 5,
    timeLimit: 180,
    centerId: "ALPHA-01"
  })

  const handleGenerate = async () => {
    if (!user) return
    
    setIsGenerating(true)
    setExam(null)
    try {
      const result = await generateExam({
        subject: config.subject,
        difficulty: config.difficulty,
        questionCount: config.questionCount,
        timeLimit: config.timeLimit,
        centerId: config.centerId
      })
      
      setExam(result)

      if (firestore) {
        // 1. Persist the full question paper content for forensic tracking
        const paperData = {
          ...result,
          userId: user.uid
        };
        const pRef = doc(firestore, "question_papers", result.batchId);
        setDoc(pRef, paperData)
          .catch(async () => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: pRef.path,
              operation: 'create',
              requestResourceData: paperData
            }));
          });

        // 2. Log the event in the audit vault with a link to the batchId
        const auditRef = collection(firestore, "audit_vault");
        const auditData = {
          userId: user.uid,
          type: "GENERATION",
          event: `Synthesized Exam: ${result.title}`,
          center: config.centerId,
          status: "VERIFIED",
          timestamp: new Date().toISOString(),
          batchId: result.batchId
        };
        
        addDoc(auditRef, auditData)
          .catch(async () => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: auditRef.path,
              operation: 'create',
              requestResourceData: auditData
            }));
          });
      }

      toast({
        title: "Paper Successfully Synthesized",
        description: `Generated ${config.questionCount} questions with forensic QR. Content persisted in vault.`,
      })
    } catch (error: any) {
      console.error("Failed to generate exam:", error)
      toast({
        variant: "destructive",
        title: "Sequencer Error",
        description: error.message || "Failed to interface with AI cluster.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!paperRef.current) return
    setIsExporting(true)
    try {
      const canvas = await html2canvas(paperRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height]
      })
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height)
      pdf.save(`${exam?.batchId || 'exam'}-forensic-paper.pdf`)
      
      toast({
        title: "Export Successful",
        description: "Forensic PDF has been generated and downloaded.",
      })
    } catch (error) {
      console.error("PDF generation failed:", error)
      toast({
        variant: "destructive",
        title: "Export Error",
        description: "Failed to generate forensic PDF.",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <DashboardHeader title="Secure Exam Generator" />
      
      <main className="lg:ml-64 p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
          
          {/* Config Panel */}
          <div className="xl:col-span-1 space-y-6 print-hide">
            <Card className="glass-panel border-white/10">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings2 className="w-5 h-5 text-primary" />
                  Blueprint Config
                </CardTitle>
                <CardDescription className="text-xs">Define synthesis parameters</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-5 md:space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs">Subject Domain</Label>
                  <Input 
                    placeholder="e.g. Advanced Computing" 
                    value={config.subject}
                    onChange={(e) => setConfig(prev => ({...prev, subject: e.target.value}))}
                    className="bg-white/5 border-white/10 h-10" 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Difficulty Curve</Label>
                  <Select 
                    defaultValue={config.difficulty}
                    onValueChange={(val) => setConfig(prev => ({...prev, difficulty: val}))}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 h-10">
                      <SelectValue placeholder="Select Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Adaptive Intelligent">Adaptive Intelligent</SelectItem>
                      <SelectItem value="Linear Medium">Linear Medium</SelectItem>
                      <SelectItem value="Hard Peak Stress">Hard Peak Stress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Questions</Label>
                    <Input 
                      type="number" 
                      value={config.questionCount} 
                      onChange={(e) => setConfig(prev => ({...prev, questionCount: parseInt(e.target.value) || 1}))}
                      className="bg-white/5 border-white/10 h-10" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Limit (Min)</Label>
                    <Input 
                      type="number" 
                      value={config.timeLimit} 
                      onChange={(e) => setConfig(prev => ({...prev, timeLimit: parseInt(e.target.value) || 1}))}
                      className="bg-white/5 border-white/10 h-10" 
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                      <span>Watermarking</span>
                    </div>
                    <Switch defaultChecked className="scale-75" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-3.5 h-3.5 text-accent" />
                      <span>Forensic Headers</span>
                    </div>
                    <Switch defaultChecked className="scale-75" />
                  </div>
                </div>

                <Button 
                  className="w-full bg-primary text-white hover:bg-primary/90 mt-2 h-11 gap-2 shadow-lg shadow-primary/20 text-sm"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Cpu className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Batch
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="glass-panel border-white/5 h-full flex flex-col min-h-[500px] md:min-h-[600px] print-container">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 p-4 md:p-6 gap-3 print-hide">
                <div>
                  <CardTitle className="text-white text-lg">Forensic Preview</CardTitle>
                  <CardDescription className="text-xs">Live terminal synthesis</CardDescription>
                </div>
                {exam && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-white/10 gap-2 h-9 px-3 text-xs" onClick={handlePrint}>
                      <Printer className="w-3.5 h-3.5" />
                      Print
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-accent text-accent-foreground gap-2 h-9 px-3 text-xs"
                      onClick={handleDownloadPDF}
                      disabled={isExporting}
                    >
                      {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      PDF
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-0 bg-black/40 relative print:bg-white">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div 
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 md:p-12"
                    >
                      <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-12 h-12 md:w-16 md:h-16 rounded-xl border-2 border-primary border-t-transparent mb-4 md:mb-6 shadow-glow"
                      />
                      <h3 className="text-base md:text-lg font-headline text-white mb-2">Hashing Forensic Layers</h3>
                      <p className="text-muted-foreground text-[10px] md:text-sm max-w-xs mx-auto">
                        Synthesizing questions with high-density watermarks.
                      </p>
                    </motion.div>
                  ) : exam ? (
                    <motion.div 
                      ref={paperRef}
                      key="exam"
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="p-6 md:p-10 font-body space-y-8 md:space-y-10 bg-white min-h-full print:p-0 relative print-area"
                    >
                      {/* Watermark Overlay */}
                      <div className="absolute inset-0 opacity-[0.03] rotate-[-45deg] pointer-events-none select-none flex items-center justify-center text-[24px] md:text-[40px] font-code whitespace-nowrap overflow-hidden text-black uppercase">
                        {exam.watermark.substring(0, 32)}
                      </div>

                      {/* Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-black pb-6 md:pb-8 relative z-10 gap-4">
                        <div className="space-y-2 md:space-y-3">
                          <Badge className="bg-red-600 text-white border-none rounded-none uppercase tracking-widest text-[8px] md:text-[10px] font-bold px-2 md:px-3">Confidential - Sentinel Paper</Badge>
                          <h2 className="text-xl md:text-3xl font-headline font-black text-black uppercase tracking-tighter leading-none">{exam.title}</h2>
                          <div className="grid grid-cols-1 gap-1 text-[9px] md:text-[11px] font-code text-zinc-600 uppercase">
                            <p>Batch ID: <span className="font-bold text-black">{exam.batchId.substring(0, 16)}</span></p>
                            <p>Node: <span className="font-bold text-black">{exam.centerId}</span></p>
                            <p>Hash: <span className="font-bold text-black truncate max-w-[120px] md:max-w-[200px] inline-block align-bottom">{exam.watermark}</span></p>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1 shrink-0 self-center sm:self-auto">
                          <div className="w-24 h-24 md:w-32 md:h-32 border-2 border-black p-1 bg-white relative">
                            {exam.qrDataUri && (
                              <Image 
                                src={exam.qrDataUri} 
                                alt="Forensic QR" 
                                width={128} 
                                height={128} 
                                className="w-full h-full object-contain"
                              />
                            )}
                          </div>
                          <span className="text-[8px] font-code font-bold uppercase tracking-tighter text-black">Verify Integrity</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-6 md:space-y-8 relative z-10">
                        {exam.questions.map((q) => (
                          <div key={q.id} className="space-y-3 md:space-y-4">
                            <div className="flex gap-3 md:gap-4">
                              <span className="font-headline text-sm md:text-xl font-black text-black border-2 border-black w-8 h-8 md:w-10 md:h-10 shrink-0 flex items-center justify-center">
                                {q.id}
                              </span>
                              <p className="text-black text-base md:text-lg font-medium leading-tight pt-0.5 md:pt-1">
                                {q.text}
                              </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pl-11 md:pl-14">
                              {q.options.map((opt, i) => (
                                <div key={i} className="p-2.5 md:p-3 border-2 border-zinc-200 rounded flex items-center gap-2 md:gap-3 text-zinc-800 text-xs md:text-sm font-medium">
                                  <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-zinc-300 flex items-center justify-center text-[8px] md:text-[10px] shrink-0 font-bold">
                                    {String.fromCharCode(65 + i)}
                                  </div>
                                  {opt}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="pt-8 md:pt-10 border-t-2 border-black flex justify-between items-end text-[8px] md:text-[10px] font-code font-bold text-zinc-500 uppercase">
                        <div>SENTINEL NODE {exam.centerId} | LEVEL 4</div>
                        <div>Page 01 of 01</div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-full flex flex-col items-center justify-center text-center p-8 md:p-12 min-h-[500px] md:min-h-[600px] print-hide"
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center mb-6">
                        <FileText className="w-8 h-8 md:w-10 md:h-10 text-white/20" />
                      </div>
                      <h3 className="text-lg md:text-xl font-headline text-white mb-2 tracking-tight font-bold">Sequencer Idle</h3>
                      <p className="text-muted-foreground text-xs md:text-sm max-w-xs mx-auto">
                        Authorize the sequencer to synthesize a forensic batch.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
