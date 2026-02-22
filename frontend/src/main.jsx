import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CssBaseline from "@mui/material/CssBaseline";

import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import UploadPage from "./pages/UploadPage";
import RulesPage from "./pages/RulesPage";
import PredictPage from "./pages/PredictPage";
import MetricsPage from "./pages/MetricsPage";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CssBaseline />
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/metrics" element={<MetricsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);