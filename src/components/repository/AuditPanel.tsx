import React, { useState } from "react";
import { useRepoStore } from "@/stores/repo-store";
import type { AuditCategory, AuditSeverity, AuditItem } from "@repolens/analysis-adapter";
import {
  ShieldAlert,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  ListTodo,
  FileCode,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Loader2,
  Bot,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AuditPanel({ onNavigateToFile }: { onNavigateToFile?: (path: string, line: number) => void }) {
  const navigate = useNavigate();
  const {
    projectId,
    auditReport,
    isAuditing,
    runAudit,
    loadFile,
    activeProvider,
    sendChatMessage,
  } = useRepoStore();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [useAiSummary, setUseAiSummary] = useState(false);

  if (isAuditing && !auditReport) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-950 p-8 text-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <h3 className="text-sm font-semibold text-slate-200">Auditing Repository Files...</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Scanning source code, deployment manifests, configuration files, and checklists for potential bugs and risks.
        </p>
      </div>
    );
  }

  if (!auditReport) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-950 p-8 text-center">
        <ShieldCheck className="w-10 h-10 text-slate-600 mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">No Audit Run Yet</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4 max-w-sm">
          Run an automated code and deployment audit across all files in this repository.
        </p>
        <button
          onClick={() => runAudit(projectId || undefined, useAiSummary)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Run Repository Audit</span>
        </button>
      </div>
    );
  }

  const { summary, items, passedChecks } = auditReport;

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedCategory === "all") return true;
    return item.category === selectedCategory;
  });

  const getSeverityBadge = (sev: AuditSeverity) => {
    switch (sev) {
      case "high":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-950/80 text-rose-400 border border-rose-800/80 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            High
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-400 border border-amber-800/80 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Medium
          </span>
        );
      case "low":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-950/80 text-blue-400 border border-blue-800/80 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Low
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Info
          </span>
        );
    }
  };

  const handleItemClick = (filePath: string, line: number) => {
    loadFile(filePath, [line, line + 10]);
    if (onNavigateToFile) {
      onNavigateToFile(filePath, line);
    }
  };

  const handleAskAiAboutIssue = (item: AuditItem) => {
    if (!projectId) return;
    const prompt = `Can you analyze this issue found in file ${item.filePath} at line ${item.line} and propose a direct code fix?\n\nIssue: ${item.title}\nDescription: ${item.description}\nSnippet: ${item.snippet || "N/A"}`;
    sendChatMessage(prompt);
    navigate(`/project/${projectId}/chat`);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Audit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-400" />
            <span>Repository Health & Code Audit</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Static analysis of source code, deployment manifests, security boundaries, and pending tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] text-slate-400 flex items-center gap-1.5 cursor-pointer bg-slate-900 border border-slate-800 px-2 py-1.5 rounded-lg hover:border-slate-700">
            <input
              type="checkbox"
              checked={useAiSummary}
              onChange={(e) => setUseAiSummary(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
            />
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>AI Executive Summary</span>
          </label>

          <button
            onClick={() => runAudit(projectId || undefined, useAiSummary)}
            disabled={isAuditing}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-600/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? "animate-spin" : ""}`} />
            <span>{isAuditing ? "Auditing..." : "Re-run Audit"}</span>
          </button>
        </div>
      </div>

      {/* AI Executive Summary Callout (if present) */}
      {(auditReport as any).aiExecutiveSummary && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/30 text-xs text-slate-200 space-y-1.5 shadow-lg">
          <div className="flex items-center gap-2 font-semibold text-blue-400">
            <Bot className="w-4 h-4" />
            <span>AI Executive Summary ({activeProvider})</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {(auditReport as any).aiExecutiveSummary}
          </p>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {/* Health Score & Grade */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-medium">Health Score</span>
            <div className="text-xl font-bold text-slate-100 mt-0.5">
              {summary.codeHealthScore ?? 100}
              <span className="text-xs font-normal text-slate-500">/100</span>
            </div>
          </div>
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm border ${
              summary.healthGrade === "A+" || summary.healthGrade === "A"
                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400"
                : summary.healthGrade === "B"
                ? "bg-blue-950/60 border-blue-500/40 text-blue-400"
                : summary.healthGrade === "C"
                ? "bg-amber-950/60 border-amber-500/40 text-amber-400"
                : "bg-rose-950/60 border-rose-500/40 text-rose-400"
            }`}
          >
            {summary.healthGrade || "A"}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium">Total Issues</span>
          <div className="text-xl font-bold text-slate-100 mt-1">{summary.totalIssues}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {summary.totalFilesAnalyzed ?? 0} files • {summary.totalLinesOfCode ?? 0} loc
          </div>
        </div>

        <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40">
          <span className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            High Severity
          </span>
          <div className="text-xl font-bold text-rose-300 mt-1">{summary.high}</div>
        </div>

        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40">
          <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Medium
          </span>
          <div className="text-xl font-bold text-amber-300 mt-1">{summary.medium}</div>
        </div>

        <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-900/40">
          <span className="text-[11px] text-blue-400 font-medium flex items-center gap-1">
            <ListTodo className="w-3 h-3" />
            Checklists
          </span>
          <div className="text-xl font-bold text-blue-300 mt-1">{auditReport.categories.checklist.length}</div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Passed Checks
          </span>
          <div className="text-xl font-bold text-emerald-300 mt-1">{passedChecks.length}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            selectedCategory === "all"
              ? "bg-slate-800 text-blue-400 font-medium"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          All Issues ({items.length})
        </button>
        <button
          onClick={() => setSelectedCategory("checklist")}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            selectedCategory === "checklist"
              ? "bg-slate-800 text-blue-400 font-medium"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Checklists & Tasks ({auditReport.categories.checklist.length})
        </button>
        <button
          onClick={() => setSelectedCategory("env")}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            selectedCategory === "env"
              ? "bg-slate-800 text-blue-400 font-medium"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Env Variables ({auditReport.categories.env?.length || 0})
        </button>
        <button
          onClick={() => setSelectedCategory("config")}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            selectedCategory === "config"
              ? "bg-slate-800 text-blue-400 font-medium"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Config & Placeholders ({auditReport.categories.config.length})
        </button>
        <button
          onClick={() => setSelectedCategory("deployment")}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            selectedCategory === "deployment"
              ? "bg-slate-800 text-blue-400 font-medium"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Deployment & SPA ({auditReport.categories.deployment.length})
        </button>
        <button
          onClick={() => setSelectedCategory("architecture")}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            selectedCategory === "architecture"
              ? "bg-slate-800 text-blue-400 font-medium"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Architecture & Monoliths ({auditReport.categories.architecture?.length || 0})
        </button>
        <button
          onClick={() => setSelectedCategory("security")}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            selectedCategory === "security"
              ? "bg-slate-800 text-blue-400 font-medium"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Security ({auditReport.categories.security.length})
        </button>
        <button
          onClick={() => setSelectedCategory("bugs")}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            selectedCategory === "bugs"
              ? "bg-slate-800 text-blue-400 font-medium"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Code & Logic ({auditReport.categories.bugs.length})
        </button>
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-200">No issues found in this category.</p>
            <p className="text-slate-500 mt-1">This section of the codebase conforms to all configured checks.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:border-slate-700/80 transition-all space-y-2.5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(item.severity)}
                    <h3 className="text-sm font-semibold text-slate-200">{item.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                </div>

                {/* Jump to File Button */}
                <button
                  onClick={() => handleItemClick(item.filePath, item.line)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors shrink-0"
                  title="View file at this line in Source Editor"
                >
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {item.filePath}:{item.line}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-500" />
                </button>
              </div>

              {/* Code Snippet Preview */}
              {item.snippet && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90 font-mono text-[11px] text-slate-300 overflow-x-auto">
                  <span className="text-slate-600 select-none mr-2">{item.line} |</span>
                  <span>{item.snippet}</span>
                </div>
              )}

              {/* Suggestion & Ask AI Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px]">
                {item.suggestion ? (
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <span className="font-semibold text-blue-400">Recommendation:</span>
                    <span>{item.suggestion}</span>
                  </div>
                ) : (
                  <div />
                )}

                <button
                  onClick={() => handleAskAiAboutIssue(item)}
                  className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors ml-auto"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Ask AI to Fix</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Passed Checks Section */}
      {passedChecks.length > 0 && (
        <div className="pt-4 border-t border-slate-900 space-y-2">
          <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Passed Verifications ({passedChecks.length})</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
            {passedChecks.map((chk, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/30 border border-slate-800/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{chk}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
