import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import api from "../api";
// styling switched to Tailwind, old CSS removed

/* ======================================================
   CLIENT DETAIL PAGE
   ====================================================== */
function ClientDetailPage() {
  /* ---------------- ROUTING ---------------- */
  const { id } = useParams();
  const navigate = useNavigate();

  /* ---------------- STATE ---------------- */
  const [client, setClient] = useState(null);
  const [services, setServices] = useState([]);
  const [visits, setVisits] = useState([]);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    notes: "",
  });

  const [visitDate, setVisitDate] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [visitServices, setVisitServices] = useState([]);
  const [visitNotes, setVisitNotes] = useState("");

  /* ======================================================
     GUARD
     ====================================================== */
  useEffect(() => {
    if (!id) {
      navigate("/", { replace: true });
    }
  }, [id, navigate]);

  /* ======================================================
     LOAD DATA
     ====================================================== */
  useEffect(() => {
    const load = async () => {
      const [clientRes, serviceRes, visitRes] =
        await Promise.all([
          api.get(`/clients/${id}`),
          api.get("/services"),
          api.get(`/visits/client/${id}`),
        ]);

      setClient(clientRes.data);

      setForm({
        name: clientRes.data.name,
        phone: clientRes.data.phone,
        notes: clientRes.data.notes || "",
      });

      setServices(
        serviceRes.data.filter((s) => s.isActive)
      );

      setVisits(visitRes.data);
      setVisitDate(
        new Date().toISOString().slice(0, 10)
      );
    };

    load();
  }, [id]);

  /* ======================================================
     CLIENT UPDATE
     ====================================================== */
  const saveClient = async () => {
    const res = await api.put(`/clients/${id}`, form);
    setClient(res.data);
    setEditing(false);
  };

  /* ======================================================
     VISIT BILLING LOGIC
     ====================================================== */
  const addServiceToVisit = () => {
    const svc = services.find(
      (s) => s._id === selectedServiceId
    );

    if (!svc) return;

    setVisitServices((prev) => [
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
    setVisitServices((prev) =>
      prev.map((s, i) =>
        i === index
          ? {
              ...s,
              chargedPrice: Math.max(
                0,
                Number(value) || 0
              ),
            }
          : s
      )
    );
  };

  const removeService = (index) => {
    setVisitServices((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const currentTotal = useMemo(
    () =>
      visitServices.reduce(
        (sum, s) => sum + s.chargedPrice,
        0
      ),
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
      services: visitServices.map((s) => ({
        serviceId: s._id,
        chargedPrice: s.chargedPrice,
      })),
      notes: visitNotes,
      totalAmount: currentTotal,
    });

    const refreshed = await api.get(
      `/visits/client/${id}`
    );

    setVisits(refreshed.data);
    setVisitServices([]);
    setVisitNotes("");
  };

  /* ======================================================
     DERIVED DATA
     ====================================================== */
  if (!client) return null;

  const lastVisit = visits[0];

  /* ======================================================
     RENDER
     ====================================================== */
  return (
    <div className="page-container">
      {/* profile section */}
      <div className="app-card flex flex-col lg:flex-row gap-6">
        <div className="relative flex-1">
          <button
            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-pink-100 text-brandPink hover:bg-brandPink hover:text-white transition"
            onClick={() => setEditing((v) => !v)}
          >
            ✎
          </button>

          {!editing ? (
            <div>
              <h2 className="text-xl font-bold">
                {client.name}
              </h2>
              <div className="text-gray-600">
                {client.phone}
              </div>
              <div className="mt-4 p-4 bg-pink-50 rounded-lg text-gray-700">
                {client.notes || "Persistent Note"}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
              />

              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
              />

              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={form.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes: e.target.value,
                  })
                }
              />

              <div className="flex gap-2 mt-2">
                <button
                  className="btn-primary"
                  onClick={saveClient}
                >
                  Save
                </button>

                <button
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-600"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 p-4 bg-gradient-to-br from-white to-pink-50 border border-pink-200 rounded-lg">
          <h5 className="text-md font-semibold text-brandPink">
            Last Visit Summary
          </h5>

          {lastVisit ? (
            <>
              <div className="text-sm text-gray-600 mb-2">
                {new Date(lastVisit.visitDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>

              {lastVisit.services.map((s, i) => (
                <div
                  key={i}
                  className="flex justify-between text-sm mb-1"
                >
                  <span>{s.name}</span>
                  <strong>₹{s.chargedPrice}</strong>
                </div>
              ))}

              <div className="flex justify-between mt-4 pt-2 border-t border-pink-200 text-lg font-bold text-brandPink">
                <span>Total</span>
                <span>₹{lastVisit.totalAmount}</span>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-sm">
              No visits yet
            </div>
          )}
        </div>
      </div>

      {/* bottom grid */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* visit history */}
        <div className="app-card flex flex-col flex-1 min-h-0">
          <h4 className="text-lg font-semibold mb-4">Visit History</h4>
          <div className="flex-1 min-h-0 internal-scroll">
            {visits.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No history available
              </div>
            )}
            {visits.map((v, index) => (
              <div key={v._id} className="flex mb-6">
                <div className="w-12 text-right pr-2">
                  <span className="text-xs font-semibold text-gray-600">
                    {new Date(v.visitDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-brandPink border-2 border-pink-100"></div>
                  {index !== visits.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200"></div>
                  )}
                </div>
                <div className="pl-4">
                  <div className="text-sm font-medium text-gray-800">
                    {v.services.map((s) => s.name).join(", ")}
                  </div>
                  <div className="text-sm font-semibold text-brandPink">
                    ₹{v.totalAmount}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* billing */}
        <div className="app-card flex flex-col flex-1 min-h-0">
          {/* header */}
          <div className="p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold">
                New Visit Billing
              </h4>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <select
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                value={selectedServiceId}
                onChange={(e) =>
                  setSelectedServiceId(e.target.value)
                }
              >
                <option value="">Select service to add...</option>
                {services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} (₹{s.price})
                  </option>
                ))}
              </select>
              <button
                className="bg-gray-800 text-white rounded-lg px-3"
                onClick={addServiceToVisit}
                disabled={!selectedServiceId}
              >
                +
              </button>
            </div>
          </div>

          {/* chips / content */}
          <div className="flex-1 min-h-0 internal-scroll p-4 bg-gray-50">
            {visitServices.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Select services above to create a bill</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {visitServices.map((s, i) => {
                  const diff = s.chargedPrice - s.basePrice;
                  return (
                    <div key={i} className="relative flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 shadow-sm">
                      <span className="text-sm font-medium">
                        {s.name}
                      </span>
                      <div className="flex items-center bg-gray-100 rounded px-1 text-sm font-semibold text-brandPink">
                        <span>₹</span>
                        <input
                          type="number"
                          className="w-12 bg-transparent text-right focus:outline-none"
                          value={s.chargedPrice}
                          onChange={(e) =>
                            updateChargedPrice(i, e.target.value)
                          }
                          onClick={(e) => e.target.select()}
                        />
                      </div>
                      <button
                        className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs"
                        onClick={() => removeService(i)}
                      >
                        ×
                      </button>
                      {diff !== 0 && (
                        <span
                          className={`absolute -top-2 -right-6 text-xs font-bold ${
                            diff < 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {diff < 0 ? "-" : "+"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* footer */}
          <div className="p-4">
            <input
              type="text"
              className="w-full border-b border-gray-300 pb-1 mb-2"
              placeholder="Add a remark or note..."
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
            />

            <div className="flex justify-between items-center">
              <div>
                <small className="text-gray-500">Total Bill</small>
                <div className="text-2xl font-bold">
                  ₹{currentTotal}
                </div>
              </div>
              <button onClick={addVisit} className="btn-primary">
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
