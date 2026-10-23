import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  GitBranch,
  Layers,
  Settings,
  Sparkles,
  FolderGit2,
  Shield,
  Key,
  Cpu,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useRepoStore } from "@/stores/repo-store";

export function Navbar() {
  const location = useLocation();
  const {
    byokKeys,
    activeProvider,
    activeModel,
    setProvider,
    setModel,
    availableModels,
    isFetchingModels,
    fetchModelsForProvider,
    openApiKeyModal,
  } = useRepoStore();

  const hasKey = !!byokKeys[activeProvider];
  const currentModels = availableModels[activeProvider] || [];

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 flex items-center justify-between z-50 sticky top-0">
      <div className="flex items-center gap-5">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-100 tracking-tight text-base">RepoLens</span>
            <span className="text-blue-500 font-mono text-xs ml-1 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">AI</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
          <Link
            to="/new"
            className={`px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 text-xs ${
              isActive("/new")
                ? "bg-slate-800 text-blue-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            Analyze Repo
          </Link>
          <Link
            to="/projects"
            className={`px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 text-xs ${
              isActive("/projects")
                ? "bg-slate-800 text-blue-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            Projects
          </Link>
          <Link
            to="/project/demo-express-react-app"
            className={`px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 text-xs ${
              location.pathname.includes("demo-express-react-app")
                ? "bg-slate-800 text-cyan-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Demo
          </Link>
        </nav>
      </div>

      {/* Center/Right: Dual Dropdowns + API Key Control */}
      <div className="flex items-center gap-2">
        {/* Dropdown 1: AI Provider */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2 py-1 text-xs shadow-inner">
          <Cpu className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <select
            value={activeProvider}
            onChange={(e) => setProvider(e.target.value)}
            className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
            title="Dropdown 1: Select AI Provider"
          >
            <option value="gemini" className="bg-slate-900 text-slate-100">Gemini (Free Tier)</option>
            <option value="openai" className="bg-slate-900 text-slate-100">OpenAI</option>
            <option value="anthropic" className="bg-slate-900 text-slate-100">Anthropic Claude</option>
            <option value="ollama" className="bg-slate-900 text-slate-100">Ollama (Local)</option>
          </select>
        </div>

        {/* Dropdown 2: Model list from API key */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-lg px-2 py-1 text-xs shadow-inner max-w-[200px] sm:max-w-[240px]">
          {isFetchingModels ? (
            <Loader2 className="w-3 h-3 text-cyan-400 animate-spin shrink-0" />
          ) : (
            <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
          )}
          <select
            value={activeModel}
            onChange={(e) => setModel(e.target.value)}
            disabled={isFetchingModels}
            className="bg-transparent text-slate-200 text-xs font-mono focus:outline-none cursor-pointer truncate w-full"
            title={`Dropdown 2: Live Model List from API Key (${currentModels.length} models available)`}
          >
            {currentModels.map((m) => (
              <option key={m} value={m} className="bg-slate-900 text-slate-100">
                {m}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => fetchModelsForProvider(activeProvider)}
            disabled={isFetchingModels}
            className="text-slate-400 hover:text-cyan-300 p-0.5 rounded transition-colors"
            title="Refresh model list from API key"
          >
            <RefreshCw className={`w-3 h-3 ${isFetchingModels ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* API Key Modal Button */}
        <button
          onClick={openApiKeyModal}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border shadow-sm ${
            hasKey
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40"
              : "bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/40 animate-pulse"
          }`}
          title="Configure AI API Key (No .env needed)"
        >
          <Key className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {hasKey ? "Key Active" : "Set API Key"}
          </span>
        </button>

        <Link
          to="/settings/ai"
          className={`p-1.5 rounded-lg transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-900 ${
            isActive("/settings/ai") ? "bg-slate-800 text-blue-400" : ""
          }`}
          title="AI Provider Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
        <Link
          to="/settings/privacy"
          className={`p-1.5 rounded-lg transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-900 ${
            isActive("/settings/privacy") ? "bg-slate-800 text-blue-400" : ""
          }`}
          title="Privacy & Ingestion Safety"
        >
          <Shield className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}
