import React, { useEffect } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { ApiKeyModal } from "@/components/ui/ApiKeyModal";
import { useRepoStore } from "@/stores/repo-store";
import { AppRoutes } from "./routes";

export function App() {
  const { activeProvider, fetchModelsForProvider } = useRepoStore();

  useEffect(() => {
    // Initial fetch of models for active provider
    fetchModelsForProvider(activeProvider);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />
      <div className="flex-1 flex flex-col">
        <AppRoutes />
      </div>
      <ApiKeyModal />
    </div>
  );
}

export default App;
