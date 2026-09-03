import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MainHeader from "../components/MainHeader";
import TrashIcon from "../components/TrashIcon";
import { useConfirm } from "../dialogs/ConfirmDialogProvider";
import { serviceService } from "../services/serviceService";
import { parseMoney, serviceValidationError } from "../utils/validation";
import { toast } from "../notifications/toastBus";

function Icon({ children, className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const icons = {
  search: (
    <Icon>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </Icon>
  ),
  edit: (
    <Icon>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </Icon>
  ),
  service: (
    <Icon className="w-7 h-7">
      <path d="M4 4h16v5H4z" />
      <path d="M4 15h16v5H4z" />
      <path d="M7 9v6" />
      <path d="M17 9v6" />
    </Icon>
  ),
};

function ServicesPage() {
  const confirm = useConfirm();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);

  const lowerSearch = searchTerm.toLowerCase();

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await serviceService.getServices();
      setServices(res.data);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = serviceValidationError(formData);
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        price: parseMoney(formData.price),
      };

      if (editingId) {
        const res = await serviceService.updateService(editingId, payload);
        setServices((prev) => prev.map((s) => (s._id === editingId ? res.data : s)));
      } else {
        const res = await serviceService.createService(payload);
        setServices((prev) => [res.data, ...prev]);
      }

      handleCancel();
      toast.success(editingId ? "Service updated successfully" : "Service created successfully");
    } catch {
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
    setShowMobileForm(false);
  };

  const handleDelete = async (id, name) => {
    const confirmed = await confirm({
      title: "Delete service?",
      message: `Delete "${name}" from the service menu?`,
      confirmLabel: "Delete",
      cancelLabel: "Keep",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    const previousServices = [...services];
    setServices((prev) => prev.filter((s) => s._id !== id));

    try {
      await serviceService.deleteService(id);
      toast.success("Service deleted successfully");
    } catch {
      setServices(previousServices);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-28">
      <MainHeader title="Services">
        <div className="flex gap-2 items-center mb-4">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icons.search}</span>
            <input
              type="text"
              className="input-soft pl-11"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-sm shadow-brandPink/20"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </MainHeader>

      <main className="p-4 flex-1">
        {loading && <div className="text-center text-brandPink font-bold mt-10 animate-pulse">Loading menu...</div>}
        {!loading && (
          <motion.div layout className="space-y-3">
            <AnimatePresence>
              {filteredServices.map((s) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={s._id}
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                  
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 truncate text-base">{s.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-0.5 rounded-md">
                          {s.category || "General"}
                        </span>
                        <span className="text-sm font-semibold text-brandPink">₹{s.price}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-1.5">
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-600 shadow-sm transition-transform active:scale-95"
                        onClick={() => handleEdit(s)}
                        aria-label={`Edit ${s.name}`}
                      >
                        {icons.edit}
                      </button>
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-500 shadow-sm transition-transform active:scale-95"
                        onClick={() => handleDelete(s._id, s.name)}
                        aria-label={`Delete ${s.name}`}
                      >
                        <TrashIcon />
                      </button>
                    </div>

                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredServices.length === 0 && (
              <div className="empty-state">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
                  {icons.service}
                </div>
                <p>No services found.</p>
              </div>
            )}
          </motion.div>
        )}
      </main>

      <button
        onClick={() => {
          setFormData({ name: "", category: "", price: "" });
          setShowMobileForm(true);
        }}
        className="fab-button"
        aria-label="Add service"
      >
        +
      </button>

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
              className="bottom-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <h2 className="mb-5 text-lg font-semibold text-gray-950">
                {editingId ? "Edit Service" : "New Service"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xl font-semibold text-gray-400">₹</span>
                  <input 
                    type="number" 
                    min="0"
                    step="1"
                    placeholder="0.00" 
                    value={formData.price}
                    className="w-full border-b-2 border-gray-100 py-3 pl-6 text-3xl font-semibold outline-none transition-colors focus:border-brandPink"
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Service Name (e.g. Haircut)"
                    className="input-soft"
                    value={formData.name}
                    maxLength="120"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />

                  <input
                    type="text"
                    list="category-options"
                    placeholder="Category (e.g. Hair, Skin)"
                    className="input-soft"
                    value={formData.category}
                    maxLength="80"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                  <datalist id="category-options">
                    {categories.filter(c => c !== "All").map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" 
                    className="btn-secondary w-1/3"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="btn-primary w-2/3"
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
