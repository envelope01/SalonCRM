import React, { useEffect, useState, useCallback } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
import MainHeader from "../components/MainHeader";
import TrashIcon from "../components/TrashIcon";
import { useConfirm } from "../dialogs/ConfirmDialogProvider";
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
import { expenseService } from "../services/expenseService";
import { reportService } from "../services/reportService";
import { expenseValidationError, parseMoney } from "../utils/validation";
import { toast } from "../notifications/toastBus";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function Icon({ children, className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const receiptIcon = (
  <Icon>
    <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z" />
    <path d="M9 7h6" />
    <path d="M9 11h6" />
    <path d="M9 15h4" />
  </Icon>
);

function ReportsPage() {
  const confirm = useConfirm();
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
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState("");
  
  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "",
    amount: "",
    notes: "",
  });

  const fetchData = useCallback(async (start, end) => {
    try {
      const [summaryRes, expRes] = await Promise.all([
        reportService.getSummary({ from: start, to: end }),
        expenseService.getExpenses({ from: start, to: end })
      ]);
      setSummary(summaryRes.data);
      const sorted = (expRes.data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpensesList(sorted);
    } catch {
      setSummary({
        totalEarnings: 0,
        totalExpenses: 0,
        netProfit: 0,
        byDay: [],
        expensesByCategory: [],
      });
      setExpensesList([]);
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

  const applyCustomRange = () => {
    if (!fromDate && !toDate) {
      toast.warning("Select at least one custom date");
      return;
    }

    setPeriod("custom");
    fetchData(fromDate, toDate);
  };

  useEffect(() => {
    applyPreset("today");
  }, [applyPreset]);

  const saveExpense = async () => {
    const validationError = expenseValidationError(expenseForm);
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    try {
      setIsSavingExpense(true);
      await expenseService.createExpense({
        date: expenseForm.date,
        category: expenseForm.category.trim(),
        amount: parseMoney(expenseForm.amount),
        notes: expenseForm.notes.trim(),
      });
      setShowAddExpenseModal(false);
      setExpenseForm({
        date: new Date().toISOString().slice(0, 10),
        category: "",
        amount: "",
        notes: "",
      });
      fetchData(fromDate, toDate);
      toast.success("Expense saved successfully");
    } catch {
    } finally {
      setIsSavingExpense(false);
    }
  };

  const deleteExpense = async (expense) => {
    const confirmed = await confirm({
      title: "Delete expense?",
      message: `Delete ${expense.category} expense of ₹${expense.amount}?`,
      confirmLabel: "Delete",
      cancelLabel: "Keep",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingExpenseId(expense._id);
      await expenseService.deleteExpense(expense._id);
      await fetchData(fromDate, toDate);
      toast.success("Expense deleted successfully");
    } catch {
    } finally {
      setDeletingExpenseId("");
    }
  };

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
      <MainHeader title="Reports">
        <div className="mt-3 flex rounded-xl bg-gray-100 p-1">
          {["today", "week", "month", "year", "custom"].map((p) => (
            <button
              key={p}
              onClick={() => (p === "custom" ? setPeriod("custom") : applyPreset(p))}
              className={`flex-1 rounded-lg py-2 text-[11px] font-semibold capitalize transition-all ${
                period === p ? "bg-white text-gray-950 shadow-sm" : "text-gray-500"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        
        {period === "custom" ? (
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mt-3">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="min-w-0 rounded-xl bg-gray-100 px-3 py-3 text-xs font-semibold text-gray-700 outline-none"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="min-w-0 rounded-xl bg-gray-100 px-3 py-3 text-xs font-semibold text-gray-700 outline-none"
            />
            <button
              type="button"
              onClick={applyCustomRange}
              className="rounded-xl bg-primary px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-brandPink/20 transition-transform active:scale-95"
            >
              Go
            </button>
          </div>
        ) : (
          <div className={`mt-3 flex items-center text-xs font-bold text-gray-500 px-1 ${
            period === "today" ? "justify-center" : "justify-center gap-3"
          }`}>
            {period === "today" ? (
              <span>{fromDate}</span>
            ) : (
              <>
                <span>From: {fromDate}</span>
                <span className="text-gray-300">|</span>
                <span>To: {toDate}</span>
              </>
            )}
          </div>
        )}
      </MainHeader>

      <main className="p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase text-gray-400">Income</p>
            <p className="text-lg font-semibold text-emerald-600">₹{summary.totalEarnings.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase text-gray-400">Expenses</p>
            <p className="text-lg font-semibold text-rose-500">₹{summary.totalExpenses.toLocaleString()}</p>
          </div>
          <div className="col-span-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:col-span-1">
            <p className="text-[10px] font-semibold uppercase text-gray-400">Profit</p>
            <p className={`text-lg font-semibold ${summary.netProfit >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
              &#8377;{summary.netProfit.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="relative h-72 perspective-1000">
          <motion.div
            className="w-full h-full relative preserve-3d"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className="absolute inset-0 backface-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-800">Income vs Expense</span>
                <span className="rounded-full bg-brandPink/10 px-2 py-1 text-[9px] uppercase text-brandPink">Tap to flip</span>
              </div>
              <div className="h-48">
                <Bar data={barChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>
            </div>

            <div 
              className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-800">Expense Breakdown</span>
                <span className="rounded-full bg-brandPink/10 px-2 py-1 text-[9px] uppercase text-brandPink">Tap to flip</span>
              </div>
              <div className="h-48">
                <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, font: { size: 10 } } } } }} />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Activity</h3>
            <button onClick={() => setShowHistoryModal(true)} className="text-brandPink text-xs font-bold">See All</button>
          </div>
          <div className="space-y-4">
            {expensesList.slice(0, 4).map((e) => (
              <div key={e._id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-500">{receiptIcon}</div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{e.category}</p>
                    <p className="text-[10px] text-gray-400">{new Date(e.date).toLocaleDateString()}</p>
                    {e.notes && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{e.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="font-bold text-rose-500 text-sm">-&#8377;{e.amount}</p>
                  <button
                    type="button"
                    disabled={deletingExpenseId === e._id}
                    onClick={() => deleteExpense(e)}
                    className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 active:scale-90 transition-transform disabled:opacity-60"
                    aria-label={`Delete ${e.category} expense`}
                  >
                    {deletingExpenseId === e._id ? "..." : <TrashIcon />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <button
        onClick={() => {
          setShowAddExpenseModal(true);
        }}
        className="fab-button"
        aria-label="Add expense"
      >
        +
      </button>

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
              className="bottom-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <h2 className="mb-5 text-lg font-semibold text-gray-950">Add Expense</h2>
              
              <div className="space-y-5">
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xl font-semibold text-gray-400">₹</span>
                  <input 
                    type="number" 
                    min="0"
                    step="1"
                    placeholder="0.00" 
                    value={expenseForm.amount}
                    className="w-full border-b-2 border-gray-100 py-3 pl-6 text-3xl font-semibold outline-none transition-colors focus:border-brandPink"
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="date"
                    required
                    value={expenseForm.date}
                    className="input-soft"
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                  
                  <select 
                    value={expenseForm.category}
                    className="input-soft appearance-none"
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Category</option>
                    <option value="Rent">Rent</option>
                    <option value="Light Bill">Light Bill</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Notes (Optional)"
                  value={expenseForm.notes}
                  maxLength="1000"
                  className="input-soft"
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                />

                <button 
                  disabled={isSavingExpense}
                  className="btn-primary w-full"
                  onClick={saveExpense}
                >
                  {isSavingExpense ? "Saving..." : "Save Transaction"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end bg-gray-950/40 px-3 pb-3 pt-12 sm:items-center sm:justify-center sm:p-5"
            onClick={() => setShowHistoryModal(false)}
          >
            <motion.div
              initial={{ y: 28, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 28, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 240 }}
              className="flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl sm:max-h-[76vh]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-gray-100 px-5 py-4">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 sm:hidden" />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Expense History</p>
                    <h2 className="mt-1 text-lg font-semibold text-gray-950">All expenses</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-xl font-semibold text-gray-500 active:scale-95"
                    aria-label="Close expense history"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
                {expensesList.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                      {receiptIcon}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-gray-900">No expenses found</p>
                    <p className="mt-1 text-xs font-medium text-gray-400">Try another date range or add a new expense.</p>
                  </div>
                ) : expensesList.map((e) => (
                  <div key={e._id} className="flex justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{e.category}</p>
                      <p className="text-xs font-medium text-gray-400">{new Date(e.date).toLocaleDateString()}</p>
                      {e.notes && (
                        <p className="mt-1 break-words text-xs leading-relaxed text-gray-500">{e.notes}</p>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className="text-sm font-semibold text-rose-500">-&#8377;{e.amount}</span>
                      <button
                        type="button"
                        disabled={deletingExpenseId === e._id}
                        onClick={() => deleteExpense(e)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-100 bg-rose-50 text-rose-500 transition-transform active:scale-90 disabled:opacity-60"
                        aria-label={`Delete ${e.category} expense`}
                      >
                        {deletingExpenseId === e._id ? "..." : <TrashIcon />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ReportsPage;
