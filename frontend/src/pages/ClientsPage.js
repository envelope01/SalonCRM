import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";
import api from "../api";

function ClientsPage() {

  /* ---------------- STATE ---------------- */
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- MODAL STATE ---------------- */
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  /* ======================================================
     FETCH CLIENTS
     ====================================================== */
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);

      const res = await api.get("/clients");

      setClients(res.data || []);
      setAllClients(res.data || []);

    } catch (err) {

      console.error(err);
      setClients([]);
      setAllClients([]);

    } finally {

      setLoading(false);

    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  /* ======================================================
     LOCAL SEARCH
     ====================================================== */
  const handleSearch = (e) => {

    const value = e.target.value;
    setSearch(value);

    if (!value.trim()) {
      setClients(allClients);
      return;
    }

    const query = value.toLowerCase();

    const filtered = allClients.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query)
    );

    setClients(filtered);
  };

  /* ======================================================
     ADD CLIENT
     ====================================================== */
  const addClient = async (e) => {

    e.preventDefault();
    setError("");

    if (!name || !phone) {
      setError("Name & phone required");
      return;
    }

    try {

      setSaving(true);

      const res = await api.post("/clients", {
        name,
        phone,
        notes,
      });

      setClients((prev) => [res.data, ...prev]);
      setAllClients((prev) => [res.data, ...prev]);

      setName("");
      setPhone("");
      setNotes("");
      setShowModal(false);

    } catch (err) {

      console.error(err);
      setError("Failed to add client");

    } finally {

      setSaving(false);

    }
  };

  /* ======================================================
     DELETE CLIENT
     ====================================================== */
  const deleteClient = async (id) => {

    if (!window.confirm("Delete this client permanently?")) return;

    try {

      await api.delete(`/clients/${id}`);

      setClients((prev) =>
        prev.filter((c) => c._id !== id)
      );

      setAllClients((prev) =>
        prev.filter((c) => c._id !== id)
      );

    } catch (err) {

      console.error(err);
      alert("Failed to delete client");

    }
  };

  /* ======================================================
     HELPERS
     ====================================================== */
  const initials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  /* ======================================================
     RENDER
     ====================================================== */
  return (

    <div className="page-container flex flex-col h-full">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">

        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            Clients
          </h3>
          <p className="text-sm text-gray-600">
            Manage and access your salon’s clientele
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">

          <input
            className="border border-gray-300 rounded-lg px-3 py-2 w-full"
            placeholder="Search by name or phone number…"
            value={search}
            onChange={handleSearch}
          />

          <button
            className="btn-primary whitespace-nowrap"
            onClick={() => setShowModal(true)}
          >
            + New Client
          </button>

        </div>
      </div>


      {/* CLIENT GRID SCROLLABLE */}
      <div className="flex-1 overflow-y-auto mt-4">

        <div className="page-grid">

          {loading ? (

            <p className="text-gray-500">Loading…</p>

          ) : clients.length === 0 ? (

            <p className="text-gray-500">No clients found</p>

          ) : (

            clients.map((c) => (

              <Link
                key={c._id}
                to={`/clients/${c._id}`}
                className="block"
              >

                <div className="relative app-card hover:shadow-lg transition">

                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteClient(c._id);
                    }}
                  >
                    🗑️
                  </button>

                  <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-brandPink text-white flex items-center justify-center font-semibold">
                      {initials(c.name)}
                    </div>

                    <div>
                      <div className="font-semibold text-gray-900">
                        {c.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {c.phone}
                      </div>
                    </div>

                  </div>

                  <span className="inline-block mt-3 text-sm font-semibold text-brandPink">
                    View Profile →
                  </span>

                </div>

              </Link>

            ))
          )}

        </div>
      </div>


      {/* ADD CLIENT MODAL */}
      {showModal && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">

            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              onClick={() => setShowModal(false)}
            >
              ✕
            </button>

            <h5 className="font-bold text-lg mb-4">
              Add New Client
            </h5>

            {error && (
              <div className="bg-red-100 text-red-700 rounded-lg px-3 py-2 mb-4">
                {error}
              </div>
            )}

            <form
              onSubmit={addClient}
              className="grid gap-3"
            >

              <input
                className="border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Client name"
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
              />

              <input
                className="border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Phone number"
                value={phone}
                inputMode="numeric"
                maxLength="15"
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, ""))
                }
              />

              <input
                className="border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <button
                className="btn-primary mt-2"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Client"}
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default ClientsPage;