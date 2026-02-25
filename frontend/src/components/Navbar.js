import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
// navbar now styled with Tailwind; old CSS removed

  const Navbar = ({ user, onLogout }) => {
    /* ======================================================
      HELPERS
      ====================================================== */

const [menuOpen, setMenuOpen] = useState(false);
  const closeMobileMenu = () => setMenuOpen(false);
  const toggleMenu = () => setMenuOpen((v) => !v);

    /* ======================================================
      UI
      ====================================================== */
    return (
      <nav className="fixed inset-x-0 top-0 bg-white/95 backdrop-blur border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link
          className="text-lg font-bold flex items-center gap-1"
          to={user ? "/" : "/login"}
          onClick={closeMobileMenu}
        >
          NUTAN’S
          <span className="text-brandPink">BEAUTY LOUNGE</span>
        </Link>

        {user && (
          <>
            <button
              className="lg:hidden p-2"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    menuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>

            <div
              className={`flex-col lg:flex-row lg:flex lg:items-center lg:space-x-6 ${
                menuOpen ? "flex" : "hidden"
              }`}
            >
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-gray-700 hover:text-brandPink font-medium ${
                    isActive ? "text-brandPink" : ""
                  }`
                }
                onClick={closeMobileMenu}
              >
                Clients
              </NavLink>

              <NavLink
                to="/services"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-gray-700 hover:text-brandPink font-medium ${
                    isActive ? "text-brandPink" : ""
                  }`
                }
                onClick={closeMobileMenu}
              >
                Services
              </NavLink>

              {user.role !== "staff" && (
                <NavLink
                  to="/reports"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-gray-700 hover:text-brandPink font-medium ${
                      isActive ? "text-brandPink" : ""
                    }`
                  }
                  onClick={closeMobileMenu}
                >
                  Reports
                </NavLink>
              )}

              <div className="flex items-center gap-3 mt-4 lg:mt-0">
                <span className="hidden lg:block text-sm text-gray-600">
                  Hey, <strong>{user.name}</strong>
                </span>
                <button
                  className="btn-primary"
                  onClick={() => {
                    onLogout();
                    closeMobileMenu();
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
    );
  };

  export default Navbar;
