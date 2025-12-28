import React, { useEffect, useState, useMemo } from "react";
import api from "../api";
import "./servicesPage.css";

function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const lowerSearch = searchTerm.toLowerCase();

  // LOAD DATA
  const loadServices = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/services");
      setServices(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // COMPUTED STATS
  const activeCount = useMemo(
    () => services.filter((s) => s.isActive).length,
    [services]
  );
  const inactiveCount = useMemo(
    () => services.filter((s) => !s.isActive).length,
    [services]
  );

  const filteredServices = useMemo(() => {
    return services.filter(
      (s) =>
        (s.name ?? "").toLowerCase().includes(lowerSearch) ||
        (s.category ?? "").toLowerCase().includes(lowerSearch)
    );
  }, [services, lowerSearch]);

  // HANDLERS
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim() || formData.price === "") {
      setFormError("Name and Price are required");
      return;
    }

    try {
      setIsSaving(true);
      const payload = { ...formData, price: Number(formData.price) };

      if (editingId) {
        const res = await api.put(`/services/${editingId}`, payload);

        // update locally
        setServices((prev) =>
          prev.map((s) => (s._id === editingId ? res.data : s))
        );
      } else {
        const res = await api.post("/services", payload);

        // prepend new service locally
        setServices((prev) =>
          // prev.map((s) => (s._id === editingId ? { ...s, ...res.data } : s))
        setServices((prev) => [res.data, ...prev])

        );
      }

      setFormData({ name: "", category: "", price: "" });
      setEditingId(null);
    } catch (err) {
      setFormError("Failed to save service");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (s) => {
    setEditingId(s._id);
    setFormData({
      name: s.name,
      category: s.category || "",
      price: String(s.price ?? ""),
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: "", category: "", price: "" });
    setFormError("");
  };

  const handleToggle = async (id, currentStatus) => {
    if (
      !window.confirm(
        currentStatus ? "Deactivate this service?" : "Activate this service?"
      )
    ) {
      return;
    }

    // 1️⃣ Optimistic UI update
    setServices((prev) =>
      prev.map((s) => (s._id === id ? { ...s, isActive: !currentStatus } : s))
    );

    try {
      // 2️⃣ API call
      await api.put(`/services/toggle/${id}`);
    } catch (err) {
      // 3️⃣ Rollback if failed
      setServices((prev) =>
        prev.map((s) => (s._id === id ? { ...s, isActive: currentStatus } : s))
      );
      alert("Failed to update service status");
    }
  };

  const getCategoryClass = (cat) => {
    if (!cat) return "cat-default";
    const lower = cat.toLowerCase();
    if (lower.includes("hair")) return "cat-hair";
    if (lower.includes("skin") || lower.includes("facial")) return "cat-skin";
    return "cat-default";
  };

  return (
    <div className="services-container services-page">
      {/* HEADER: Title + Stats Widget */}
      <div className="page-header">
        <div className="header-left">
          <h2 className="page-title">Service Menu</h2>
          <p className="page-subtitle">Manage your salon catalog</p>
        </div>

        {/* CREATIVE STATS WIDGET */}
        <div className="header-stats">
          <div className="stat-pill">
            <div className="dot green"></div>
            <span>Active:</span>
            <strong>{activeCount}</strong>
          </div>
          <div className="stat-pill">
            <div className="dot red"></div>
            <span>Inactive:</span>
            <strong>{inactiveCount}</strong>
          </div>
        </div>
      </div>

      <div className="services-grid">
        {/* LEFT CARD: SCROLLABLE LIST */}
        <div className="services-list-card">
          <div className="table-controls">
            <input
              type="text"
              className="search-input"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="table-scroll-area">
            {loading && (
              <div style={{ padding: 20, textAlign: "center", color: "#999" }}>
                Loading...
              </div>
            )}
            {error && (
              <div
                style={{ padding: 20, textAlign: "center", color: "#dc3545" }}
              >
                {error}
              </div>
            )}

            {!loading && !error && (
              <table className="services-table">
                <thead>
                  <tr>
                    <th style={{ width: "35%" }}>Name</th>
                    <th style={{ width: "25%" }}>Category</th>
                    <th style={{ width: "20%" }}>Price</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((s) => (
                    <tr
                      key={s._id}
                      className={!s.isActive ? "inactive-row" : ""}
                    >
                      <td>
                        <div style={{ fontWeight: 500 }}>{s.name}</div>
                      </td>
                      <td>
                        <span
                          className={`category-chip ${getCategoryClass(
                            s.category
                          )}`}
                        >
                          {s.category || "General"}
                        </span>
                      </td>
                      <td>
                        <span className="price-tag">₹{s.price}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="icon-btn btn-edit"
                            onClick={() => handleEdit(s)}
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            className={`icon-btn btn-toggle ${
                              !s.isActive ? "off" : ""
                            }`}
                            onClick={() => handleToggle(s._id, s.isActive)}
                            title={s.isActive ? "Deactivate" : "Activate"}
                          >
                            {s.isActive ? "✓" : "✕"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredServices.length === 0 && (
                    <tr>
                      <td
                        colSpan="4"
                        style={{
                          textAlign: "center",
                          padding: 30,
                          color: "#999",
                        }}
                      >
                        No services found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT CARD: FORM (Same Height) */}
        <div className="form-card">
          <h4 className="form-title">
            {editingId ? "Edit Service" : "Add New Service"}
          </h4>

          {formError && (
            <div
              style={{ color: "red", fontSize: "0.85rem", marginBottom: 10 }}
            >
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="vertical-form">
            <div className="form-group">
              <label>Service Name</label>
              <input
                className="modern-input"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Haircut"
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <input
                className="modern-input"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="e.g. Hair"
              />
            </div>

            <div className="form-group">
              <label>Price (₹)</label>
              <input
                type="number"
                className="modern-input"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="0"
              />
            </div>

            <button
              type="submit"
              className="btn-primary-block"
              disabled={isSaving}
            >
              {isSaving
                ? "Saving..."
                : editingId
                ? "Update Service"
                : "Add Service"}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn-cancel-block"
                onClick={handleCancel}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default ServicesPage;
