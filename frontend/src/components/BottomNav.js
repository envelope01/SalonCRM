import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const privilegedRoles = new Set(["owner"]);

function NavIcon({ type }) {
  const common = {
    className: "w-5 h-5",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  const icons = {
    calendar: (
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18" />
      </>
    ),
    clients: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    services: (
      <>
        <path d="M7 21h10" />
        <path d="M12 17V3" />
        <path d="M6 8h12" />
        <path d="M7 8l-3 5a4 4 0 0 0 6 0L7 8z" />
        <path d="M17 8l-3 5a4 4 0 0 0 6 0l-3-5z" />
      </>
    ),
    reports: (
      <>
        <path d="M3 3v18h18" />
        <path d="M7 15l4-4 3 3 5-7" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.4 1.08V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.08-.4H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .4-1.08V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.33.6.6 1 .6h.09a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1 .6z" />
      </>
    ),
  };

  return <svg {...common}>{icons[type]}</svg>;
}

const BottomNav = ({ user }) => {
  const location = useLocation();
  const canViewReportsAndSettings = privilegedRoles.has(user?.role);

  const isMainPage = ["/", "/clients", "/services", "/reports", "/settings"].includes(location.pathname);

  if (!isMainPage) return null;

  const navItems = [
    { to: "/", label: "Appts", icon: "calendar" },
    { to: "/clients", label: "Clients", icon: "clients" },
    { to: "/services", label: "Services", icon: "services" },
    canViewReportsAndSettings ? { to: "/reports", label: "Reports", icon: "reports" } : null,
    canViewReportsAndSettings ? { to: "/settings", label: "Settings", icon: "settings" } : null,
  ].filter(Boolean);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center">
      <div className="relative w-full max-w-3xl">
        <div className="absolute inset-0 border-t border-gray-200/80 bg-white/95 shadow-[0_-8px_28px_rgba(15,23,42,0.06)] backdrop-blur" />

        <div className="relative flex items-center justify-around px-2 pt-1.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className="flex-1">
              {({ isActive }) => (
                <motion.div
                  whileTap={{ scale: 0.96 }}
                  className="flex w-full flex-col items-center justify-center py-1.5"
                >
                  <div className={`flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${
                    isActive ? "bg-primary text-white shadow-sm shadow-brandPink/20" : "bg-transparent text-gray-500"
                  }`}>
                    <span className="transition-transform duration-300">
                      <NavIcon type={item.icon} />
                    </span>
                  </div>
                  <span className={`mt-1 text-[10px] font-semibold transition-colors duration-300 ${
                    isActive ? "text-primary" : "text-gray-400"
                  }`}>
                    {item.label}
                  </span>
                </motion.div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
