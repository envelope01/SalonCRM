  import React from "react";
  import { NavLink, Link } from "react-router-dom";

  import "./navbar.css";

  const Navbar = ({ user, onLogout }) => {
    /* ======================================================
      HELPERS
      ====================================================== */

    // Manually close Bootstrap collapse menu on mobile
    const closeMobileMenu = () => {
      const menu = document.getElementById("mainNavbar");

      if (menu && menu.classList.contains("show")) {
        menu.classList.remove("show");
      }
    };

    /* ======================================================
      UI
      ====================================================== */
    return (
      <nav className="navbar navbar-expand-lg fixed-top custom-navbar">
        <div className="container-fluid px-4">
          {/* MOBILE TOGGLER */}
          <button
            className="navbar-toggler border-0 shadow-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* BRAND */}
          <Link
            className="navbar-brand brand-text d-flex align-items-center"
            to={user ? "/" : "/login"}
            onClick={closeMobileMenu}
          >
            NUTAN’S&nbsp;
            <span className="brand-highlight">BEAUTY LOUNGE</span>
          </Link>

          {/* COLLAPSIBLE CONTENT */}
          <div className="collapse navbar-collapse" id="mainNavbar">
            {/* NAV LINKS */}
            {user && (
              <ul className="navbar-nav me-auto mb-2 mb-lg-0 mt-3 mt-lg-0">
                <li className="nav-item">
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      `nav-link custom-link ${
                        isActive ? "active-link" : ""
                      }`
                    }
                    onClick={closeMobileMenu}
                  >
                    Clients
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink
                    to="/services"
                    className={({ isActive }) =>
                      `nav-link custom-link ${
                        isActive ? "active-link" : ""
                      }`
                    }
                    onClick={closeMobileMenu}
                  >
                    Services
                  </NavLink>
                </li>


                {/* Show Reports only if user is NOT staff */}
                {user.role !== "staff" && (
                <li className="nav-item">
                  <NavLink
                    to="/reports"
                    className={({ isActive }) =>
                      `nav-link custom-link ${
                        isActive ? "active-link" : ""
                      }`
                    }
                    onClick={closeMobileMenu}
                  >
                    Reports
                  </NavLink>
                </li>
                )}
              </ul>
            )}

            {/* USER ACTIONS */}
            {user && (
              <div className="d-flex align-items-center ms-auto pb-3 pb-lg-0">
                <div className="d-flex align-items-center gap-3">
                  <span className="user-greeting d-none d-lg-block">
                    Hey, <strong>{user.name}</strong>
                  </span>

                  <button
                    className="btn btn-sm btn-logout"
                    onClick={() => {
                      onLogout();
                      closeMobileMenu();
                    }}
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    );
  };

  export default Navbar;
