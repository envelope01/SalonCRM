// src/components/MainHeader.js
import React from "react";
import { clearAuth } from "../api";

const MainHeader = ({ title, children }) => {
  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 bg-white px-5 pt-8 pb-4 shadow-sm z-20">
      {/* Title and Logout Button */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <button
          onClick={handleLogout}
          className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-transform"
        >
          Logout
        </button>
      </div>

      {/* Page-specific content (Search bars, filters, etc.) */}
      {children}
    </header>
  );
};

export default MainHeader;