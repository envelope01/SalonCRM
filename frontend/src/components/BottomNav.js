import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const BottomNav = () => {
  const location = useLocation();

  // Show bottom nav only on main pages
  const isMainPage = ["/", "/services", "/reports"].includes(location.pathname);

  if (!isMainPage) return null;

  const navItems = [
    { to: "/", label: "Clients", icon: "👥" },
    { to: "/services", label: "Services", icon: "💅" }, // Switched icon to match salon vibe
    { to: "/reports", label: "Reports", icon: "📊" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
      {/* iOS Frosted Glass Effect */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]" />
      
      <div className="relative flex justify-around items-center px-2 pt-2 pb-6"> {/* pb-6 adds space for iOS home bar */}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex-1"
          >
            {({ isActive }) => (
              <motion.div 
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center justify-center w-full py-2"
              >
                <div className={`flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${
                  isActive ? "bg-brandPink/15 text-brandPink" : "bg-transparent text-gray-500"
                }`}>
                  <span className={`text-xl transition-transform duration-300 ${isActive ? "scale-110 drop-shadow-sm" : "scale-100 grayscale-[50%]"}`}>
                    {item.icon}
                  </span>
                </div>
                <span className={`text-[10px] font-bold mt-1 transition-colors duration-300 ${
                  isActive ? "text-gray-900" : "text-gray-400"
                }`}>
                  {item.label}
                </span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;