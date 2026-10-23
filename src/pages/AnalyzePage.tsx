import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ApiClient, type InspectResponse } from "@/lib/api-client";
import { useRepoStore } from "@/stores/repo-store";
import { ClientAnalyzer } from "@/services/client-analyzer";
import { GitHubClient } from "@repolens/github-ingestion";
import {
  GitBranch,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ArrowRight,
  Sparkles,
  Key,
} from "lucide-react";

export function AnalyzePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { byokKeys, activeProvider, openApiKeyModal } = useRepoStore();
  const hasKey = !!byokKeys[activeProvider];

  const [repoUrl, setRepoUrl] = useState(searchParams.get("repo") || "");
  const [maxFiles, setMaxFiles] = useState(150);

  // States: 'idle' | 'inspecting' | 'ready' | 'analyzing' | 'done' | 'error'
  const [status, setStatus] = useState<"idle" | "inspecting" | "ready" | "analyzing" | "done" | "error">("idle");
  const [inspectData, setInspectData] = useState<InspectResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Progress tracking
  const [progressStage, setProgressStage] = useState("Initializing analysis pipeline...");
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    const initialRepo = searchParams.get("repo");
    if (initialRepo && status === "idle") {
      handleInspect(initialRepo);
    }
  }, [searchParams]);

  const handleInspect = async (urlToInspect = repoUrl) => {
    if (!urlToInspect.trim()) return;
    setStatus("inspecting");
    setErrorMessage(null);

    try {
      const data = await ApiClient.inspectRepo(urlToInspect.trim());
      setInspectData(data);
      setStatus("ready");
    } catch (err: any) {
      try {
        const client = new GitHubClient();
        const meta = await client.resolveRepository(urlToInspect.trim());
        const tree = await client.fetchFilteredTree(meta, { maxFiles: 100 });
        setInspectData({
          metadata: meta,
          totalEligibleFiles: tree.length,
          filePreview: tree.slice(0, 15).map((t) => t.path),
        });
        setStatus("ready");
      } catch (clientErr: any) {
        setErrorMessage(clientErr.message || err.message || "Failed to inspect repository.");
        setStatus("error");
      }
    }
  };

  const handleStartAnalysis = async () => {
    if (!repoUrl.trim()) return;
    setStatus("analyzing");
    setProgressPercent(10);
    setProgressStage("Connecting to GitHub...");

    try {
      // 1. Run direct client analysis (instant, zero Vercel Lambda limits)
      const result = await ClientAnalyzer.analyze(
        repoUrl.trim(),
        maxFiles,
        (progress, stage) => {
          setProgressPercent(progress);
          setProgressStage(stage);
        }
      );

      useRepoStore
        .getState()
        .setProjectData(result.projectId, result.graph, result.metadata, result.files, result.chunks);

      setProgressPercent(100);
      setProgressStage("Analysis completed successfully!");
      setTimeout(() => {
        navigate(`/project/${result.projectId}`);
      }, 300);
      return;
    } catch (clientErr: any) {
      console.warn("Client analysis fallback to server API:", clientErr);

      // 2. Server API fallback if client encounters an issue
      try {
        const res = await ApiClient.analyzeRepo(repoUrl.trim(), maxFiles);

        if (res.status === "completed") {
          setProgressPercent(100);
          setProgressStage("Analysis completed successfully!");
          if (res.graph && res.metadata) {
            useRepoStore.getState().setProjectData(res.projectId, res.graph, res.metadata);
          }
          setTimeout(() => {
            navigate(`/project/${res.projectId}`);
          }, 300);
          return;
        }

        // If job returned with progress, poll status
        const pollInterval = setInterval(async () => {
          try {
            const job = await ApiClient.getJobStatus(res.jobId);
            setProgressPercent(job.progress);
            setProgressStage(job.currentStage);

            if (job.status === "completed") {
              clearInterval(pollInterval);
              navigate(`/project/${res.projectId}`);
            } else if (job.status === "failed") {
              clearInterval(pollInterval);
              setErrorMessage(job.errorMessage || "Analysis job failed.");
              setStatus("error");
            }
          } catch {
            // Retry next tick
          }
        }, 1000);
      } catch (err: any) {
        setErrorMessage(clientErr.message || err.message || "Repository analysis failed.");
        setStatus("error");
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-950 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Analyze Public GitHub Repository</h1>
            <p className="text-xs text-slate-400">
              Input a repository URL to generate its AST knowledge graph and grounded Q&A index.
            </p>
          </div>
        </div>

        {/* API Key Status Notice */}
        <div className="mb-5 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Key className={`w-4 h-4 ${hasKey ? "text-emerald-400" : "text-amber-400"}`} />
            <span className="text-slate-300">
              {hasKey
                ? "AI API Key configured via browser storage."
                : "No server .env required. Enter your free Gemini key to enable AI Q&A."}
            </span>
          </div>
          <button
            type="button"
            onClick={openApiKeyModal}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors shrink-0 ${
              hasKey
                ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {hasKey ? "Change Key" : "Set API Key"}
          </button>
        </div>

        {/* URL Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              GitHub Repository URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repository"
                disabled={status === "analyzing"}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => handleInspect()}
                disabled={status === "analyzing" || status === "inspecting" || !repoUrl.trim()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                {status === "inspecting" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Inspecting...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Inspected Preview Card */}
          {inspectData && status !== "analyzing" && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200">
                  {inspectData.metadata.owner}/{inspectData.metadata.repo}
                </span>
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                  {inspectData.metadata.commitSha.slice(0, 7)}
                </span>
              </div>

              <p className="text-xs text-slate-400">
                {inspectData.metadata.description || "No repository description provided."}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-400 border-t border-slate-900 pt-2.5">
                <span>Branch: <b className="text-slate-300">{inspectData.metadata.defaultBranch}</b></span>
                <span>Eligible files: <b className="text-slate-300">{inspectData.totalEligibleFiles}</b></span>
                <span>Language: <b className="text-blue-400">{inspectData.metadata.primaryLanguage}</b></span>
              </div>

              {/* Slider for bounded batch size */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Files to analyze (Bounded Serverless limit):</span>
                  <span className="font-mono text-blue-400">{maxFiles} files</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max={Math.min(500, inspectData.totalEligibleFiles)}
                  value={maxFiles}
                  onChange={(e) => setMaxFiles(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleStartAnalysis}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-600/30"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Knowledge Graph Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Analysis In Progress Card */}
          {status === "analyzing" && (
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Processing Repository</h3>
                <p className="text-xs text-slate-400 mt-1">{progressStage}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-slate-500">{progressPercent}% complete</div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
