import React from "react";
import { Navbar } from "@/components/ui/Navbar";
import { AppRoutes } from "./routes";

export function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />
      <div className="flex-1 flex flex-col">
        <AppRoutes />
      </div>
    </div>
  );
}

export default App;
