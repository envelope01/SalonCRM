import React, { useEffect, useState, useCallback } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
import MainHeader from "../components/MainHeader";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "",
    amount: "",
    notes: "",
  });

  const fetchData = useCallback(async (start, end) => {
    try {
      const [summaryRes, expRes] = await Promise.all([
        api.get(`/reports/summary?from=${start}&to=${end}`),
        api.get(`/expenses?from=${start}&to=${end}`)
      ]);
      setSummary(summaryRes.data);
      const sorted = (expRes.data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpensesList(sorted);
    } catch (err) {
      console.error("Fetch error", err);
    }
  }, []);

  const applyPreset = useCallback((type) => {
    setPeriod(type);
    const now = new Date();
    let start, end = new Date().toISOString().slice(0, 10);

    if (type === "today") start = end;
    else if (type === "week") {
      const diff = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1);
      start = new Date(now.setDate(diff)).toISOString().slice(0, 10);
    } else if (type === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    } else {
      start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
    }

    setFromDate(start);
    setToDate(end);
    fetchData(start, end);
  }, [fetchData]);

  useEffect(() => {
    applyPreset("year");
  }, [applyPreset]);

  // Chart Configs
  const barChartData = {
    labels: summary.byDay?.map((d) => new Date(d.date).getDate()) || [],
    datasets: [
      { label: "In", data: summary.byDay?.map((d) => d.earnings) || [], backgroundColor: "#10b981", borderRadius: 6 },
      { label: "Out", data: summary.byDay?.map((d) => d.expenses) || [], backgroundColor: "#ef4444", borderRadius: 6 },
    ],
  };

  const doughnutData = {
    labels: summary.expensesByCategory?.map((c) => c.category) || [],
    datasets: [{
      data: summary.expensesByCategory?.map((c) => c.total) || [],
      backgroundColor: ["#d63384", "#60a5fa", "#fbbf24", "#34d399", "#a78bfa"],
      borderWidth: 2,
    }],
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
{/* HEADER */}
      <MainHeader title="Reports">
        <div className="flex bg-gray-100 p-1 rounded-2xl mt-4">
          {["today", "week", "month", "year"].map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl capitalize transition-all ${
                period === p ? "bg-white shadow text-brandPink" : "text-gray-500"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        
        {/* Manual Date Indicators */}
        <div className="mt-3 flex justify-between items-center text-[10px] text-gray-400 font-medium px-1">
          <span>From: {fromDate}</span>
          <span>To: {toDate}</span>
        </div>
      </MainHeader>

      <main className="p-4 space-y-4">
        {/* KPI SECTION */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-gray-400 text-[10px] font-bold uppercase">Income</p>
            <p className="text-lg font-black text-emerald-600">₹{summary.totalEarnings.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-gray-400 text-[10px] font-bold uppercase">Expenses</p>
            <p className="text-lg font-black text-rose-500">₹{summary.totalExpenses.toLocaleString()}</p>
          </div>
        </div>

        {/* 3D FLIP CHART */}
        <div className="relative h-72 perspective-1000">
          <motion.div
            className="w-full h-full relative preserve-3d"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* FRONT: TREND */}
            <div className="absolute inset-0 backface-hidden bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-800">Income vs Expense</span>
                <span className="text-[9px] bg-brandPink/10 text-brandPink px-2 py-1 rounded-full uppercase">Tap to Flip</span>
              </div>
              <div className="h-48">
                <Bar data={barChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>
            </div>

            {/* BACK: PIE CHART */}
            <div 
              className="absolute inset-0 backface-hidden bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-100 rotate-y-180"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-800">Expense Breakdown</span>
                <span className="text-[9px] bg-brandPink/10 text-brandPink px-2 py-1 rounded-full uppercase">Tap to Flip</span>
              </div>
              <div className="h-48">
                <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 10 } } } } }} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* RECENT LIST */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Activity</h3>
            <button onClick={() => setShowHistoryModal(true)} className="text-brandPink text-xs font-bold">See All</button>
          </div>
          <div className="space-y-4">
            {expensesList.slice(0, 4).map((e) => (
              <div key={e._id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-sm">💸</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{e.category}</p>
                    <p className="text-[10px] text-gray-400">{new Date(e.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="font-bold text-rose-500 text-sm">-₹{e.amount}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowAddExpenseModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brandPink text-white rounded-2xl shadow-lg shadow-brandPink/30 flex items-center justify-center text-3xl z-30"
      >
        +
      </button>

{/* ADD EXPENSE SHEET */}
      <AnimatePresence>
        {showAddExpenseModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end"
            onClick={() => setShowAddExpenseModal(false)}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full rounded-t-[2.5rem] p-8 pb-12"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-black mb-6 text-gray-900">Add Expense</h2>
              
              <div className="space-y-5">
                {/* Amount Input */}
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₹</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={expenseForm.amount} // Using expenseForm here
                    className="w-full text-4xl font-black pl-6 py-3 focus:outline-none border-b-2 border-gray-100 focus:border-brandPink transition-colors"
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Date Input */}
                  <input 
                    type="date"
                    value={expenseForm.date} // Using expenseForm here
                    className="bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-700 outline-none"
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                  
                  {/* Category Select */}
                  <select 
                    value={expenseForm.category} // Using expenseForm here
                    className="bg-gray-50 p-4 rounded-2xl border-none text-sm font-semibold text-gray-700 outline-none appearance-none"
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Category</option>
                    <option value="Rent">Rent</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>

                {/* Notes Input */}
                <input 
                  type="text"
                  placeholder="Notes (Optional)"
                  value={expenseForm.notes} // Using expenseForm here
                  className="w-full bg-gray-50 p-4 rounded-2xl border-none text-sm outline-none"
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                />

                <button 
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                  onClick={() => {
                    console.log("Saving:", expenseForm);
                    setShowAddExpenseModal(false);
                  }}
                >
                  Save Transaction
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HISTORY MODAL (Simple implementation for the warning) */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-white z-[60] p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">All History</h2>
            <button onClick={() => setShowHistoryModal(false)} className="text-2xl">×</button>
          </div>
          {expensesList.map(e => (
            <div key={e._id} className="border-b py-3 flex justify-between">
              <span>{e.category}</span>
              <span className="font-bold">₹{e.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReportsPage;