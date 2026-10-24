import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiClient } from "@/lib/api-client";
import { getDemoProject } from "@repolens/shared";
import {
  FolderGit2,
  GitCommit,
  Star,
  Layers,
  ArrowRight,
  Plus,
  Loader2,
} from "lucide-react";

export function ProjectsListPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Gather local projects
    const localListJson = localStorage.getItem("repolens_recent_projects");
    const localList = localListJson ? JSON.parse(localListJson) : [];

    // Always include Demo project
    const demo = getDemoProject();
    const demoEntry = {
      id: demo.id,
      name: demo.name,
      owner: demo.owner,
      repo: demo.repo,
      commitSha: demo.commitSha,
      metadata: demo.metadata,
      graph: demo.graph,
      createdAt: demo.createdAt,
    };

    ApiClient.listProjects()
      .then((data) => {
        const serverProjects = data.projects || [];
        const map = new Map<string, any>();
        map.set(demoEntry.id, demoEntry);
        for (const p of localList) map.set(p.id, p);
        for (const p of serverProjects) map.set(p.id, p);
        setProjects(Array.from(map.values()));
        setIsLoading(false);
      })
      .catch(() => {
        const map = new Map<string, any>();
        map.set(demoEntry.id, demoEntry);
        for (const p of localList) map.set(p.id, p);
        setProjects(Array.from(map.values()));
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-950 p-6 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-blue-400" />
            Saved & Analyzed Repositories
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access precomputed AST knowledge graphs and chat history.
          </p>
        </div>

        <Link
          to="/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Analyze New Repo</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-slate-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-500" />
          Loading saved repositories...
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400">
          <p className="text-sm mb-4">No analyzed repositories found yet.</p>
          <Link
            to="/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium"
          >
            Analyze Your First Repo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-semibold text-blue-400 truncate">
                    {p.owner}/{p.repo}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">
                    <GitCommit className="w-2.5 h-2.5 inline mr-1 text-slate-400" />
                    {p.commitSha ? p.commitSha.slice(0, 7) : "main"}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-200 mb-1">{p.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                  {p.metadata?.description || "Repository knowledge graph and source index."}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    {p.graph?.nodes?.length || 0} nodes
                  </span>
                  {p.metadata?.stars !== undefined && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      {p.metadata.stars}
                    </span>
                  )}
                </div>

                <Link
                  to={`/project/${p.id}`}
                  className="px-3 py-1.5 rounded bg-slate-800 group-hover:bg-blue-600 text-slate-200 group-hover:text-white transition-colors flex items-center gap-1 font-medium"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
