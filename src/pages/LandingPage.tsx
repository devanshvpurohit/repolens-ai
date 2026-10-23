import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  GitBranch,
  Search,
  Network,
  ShieldCheck,
  Cpu,
  ArrowRight,
  CheckCircle2,
  Lock,
  Layers,
  Code2,
  FileCode,
} from "lucide-react";

export function LandingPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const navigate = useNavigate();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    navigate(`/new?repo=${encodeURIComponent(repoUrl.trim())}`);
  };

  const sampleRepos = [
    { label: "Express.js", url: "https://github.com/expressjs/express" },
    { label: "Flask (Python)", url: "https://github.com/pallets/flask" },
    { label: "Fastify", url: "https://github.com/fastify/fastify" },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col bg-slate-950">
      {/* Hero Section */}
      <section className="relative px-4 pt-16 pb-20 md:pt-24 md:pb-28 max-w-5xl mx-auto text-center">
        {/* Glow background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Vercel-Native Codebase Intelligence • Powered by Gemini Free Tier</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-100 tracking-tight leading-tight">
          Understand any GitHub repository <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
            in seconds with interactive graphs
          </span>
        </h1>

        <p className="mt-5 text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          RepoLens AI converts repositories into structured AST knowledge graphs, architecture layers,
          and grounded Q&A with verified line-level source citations.
        </p>

        {/* Input Form */}
        <form onSubmit={handleAnalyze} className="mt-8 max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl focus-within:border-blue-500/80 transition-all">
            <div className="flex-1 flex items-center px-3 gap-2">
              <GitBranch className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 shrink-0"
            >
              <span>Analyze Repo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick example chips */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span>Try an example:</span>
            {sampleRepos.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setRepoUrl(r.url)}
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-slate-200 transition-colors"
              >
                {r.label}
              </button>
            ))}
            <Link
              to="/project/demo-express-react-app"
              className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 hover:border-cyan-700 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Launch Fixture Demo
            </Link>
          </div>
        </form>
      </section>

      {/* Feature Highlights Grid */}
      <section className="px-4 py-16 border-t border-slate-900 bg-slate-950/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-100">Engineered for Deep Code Comprehension</h2>
            <p className="text-sm text-slate-400 mt-2">
              Combining deterministic AST parsing with bounded serverless analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-200 mb-2">Interactive Knowledge Graph</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visualizes files, classes, functions, and API endpoints with dependency relationships and architecture layers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                <FileCode className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-200 mb-2">Verified Line-Level Citations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every AI response is grounded via AST chunks. Click citations to jump directly to exact source lines in Monaco Editor.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-200 mb-2">Gemini Free Tier First</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Optimized for Gemini Flash free tier with token budgeting, backoff on 429 errors, and multi-provider BYOK support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ingestion & Safety Guarantee */}
      <section className="px-4 py-12 border-t border-slate-900 bg-slate-900/20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-1">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Zero Code Execution & SSRF Protected</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Repository code is strictly parsed statically and never executed. Secret files (.env, keys) are filtered out automatically.
              </p>
            </div>
          </div>
          <Link
            to="/settings/privacy"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium whitespace-nowrap flex items-center gap-1"
          >
            <span>Read Privacy Specs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
