import React from "react";
import { ShieldCheck, Lock, EyeOff, Server, AlertTriangle } from "lucide-react";

export function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-950 p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          Privacy & Ingestion Security
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Detailed transparency on how RepoLens AI processes, analyzes, and isolates repository data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Lock className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-slate-200">Zero Code Execution</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            All repository source code is treated as completely untrusted input. Analysis is strictly
            structural and static (AST parsing, regex pattern matching, and lexical tokenization).
            RepoLens AI never executes code, scripts, or build commands from analyzed repositories.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <EyeOff className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-slate-200">Secret & Credential Redaction</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Files matching known secret patterns (such as <code>.env*</code>, <code>*.pem</code>,{" "}
            <code>*.key</code>, <code>id_rsa</code>, <code>credentials.json</code>, and API tokens)
            are automatically excluded before ingestion and are never parsed or sent to AI models.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Server className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-slate-200">SSRF & Network Safety</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Ingestion requests are strictly pinned to allowlisted hosts (<code>api.github.com</code> and{" "}
            <code>raw.githubusercontent.com</code>). Outbound requests to private IP ranges, localhost,
            link-local addresses, or cloud metadata services (e.g. <code>169.254.169.254</code>) are
            strictly rejected.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold text-slate-200">Data Retention & Ephemeral Storage</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            By default, repository analyses are held in ephemeral memory or your configured private
            PostgreSQL instance. Bring Your Own Key (BYOK) credentials are stored only in memory or
            sessionStorage and are never written to permanent disk storage or server logs.
          </p>
        </div>
      </div>
    </div>
  );
}
