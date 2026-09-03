import { clearAuth } from "../api";

function LogoutIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

const MainHeader = ({ title, children }) => {
  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="truncate text-xl font-semibold tracking-tight text-gray-950">{title}</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-transform active:scale-95"
          aria-label="Logout"
        >
          <LogoutIcon />
        </button>
      </div>
      {children}
    </header>
  );
};

export default MainHeader;
