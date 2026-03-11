import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";

import api from "../api";
// Tailwind handles styling now; old CSS removed

/* ======================================================
   SERVICES PAGE
   ====================================================== */
function ServicesPage() {
  /* ---------------- STATE ---------------- */
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const formRef = useRef(null);

  /* ---------------- FORM STATE ---------------- */
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const lowerSearch = searchTerm.toLowerCase();

  /* ======================================================
     DATA LOADING
     ====================================================== */
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

  /* ======================================================
     COMPUTED VALUES
     ====================================================== */
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

  /* ======================================================
     HANDLERS
     ====================================================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim() || formData.price === "") {
      setFormError("Name and Price are required");
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        ...formData,
        price: Number(formData.price),
      };

      if (editingId) {
        const res = await api.put(`/services/${editingId}`, payload);

        setServices((prev) =>
          prev.map((s) => (s._id === editingId ? res.data : s))
        );
      } else {
        const res = await api.post("/services", payload);

        setServices((prev) => [res.data, ...prev]);
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

    if (formRef.current) {
      formRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: "", category: "", price: "" });
    setFormError("");
  };

  const handleToggle = async (id, currentStatus) => {
    if (
      !window.confirm(
        currentStatus
          ? "Deactivate this service?"
          : "Activate this service?"
      )
    ) {
      return;
    }

    setServices((prev) =>
      prev.map((s) =>
        s._id === id ? { ...s, isActive: !currentStatus } : s
      )
    );

    try {
      await api.put(`/services/toggle/${id}`);
    } catch (err) {
      setServices((prev) =>
        prev.map((s) =>
          s._id === id ? { ...s, isActive: currentStatus } : s
        )
      );
      alert("Failed to update service status");
    }
  };

  const getCategoryClass = (cat) => {
    if (!cat) return "bg-gray-100 text-gray-600";

    const lower = cat.toLowerCase();
    if (lower.includes("hair")) return "bg-blue-100 text-blue-800";
    if (lower.includes("skin") || lower.includes("facial"))
      return "bg-pink-100 text-pink-700";
    return "bg-gray-100 text-gray-600";
  };

  /* ======================================================
     RENDER
     ====================================================== */
  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Service Menu</h2>
          <p className="text-sm text-gray-600">
            Manage your salon catalog
          </p>
        </div>

        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Active: <strong>{activeCount}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Inactive: <strong>{inactiveCount}</strong>
          </span>
        </div>
      </div>

      {/* GRID CONTENT */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* LEFT: LIST */}
        <div className="app-card flex flex-col flex-1 min-h-0">
          <div className="pb-2">
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 "
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1 min-h-0 internal-scroll">
            {loading && (
              <div className="py-5 text-center text-gray-500">
                Loading...
              </div>
            )}

            {error && (
              <div className="py-5 text-center text-red-600">
                {error}
              </div>
            )}

            {!loading && !error && (
              <table className="w-full table-auto text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Category</th>
                    <th className="text-left p-2">Price</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((s) => (
                    <tr
                      key={s._id}
                      className={!s.isActive ? "opacity-60" : ""}
                    >
                      <td className="p-2 font-medium">{s.name}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryClass(
                            s.category
                          )}`}
                        >
                          {s.category || "General"}
                        </span>
                      </td>
                      <td className="p-2 font-semibold">₹{s.price}</td>
                      <td className="p-2 flex gap-2 justify-end">
                        <button
                          className="p-1 rounded-md hover:bg-gray-100"
                          onClick={() => handleEdit(s)}
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          className={`p-1 rounded-md hover:bg-gray-100 ${
                            !s.isActive ? "text-red-600" : "text-green-600"
                          }`}
                          onClick={() =>
                            handleToggle(s._id, s.isActive)
                          }
                          title={
                            s.isActive ? "Deactivate" : "Activate"
                          }
                        >
                          {s.isActive ? "✓" : "✕"}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredServices.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-gray-500">
                        No services found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT: FORM */}
        <div
          className="app-card flex-shrink-0 w-full lg:w-80"
          ref={formRef}
        >
          <h4 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Service" : "Add New Service"}
          </h4>

          {formError && (
            <div className="text-red-600 text-sm mb-2">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Service Name
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 "
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g. Haircut"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Category
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 "
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value,
                  })
                }
                placeholder="e.g. Hair"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 "
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: e.target.value,
                  })
                }
                placeholder="0"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
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
                className="mt-2 w-full border border-gray-300 rounded-lg py-2 text-gray-600"
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
