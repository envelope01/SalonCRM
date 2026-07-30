/* =========================================================
   GLOBAL STYLES & LIBRARIES
   ========================================================= */
// tailwind base styles
import "./index.css";

/* =========================================================
   REACT CORE
   ========================================================= */
import React from "react";
import ReactDOM from "react-dom/client";


/* =========================================================
   APP ENTRY
   ========================================================= */
import App from "./App";

/* =========================================================
   RENDER
   ========================================================= */
const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);