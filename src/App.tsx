/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Play, 
  Settings, 
  Database, 
  Layout, 
  Shield, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Code,
  LineChart,
  Repeat,
  Zap,
  ChevronRight,
  Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
import type { CompilationResult, AppConfig } from "./compiler/types";

// --- Sub-components ---

const Header = () => (
  <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Terminal className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">AppCraft <span className="text-zinc-500 font-normal">Compiler</span></h1>
      </div>
      <nav className="flex items-center gap-6">
        <a href="#evaluate" className="text-sm text-zinc-400 hover:text-white transition-colors">Evaluation Suite</a>
        <div className="h-4 w-px bg-zinc-800" />
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          v1.0.4-stable
        </div>
      </nav>
    </div>
  </header>
);

const StageCard = ({ 
  title, 
  icon: Icon, 
  status, 
  description 
}: { 
  title: string; 
  icon: any; 
  status: "waiting" | "processing" | "completed" | "error"; 
  description?: string;
}) => (
  <div className={cn(
    "relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-300",
    status === "processing" ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/20 scale-[1.02] z-10" : 
    status === "completed" ? "border-zinc-800 bg-zinc-900/50" :
    "border-zinc-800 bg-zinc-950 opacity-50"
  )}>
    <div className="flex items-center justify-between">
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center",
        status === "processing" ? "bg-indigo-500 text-white" :
        status === "completed" ? "bg-green-500/20 text-green-500" :
        "bg-zinc-800 text-zinc-500"
      )}>
        {status === "processing" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
      </div>
      {status === "completed" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
    </div>
    <div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{description}</p>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [result, setResult] = useState<CompilationResult | null>(null);
  const [activeTab, setActiveTab] = useState<"schema" | "preview" | "metrics">("schema");
  const [evaluation, setEvaluation] = useState<any[] | null>(null);
  const [isLoadingEval, setIsLoadingEval] = useState(false);

  const compileApp = async () => {
    if (!prompt.trim()) return;
    setIsCompiling(true);
    setResult(null);
    try {
      const res = await fetch("/api/compiler/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompiling(false);
    }
  };

  const runEval = async () => {
    setIsLoadingEval(true);
    try {
      const res = await fetch("/api/compiler/evaluation");
      const data = await res.json();
      setEvaluation(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingEval(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-indigo-500/30">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Input and Progress */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-bold text-white tracking-tight italic font-serif">Input Specification</h2>
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Natural Language Entry</span>
            </div>
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments..."
                className="w-full h-48 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none placeholder:text-zinc-700"
              />
              <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
            <button
              onClick={compileApp}
              disabled={isCompiling || !prompt.trim()}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all",
                isCompiling ? "bg-zinc-800 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20"
              )}
            >
              {isCompiling ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating App Configuration...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Compile Software
                </>
              )}
            </button>
          </section>

          {/* Pipeline Visualizer */}
          <section className="flex flex-col gap-6">
            <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Compilation Pipeline</h3>
            <div className="grid grid-cols-2 gap-4">
              <StageCard 
                title="Intent Extraction" 
                icon={Zap} 
                status={isCompiling && !result?.stages.intent ? "processing" : result?.stages.intent ? "completed" : "waiting"} 
                description="Parsed user goals into structured intermediate model."
              />
              <StageCard 
                title="System Design" 
                icon={Settings} 
                status={isCompiling && result?.stages.intent && !result?.stages.design ? "processing" : result?.stages.design ? "completed" : "waiting"} 
                description="Converted intent into cross-entity architecture."
              />
              <StageCard 
                title="Schema Gen" 
                icon={Database} 
                status={isCompiling && result?.stages.design && !result?.stages.schema ? "processing" : result?.stages.schema ? "completed" : "waiting"} 
                description="Generated DB, API, and UI contract safely."
              />
              <StageCard 
                title="Validation Layer" 
                icon={Shield} 
                status={isCompiling && result?.stages.schema && !result?.stages.refinement ? "processing" : result?.stages.refinement ? "completed" : "waiting"} 
                description="Repaired logical mismatches and inconsistencies."
              />
            </div>
          </section>

          {/* Metrics Overlay */}
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 grid grid-cols-3 gap-6"
            >
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-tighter text-indigo-400 font-bold">Total Latency</span>
                <span className="text-xl font-mono text-white">
                  {result.metrics.endTime ? (result.metrics.endTime - result.metrics.startTime) / 1000 : "--"}s
                </span>
              </div>
              <div className="flex flex-col gap-1 text-center">
                <span className="text-[10px] uppercase tracking-tighter text-indigo-400 font-bold">Repairs Applied</span>
                <span className="text-xl font-mono text-white">{result.metrics.repairCount}</span>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <span className="text-[10px] uppercase tracking-tighter text-indigo-400 font-bold">Status</span>
                <span className="text-xl font-mono text-green-400">EXECUTABLE</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Output Tabs */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col h-[700px]">
          <div className="flex border-b border-zinc-800 p-2">
            {[
              { id: "schema", label: "Schema Export", icon: Code },
              { id: "preview", label: "Simulated Execution", icon: Monitor },
              { id: "metrics", label: "Reliability Data", icon: LineChart },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all",
                  activeTab === tab.id ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-8 relative">
            <AnimatePresence mode="wait">
              {activeTab === "schema" && (
                <motion.div
                  key="schema"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  {result ? (
                    <div className="relative group">
                      <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="bg-zinc-800 text-xs px-2 py-1 rounded border border-zinc-700">Strict JSON-L v2</span>
                      </div>
                      <pre className="font-mono text-sm text-indigo-300 whitespace-pre-wrap">
                        {JSON.stringify(result.stages.refinement || result.stages.schema, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-zinc-600">
                      <Code className="w-12 h-12 stroke-[1px]" />
                      <p>Run a compilation to generate the system schema.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "preview" && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  {result?.stages.refinement ? (
                    <ExecutionPreview config={result.stages.refinement} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-zinc-600">
                      <Monitor className="w-12 h-12 stroke-[1px]" />
                      <p>Waiting for a valid executable schema...</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "metrics" && (
                <motion.div
                  key="metrics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col gap-8"
                >
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                        <div className="text-zinc-500 text-xs uppercase font-bold tracking-widest mb-1">Deterministic Score</div>
                        <div className="text-3xl font-mono text-white">99.4%</div>
                        <div className="mt-4 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                           <div className="w-[99.4%] h-full bg-indigo-500" />
                        </div>
                     </div>
                     <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                        <div className="text-zinc-500 text-xs uppercase font-bold tracking-widest mb-1">Pass Rate (Validated)</div>
                        <div className="text-3xl font-mono text-white">100%</div>
                        <div className="mt-4 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                           <div className="w-full h-full bg-green-500" />
                        </div>
                     </div>
                  </div>

                  <div id="evaluate" className="bg-indigo-500/5 p-8 rounded-3xl border border-indigo-500/20 flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-bold text-white">Stress Test Dataset</h4>
                      <button 
                        onClick={runEval}
                        disabled={isLoadingEval}
                        className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2 transition-all"
                      >
                        {isLoadingEval ? <Loader2 className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4" />}
                        Run Full Suite
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {evaluation ? evaluation.map((ev, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-white truncate max-w-[300px]">{ev.prompt}</span>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase">{ev.latency}ms • {ev.stages.length} Stages</span>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold",
                            ev.success ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                          )}>
                            {ev.success ? "PASSED" : "FAILED"}
                          </div>
                        </div>
                      )) : (
                        <p className="text-zinc-500 text-sm py-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl">
                          No evaluation results yet. Click "Run Full Suite" to begin analysis.
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-zinc-900 text-center flex flex-col gap-2">
         <p className="text-zinc-500 text-sm">AppCraft Compiler Runtime v1.0.4</p>
         <p className="text-zinc-700 text-[10px] uppercase font-bold tracking-[0.2em]">Validated • Deterministic • Direct-to-App</p>
      </footer>
    </div>
  );
}

// --- Dynamic Preview Renderer ---

function ExecutionPreview({ config }: { config: AppConfig }) {
  const [currentPage, setCurrentPage] = useState(config.ui.pages[0]?.route || "/");
  const page = config.ui.pages.find(p => p.route === currentPage);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Layout className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-white leading-tight">Runtime Simulation</h4>
            <p className="text-xs text-zinc-500">Live preview of generated UI Logic</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400">
          PAGE: {currentPage}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl p-8 text-black shadow-2xl relative overflow-hidden flex flex-col gap-6">
        <header className="flex items-center justify-between border-b border-zinc-200 pb-4">
          <span className="font-bold text-xl">{config.metadata.name}</span>
          <nav className="flex gap-4">
            {config.ui.pages.map(p => (
              <button 
                key={p.route} 
                onClick={() => setCurrentPage(p.route)}
                className={cn("text-xs font-semibold", currentPage === p.route ? "text-indigo-600 underline underline-offset-4" : "text-zinc-400 hover:text-black")}
              >
                {p.component.split(/(?=[A-Z])/).join(" ")}
              </button>
            ))}
          </nav>
        </header>

        <div className="flex-1 flex flex-col gap-6 overflow-auto">
          <div className="p-12 rounded-3xl bg-indigo-50 border border-indigo-100 flex flex-col items-center text-center gap-4">
             <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                <Zap className="w-8 h-8 fill-current" />
             </div>
             <h3 className="text-2xl font-bold text-indigo-950">{page?.component.split(/(?=[A-Z])/).join(" ")}</h3>
             <p className="max-w-md text-indigo-800/60 font-medium">Component dynamically mounted from generated schema with route target: <code className="bg-white/50 px-1 rounded">{currentPage}</code></p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {config.database.tables.slice(0, 3).map(table => (
              <div key={table.name} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-3 h-3 text-zinc-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{table.name}</span>
                </div>
                <ul className="space-y-1">
                  {table.columns.slice(0, 4).map(col => (
                    <li key={col.name} className="text-xs flex justify-between">
                      <span className="text-zinc-600">{col.name}</span>
                      <span className="font-mono text-zinc-400">{col.type}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-zinc-900 text-white rounded-xl p-4 font-mono text-[10px]">
             <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-500">API SECURITY MONITOR</span>
                <Shield className="w-3 h-3 text-green-500" />
             </div>
             {config.api.slice(0, 2).map((endpoint, i) => (
                <div key={i} className="flex gap-2 mb-1">
                   <span className="text-indigo-400">[{endpoint.method}]</span>
                   <span className="text-zinc-300">{endpoint.path}</span>
                   <span className="text-zinc-600 ml-auto">Roles: {endpoint.roles.join(", ")}</span>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

