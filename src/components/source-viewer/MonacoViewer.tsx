import React, { useRef, useEffect } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useRepoStore } from "@/stores/repo-store";
import { FileCode, Loader2 } from "lucide-react";

function getEditorLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return "typescript";
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return "javascript";
    case "py":
      return "python";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "java":
      return "java";
    case "json":
      return "json";
    case "yaml":
    case "yml":
      return "yaml";
    case "md":
      return "markdown";
    case "sql":
      return "sql";
    case "html":
      return "html";
    case "css":
      return "css";
    case "sh":
      return "shell";
    default:
      return "plaintext";
  }
}

export function MonacoViewer() {
  const {
    activeFilePath,
    activeFileContent,
    activeLineRange,
    isLoadingFile,
  } = useRepoStore();

  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Apply initial line range highlight if present
    if (activeLineRange && editor) {
      applyHighlight(editor, monaco, activeLineRange);
    }
  };

  const applyHighlight = (editor: any, monaco: any, range: [number, number]) => {
    const [start, end] = range;
    editor.revealLineInCenter(start);

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
      {
        range: new monaco.Range(start, 1, end, 1),
        options: {
          isWholeLine: true,
          className: "bg-blue-500/15 border-l-2 border-blue-400",
        },
      },
    ]);
  };

  useEffect(() => {
    if (editorRef.current && (window as any).monaco && activeLineRange) {
      applyHighlight(editorRef.current, (window as any).monaco, activeLineRange);
    }
  }, [activeLineRange]);

  if (!activeFilePath) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-950 p-6 text-center">
        <FileCode className="w-10 h-10 text-slate-700 mb-3" />
        <p className="text-sm">Select a file from the explorer or click a graph node to inspect source code.</p>
      </div>
    );
  }

  const language = getEditorLanguage(activeFilePath);

  return (
    <div className="h-full flex flex-col bg-slate-950">
      {/* Viewer Header */}
      <div className="h-9 border-b border-slate-800 bg-slate-900/60 px-3 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-mono text-slate-300 truncate">
          <FileCode className="w-3.5 h-3.5 text-blue-400" />
          <span className="truncate">{activeFilePath}</span>
          {activeLineRange && (
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
              L{activeLineRange[0]}-L{activeLineRange[1]}
            </span>
          )}
        </div>
        <div className="text-[10px] text-slate-500 uppercase font-mono">{language}</div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 relative">
        {isLoadingFile ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-blue-500" />
            Loading file content...
          </div>
        ) : null}

        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={activeFileContent || "// Loading..."}
          onMount={handleEditorDidMount}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 12,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            padding: { top: 8, bottom: 8 },
          }}
        />
      </div>
    </div>
  );
}
