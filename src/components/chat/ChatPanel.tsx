import React, { useState, useRef, useEffect } from "react";
import { useRepoStore } from "@/stores/repo-store";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  FileCode,
  ExternalLink,
  Cpu,
  Trash2,
  RefreshCw,
} from "lucide-react";

export function ChatPanel({ onCitationClick }: { onCitationClick?: (path: string, lines: [number, number]) => void }) {
  const {
    chatMessages,
    isChatLoading,
    sendChatMessage,
    clearChat,
    activeProvider,
    activeModel,
    setProvider,
    setModel,
    loadFile,
    byokKeys,
    availableModels,
    isFetchingModels,
    fetchModelsForProvider,
    openApiKeyModal,
  } = useRepoStore();

  const currentModels = availableModels[activeProvider] || [];

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;
    const msg = input.trim();
    setInput("");
    sendChatMessage(msg);
  };

  const handleCitationClick = (path: string, startLine: number, endLine: number) => {
    loadFile(path, [startLine, endLine]);
    if (onCitationClick) {
      onCitationClick(path, [startLine, endLine]);
    }
  };

  const suggestions = [
    "Explain the high-level architecture of this repository.",
    "Where are the primary entry points and API routes?",
    "How does data persistence and storage work in this project?",
    "What external dependencies and services are utilized?",
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Chat Header */}
      <div className="h-12 border-b border-slate-800 bg-slate-900/50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-slate-100">Repository Grounded AI</span>
          <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
            RAG Grounded
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Dropdown 1: Provider selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/60 text-xs">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={activeProvider}
              onChange={(e) => setProvider(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
              title="Select AI Provider"
            >
              <option value="gemini" className="bg-slate-900">Gemini (Free Tier)</option>
              <option value="openai" className="bg-slate-900">OpenAI</option>
              <option value="anthropic" className="bg-slate-900">Anthropic Claude</option>
              <option value="ollama" className="bg-slate-900">Ollama</option>
            </select>
          </div>

          {/* Dropdown 2: Model list from API key */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-md border border-slate-700/60 text-xs">
            {isFetchingModels ? (
              <Loader2 className="w-3 h-3 text-cyan-400 animate-spin shrink-0" />
            ) : null}
            <select
              value={activeModel}
              onChange={(e) => setModel(e.target.value)}
              disabled={isFetchingModels}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs font-mono max-w-[150px] truncate"
              title={`Select Model (retrieved from API key: ${currentModels.length} models available)`}
            >
              {currentModels.map((m) => (
                <option key={m} value={m} className="bg-slate-900">
                  {m}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => fetchModelsForProvider(activeProvider)}
              disabled={isFetchingModels}
              className="text-slate-400 hover:text-cyan-300 p-0.5 rounded transition-colors"
              title="Refresh models from API key"
            >
              <RefreshCw className={`w-3 h-3 ${isFetchingModels ? "animate-spin" : ""}`} />
            </button>
          </div>

          <button
            onClick={clearChat}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* No API Key Helper Banner */}
      {!byokKeys[activeProvider] && activeProvider !== "ollama" && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              No server <code className="text-blue-300 font-mono">.env</code> needed! Add your free Gemini key to enable AI answers.
            </span>
          </div>
          <button
            onClick={openApiKeyModal}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs whitespace-nowrap shadow-sm shadow-blue-600/30 transition-colors"
          >
            Enter Free Key
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center p-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-200 mb-1">Ask RepoLens AI</h3>
            <p className="text-xs text-slate-400 mb-4">
              Answers are strictly grounded in indexed source files with verified line citations.
            </p>
            <div className="w-full space-y-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => sendChatMessage(s)}
                  className="w-full text-left text-xs p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center justify-between group"
                >
                  <span>{s}</span>
                  <Send className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3.5 shadow-md ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none space-y-2.5"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                {/* Citations section */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1.5 flex items-center gap-1">
                      <FileCode className="w-3 h-3 text-blue-400" />
                      Verified Source Citations:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => handleCitationClick(c.path, c.startLine, c.endLine)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-900/50 hover:border-blue-500/50 border border-slate-700/60 text-[11px] font-mono text-blue-300 flex items-center gap-1 transition-colors"
                          title={`Click to jump to ${c.path}:${c.startLine}-${c.endLine}`}
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>{c.path}</span>
                          <span className="text-slate-400">
                            :L{c.startLine}{c.endLine !== c.startLine ? `-L${c.endLine}` : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-slate-300">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isChatLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs pl-1">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <span>Retrieving repository context and generating answer...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900/40 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this repository's code, structure, or routes..."
          disabled={isChatLoading}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isChatLoading || !input.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-600/30"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask</span>
        </button>
      </form>
    </div>
  );
}
