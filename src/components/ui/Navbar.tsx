import React from "react";
import { Link, useLocation } from "react-router-dom";
import { GitBranch, Layers, MessageSquare, Settings, Sparkles, FolderGit2, Shield } from "lucide-react";

export function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 flex items-center justify-between z-50 sticky top-0">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-100 tracking-tight text-base">RepoLens</span>
            <span className="text-blue-500 font-mono text-xs ml-1 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">AI</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            to="/new"
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
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
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
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
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              location.pathname.includes("demo-express-react-app")
                ? "bg-slate-800 text-cyan-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Interactive Demo
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <Link
          to="/settings/ai"
          className={`p-2 rounded-lg transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-900 ${
            isActive("/settings/ai") ? "bg-slate-800 text-blue-400" : ""
          }`}
          title="AI Provider Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
        <Link
          to="/settings/privacy"
          className={`p-2 rounded-lg transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-900 ${
            isActive("/settings/privacy") ? "bg-slate-800 text-blue-400" : ""
          }`}
          title="Privacy & Ingestion Safety"
        >
          <Shield className="w-4 h-4" />
        </Link>
        <a
          href="https://github.com/Egonex-AI/Understand-Anything"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-md border border-slate-800 hover:border-slate-700 bg-slate-900/50 flex items-center gap-1.5 ml-2"
        >
          <span>Upstream</span>
        </a>
      </div>
    </header>
  );
}
