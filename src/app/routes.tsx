import React from "react";
import { Routes, Route } from "react-router-dom";
import { LandingPage } from "@/pages/LandingPage";
import { AnalyzePage } from "@/pages/AnalyzePage";
import { ProjectDashboardPage } from "@/pages/ProjectDashboardPage";
import { ChatPage } from "@/pages/ChatPage";
import { ProjectsListPage } from "@/pages/ProjectsListPage";
import { AISettingsPage } from "@/pages/AISettingsPage";
import { PrivacyPage } from "@/pages/PrivacyPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/new" element={<AnalyzePage />} />
      <Route path="/projects" element={<ProjectsListPage />} />
      <Route path="/project/:id" element={<ProjectDashboardPage />} />
      <Route path="/project/:id/chat" element={<ChatPage />} />
      <Route path="/settings/ai" element={<AISettingsPage />} />
      <Route path="/settings/privacy" element={<PrivacyPage />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}
