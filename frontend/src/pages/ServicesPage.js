import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api";
import MainHeader from "../components/MainHeader";

/* ======================================================
   SERVICES PAGE (MOBILE REDESIGN)
   ====================================================== */
function ServicesPage() {
  /* ---------------- STATE ---------------- */
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  /* ---------------- FORM STATE ---------------- */
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);

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
  // Extract unique categories for the horizontal filter pills
  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.category).filter(Boolean));
    return ["All", ...Array.from(cats)];
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesSearch = 
        (s.name ?? "").toLowerCase().includes(lowerSearch) ||
        (s.category ?? "").toLowerCase().includes(lowerSearch);
      
      const matchesCategory = activeCategory === "All" || s.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [services, lowerSearch, activeCategory]);

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
      const payload = { ...formData, price: Number(formData.price) };

      if (editingId) {
        const res = await api.put(`/services/${editingId}`, payload);
        setServices((prev) => prev.map((s) => (s._id === editingId ? res.data : s)));
      } else {
        const res = await api.post("/services", payload);
        setServices((prev) => [res.data, ...prev]);
      }

      handleCancel();
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
    setShowMobileForm(true);
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: "", category: "", price: "" });
    setFormError("");
    setShowMobileForm(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    // Optimistic UI update
    const previousServices = [...services];
    setServices((prev) => prev.filter((s) => s._id !== id));

    try {
      await api.delete(`/services/${id}`);
    } catch (err) {
      // Revert if failed
      setServices(previousServices);
      alert("Failed to delete service.");
    }
  };

  /* ======================================================
     RENDER
     ====================================================== */
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-28">
      
      {/* STICKY HEADER */}
      <MainHeader title="Services">
        
        <div className="flex gap-2 items-center mb-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brandPink/50 transition-shadow"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Top Add Button */}
          <button
            onClick={() => {
              setFormData({ name: "", category: "", price: "" });
              setShowMobileForm(true);
            }}
            className="bg-brandPink text-white px-4 py-3 rounded-2xl text-sm font-bold shadow-md active:scale-95 transition-transform whitespace-nowrap flex items-center gap-1"
          >
            <span>+</span>
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        {/* Category Pills (Horizontal Scroll) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat
                  ? "bg-gray-900 text-white shadow-md"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </MainHeader>

      {/* MAIN CONTENT */}
      <main className="p-4 flex-1">
        {loading && <div className="text-center text-brandPink font-bold mt-10 animate-pulse">Loading menu...</div>}
        {error && <div className="text-center text-rose-500 font-bold mt-10">{error}</div>}

        {!loading && !error && (
          <motion.div layout className="space-y-3">
            <AnimatePresence>
              {filteredServices.map((s) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={s._id}
                  className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group"
                >
                  <div className="flex justify-between items-center">
                  
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 truncate text-base">{s.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded-md">
                          {s.category || "General"}
                        </span>
                        <span className="text-sm font-black text-brandPink">₹{s.price}</span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl">
                      <button
                        className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-600 shadow-sm border border-gray-100 active:scale-90 transition-transform"
                        onClick={() => handleEdit(s)}
                      >
                        ✎
                      </button>
                      <button
                        className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100 active:scale-90 transition-transform font-bold"
                        onClick={() => handleDelete(s._id, s.name)}
                      >
                        🗑️
                      </button>
                    </div>

                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredServices.length === 0 && (
              <div className="text-center mt-12 text-gray-400 font-medium">
                <div className="text-4xl mb-3">🪞</div>
                No services found.
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* FAB - Add Service */}
      <button
        onClick={() => {
          setFormData({ name: "", category: "", price: "" });
          setShowMobileForm(true);
        }}
        className="fixed bottom-28 right-6 w-14 h-14 bg-brandPink text-white rounded-2xl shadow-lg shadow-brandPink/30 flex items-center justify-center text-3xl z-30 active:scale-90 transition-transform md:hidden"
      >
        +
      </button>

      {/* ADD/EDIT MOBILE BOTTOM SHEET */}
      <AnimatePresence>
        {showMobileForm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end"
            onClick={handleCancel}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full rounded-t-[2.5rem] p-8 pb-12"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-black mb-6 text-gray-900">
                {editingId ? "Edit Service" : "New Service"}
              </h2>

              {formError && <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-semibold mb-4">{formError}</div>}

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Price Input (Hero Style) */}
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₹</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={formData.price}
                    className="w-full text-4xl font-black pl-6 py-3 focus:outline-none border-b-2 border-gray-100 focus:border-brandPink transition-colors"
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Service Name (e.g. Haircut)"
                    className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-700 outline-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />

                  {/* Datatalist for categories ensures they can type a new one or pick existing */}
                  <input
                    type="text"
                    list="category-options"
                    placeholder="Category (e.g. Hair, Skin)"
                    className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-700 outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                  <datalist id="category-options">
                    {categories.filter(c => c !== "All").map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    className="w-1/3 bg-gray-100 text-gray-600 py-4 rounded-2xl font-bold active:scale-95 transition-transform"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="w-2/3 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-70"
                  >
                    {isSaving ? "Saving..." : editingId ? "Save Changes" : "Add Service"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ServicesPage;