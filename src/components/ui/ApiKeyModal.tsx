import React, { useState, useEffect } from "react";
import { useRepoStore } from "@/stores/repo-store";
import { ApiClient } from "@/lib/api-client";
import {
  Key,
  X,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Cpu,
  RefreshCw,
  Layers,
} from "lucide-react";

export function ApiKeyModal() {
  const {
    isApiKeyModalOpen,
    closeApiKeyModal,
    activeProvider,
    activeModel,
    setProvider,
    setModel,
    byokKeys,
    setByokKey,
    availableModels,
    fetchModelsForProvider,
  } = useRepoStore();

  const [provider, setLocalProvider] = useState(activeProvider || "gemini");
  const [keyInput, setKeyInput] = useState(byokKeys[provider] || "");
  const [selectedModel, setSelectedModel] = useState(activeModel || "gemini-2.5-flash");
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [fetchSuccessCount, setFetchSuccessCount] = useState<number | null>(null);

  // Available models for currently selected provider
  const currentModels = availableModels[provider] || [];

  useEffect(() => {
    if (isApiKeyModalOpen) {
      setLocalProvider(activeProvider);
      const currentKey = byokKeys[activeProvider] || "";
      setKeyInput(currentKey);
      setSelectedModel(activeModel);

      // Always query models on open
      handleFetchModels(activeProvider, currentKey);
    }
  }, [isApiKeyModalOpen, activeProvider]);

  const handleFetchModels = async (prov = provider, key = keyInput) => {
    setIsLoadingModels(true);
    setModelsError(null);
    setFetchSuccessCount(null);

    try {
      const models = await fetchModelsForProvider(prov, key.trim() || undefined);
      if (models && models.length > 0) {
        setFetchSuccessCount(models.length);
        if (!models.includes(selectedModel)) {
          setSelectedModel(models[0]);
        }
      }
    } catch (err: any) {
      setModelsError(err.message || "Failed to query model list with this key.");
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleProviderChange = (newProvider: string) => {
    setLocalProvider(newProvider);
    const existingKey = byokKeys[newProvider] || "";
    setKeyInput(existingKey);
    setSavedSuccess(false);
    setFetchSuccessCount(null);
    setModelsError(null);

    const defaultForProv = (availableModels[newProvider] || [])[0] || (newProvider === "gemini" ? "gemini-2.5-flash" : newProvider === "openai" ? "gpt-4o-mini" : "claude-3-5-sonnet");
    setSelectedModel(defaultForProv);

    // Fetch models immediately for newly selected provider
    handleFetchModels(newProvider, existingKey);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim()) {
      setByokKey(provider, keyInput.trim());
    }
    setProvider(provider, selectedModel);
    setModel(selectedModel);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      closeApiKeyModal();
    }, 600);
  };

  if (!isApiKeyModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={closeApiKeyModal}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">AI Provider & Model Configuration</h2>
            <p className="text-xs text-slate-400">Configure provider and query live model list from your API key</p>
          </div>
        </div>

        {/* Free Tier Callout for Gemini */}
        {provider === "gemini" && (
          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 mb-5 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-blue-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Google Gemini Free Tier
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Google offers free access to Gemini Flash. Get your free key from Google AI Studio:
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium underline"
            >
              <span>https://aistudio.google.com/app/apikey</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Dropdown 1: AI Provider */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>1. AI Provider</span>
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-medium cursor-pointer"
            >
              <option value="gemini">Google Gemini (Recommended • Free Tier)</option>
              <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
              <option value="anthropic">Anthropic Claude (Claude 3.5 Sonnet)</option>
              <option value="ollama">Ollama (Local / Self-Hosted)</option>
            </select>
          </div>

          {/* API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                <span>API Key</span>
              </label>
              {fetchSuccessCount !== null && (
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>{fetchSuccessCount} models loaded</span>
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? "text" : "password"}
                  value={keyInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setKeyInput(val);
                    if (val.length > 25) {
                      handleFetchModels(provider, val);
                    }
                  }}
                  onBlur={() => {
                    if (keyInput.trim()) {
                      handleFetchModels(provider, keyInput);
                    }
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text").trim();
                    if (pasted) {
                      setKeyInput(pasted);
                      handleFetchModels(provider, pasted);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleFetchModels(provider, keyInput);
                    }
                  }}
                  placeholder={
                    provider === "gemini"
                      ? "Enter your Gemini API key (AIzaSy...)"
                      : provider === "openai"
                      ? "Enter your OpenAI key (sk-...)"
                      : provider === "anthropic"
                      ? "Enter your Anthropic key (sk-ant-...)"
                      : "http://127.0.0.1:11434 (No key needed for local)"
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleFetchModels(provider, keyInput)}
                disabled={isLoadingModels}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-md shadow-blue-600/20"
                title="Query model list from API key"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingModels ? "animate-spin" : ""}`} />
                <span>{isLoadingModels ? "Fetching..." : "Fetch Models"}</span>
              </button>
            </div>
          </div>

          {/* Dropdown 2: Model List from API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>2. Model List (from API Key)</span>
              </label>
              {isLoadingModels ? (
                <span className="text-[11px] text-blue-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Querying models from API key...
                </span>
              ) : currentModels.length > 0 ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md font-semibold">
                  {currentModels.length} models available
                </span>
              ) : null}
            </div>

            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={isLoadingModels}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 font-mono cursor-pointer disabled:opacity-50"
            >
              {currentModels.map((m) => (
                <option key={m} value={m}>
                  {m} {m.includes("2.5-flash") ? "★ (Recommended • Free Tier)" : m.includes("flash") ? "(Fast • Free Tier)" : ""}
                </option>
              ))}
            </select>

            <p className="text-[11px] text-slate-400 mt-1">
              {currentModels.length > 4
                ? `Active model list: ${currentModels.length} models loaded dynamically from API key.`
                : "Select your desired model or click 'Fetch Models' above to refresh with your key."}
            </p>

            {modelsError && (
              <p className="text-[11px] text-amber-300 mt-1.5 bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/50 flex items-start gap-1.5">
                <span className="font-bold text-amber-400">Notice:</span>
                <span>{modelsError}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Saved in browser storage. No server environment variable required.</span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={closeApiKeyModal}
              className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-blue-600/30"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Provider & Model</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
