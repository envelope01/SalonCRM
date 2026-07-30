import React from "react";
import { useNavigate } from "react-router-dom";

const TopHeader = ({ title, showBack = false, rightElement = null }) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-5 pt-2 pb-4 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all">
      <div className="flex items-center gap-4">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-700 shadow-sm active:scale-90 transition-transform"
            aria-label="Go back"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h1>
      </div>

      {rightElement && (
        <div className="flex items-center">
          {rightElement}
        </div>
      )}
    </header>
  );
};

export default TopHeader;