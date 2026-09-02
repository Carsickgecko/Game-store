import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App.jsx";
import { LanguageProvider } from "./contexts/LanguageContext.jsx";
import { bootstrapAuth } from "./store/auth.js";
import "./index.css";

await bootstrapAuth();

const Router =
  import.meta.env.VITE_DEPLOY_TARGET === "github-pages" ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <Router>
        <App />
      </Router>
    </LanguageProvider>
  </React.StrictMode>,
);
