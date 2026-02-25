import React, { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import api from "../api";
// styling handled with Tailwind, legacy CSS removed

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function ReportsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [period, setPeriod] = useState("month");
  const [isFlipped, setIsFlipped] = useState(false);

  const [summary, setSummary] = useState({
    totalEarnings: 0,
    totalExpenses: 0,
    netProfit: 0,
    byDay: [],
    expensesByCategory: [],
  });

  const [expensesList, setExpensesList] = useState([]);

  // MODAL STATE
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [fullHistory, setFullHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ADD FORM STATE
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().slice(0, 10), // Default to today
    category: "",
    amount: "",
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const getToday = () => new Date().toISOString().slice(0, 10);

  /* --- DATA FETCHING --- */
  const fetchData = async (start, end) => {
    try {
      const summaryRes = await api.get(
        `/reports/summary?from=${start}&to=${end}`
      );
      setSummary(summaryRes.data);

      const expRes = await api.get(`/expenses?from=${start}&to=${end}`);

      // FIX: Robust Sorting (Date DESC -> Then ID DESC)
      const sortedExpenses = (expRes.data || []).sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        // 1. Different dates? Sort by date (Newest first)
        if (dateB.getTime() !== dateA.getTime()) {
          return dateB - dateA;
        }

        // 2. Same date? Sort by ID (Newest entry first)
        // MongoDB IDs are strings that contain timestamps
        return (b._id || "").localeCompare(a._id || "");
      });

      setExpensesList(sortedExpenses);
    } catch (err) {
      console.error("Error fetching report data", err);
    }
  };

  const applyPreset = (type) => {
    setPeriod(type);
    const now = new Date();
    let start, end;

    if (type === "today") {
      start = end = getToday();
    } else if (type === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      start = monday.toISOString().slice(0, 10);
      end = getToday();
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      end = getToday();
    }
    setFromDate(start);
    setToDate(end);
    fetchData(start, end);
  };

  useEffect(() => {
    applyPreset("month");
    // eslint-disable-next-line
  }, []);

  /* --- VIEW ALL HISTORY --- */
  const handleViewAllHistory = async () => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res = await api.get("/expenses");

      // FIX: Apply same robust sorting here
      const sortedFull = (res.data || []).sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateB.getTime() !== dateA.getTime()) return dateB - dateA;
        return (b._id || "").localeCompare(a._id || "");
      });

      setFullHistory(sortedFull);
    } catch (err) {
      alert("Failed to load full history");
    } finally {
      setLoadingHistory(false);
    }
  };
  /* --- SAVE EXPENSE --- */
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.category || !expenseForm.amount) {
      alert("Please fill Category and Amount");
      return;
    }

    try {
      setIsSaving(true);
      await api.post("/expenses", {
        date: expenseForm.date,
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        notes: expenseForm.notes,
      });

      // Keep date same (user might want to add multiple for same day), reset others
      setExpenseForm((prev) => ({
        ...prev,
        category: "",
        amount: "",
        notes: "",
      }));

      fetchData(fromDate, toDate);
    } catch (err) {
      alert("Failed to save expense");
    } finally {
      setIsSaving(false);
    }
  };

  /* --- CHART DATA --- */
  const barChartData = {
    labels: summary.byDay?.map((d) => new Date(d.date).getDate()) || [],
    datasets: [
      {
        label: "Income",
        data: summary.byDay?.map((d) => d.earnings) || [],
        backgroundColor: "#198754",
        borderRadius: 4,
      },
      {
        label: "Expense",
        data: summary.byDay?.map((d) => d.expenses) || [],
        backgroundColor: "#dc3545",
        borderRadius: 4,
      },
    ],
  };

  const doughnutData = {
    labels: summary.expensesByCategory?.map((c) => c.category) || [],
    datasets: [
      {
        data: summary.expensesByCategory?.map((c) => c.total) || [],
        backgroundColor: [
          "#ff6384",
          "#36a2eb",
          "#ffce56",
          "#4bc0c0",
          "#9966ff",
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="page-container">
      {/* header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Finance Dashboard</h2>
          <p className="text-sm text-gray-600">
            Profit &amp; Loss Overview
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
          <button
            className={`px-3 py-1 rounded-md font-medium ${
              period === "today" ? "bg-pink-100 text-brandPink" : "text-gray-600"
            }`}
            onClick={() => applyPreset("today")}
          >
            Today
          </button>
          <button
            className={`px-3 py-1 rounded-md font-medium ${
              period === "week" ? "bg-pink-100 text-brandPink" : "text-gray-600"
            }`}
            onClick={() => applyPreset("week")}
          >
            Week
          </button>
          <button
            className={`px-3 py-1 rounded-md font-medium ${
              period === "month" ? "bg-pink-100 text-brandPink" : "text-gray-600"
            }`}
            onClick={() => applyPreset("month")}
          >
            Month
          </button>
          <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
            <input
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <span className="text-gray-500">–</span>
            <input
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
            <button
              className="ml-2 bg-gray-800 text-white px-3 py-1 rounded-md text-sm"
              onClick={() => fetchData(fromDate, toDate)}
            >
              Go
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        <div className="app-card border-b-4 border-green-500">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Total Income
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            ₹{summary.totalEarnings.toLocaleString()}
          </div>
        </div>
        <div className="app-card border-b-4 border-red-500">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Total Expenses
          </div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            ₹{summary.totalExpenses.toLocaleString()}
          </div>
        </div>
        <div className="app-card border-b-4 border-blue-500">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Net Profit
          </div>
          <div
            className="mt-1 text-2xl font-bold"
            style={{ color: summary.netProfit >= 0 ? "#333" : "#dc3545" }}
          >
            ₹{summary.netProfit.toLocaleString()}
          </div>
        </div>
      </div>

      {/* content */}
      <div className="flex flex-col lg:flex-row gap-4 mt-4 flex-1 min-h-0">
        {/* left panel */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 internal-scroll">
          {/* flip card */}
          <div className="relative">
            <div className="w-full h-72" style={{ perspective: 1200 }}>
              <div
                className="w-full h-full relative transition-transform duration-500"
                style={{ transform: isFlipped ? "rotateY(180deg)" : "none" }}
              >
                <div className="absolute inset-0 bg-white border border-gray-200 rounded-xl p-4 flex flex-col">
                  <div className="text-lg font-medium mb-2">
                    Income vs Expense
                  </div>
                  <div className="flex-1">
                    <Bar data={barChartData} options={{ maintainAspectRatio: false }} />
                  </div>
                </div>
                <div className="absolute inset-0 bg-white border border-gray-200 rounded-xl p-4 flex flex-col" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <div className="text-lg font-medium mb-2">
                    Profit &amp; Loss
                  </div>
                  <div className="flex-1">
                    <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
                  </div>
                </div>
              </div>
            </div>
            <button
              className="absolute top-2 right-2 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-pink-200 transition-transform"
              onClick={() => setIsFlipped((v) => !v)}
              title="Flip card"
            >
              🔄
            </button>
          </div>

          {/* recent expenses table */}
          <div className="app-card">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <h5 className="font-semibold">Recent Expenses</h5>
              <button
                className="text-sm text-brandPink underline"
                onClick={handleViewAllHistory}
              >
                View All History →
              </button>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {expensesList.slice(0, 10).map((e) => (
                  <tr key={e._id} className="odd:bg-gray-50">
                    <td className="py-2">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="py-2">{e.category}</td>
                    <td className="py-2">{e.notes || "-"}</td>
                    <td className="py-2 text-right font-semibold text-red-600">₹{e.amount}</td>
                  </tr>
                ))}
                {expensesList.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-500">
                      No expenses in this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* right panel */}
        <div className="app-card w-full lg:w-80 flex-shrink-0">
          <div className="flex justify-between items-center pb-2 mb-3 border-b border-gray-200">
            <h4 className="font-semibold">Add Expense</h4>
            <input
              type="date"
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              value={expenseForm.date}
              onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
            />
          </div>
          <form onSubmit={handleSaveExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount (₹)</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="0"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Details..."
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
              />
            </div>
            <button className="btn-primary w-full" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Expense"}
            </button>
          </form>
        </div>
      </div>

      {/* modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[70vh] rounded-xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">All Expense History</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th className="p-2 text-left text-gray-500">Date</th>
                    <th className="p-2 text-left text-gray-500">Category</th>
                    <th className="p-2 text-left text-gray-500">Notes</th>
                    <th className="p-2 text-right text-gray-500">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingHistory ? (
                    <tr><td colSpan="4" className="text-center p-4">Loading...</td></tr>
                  ) : (
                    fullHistory.map((e) => (
                      <tr key={e._id} className="odd:bg-gray-50">
                        <td className="p-2">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="p-2">{e.category}</td>
                        <td className="p-2 text-gray-600">{e.notes}</td>
                        <td className="p-2 text-right font-semibold text-red-600">₹{e.amount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
