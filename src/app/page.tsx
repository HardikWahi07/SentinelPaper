
"use client"

import { useMemo } from "react"
import { DashboardSidebar } from "@/components/dashboard/Sidebar"
import { DashboardHeader } from "@/components/dashboard/Header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  FileCheck, 
  ShieldAlert, 
  Users, 
  ArrowUpRight, 
  AlertTriangle,
  Zap,
  Info
} from "lucide-react"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"

const iconMap: Record<string, any> = {
  FileCheck,
  ShieldAlert,
  Activity,
  Users,
  AlertTriangle,
  Info
}

export default function Dashboard() {
  const firestore = useFirestore()

  const statsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return collection(firestore, "system_stats")
  }, [firestore])

  const alertsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "security_alerts"), orderBy("time", "desc"), limit(5))
  }, [firestore])

  const chartQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, "threat_activity"), orderBy("name", "asc"))
  }, [firestore])

  const { data: statsData, loading: statsLoading } = useCollection(statsQuery)
  const { data: alertsData, loading: alertsLoading } = useCollection(alertsQuery)
  const { data: chartData, loading: chartLoading } = useCollection(chartQuery)

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <DashboardHeader title="Security Command Center" />
      
      <main className="lg:ml-64 p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statsLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="glass-panel animate-pulse h-32" />
            ))
          ) : statsData?.length === 0 ? (
            <div className="col-span-full text-center p-8 border border-dashed border-white/10 rounded-xl">
               <p className="text-muted-foreground italic">No system metrics found. Please seed the "system_stats" collection.</p>
            </div>
          ) : (
            statsData?.map((stat: any, i) => {
              const Icon = iconMap[stat.icon] || Info
              return (
                <motion.div
                  key={stat.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass-panel hover:border-primary/50 transition-colors group">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className={cn("p-2 rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors")}>
                          <Icon className={cn("w-5 h-5", stat.color || "text-primary")} />
                        </div>
                        <Badge variant="outline" className="border-white/10 text-xs text-muted-foreground font-code">
                          {stat.trend}
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm font-medium text-muted-foreground tracking-tight">{stat.label}</p>
                        <h3 className="text-2xl font-headline font-bold text-white mt-1">{stat.value}</h3>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 glass-panel overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Activity className="w-5 h-5 text-primary" />
                Network Threat Intelligence
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">Real-time analysis of anomalous access patterns across all nodes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] md:h-[300px] w-full mt-4">
                {chartLoading ? (
                  <div className="w-full h-full bg-white/5 animate-pulse rounded-lg" />
                ) : chartData?.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center border border-dashed border-white/10 rounded-lg">
                    <p className="text-sm text-muted-foreground italic">No data in "threat_activity" collection.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsla(210, 20%, 98%, 0.05)" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsla(210, 20%, 98%, 0.3)" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsla(210, 20%, 98%, 0.3)" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(11, 12, 16, 0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: 'white' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="threats" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorThreats)" 
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Live Alerts</CardTitle>
                <CardDescription className="text-xs">Immediate security responses</CardDescription>
              </div>
              <Badge variant="destructive" className="animate-pulse">Active</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {alertsLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
                ))
              ) : alertsData?.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground italic">No active alerts in "security_alerts".</p>
                </div>
              ) : (
                alertsData?.map((alert: any) => (
                  <div key={alert.id} className="flex gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className={cn(
                      "w-1 h-auto rounded-full",
                      alert.type === "Critical" ? "bg-red-500" : alert.type === "Warning" ? "bg-yellow-500" : "bg-blue-500"
                    )} />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">{alert.type}</p>
                      <p className="text-sm text-muted-foreground leading-tight mt-1">{alert.msg}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1 font-code">{alert.time}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="glass-panel bg-primary/5 border-primary/20 group hover:bg-primary/10 transition-all cursor-pointer" onClick={() => window.location.href = '/exam-generation'}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20 text-primary glow-primary shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-headline font-bold text-lg text-white truncate">Generate Exam</h4>
                <p className="text-sm text-muted-foreground truncate">Launch sequencer</p>
              </div>
              <ArrowUpRight className="ml-auto w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </CardContent>
          </Card>
          
          <Card className="glass-panel bg-accent/5 border-accent/20 group hover:bg-accent/10 transition-all cursor-pointer" onClick={() => window.location.href = '/leak-tracing'}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/20 text-accent glow-accent shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-headline font-bold text-lg text-white truncate">Trace Leak</h4>
                <p className="text-sm text-muted-foreground truncate">Upload evidence</p>
              </div>
              <ArrowUpRight className="ml-auto w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
            </CardContent>
          </Card>

          <Card className="glass-panel bg-white/5 border-white/10 group hover:bg-white/10 transition-all cursor-pointer" onClick={() => window.location.href = '/audit-vault'}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/10 text-white shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="font-headline font-bold text-lg text-white truncate">Audit Logs</h4>
                <p className="text-sm text-muted-foreground truncate">Immutable ledger</p>
              </div>
              <ArrowUpRight className="ml-auto w-5 h-5 text-muted-foreground group-hover:text-white transition-colors shrink-0" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
