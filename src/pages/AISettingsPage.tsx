import React, { useState, useEffect } from "react";
import { ApiClient } from "@/lib/api-client";
import { useRepoStore } from "@/stores/repo-store";
import {
  Cpu,
  Key,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Server,
  Zap,
} from "lucide-react";

export function AISettingsPage() {
  const { activeProvider, setProvider, byokKeys, setByokKey } = useRepoStore();

  const [providerList, setProviderList] = useState<any[]>([]);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; message: string }>>({});

  useEffect(() => {
    ApiClient.getProviderSettings().then((data) => {
      setProviderList(data.providers || []);
    });
  }, []);

  const handleTestConnection = async (providerId: string) => {
    setTestingProvider(providerId);
    try {
      const res = await ApiClient.testProvider(providerId, byokKeys[providerId]);
      setTestResult((prev) => ({
        ...prev,
        [providerId]: {
          ok: res.ok,
          message: res.message || (res.ok ? "Connection healthy" : "Connection failed"),
        },
      }));
    } catch (err: any) {
      setTestResult((prev) => ({
        ...prev,
        [providerId]: { ok: false, message: err.message },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-slate-950 p-6 md:p-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Cpu className="w-6 h-6 text-blue-400" />
          AI Provider Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure default AI models, manage BYOK credentials, and test connectivity.
        </p>
      </div>

      {/* Gemini Free Tier Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/30 mb-8 shadow-xl">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          Default Provider: Google Gemini API (Free Tier)
        </div>
        <h2 className="text-lg font-bold text-slate-100 mb-2">Zero-Cost Repository Intelligence</h2>
        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          RepoLens AI is pre-configured to utilize Google Gemini Flash (e.g. <code>gemini-2.5-flash</code>)
          within the Google AI Studio free tier. Deterministic AST parsing is performed beforehand so
          that AI tokens are reserved strictly for high-value question answering and semantic summaries.
        </p>
      </div>

      {/* Provider List */}
      <div className="space-y-4">
        {/* Gemini */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Google Gemini</h3>
                <span className="text-[11px] text-slate-400 font-mono">gemini-2.5-flash / gemini-1.5-flash</span>
              </div>
            </div>

            <button
              onClick={() => handleTestConnection("gemini")}
              disabled={testingProvider === "gemini"}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {testingProvider === "gemini" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Test Connection"}
            </button>
          </div>

          <div className="pt-2">
            <label className="block text-xs text-slate-400 mb-1">
              Custom Gemini API Key (Optional BYOK Override):
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={byokKeys["gemini"] || ""}
              onChange={(e) => setByokKey("gemini", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {testResult["gemini"] && (
            <div
              className={`p-2.5 rounded text-xs flex items-center gap-2 ${
                testResult["gemini"].ok
                  ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/60"
                  : "bg-rose-950/40 text-rose-300 border border-rose-800/60"
              }`}
            >
              {testResult["gemini"].ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{testResult["gemini"].message}</span>
            </div>
          )}
        </div>

        {/* OpenAI */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">OpenAI</h3>
                <span className="text-[11px] text-slate-400 font-mono">gpt-4o-mini</span>
              </div>
            </div>

            <button
              onClick={() => handleTestConnection("openai")}
              disabled={testingProvider === "openai"}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {testingProvider === "openai" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Test Connection"}
            </button>
          </div>

          <div className="pt-2">
            <label className="block text-xs text-slate-400 mb-1">
              OpenAI API Key (BYOK):
            </label>
            <input
              type="password"
              placeholder="sk-..."
              value={byokKeys["openai"] || ""}
              onChange={(e) => setByokKey("openai", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {testResult["openai"] && (
            <div
              className={`p-2.5 rounded text-xs flex items-center gap-2 ${
                testResult["openai"].ok
                  ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/60"
                  : "bg-rose-950/40 text-rose-300 border border-rose-800/60"
              }`}
            >
              {testResult["openai"].ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{testResult["openai"].message}</span>
            </div>
          )}
        </div>

        {/* Anthropic */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Anthropic Claude</h3>
                <span className="text-[11px] text-slate-400 font-mono">claude-3-5-sonnet-20241022</span>
              </div>
            </div>

            <button
              onClick={() => handleTestConnection("anthropic")}
              disabled={testingProvider === "anthropic"}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {testingProvider === "anthropic" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Test Connection"}
            </button>
          </div>

          <div className="pt-2">
            <label className="block text-xs text-slate-400 mb-1">
              Anthropic API Key (BYOK):
            </label>
            <input
              type="password"
              placeholder="sk-ant-..."
              value={byokKeys["anthropic"] || ""}
              onChange={(e) => setByokKey("anthropic", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {testResult["anthropic"] && (
            <div
              className={`p-2.5 rounded text-xs flex items-center gap-2 ${
                testResult["anthropic"].ok
                  ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/60"
                  : "bg-rose-950/40 text-rose-300 border border-rose-800/60"
              }`}
            >
              {testResult["anthropic"].ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{testResult["anthropic"].message}</span>
            </div>
          )}
        </div>

        {/* Ollama */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Ollama (Local / Self-Hosted)</h3>
                <span className="text-[11px] text-slate-400 font-mono">http://127.0.0.1:11434</span>
              </div>
            </div>

            <button
              onClick={() => handleTestConnection("ollama")}
              disabled={testingProvider === "ollama"}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {testingProvider === "ollama" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Test Connection"}
            </button>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
            <b>Serverless note:</b> In production on Vercel, serverless functions cannot connect to localhost on your laptop. Run <code>pnpm dev</code> locally or configure an authenticated remote Ollama URL in <code>OLLAMA_BASE_URL</code>.
          </div>

          {testResult["ollama"] && (
            <div
              className={`p-2.5 rounded text-xs flex items-center gap-2 ${
                testResult["ollama"].ok
                  ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/60"
                  : "bg-rose-950/40 text-rose-300 border border-rose-800/60"
              }`}
            >
              {testResult["ollama"].ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{testResult["ollama"].message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
