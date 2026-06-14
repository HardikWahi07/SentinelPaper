"use client"

import { useState, useRef, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard/Sidebar"
import { DashboardHeader } from "@/components/dashboard/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Send, 
  Bot, 
  User, 
  Terminal,
  Sparkles,
  RefreshCcw
} from "lucide-react"
import { naturalLanguageSecurityCopilot } from "@/ai/flows/natural-language-security-copilot"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function SecurityCopilot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Agent Sentinel online. System optimal. How can I assist with security queries today?" }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const firestore = useFirestore()

  // Fetch live context on the client to pass to the AI flow
  const logsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "audit_vault"), orderBy("timestamp", "desc"), limit(10))
  }, [firestore])

  const statsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return collection(firestore, "system_stats")
  }, [firestore])

  const { data: logs } = useCollection(logsQuery)
  const { data: stats } = useCollection(statsQuery)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  async function handleSend() {
    if (!input.trim()) return

    const userMsg = input
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMsg }])
    setIsTyping(true)

    // Format the context from live Firestore data
    const contextString = `
LATEST AUDIT LOGS:
${logs?.map(l => `[${l.type}] ${l.event} (${l.status}) at ${l.timestamp}`).join('\n') || "No logs found."}

SYSTEM METRICS:
${stats?.map(s => `${s.label}: ${s.value} (${s.trend})`).join('\n') || "No stats found."}
`

    try {
      const response = await naturalLanguageSecurityCopilot({ 
        query: userMsg,
        context: contextString
      })
      setMessages(prev => [...prev, { role: "assistant", content: response.response }])
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: Failed to interface with security cluster. Verify node connectivity." }])
    } finally {
      setIsTyping(false)
    }
  }

  const suggestedQueries = [
    "Summarize latest generation events.",
    "Are there any critical anomalies?",
    "Show system stats overview.",
    "List recently verified nodes."
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <DashboardHeader title="Security Copilot" />
        
        <main className="lg:ml-64 p-4 md:p-8 flex flex-col xl:flex-row gap-6 md:gap-8 flex-1 overflow-hidden">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden border-white/5 min-h-0">
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">AI Analysis</h3>
                  <p className="text-[10px] text-accent uppercase tracking-tighter truncate">Live Contextual Session</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => setMessages([messages[0]])}>
                <RefreshCcw className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4 md:p-6">
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3 md:gap-4",
                      msg.role === "user" ? "flex-row-reverse" : ""
                    )}
                  >
                    <Avatar className={cn(
                      "h-8 w-8 md:h-10 md:w-10 border shrink-0",
                      msg.role === "assistant" ? "border-accent/20 bg-accent/10" : "border-primary/20 bg-primary/10"
                    )}>
                      <AvatarFallback>
                        {msg.role === "assistant" ? <Bot className="w-5 h-5 md:w-6 md:h-6 text-accent" /> : <User className="w-5 h-5 md:w-6 md:h-6 text-primary" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={cn(
                      "p-3 md:p-4 rounded-2xl max-w-[85%] text-xs md:text-sm leading-relaxed",
                      msg.role === "assistant" 
                        ? "bg-white/5 text-white border border-white/5" 
                        : "bg-primary text-white glow-primary"
                    )}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-4 animate-pulse">
                    <Avatar className="h-8 w-8 md:h-10 md:w-10 border border-accent/20 bg-accent/10">
                      <AvatarFallback><Bot className="w-5 h-5 text-accent" /></AvatarFallback>
                    </Avatar>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-accent/50" />
                      <div className="w-2 h-2 rounded-full bg-accent/50" />
                      <div className="w-2 h-2 rounded-full bg-accent/50" />
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 md:p-6 bg-white/5 border-t border-white/5">
              <div className="relative max-w-4xl mx-auto flex gap-2">
                <Input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask Sentinel about live node status..."
                  className="h-11 md:h-14 bg-background border-white/10 rounded-xl focus-visible:ring-accent text-sm"
                />
                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 h-11 md:h-14 px-4 md:px-6" onClick={handleSend}>
                  <Send className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Analyze</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="xl:w-80 flex flex-col sm:flex-row xl:flex-col gap-4 md:gap-6">
            <Card className="glass-panel border-accent/20 flex-1">
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                  <h4 className="font-bold text-white text-sm">Suggestions</h4>
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-1 gap-2">
                  {suggestedQueries.map((q, i) => (
                    <button 
                      key={i}
                      onClick={() => setInput(q)}
                      className="w-full text-left p-2 md:p-3 text-[10px] md:text-xs text-muted-foreground bg-white/5 border border-white/5 rounded-lg hover:bg-accent/10 hover:border-accent/30 hover:text-white transition-all truncate"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel border-primary/20 flex-1">
              <CardContent className="pt-4 md:pt-6">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <Terminal className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  <h4 className="font-bold text-white text-sm">Context Feed</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5">
                    <span className="text-[10px] font-bold text-white">Live Logs</span>
                    <Badge variant="outline" className="text-[8px] text-green-500 border-green-500/20 py-0 px-1">{logs?.length || 0} Buffered</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5">
                    <span className="text-[10px] font-bold text-white">System Stats</span>
                    <Badge variant="outline" className="text-[8px] text-green-500 border-green-500/20 py-0 px-1">Synched</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
