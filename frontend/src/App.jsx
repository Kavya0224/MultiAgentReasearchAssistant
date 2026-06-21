import React from "react";
import { BrowserRouter } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ResearchPage from "./pages/ResearchPage.jsx";
import DocumentsPage from "./pages/DocumentsPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import { useResearchStore } from "./store/researchStore.js";

export default function App() {
  const activeTab = useResearchStore((s) => s.activeTab);

  return (
    <BrowserRouter>
      <Layout>
        {activeTab === "research" && <ResearchPage />}
        {activeTab === "documents" && <DocumentsPage />}
        {activeTab === "history" && <HistoryPage />}
      </Layout>
    </BrowserRouter>
  );
}
