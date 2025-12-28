import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "./clientsPage.css";

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Add client
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  /* ================= FETCH CLIENTS ================= */
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

  /* ================= LOCAL FAST SEARCH ================= */
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);

    if (!value.trim()) {
      setClients(allClients);
      return;
    }

    const query = value.toLowerCase();

    const filtered = allClients.filter(
      (c) => c.name.toLowerCase().includes(query) || c.phone.includes(query)
    );

    setClients(filtered);
  };

  /* ================= ADD CLIENT ================= */
  const addClient = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !phone) {
      setError("Name & phone required");
      return;
    }

    try {
      setSaving(true);
      const res = await api.post("/clients", { name, phone, notes });

      // update BOTH lists
      setClients((prev) => [res.data, ...prev]);
      setAllClients((prev) => [res.data, ...prev]);

      setName("");
      setPhone("");
      setNotes("");
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError("Failed to add client");
    } finally {
      setSaving(false);
    }
  };

  /* ================= DELETE CLIENT ================= */
  const deleteClient = async (id) => {
    if (!window.confirm("Delete this client permanently?")) return;

    try {
      await api.delete(`/clients/${id}`);
      setClients((prev) => prev.filter((c) => c._id !== id));
      setAllClients((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete client");
    }
  };

  const initials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  return (
    <div className="container-fluid px-4">
      {/* HEADER */}
      <div className="clients-top">
        <div>
          <h3 className="page-title">Clients</h3>
          <p className="page-subtitle">
            Manage and access your salon’s clientele
          </p>
        </div>

        <button
          className="add-client-btn"
          onClick={() => setShowForm((v) => !v)}
        >
          + New Client
        </button>
      </div>

      {/* SEARCH */}
      <input
        className="client-search"
        placeholder="Search by name or phone number…"
        value={search}
        onChange={handleSearch}
      />

      {/* ADD CLIENT FORM */}
      {showForm && (
        <div className="lux-card mt-3">
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={addClient} className="row g-2">
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Client name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Phone number"
                value={phone}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={15}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, "");
                  setPhone(digitsOnly);
                }}
              />
            </div>

            <div className="col-md-4">
              <input
                className="form-control"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="col-12 text-end">
              <button className="save-client-btn" disabled={saving}>
                {saving ? "Saving..." : "Save Client"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CLIENT GRID */}
      <div className="clients-grid mt-4">
        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : clients.length === 0 ? (
          <p className="text-muted">No clients found</p>
        ) : (
          clients.map((c) => (
            <Link
              key={c._id}
              to={`/clients/${c._id}`}
              className="client-card-link"
            >
              <div className="client-card lux-card">
                <button
                  className="delete-client-btn"
                  onClick={(e) => {
                    e.preventDefault(); // stop Link navigation
                    e.stopPropagation(); // stop bubbling
                    deleteClient(c._id);
                  }}
                >
                  🗑️
                </button>

                <div className="client-row">
                  <div className="client-avatar">{initials(c.name)}</div>
                  <div>
                    <div className="client-name">{c.name}</div>
                    <div className="client-phone">{c.phone}</div>
                  </div>
                </div>

                <span className="open-client">View Profile →</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default ClientsPage;
