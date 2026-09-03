import React from "react";
import { useNavigate } from "react-router-dom";

const TopHeader = ({ title, showBack = false, rightElement = null }) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white/80 px-5 pb-4 pt-2 shadow-sm backdrop-blur-xl transition-all">
      <div className="flex min-w-0 items-center gap-4">
        {showBack && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-transform active:scale-90"
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
        <h1 className="truncate text-2xl font-black tracking-tight text-gray-900">{title}</h1>
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
