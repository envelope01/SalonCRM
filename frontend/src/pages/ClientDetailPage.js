import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "./clientDetail.css";

function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [visits, setVisits] = useState([]);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });

  const [visitDate, setVisitDate] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [visitServices, setVisitServices] = useState([]);

  const [visitNotes, setVisitNotes] = useState("");

  /* ---------- GUARD ---------- */
  useEffect(() => {
    if (!id) navigate("/", { replace: true });
  }, [id, navigate]);

  /* ---------- LOAD DATA ---------- */
  useEffect(() => {
    const load = async () => {
      const [c, s, v] = await Promise.all([
        api.get(`/clients/${id}`),
        api.get("/services"),
        api.get(`/visits/client/${id}`),
      ]);

      setClient(c.data);
      setForm({
        name: c.data.name,
        phone: c.data.phone,
        notes: c.data.notes || "",
      });

      setServices(s.data.filter(x => x.isActive));
      setVisits(v.data);
      setVisitDate(new Date().toISOString().slice(0, 10));
    };

    load();
  }, [id]);

  /* ---------- CLIENT ---------- */
  const saveClient = async () => {
    const res = await api.put(`/clients/${id}`, form);
    setClient(res.data);
    setEditing(false);
  };

  /* ---------- VISIT BILLING ---------- */
  const addServiceToVisit = () => {
    const svc = services.find(s => s._id === selectedServiceId);
    if (!svc) return;

    setVisitServices(prev => [
      ...prev,
      {
        _id: svc._id,
        name: svc.name,
        basePrice: svc.price,
        chargedPrice: svc.price,
      },
    ]);

    setSelectedServiceId("");
  };

  const updateChargedPrice = (index, value) => {
    setVisitServices(prev =>
      prev.map((s, i) =>
        i === index
          ? { ...s, chargedPrice: Math.max(0, Number(value) || 0) }
          : s
      )
    );
  };

  const removeService = index => {
    setVisitServices(prev => prev.filter((_, i) => i !== index));
  };

  const currentTotal = useMemo(
    () => visitServices.reduce((sum, s) => sum + s.chargedPrice, 0),
    [visitServices]
  );

  const addVisit = async () => {
    if (!visitServices.length) {
      alert("Please add at least one service");
      return;
    }

    await api.post("/visits", {
      clientId: id,
      visitDate,
      services: visitServices.map(s => ({
        serviceId: s._id,
        chargedPrice: s.chargedPrice,
      })),
      notes: visitNotes,
      totalAmount: currentTotal,
    });

    const refreshed = await api.get(`/visits/client/${id}`);
    setVisits(refreshed.data);

    setVisitServices([]);
    setVisitNotes("");
  };

  if (!client) return null;
  const lastVisit = visits[0];

  /* ---------- UI ---------- */
  return (
    <div className="client-detail-container">

      {/* ===== PROFILE ===== */}
      <div className="card profile-card">
        <div className="profile-left">
          <button
            className="edit-client-btn"
            onClick={() => setEditing(v => !v)}
          >
            ✎
          </button>
          {!editing ? (
            <>
              <h2>{client.name}</h2>
              <div className="muted">{client.phone}</div>
              <div className="notes-text">
                {client.notes || "Persistent Note"}
              </div>
            </>
          ) : (
            <>
              <input
                className="edit-input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="edit-input"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
              <textarea
                className="edit-textarea"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
              />
              <div className="edit-actions">
                <button className="btn-primary" onClick={saveClient}>Save</button>
                <button className="btn-cancel" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </>
          )}
        </div>

        <div className="profile-right">
          <h5>Last Visit Summary</h5>
          {lastVisit ? (
            <>
              <div className="last-date">
                {new Date(lastVisit.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              {lastVisit.services.map((s, i) => (
                <div key={i} className="service-row">
                  <span>{s.name}</span>
                  <strong>₹{s.chargedPrice}</strong>
                </div>
              ))}
              <div className="last-total">
                <span>Total</span>
                <strong>₹{lastVisit.totalAmount}</strong>
              </div>
            </>
          ) : (
            <div className="muted small">No visits yet</div>
          )}
        </div>
      </div>

      {/* ===== BOTTOM GRID (SWAPPED: History Left, Billing Right) ===== */}
      <div className="bottom-grid">

        {/* 1. LEFT SIDE: VISIT HISTORY (Timeline) */}
        <div className="card timeline-card">
          <h4>Visit History</h4>
          <div className="timeline-container">
            {visits.map((v, index) => (
              <div key={v._id} className="timeline-item">
                {/* 1. Left: Time/Date */}
                <div className="timeline-left">
                  <span className="time-text">
                    {new Date(v.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                {/* 2. Center: Dot & Line */}
                <div className="timeline-separator">
                  <div className="t-dot"></div>
                  {index !== visits.length - 1 && <div className="t-connector"></div>}
                </div>

                {/* 3. Right: Content */}
                <div className="timeline-content">
                  <div className="t-services">
                    {v.services.map(s => s.name).join(", ")}
                  </div>
                  <div className="t-price">₹{v.totalAmount}</div>
                </div>
              </div>
            ))}

            {visits.length === 0 && (
              <div className="empty-state">No history available</div>
            )}
          </div>
        </div>

        {/* 2. RIGHT SIDE: BILLING (With Chips) */}
        <div className="card add-visit-card">
          
          {/* HEADER */}
          <div className="billing-header">
            <div className="header-top-row">
              <h4>New Visit Billing</h4>
              <input
                type="date"
                className="compact-date-input"
                value={visitDate}
                onChange={e => setVisitDate(e.target.value)}
              />
            </div>

            <div className="input-group">
              <select
                className="service-select-modern"
                value={selectedServiceId}
                onChange={e => setSelectedServiceId(e.target.value)}
              >
                <option value="">Select service to add...</option>
                {services.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name} (₹{s.price})
                  </option>
                ))}
              </select>
              <button
                className="add-btn-modern"
                onClick={addServiceToVisit}
                disabled={!selectedServiceId}
              >
                +
              </button>
            </div>
          </div>

          {/* CHIPS AREA */}
          <div className="billing-scroll-area">
            {visitServices.length === 0 ? (
              <div className="billing-empty-state">
                <p>Select services above to create a bill</p>
              </div>
            ) : (
              <div className="chips-container">
                {visitServices.map((s, i) => {
                  const diff = s.chargedPrice - s.basePrice;
                  return (
                    <div key={i} className="service-chip">
                      <div className="chip-content">
                        <span className="chip-name">{s.name}</span>
                        <div className="chip-price-box">
                          <span className="tiny-symbol">₹</span>
                          <input
                            type="number"
                            className="chip-price-input"
                            value={s.chargedPrice}
                            onChange={e => updateChargedPrice(i, e.target.value)}
                            onClick={(e) => e.target.select()}
                          />
                        </div>
                      </div>
                      <button className="chip-remove" onClick={() => removeService(i)}>×</button>

                      {diff !== 0 && (
                        <span className={`chip-badge ${diff < 0 ? 'disc' : 'extra'}`}>
                          {diff < 0 ? '-' : '+'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="billing-footer">
            <input
              type="text"
              className="compact-notes"
              placeholder="Add a remark or note..."
              value={visitNotes}
              onChange={e => setVisitNotes(e.target.value)}
            />
            <div className="checkout-row">
              <div className="total-label">
                <small>Total Bill</small>
                <div className="total-value">₹{currentTotal}</div>
              </div>
              <button className="checkout-btn" onClick={addVisit}>
                Save & Print
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default ClientDetailPage;