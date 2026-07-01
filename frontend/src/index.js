// src/index.js
// ─────────────────────────────────────────────────────────────────────────────
// Application entry point.
// AuthProvider is the outermost wrapper — it must enclose App so that
// useAuth() works everywhere in the tree.
// No BrowserRouter here: we use state-driven navigation, not URL routing.
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
