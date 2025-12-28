import React from "react";
import { NavLink, Link } from "react-router-dom";
import "./navbar.css";

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar navbar-expand-lg fixed-top custom-navbar">
      <div className="container-fluid px-4 position-relative">

        {/* LEFT SIDE */}
        {user && (
          <div className="d-flex align-items-center">
            <ul className="navbar-nav flex-row gap-4">
              <li className="nav-item">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `nav-link custom-link ${isActive ? "active-link" : ""}`
                  }
                >
                  Clients
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  to="/services"
                  className={({ isActive }) =>
                    `nav-link custom-link ${isActive ? "active-link" : ""}`
                  }
                >
                  Services
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  to="/reports"
                  className={({ isActive }) =>
                    `nav-link custom-link ${isActive ? "active-link" : ""}`
                  }
                >
                  Reports
                </NavLink>
              </li>
            </ul>
          </div>
        )}

        {/* CENTER BRAND */}
        <div className="position-absolute start-50 translate-middle-x">
          <Link className="navbar-brand brand-text" to={user ? "/" : "/login"}>
            Nutan’s<span className="brand-highlight"> Beauty Lounge</span>
          </Link>
        </div>

        {/* RIGHT */}
        <div className="d-flex align-items-center ms-auto">
          {user && (
            <div className="d-flex align-items-center gap-3">
              <span className="user-greeting d-none d-md-block">
                Hey, <strong>{user.name}</strong>
              </span>
              <button className="btn btn-sm btn-logout" onClick={onLogout}>
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
