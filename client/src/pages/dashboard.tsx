import { useReports } from "@/hooks/use-reports";
import { Link } from "wouter";
import { Plus, Search, Calendar, FileText, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: reports, isLoading } = useReports();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReports = reports?.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.incidentType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Security Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage your incident reports and track security status.</p>
        </div>
        <Link href="/report/new">
          <Button size="lg" className="btn-primary-glow font-semibold gap-2">
            <Plus className="w-5 h-5" />
            New Incident Report
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-card/50 backdrop-blur-sm p-1 rounded-xl border border-border/50 shadow-sm flex items-center max-w-md">
        <Search className="w-5 h-5 text-muted-foreground ml-3" />
        <Input 
          placeholder="Search reports..." 
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : filteredReports?.length === 0 ? (
        <div className="text-center py-20 bg-card/30 rounded-3xl border border-border/50 border-dashed">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Reports Found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            You haven't created any incident reports yet. Use the "New Incident Report" button to get started.
          </p>
          <Link href="/report/new">
            <Button variant="outline">Start Report</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports?.map((report, idx) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Link href={`/report/${report.id}`}>
                <div className="group h-full bg-card hover:bg-card/80 border border-border/50 hover:border-primary/30 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 cursor-pointer flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-500/10 p-2 rounded-lg text-blue-500">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <Badge variant={report.status === "finalized" ? "default" : "secondary"} className="uppercase text-[10px] tracking-wider">
                      {report.status}
                    </Badge>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {report.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2 flex-1">
                    {report.rawDescription}
                  </p>
                  
                  {(report.structuredReport as any)?.guidance && (
                    <div className="mb-4 bg-orange-500/10 p-2 rounded-lg border border-orange-500/20">
                      <p className="text-[10px] font-bold uppercase text-orange-600 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Quick Response Ready
                      </p>
                      <p className="text-[11px] text-orange-700 dark:text-orange-400 line-clamp-1">
                        {((report.structuredReport as any).guidance.immediate[0])}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      {format(new Date(report.createdAt!), "MMM d, yyyy")}
                    </div>
                    <div className="text-primary text-xs font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Details <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
