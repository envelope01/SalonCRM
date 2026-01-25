/* =========================================================
   GLOBAL STYLES & LIBRARIES
   ========================================================= */
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import "./index.css";
import "./App.css";

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