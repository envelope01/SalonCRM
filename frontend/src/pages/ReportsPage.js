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
import "./reportsPage.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function ReportsPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [period, setPeriod] = useState("month");

  const [summary, setSummary] = useState({
    totalEarnings: 0,
    totalExpenses: 0,
    netProfit: 0,
    byDay: [],
    expensesByCategory: []
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
    notes: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  const getToday = () => new Date().toISOString().slice(0, 10);

  /* --- DATA FETCHING --- */
  const fetchData = async (start, end) => {
    try {
      const summaryRes = await api.get(`/reports/summary?from=${start}&to=${end}`);
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
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
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
        notes: expenseForm.notes
      });

      // Keep date same (user might want to add multiple for same day), reset others
      setExpenseForm(prev => ({ ...prev, category: "", amount: "", notes: "" }));

      fetchData(fromDate, toDate);

    } catch (err) {
      alert("Failed to save expense");
    } finally {
      setIsSaving(false);
    }
  };

  /* --- CHART DATA --- */
  const barChartData = {
    labels: summary.byDay?.map(d => new Date(d.date).getDate()) || [],
    datasets: [
      { label: "Income", data: summary.byDay?.map(d => d.earnings) || [], backgroundColor: "#198754", borderRadius: 4 },
      { label: "Expense", data: summary.byDay?.map(d => d.expenses) || [], backgroundColor: "#dc3545", borderRadius: 4 }
    ]
  };

  const doughnutData = {
    labels: summary.expensesByCategory?.map(c => c.category) || [],
    datasets: [{
      data: summary.expensesByCategory?.map(c => c.total) || [],
      backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", "#9966ff"],
      borderWidth: 0
    }]
  };

  return (
    <div className="reports-container">
      
      {/* 1. HEADER */}
      <div className="page-header">
        <div className="header-title">
          <h2>Finance Dashboard</h2>
          <p>Profit & Loss Overview</p>
        </div>
        <div className="controls-wrapper">
          <button className={`preset-btn ${period==='today'?'active':''}`} onClick={() => applyPreset('today')}>Today</button>
          <button className={`preset-btn ${period==='week'?'active':''}`} onClick={() => applyPreset('week')}>Week</button>
          <button className={`preset-btn ${period==='month'?'active':''}`} onClick={() => applyPreset('month')}>Month</button>
          <div className="date-range">
             <input type="date" className="date-input" value={fromDate} onChange={e=>setFromDate(e.target.value)} />
             <span>-</span>
             <input type="date" className="date-input" value={toDate} onChange={e=>setToDate(e.target.value)} />
             <button className="go-btn" onClick={() => fetchData(fromDate, toDate)}>Go</button>
          </div>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="kpi-row">
        <div className="kpi-card green">
          <span className="kpi-title">Total Income</span>
          <div className="kpi-value">₹{summary.totalEarnings.toLocaleString()}</div>
        </div>
        <div className="kpi-card red">
          <span className="kpi-title">Total Expenses</span>
          <div className="kpi-value">₹{summary.totalExpenses.toLocaleString()}</div>
        </div>
        <div className="kpi-card blue">
          <span className="kpi-title">Net Profit</span>
          <div className="kpi-value" style={{color: summary.netProfit >= 0 ? '#333' : '#dc3545'}}>
            ₹{summary.netProfit.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 3. CONTENT GRID */}
      <div className="content-grid">
        
        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="chart-container">
            <h4 className="section-title">Income vs Expenses (Daily)</h4>
            <div style={{height: '250px'}}>
              <Bar data={barChartData} options={{ maintainAspectRatio: false, responsive: true }} />
            </div>
          </div>

          <div className="expense-list-card">
            <div className="table-header">
                <span>Recent Expenses</span>
                <button className="view-history-btn" onClick={handleViewAllHistory}>
                    View All History →
                </button>
            </div>
            <table className="simple-table">
              <tbody>
                {/* Now expensesList is definitely sorted new to old */}
                {expensesList.slice(0, 5).map(e => (
                  <tr key={e._id}>
                    <td style={{width:'20%'}}>{new Date(e.date).toLocaleDateString()}</td>
                    <td style={{width:'30%'}}><strong>{e.category}</strong></td>
                    <td style={{color:'#888'}}>{e.notes || "-"}</td>
                    <td className="amount-red">₹{e.amount}</td>
                  </tr>
                ))}
                {expensesList.length === 0 && (
                  <tr><td colSpan="4" style={{textAlign:'center', padding:20, color:'#999'}}>No expenses in this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT PANEL: ADD EXPENSE */}
        <div className="right-panel">
          
          {/* FIX 2: HEADER WITH DATE PICKER */}
          <div className="add-expense-header">
             <h4>➕ Add Expense</h4>
             <input 
                type="date" 
                className="header-date-input"
                value={expenseForm.date}
                onChange={e => setExpenseForm({...expenseForm, date: e.target.value})}
             />
          </div>
          
          <form onSubmit={handleSaveExpense}>
            {/* Date input removed from here, moved to header */}

            <div className="form-group">
              <label className="form-label">Category</label>
              <select 
                className="modern-select" 
                value={expenseForm.category}
                onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
              >
                <option value="">Select...</option>
                <option value="Rent">Rent</option>
                <option value="Electricity">Electricity</option>
                <option value="Inventory">Inventory</option>
                <option value="Salary">Staff Salary</option>
                <option value="Marketing">Marketing</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Tea/Snacks">Tea/Snacks</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input 
                type="number" 
                className="modern-input" 
                placeholder="0"
                value={expenseForm.amount}
                onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <input 
                type="text" 
                className="modern-input" 
                placeholder="Details..."
                value={expenseForm.notes}
                onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})}
              />
            </div>

            <button type="submit" className="save-btn" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Expense"}
            </button>
          </form>

          <div className="doughnut-wrapper">
             <div className="doughnut-title">Breakdown</div>
             <div style={{height: 160, width: '100%', display:'flex', justifyContent:'center'}}>
                {summary.totalExpenses > 0 ? (
                   <Doughnut 
                     data={doughnutData} 
                     options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} 
                   />
                ) : <div style={{color:'#ccc', alignSelf:'center'}}>No Data</div>}
             </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showHistoryModal && (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>All Expense History</h3>
                    <button className="close-modal-btn" onClick={() => setShowHistoryModal(false)}>×</button>
                </div>
                <div className="modal-body">
                    {loadingHistory ? (
                        <div style={{textAlign:'center', padding:30}}>Loading full history...</div>
                    ) : (
                        <table className="simple-table">
                            <thead style={{position:'sticky', top:0, background:'#fff'}}>
                                <tr>
                                    <th style={{textAlign:'left', padding:'10px 20px', color:'#888'}}>Date</th>
                                    <th style={{textAlign:'left', padding:'10px 20px', color:'#888'}}>Category</th>
                                    <th style={{textAlign:'left', padding:'10px 20px', color:'#888'}}>Notes</th>
                                    <th style={{textAlign:'right', padding:'10px 20px', color:'#888'}}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fullHistory.map(e => (
                                    <tr key={e._id}>
                                        <td>{new Date(e.date).toLocaleDateString()}</td>
                                        <td>{e.category}</td>
                                        <td style={{color:'#888'}}>{e.notes}</td>
                                        <td className="amount-red">₹{e.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default ReportsPage;