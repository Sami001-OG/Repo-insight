import { useState } from "react";
import { Search, Github, Terminal, Map, Loader2, Info, ChevronRight, AlertCircle, Copy, Check, Cpu, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface RoadmapItem {
  phase: string;
  tasks: string[];
}

interface AnalysisResult {
  overview: string;
  buildGuide: string;
  equipment: string[];
  roadmap: RoadmapItem[];
  techStack: string[];
  difficulty: string;
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);

    // Format URL properly if user only typed owner/repo
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http") && formattedUrl.includes("/")) {
      formattedUrl = `https://github.com/${formattedUrl}`;
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl: formattedUrl }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze repository");
      }

      const data = await response.json();
      setResult(data);
      setUrl(formattedUrl); // Update input with formatted URL
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1F2937] font-sans selection:bg-[#2563EB] selection:text-white overflow-hidden relative">
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="p-4 lg:p-6 flex flex-col sm:flex-row items-center gap-4 justify-between border-b border-[#E0E2E6] bg-white">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 font-bold text-xl mr-2">
              <Github size={28} className="text-[#2563EB]" />
              <span className="hidden sm:inline-block">RepoInsight</span>
            </div>
            <form onSubmit={handleAnalyze} className="flex items-center gap-2 bg-white border border-[#E0E2E6] rounded-lg px-3 py-1.5 shadow-sm w-full sm:w-[400px] lg:w-[500px]">
              <Github className="text-[#6B7280] hidden xs:block ml-1" size={16} />
              <input 
                type="text" 
                placeholder="https://github.com/user/repository" 
                className="flex-1 border-none outline-none text-sm p-1 min-w-0"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white text-xs font-bold h-8 px-3 rounded flex-shrink-0 flex items-center gap-1.5 transition-all w-[140px] justify-center sm:w-auto"
              >
                {loading && <Loader2 className="animate-spin" size={14} />}
                <span className="hidden sm:inline">{loading ? "Analyzing..." : "Generate Blueprint"}</span>
                {!loading && <ChevronRight className="sm:hidden" size={16} />}
              </Button>
            </form>
          </div>
          {result && (
            <div className="text-[10px] sm:text-xs text-[#6B7280] truncate max-w-full">
              Analysis complete: <strong className="text-[#1F2937]">{url.split("/").pop()}</strong>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 flex items-center gap-3 rounded shadow-sm"
                >
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
                <Skeleton className="h-[240px] rounded-xl" />
                <Skeleton className="h-[240px] rounded-xl" />
                <Skeleton className="h-[400px] rounded-xl" />
                <Skeleton className="h-[400px] rounded-xl" />
              </div>
            ) : result ? (
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
                {/* Project Overview */}
                <Card className="border-[#E0E2E6] shadow-none rounded-xl overflow-hidden min-h-[240px] lg:h-[240px] flex flex-col">
                  <CardHeader className="p-5 pb-0">
                    <div className="flex items-center justify-between mb-4">
                      <CardTitle className="text-[12px] font-bold uppercase tracking-wider text-[#6B7280]">
                        Project Overview
                      </CardTitle>
                      <Badge className="bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#DBEAFE] border-none rounded text-[10px] px-2 py-0.5">
                        {result.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex-1 overflow-auto">
                    <p className="text-sm leading-relaxed text-[#1F2937] mb-4">
                      {result.overview}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.techStack?.map((tech, idx) => (
                        <span key={idx} className="bg-[#F1F5F9] text-[#2563EB] px-2 py-1 rounded text-[12px] font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Hardware & Infrastructure */}
                <Card className="border-[#E0E2E6] shadow-none rounded-xl overflow-hidden min-h-[240px] lg:h-[240px] flex flex-col">
                  <CardHeader className="p-5 pb-0">
                    <CardTitle className="text-[12px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Hardware & Infrastructure
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex-1 overflow-auto">
                    <div className="space-y-1">
                      {result.equipment?.map((item, idx) => (
                        <div key={idx} className="flex justify-between py-2 border-b border-[#F8F9FA] text-[13px]">
                          <span className="text-[#6B7280]">{item.split(":")[0]}</span>
                          <strong className="text-[#1F2937]">{item.split(":")[1] || "Required"}</strong>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Build & Initiation Guide */}
                <Card className="border-[#E0E2E6] shadow-none rounded-xl overflow-hidden">
                  <CardHeader className="p-5 pb-0">
                    <CardTitle className="text-[12px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Build & Initiation Guide
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-4">
                    <div className="space-y-6">
                      <div className="prose prose-sm max-w-none prose-pre:bg-[#1E1E1E] prose-pre:text-[#D4D4D4] prose-pre:p-3 prose-pre:rounded-lg prose-pre:text-[12px] prose-pre:font-mono overflow-x-auto">
                        <ReactMarkdown>{result.buildGuide}</ReactMarkdown>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Deployment Roadmap */}
                <Card className="border-[#E0E2E6] shadow-none rounded-xl overflow-hidden">
                  <CardHeader className="p-5 pb-0">
                    <CardTitle className="text-[12px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Deployment Roadmap
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-4">
                    <div className="timeline">
                      {result.roadmap?.map((item, idx) => (
                        <div key={idx} className="milestone">
                          <h4 className="text-[13px] font-bold text-[#1F2937]">{item.phase}</h4>
                          <p className="text-[11px] text-[#6B7280]">{item.tasks.join(", ")}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 lg:py-20">
                <div className="w-16 h-16 bg-[#F1F5F9] rounded-full flex items-center justify-center text-[#2563EB] mb-6">
                  <Github size={32} />
                </div>
                <h2 className="text-xl lg:text-2xl font-bold mb-2">Ready to Architect</h2>
                <p className="text-[#6B7280] max-w-md px-4">
                  Enter a GitHub repository URL above to generate a professional build blueprint and deployment roadmap.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
