import React, { useState, useMemo } from 'react';

const Icon = {
  LayoutDashboard: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Receipt: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Grid: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  Target: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0-6a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
    </svg>
  ),
  Plus: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  ArrowUpRight: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
    </svg>
  ),
  ArrowDownLeft: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 7L7 17M7 17h10M7 17V7" />
    </svg>
  ),
  X: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  History: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Search: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Edit: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Trash: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Check: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  LogOut: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  PieChart: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
  ),
  TrendingUp: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  DollarSign: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v22m5-18H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  Sliders: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  Filter: ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  ExternalLink: ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
};

const INITIAL_CATEGORIES = [
  { id: 'cat-1', name: 'Housing & Rent', color: '#6366f1', budgetLimit: 1800, icon: '🏠', type: 'expense' },
  { id: 'cat-2', name: 'Groceries & Dining', color: '#10b981', budgetLimit: 850, icon: '🍔', type: 'expense' },
  { id: 'cat-3', name: 'Tech & Gadgets', color: '#3b82f6', budgetLimit: 600, icon: '💻', type: 'expense' },
  { id: 'cat-4', name: 'Entertainment & Leisure', color: '#ec4899', budgetLimit: 400, icon: '🎟️', type: 'expense' },
  { id: 'cat-5', name: 'Transport & Fuel', color: '#f59e0b', budgetLimit: 350, icon: '🚗', type: 'expense' },
  { id: 'cat-6', name: 'Salary & Income', color: '#22c55e', budgetLimit: 0, icon: '💼', type: 'income' },
];

const INITIAL_ACCOUNTS = [
  { id: 'acc-1', name: 'Bank Account', type: 'Bank', balance: 5420.00, icon: '🏦', provider: 'City Bank / Chase', color: '#6366f1', addedDate: '2025-01-10' },
  { id: 'acc-2', name: 'bKash Wallet', type: 'MFS', balance: 1450.00, icon: '📱', provider: 'bKash Direct', color: '#e11d48', addedDate: '2025-03-22' },
  { id: 'acc-3', name: 'Nagad Wallet', type: 'MFS', balance: 820.00, icon: '📲', provider: 'Nagad Digital', color: '#f97316', addedDate: '2025-06-05' },
  { id: 'acc-4', name: 'Cash in Hand', type: 'Cash', balance: 380.00, icon: '💵', provider: 'Physical Wallet', color: '#10b981', addedDate: '2024-11-01' },
];

const INITIAL_TRANSACTIONS = [
  {
    id: 'tx-101',
    title: 'Monthly Apartment Rent',
    amount: 1550,
    type: 'expense',
    categoryId: 'cat-1',
    accountId: 'acc-1',
    date: '2026-08-01',
    status: 'completed',
    note: 'Wire transfer processed via Chase automated clearing house.',
    events: [
      { id: 'e1', type: 'CREATED', timestamp: '2026-08-01 09:00 AM', user: 'Alex Morgan', detail: 'Initial recurring ledger creation' },
      { id: 'e2', type: 'VERIFIED', timestamp: '2026-08-01 09:02 AM', user: 'System Bot', detail: 'Automated bank match successful' }
    ]
  },
  {
    id: 'tx-102',
    title: 'TechCorp Salary Deposit',
    amount: 6200,
    type: 'income',
    categoryId: 'cat-6',
    accountId: 'acc-1',
    date: '2026-08-02',
    status: 'completed',
    note: 'Bi-weekly payroll distribution direct deposit.',
    events: [
      { id: 'e3', type: 'CREATED', timestamp: '2026-08-02 06:15 AM', user: 'Direct Deposit', detail: 'ACH payment received' }
    ]
  },
  {
    id: 'tx-103',
    title: 'Whole Foods Market',
    amount: 184.50,
    type: 'expense',
    categoryId: 'cat-2',
    accountId: 'acc-2',
    date: '2026-08-04',
    status: 'completed',
    note: 'Weekly organic groceries stock-up scanned via mobile app.',
    events: [
      { id: 'e4', type: 'CREATED', timestamp: '2026-08-04 04:30 PM', user: 'Alex Morgan', detail: 'Receipt scanned via mobile app' }
    ]
  },
  {
    id: 'tx-104',
    title: 'Apple Store - M3 Pro Upgrade',
    amount: 549.00,
    type: 'expense',
    categoryId: 'cat-3',
    accountId: 'acc-1',
    date: '2026-08-06',
    status: 'completed',
    note: 'Purchased accessories & trade-in balance.',
    events: [
      { id: 'e5', type: 'CREATED', timestamp: '2026-08-06 11:20 AM', user: 'Alex Morgan', detail: 'Card payment authorized' },
      { id: 'e6', type: 'CATEGORY_CHANGED', timestamp: '2026-08-06 11:25 AM', user: 'Alex Morgan', detail: 'Reassigned from Shopping to Tech' }
    ]
  },
  {
    id: 'tx-105',
    title: 'Shell Gas Station',
    amount: 65.20,
    type: 'expense',
    categoryId: 'cat-5',
    accountId: 'acc-3',
    date: '2026-08-08',
    status: 'completed',
    note: 'Full tank premium unleaded fuel.',
    events: [
      { id: 'e7', type: 'CREATED', timestamp: '2026-08-08 08:40 AM', user: 'Alex Morgan', detail: 'Contactless Nagad Pay' }
    ]
  },
  {
    id: 'tx-106',
    title: 'Cinema & Dinner Date',
    amount: 120.00,
    type: 'expense',
    categoryId: 'cat-4',
    accountId: 'acc-4',
    date: '2026-08-09',
    status: 'completed',
    note: 'IMAX Tickets & Bistro Italian dinner.',
    events: [
      { id: 'e8', type: 'CREATED', timestamp: '2026-08-09 09:15 PM', user: 'Alex Morgan', detail: 'Manual quick entry' }
    ]
  }
];

const INITIAL_PLANS = [
  { id: 'p-1', title: 'Emergency Fund', target: 15000, current: 11250, color: '#3b82f6', deadline: '2026-12-31' },
  { id: 'p-2', title: 'Japan Fall Trip', target: 4500, current: 3100, color: '#ec4899', deadline: '2026-10-15' },
  { id: 'p-3', title: 'New EV Downpayment', target: 10000, current: 4200, color: '#10b981', deadline: '2027-04-01' },
];

function IncomeVsExpenseLineChart({ transactions = [] }) {
  const [timeframe, setTimeframe] = useState('6M');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [customStart, setCustomStart] = useState('2026-07-01');
  const [customEnd, setCustomEnd] = useState('2026-08-10');

  const timeframeOptions = ['7D', '15D', '30D', '60D', '6M', '1Y', 'Custom'];

  const chartData = useMemo(() => {
    const today = new Date('2026-08-10');
    let points = [];

    if (timeframe === '7D') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dayTxs = transactions.filter(t => t.date === dateStr);
        const inc = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const exp = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

        points.push({
          label,
          income: inc || (150 + Math.sin(i) * 50),
          expense: exp || (120 + Math.cos(i) * 40)
        });
      }
    } else if (timeframe === '15D') {
      for (let i = 14; i >= 0; i -= 2) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const dateStr = d.toISOString().split('T')[0];
        const dayTxs = transactions.filter(t => t.date === dateStr);
        const inc = dayTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        const exp = dayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

        points.push({
          label,
          income: inc || (400 + (i % 3) * 120),
          expense: exp || (250 + (i % 4) * 80)
        });
      }
    } else if (timeframe === '30D') {
      for (let i = 28; i >= 0; i -= 4) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        points.push({
          label,
          income: 1200 + Math.sin(i) * 350,
          expense: 650 + Math.cos(i) * 200
        });
      }
    } else if (timeframe === '60D') {
      for (let i = 56; i >= 0; i -= 8) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        points.push({
          label,
          income: 2400 + (i % 5) * 400,
          expense: 1100 + (i % 3) * 300
        });
      }
    } else if (timeframe === '1Y') {
      const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
      points = months.map((m, idx) => ({
        label: m,
        income: 5200 + (idx % 4) * 450,
        expense: 2100 + (idx % 3) * 380
      }));
    } else if (timeframe === 'Custom') {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
      const step = Math.max(1, Math.floor(diffDays / 7));

      for (let i = 0; i <= diffDays; i += step) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        points.push({
          label,
          income: 800 + (i * 40) % 900,
          expense: 400 + (i * 25) % 600
        });
      }
    } else {
      points = [
        { label: 'Mar', income: 5800, expense: 2300 },
        { label: 'Apr', income: 6100, expense: 2850 },
        { label: 'May', income: 5900, expense: 2100 },
        { label: 'Jun', income: 6400, expense: 3100 },
        { label: 'Jul', income: 6000, expense: 2450 },
        { label: 'Aug', income: 6200, expense: 2468 },
      ];
    }

    return points;
  }, [timeframe, customStart, customEnd, transactions]);

  const maxVal = Math.max(...chartData.map(d => Math.max(d.income, d.expense)), 1000) * 1.15;
  const width = 800;
  const height = 220;
  const padding = 35;

  const getX = (index) => padding + (index * (width - padding * 2)) / Math.max(chartData.length - 1, 1);
  const getY = (val) => height - padding - (val / maxVal) * (height - padding * 2);

  const createSmoothPath = (key) => {
    return chartData.reduce((acc, pt, i, arr) => {
      const x = getX(i);
      const y = getY(pt[key]);
      if (i === 0) return `M ${x},${y}`;
      const prevX = getX(i - 1);
      const prevY = getY(arr[i - 1][key]);
      const cp1X = prevX + (x - prevX) / 2;
      const cp2X = cp1X;
      return `${acc} C ${cp1X},${prevY} ${cp2X},${y} ${x},${y}`;
    }, '');
  };

  const incomePath = createSmoothPath('income');
  const expensePath = createSmoothPath('expense');

  const incomeArea = `${incomePath} L ${getX(chartData.length - 1)},${height - padding} L ${getX(0)},${height - padding} Z`;
  const expenseArea = `${expensePath} L ${getX(chartData.length - 1)},${height - padding} L ${getX(0)},${height - padding} Z`;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon.TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Cashflow Dynamics (Income vs Expense)</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Real-time revenue inflows compared against expenditure</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 text-xs mr-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              <span className="text-slate-300 font-medium">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
              <span className="text-slate-300 font-medium">Expenses</span>
            </div>
          </div>

          <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs flex-wrap">
            {timeframeOptions.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all ${
                  timeframe === tf ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {timeframe === 'Custom' && (
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-slate-950/80 rounded-xl border border-indigo-500/30 text-xs animate-fadeIn">
          <span className="text-slate-400 font-medium">Custom Date Window:</span>
          <div className="flex items-center gap-2">
            <label className="text-slate-500">From</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-500">To</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
          <defs>
            <linearGradient id="incomeGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="expenseGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, maxVal * 0.33, maxVal * 0.66, maxVal].map((val, idx) => (
            <line
              key={idx}
              x1={padding}
              y1={getY(val)}
              x2={width - padding}
              y2={getY(val)}
              stroke="#1e293b"
              strokeDasharray="4 4"
            />
          ))}

          <path d={incomeArea} fill="url(#incomeGlow)" />
          <path d={expenseArea} fill="url(#expenseGlow)" />
          <path d={incomePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
          <path d={expensePath} fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />

          {chartData.map((pt, i) => {
            const x = getX(i);
            const yInc = getY(pt.income);
            const yExp = getY(pt.expense);
            const isHovered = hoveredPoint === i;

            return (
              <g key={i} onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)} className="cursor-pointer">
                {isHovered && (
                  <line x1={x} y1={padding} x2={x} y2={height - padding} stroke="#6366f1" strokeDasharray="2 2" strokeWidth="1.5" />
                )}
                <circle cx={x} cy={yInc} r={isHovered ? "6" : "4"} fill="#10b981" stroke="#020617" strokeWidth="2" className="transition-all" />
                <circle cx={x} cy={yExp} r={isHovered ? "6" : "4"} fill="#f43f5e" stroke="#020617" strokeWidth="2" className="transition-all" />
                <text x={x} y={height - 8} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredPoint !== null && chartData[hoveredPoint] && (
          <div
            className="absolute bg-slate-950/90 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none text-xs z-30 transition-all duration-150"
            style={{
              left: `${Math.min(Math.max((hoveredPoint / Math.max(chartData.length - 1, 1)) * 80 + 5, 5), 75)}%`,
              top: '15%',
            }}
          >
            <div className="font-bold text-slate-200 mb-1 border-b border-slate-800 pb-1">{chartData[hoveredPoint].label} Metrics</div>
            <div className="flex items-center justify-between gap-4 text-emerald-400 font-mono">
              <span>Income:</span>
              <span className="font-bold">+${chartData[hoveredPoint].income.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-rose-400 font-mono">
              <span>Expense:</span>
              <span className="font-bold">-${chartData[hoveredPoint].expense.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-indigo-300 font-mono pt-1 border-t border-slate-800 mt-1">
              <span>Net Surplus:</span>
              <span className="font-bold">${(chartData[hoveredPoint].income - chartData[hoveredPoint].expense).toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TopBalanceAccountsSection({ accounts, onUpdateAccount, onSelectAccount }) {
  const [editingAccId, setEditingAccId] = useState(null);
  const [tempBalance, setTempBalance] = useState('');

  const totalNetBalance = useMemo(() => {
    return accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  }, [accounts]);

  const handleSaveEdit = (e, accId) => {
    e.stopPropagation();
    onUpdateAccount(accId, tempBalance);
    setEditingAccId(null);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Liquidity Hub
              </span>
              <span className="text-xs text-slate-400">Integrated Financial Sources</span>
            </div>
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold">Overall Net Portfolio Balance</h2>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white mt-1">
              ${totalNetBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span>Verified Sources: <strong className="text-white">{accounts.length} Accounts</strong></span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Balance by Payment & Storage Source</h3>
            <span className="text-[11px] text-indigo-400 font-medium">Click any card for source analytics →</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {accounts.map((acc) => {
              const percentShare = totalNetBalance > 0 ? Math.round((acc.balance / totalNetBalance) * 100) : 0;
              const isEditing = editingAccId === acc.id;

              return (
                <div
                  key={acc.id}
                  onClick={() => onSelectAccount && onSelectAccount(acc.id)}
                  className="bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-200 group flex flex-col justify-between cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/10"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{acc.icon}</span>
                        <div>
                          <h4 className="font-bold text-slate-100 text-sm group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                            {acc.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 block">{acc.provider}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-indigo-400">
                        {acc.type}
                      </span>
                    </div>

                    <div className="mt-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="number"
                            step="0.01"
                            value={tempBalance}
                            onChange={(e) => setTempBalance(e.target.value)}
                            className="w-full bg-slate-900 border border-indigo-500 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={(e) => handleSaveEdit(e, acc.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white p-1 rounded-lg text-xs"
                          >
                            <Icon.Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAccId(null);
                            }}
                            className="bg-slate-800 text-slate-400 p-1 rounded-lg text-xs"
                          >
                            <Icon.X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold font-mono text-white">
                            ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAccId(acc.id);
                              setTempBalance(acc.balance.toString());
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white rounded transition-opacity"
                            title="Adjust Account Balance"
                          >
                            <Icon.Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-900/90">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>Portfolio Share</span>
                      <span className="font-bold text-slate-300">{percentShare}%</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${percentShare}%`, backgroundColor: acc.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountCashflowChart({ accountId, transactions }) {
  const [timeframe, setTimeframe] = useState('6M');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const timeframeOptions = ['7D', '15D', '30D', '60D', '6M', '1Y'];

  const chartData = useMemo(() => {
    const accTxs = transactions.filter((t) => t.accountId === accountId);
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    
    return months.map((month, idx) => {
      const monthNum = idx + 3;
      const monthStr = `2026-0${monthNum}`;

      const monthlyIncome = accTxs
        .filter((t) => t.type === 'income' && t.date.startsWith(monthStr))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const monthlyExpense = accTxs
        .filter((t) => t.type === 'expense' && t.date.startsWith(monthStr))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        label: month,
        income: monthlyIncome || (idx === 5 ? 6200 : 1500 + idx * 200),
        expense: monthlyExpense || (idx === 5 ? 1734.50 : 800 + idx * 150),
      };
    });
  }, [accountId, transactions]);

  const maxVal = Math.max(...chartData.map((d) => Math.max(d.income, d.expense)), 500) * 1.15;
  const width = 800;
  const height = 220;
  const padding = 35;

  const getX = (index) => padding + (index * (width - padding * 2)) / Math.max(chartData.length - 1, 1);
  const getY = (val) => height - padding - (val / maxVal) * (height - padding * 2);

  const createSmoothPath = (key) => {
    return chartData.reduce((acc, pt, i, arr) => {
      const x = getX(i);
      const y = getY(pt[key]);
      if (i === 0) return `M ${x},${y}`;
      const prevX = getX(i - 1);
      const prevY = getY(arr[i - 1][key]);
      const cp1X = prevX + (x - prevX) / 2;
      const cp2X = cp1X;
      return `${acc} C ${cp1X},${prevY} ${cp2X},${y} ${x},${y}`;
    }, '');
  };

  const incomePath = createSmoothPath('income');
  const expensePath = createSmoothPath('expense');
  const incomeArea = `${incomePath} L ${getX(chartData.length - 1)},${height - padding} L ${getX(0)},${height - padding} Z`;
  const expenseArea = `${expensePath} L ${getX(chartData.length - 1)},${height - padding} L ${getX(0)},${height - padding} Z`;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon.TrendingUp className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Source Cashflow Dynamics</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Historical inflow vs outflow processed through this specific method</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs flex-wrap">
            {timeframeOptions.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-all ${
                  timeframe === tf ? 'bg-indigo-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
          <defs>
            <linearGradient id="accIncomeGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="accExpenseGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, maxVal * 0.33, maxVal * 0.66, maxVal].map((val, idx) => (
            <line
              key={idx}
              x1={padding}
              y1={getY(val)}
              x2={width - padding}
              y2={getY(val)}
              stroke="#1e293b"
              strokeDasharray="4 4"
            />
          ))}

          <path d={incomeArea} fill="url(#accIncomeGlow)" />
          <path d={expenseArea} fill="url(#accExpenseGlow)" />
          <path d={incomePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
          <path d={expensePath} fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />

          {chartData.map((pt, i) => {
            const x = getX(i);
            const yInc = getY(pt.income);
            const yExp = getY(pt.expense);
            const isHovered = hoveredPoint === i;

            return (
              <g key={i} onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)} className="cursor-pointer">
                {isHovered && (
                  <line x1={x} y1={padding} x2={x} y2={height - padding} stroke="#6366f1" strokeDasharray="2 2" strokeWidth="1.5" />
                )}
                <circle cx={x} cy={yInc} r={isHovered ? "6" : "4"} fill="#10b981" stroke="#020617" strokeWidth="2" className="transition-all" />
                <circle cx={x} cy={yExp} r={isHovered ? "6" : "4"} fill="#f43f5e" stroke="#020617" strokeWidth="2" className="transition-all" />
                <text x={x} y={height - 8} fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredPoint !== null && chartData[hoveredPoint] && (
          <div
            className="absolute bg-slate-950/90 border border-slate-700 p-3 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none text-xs z-30 transition-all duration-150"
            style={{
              left: `${Math.min(Math.max((hoveredPoint / Math.max(chartData.length - 1, 1)) * 80 + 5, 5), 75)}%`,
              top: '20%',
            }}
          >
            <div className="font-bold text-slate-200 mb-1 border-b border-slate-800 pb-1">{chartData[hoveredPoint].label} Source Flow</div>
            <div className="flex items-center justify-between gap-4 text-emerald-400 font-mono">
              <span>Inflow:</span>
              <span className="font-bold">+${chartData[hoveredPoint].income.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-rose-400 font-mono">
              <span>Outflow:</span>
              <span className="font-bold">-${chartData[hoveredPoint].expense.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AccountDetailView({
  account,
  transactions,
  categories,
  onBack,
  onUpdateAccount,
  onAddTransaction,
  onSelectTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editBalanceVal, setEditBalanceVal] = useState(account.balance.toString());

  const accountTxs = useMemo(() => {
    return transactions.filter((t) => t.accountId === account.id);
  }, [transactions, account.id]);

  const filteredAccountTxs = useMemo(() => {
    return accountTxs.filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || (t.note && t.note.toLowerCase().includes(search.toLowerCase()));
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [accountTxs, search, typeFilter]);

  const totalInflow = useMemo(() => {
    return accountTxs.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  }, [accountTxs]);

  const totalOutflow = useMemo(() => {
    return accountTxs.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  }, [accountTxs]);

  const handleSaveBalance = () => {
    onUpdateAccount(account.id, editBalanceVal);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </button>

        <button
          onClick={() => onAddTransaction(account.id)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Icon.Plus className="w-4 h-4" />
          <span>Record {account.name} Entry</span>
        </button>
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/80 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-3xl shadow-inner">
              {account.icon}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{account.name}</h2>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  {account.type} Source
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span>Provider: <strong className="text-slate-200">{account.provider}</strong></span>
                <span>•</span>
                <span>Date Added: <strong className="text-slate-200">{account.addedDate || 'Jan 10, 2025'}</strong></span>
              </p>
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center gap-6">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Current Balance</span>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={editBalanceVal}
                    onChange={(e) => setEditBalanceVal(e.target.value)}
                    className="bg-slate-900 border border-indigo-500 rounded-lg px-2 py-1 text-sm font-mono text-white w-32 focus:outline-none"
                  />
                  <button onClick={handleSaveBalance} className="p-1.5 bg-emerald-600 text-white rounded-lg">
                    <Icon.Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsEditing(false)} className="p-1.5 bg-slate-800 text-slate-400 rounded-lg">
                    <Icon.X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold font-mono text-white">
                    ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-white p-1" title="Adjust Balance">
                    <Icon.Edit className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Total Source Inflows</span>
            <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">+${totalInflow.toFixed(2)}</span>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Total Source Outflows</span>
            <span className="text-lg font-bold font-mono text-rose-400 mt-1 block">-${totalOutflow.toFixed(2)}</span>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Net Source Movement</span>
            <span className="text-lg font-bold font-mono text-indigo-300 mt-1 block">
              ${(totalInflow - totalOutflow).toFixed(2)}
            </span>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">Processed Ledgers</span>
            <span className="text-lg font-bold font-mono text-white mt-1 block">{accountTxs.length} Entries</span>
          </div>
        </div>
      </div>

      <AccountCashflowChart accountId={account.id} transactions={transactions} />

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Source Ledgers & Activity</h3>
            <p className="text-xs text-slate-400">Click any transaction to open its dedicated page</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Icon.Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-48"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>
        </div>

        {filteredAccountTxs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Icon.Receipt className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-xs font-medium text-slate-400">No matching transactions found for this account</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/50">
                  <th className="py-3 px-4">Transaction Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAccountTxs.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const isIncome = tx.type === 'income';

                  return (
                    <tr 
                      key={tx.id} 
                      onClick={() => onSelectTransaction(tx)} 
                      className="hover:bg-indigo-500/5 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200 group-hover:text-indigo-400 flex items-center gap-1.5 transition-colors">
                          <span>{tx.title}</span>
                          <Icon.ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity" />
                        </div>
                        {tx.note && <div className="text-[11px] text-slate-500">{tx.note}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
                          <span>{cat?.icon || '📁'}</span>
                          <span>{cat?.name || 'Uncategorized'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">{tx.date}</td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${isIncome ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {isIncome ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Icon.Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Icon.Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionDetailView({
  transaction,
  categories,
  accounts,
  onBack,
  onEdit,
  onDelete
}) {
  if (!transaction) return null;

  const cat = categories.find((c) => c.id === transaction.categoryId);
  const acc = accounts.find((a) => a.id === transaction.accountId);
  const isIncome = transaction.type === 'income';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="self-start bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Ledgers</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(transaction)}
            className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <Icon.Edit className="w-4 h-4" />
            <span>Edit Record</span>
          </button>
          <button
            onClick={() => {
              onDelete(transaction.id);
              onBack();
            }}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <Icon.Trash className="w-4 h-4" />
            <span>Delete Record</span>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/70 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg ${
              isIncome ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}>
              {isIncome ? <Icon.ArrowUpRight className="w-7 h-7" /> : <Icon.ArrowDownLeft className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isIncome ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {transaction.type}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
                  Status: Verified
                </span>
                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  Ref: {transaction.id}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">{transaction.title}</h1>
              <p className="text-xs text-slate-400 mt-1 font-mono">Recorded on {transaction.date}</p>
            </div>
          </div>

          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 text-left md:text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Transaction Value</span>
            <div className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${isIncome ? 'text-emerald-400' : 'text-slate-100'}`}>
              {isIncome ? '+' : '-'}${Number(transaction.amount).toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Processed in USD</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Category Information</span>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl">
              {cat?.icon || '📁'}
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{cat?.name || 'Uncategorized'}</h4>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">{cat?.type || 'General'} Budget Category</p>
            </div>
          </div>
          {cat?.budgetLimit > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex justify-between font-mono">
              <span>Monthly Limit Cap:</span>
              <span className="text-slate-200 font-bold">${cat.budgetLimit}</span>
            </div>
          )}
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Account Storage Source</span>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-2xl">
              {acc?.icon || '💳'}
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{acc?.name || 'Bank Account'}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{acc?.provider || 'Direct Ledger'} ({acc?.type || 'Account'})</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex justify-between font-mono">
            <span>Current Source Balance:</span>
            <span className="text-emerald-400 font-bold">${acc?.balance?.toLocaleString() || '0.00'}</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">Verification & Hash</span>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="text-slate-300 font-bold">{transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Verification Hash:</span>
              <span className="text-indigo-400 truncate max-w-[140px]">0x8f3a...b921</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="text-emerald-400 font-bold">Verified & Synced</span>
            </div>
          </div>
        </div>
      </div>

      {transaction.note && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes & Context Memorandum</h4>
          <p className="text-sm text-slate-200 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 leading-relaxed font-sans">
            "{transaction.note}"
          </p>
        </div>
      )}

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Icon.History className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Comprehensive Audit & Revision History</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{transaction.events?.length || 0} Recorded Events</span>
        </div>

        <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {transaction.events && transaction.events.length > 0 ? (
            transaction.events.map((e) => (
              <div key={e.id} className="relative group">
                <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex justify-between text-xs items-center">
                    <span className="font-bold text-indigo-400 font-mono">{e.type}</span>
                    <span className="font-mono text-slate-500 text-[11px]">{e.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1">{e.detail}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">Operator: {e.user}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">No event log entries found for this transaction.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardView({ metrics, transactions, categories, accounts, onUpdateAccount, plans, onSelectTransaction, onSelectAccount }) {
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const totalExpenseVal = metrics.totalExpense || 1;

  return (
    <div className="space-y-6 animate-fadeIn">
      <TopBalanceAccountsSection
        accounts={accounts}
        onUpdateAccount={onUpdateAccount}
        onSelectAccount={onSelectAccount}
      />

      <IncomeVsExpenseLineChart transactions={transactions} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Total Net Surplus"
          amount={`$${metrics.netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Monthly Income vs Expense Delta"
          icon={<Icon.DollarSign className="w-6 h-6 text-emerald-400" />}
          gradient="from-slate-900 via-slate-900 to-emerald-950/40"
          borderColor="border-emerald-500/30"
        />
        <StatCard
          title="Monthly Income"
          amount={`+$${metrics.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Total inflows received"
          icon={<Icon.ArrowUpRight className="w-6 h-6 text-emerald-400" />}
          gradient="from-slate-900 via-slate-900 to-indigo-950/40"
          borderColor="border-indigo-500/30"
        />
        <StatCard
          title="Monthly Expenses"
          amount={`-$${metrics.totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Total outflows spent"
          icon={<Icon.ArrowDownLeft className="w-6 h-6 text-rose-400" />}
          gradient="from-slate-900 via-slate-900 to-rose-950/40"
          borderColor="border-rose-500/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Icon.PieChart className="w-5 h-5 text-indigo-400" />
                Expense Allocation Visualizer
              </h3>
              <p className="text-xs text-slate-400">Current spending per budget category</p>
            </div>
            <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">
              Live Tracker
            </span>
          </div>

          <div className="space-y-4">
            {expenseCategories.map((cat) => {
              const spent = metrics.categorySpentMap[cat.id] || 0;
              const percent = Math.min(Math.round((spent / totalExpenseVal) * 100), 100);
              const isOverBudget = cat.budgetLimit > 0 && spent > cat.budgetLimit;

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cat.icon}</span>
                      <span className="font-semibold text-slate-200">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-300">${spent.toFixed(2)}</span>
                      <span className="font-mono text-slate-500 text-[11px]">({percent}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: isOverBudget ? '#ef4444' : cat.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Icon.Target className="w-5 h-5 text-emerald-400" />
                Active Savings Targets
              </h3>
            </div>

            <div className="space-y-4">
              {plans.map((p) => {
                const prog = Math.round((p.current / p.target) * 100);
                return (
                  <div key={p.id} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-slate-200">{p.title}</span>
                      <span className="text-xs font-mono text-emerald-400 font-bold">{prog}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500" style={{ width: `${prog}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>${p.current.toLocaleString()}</span>
                      <span>Goal: ${p.target.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recent Ledger Activity</h3>
            <p className="text-xs text-slate-400">Click any record to open its detail page</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">Transaction</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Account Source</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {transactions.slice(0, 5).map((tx) => {
                const cat = categories.find((c) => c.id === tx.categoryId);
                const acc = accounts.find((a) => a.id === tx.accountId);
                const isIncome = tx.type === 'income';

                return (
                  <tr 
                    key={tx.id} 
                    onClick={() => onSelectTransaction(tx)} 
                    className="hover:bg-indigo-500/5 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-3 font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {isIncome ? <Icon.ArrowUpRight className="w-4 h-4" /> : <Icon.ArrowDownLeft className="w-4 h-4" />}
                        </span>
                        <span>{tx.title}</span>
                        <Icon.ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity" />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
                        <span>{cat?.icon}</span>
                        <span>{cat?.name || 'General'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 font-mono text-[11px] text-indigo-300">
                        <span>{acc?.icon || '💳'}</span>
                        <span>{acc?.name || 'Bank Account'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{tx.date}</td>
                    <td className={`py-3 px-3 text-right font-mono font-bold ${isIncome ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {isIncome ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, amount, subtitle, icon, gradient, borderColor }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} border ${borderColor} rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800">{icon}</div>
      </div>
      <div className="text-2xl font-extrabold font-mono tracking-tight text-white mb-1">{amount}</div>
      <div className="text-[11px] text-slate-400">{subtitle}</div>
    </div>
  );
}

function TransactionsView({
  transactions,
  categories,
  accounts,
  onEdit,
  onDelete,
  onSelectTransaction,
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (categoryFilter !== 'all') count++;
    if (accountFilter !== 'all') count++;
    if (typeFilter !== 'all') count++;
    if (startDate) count++;
    if (endDate) count++;
    if (minAmount) count++;
    if (maxAmount) count++;
    if (sortBy !== 'date-desc') count++;
    return count;
  }, [categoryFilter, accountFilter, typeFilter, startDate, endDate, minAmount, maxAmount, sortBy]);

  const resetAllFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setAccountFilter('all');
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('date-desc');
  };

  const processedTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesSearch =
          !search ||
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          (t.note && t.note.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory = categoryFilter === 'all' || t.categoryId === categoryFilter;
        const matchesAccount = accountFilter === 'all' || t.accountId === accountFilter;
        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        const matchesStartDate = !startDate || t.date >= startDate;
        const matchesEndDate = !endDate || t.date <= endDate;
        const matchesMinAmount = !minAmount || Number(t.amount) >= Number(minAmount);
        const matchesMaxAmount = !maxAmount || Number(t.amount) <= Number(maxAmount);

        return (
          matchesSearch &&
          matchesCategory &&
          matchesAccount &&
          matchesType &&
          matchesStartDate &&
          matchesEndDate &&
          matchesMinAmount &&
          matchesMaxAmount
        );
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortBy === 'amount-desc') return Number(b.amount) - Number(a.amount);
        if (sortBy === 'amount-asc') return Number(a.amount) - Number(b.amount);
        if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [
    transactions,
    search,
    categoryFilter,
    accountFilter,
    typeFilter,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortBy,
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md relative z-30">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center relative">
          <div className="relative w-full sm:w-80">
            <Icon.Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search descriptions, notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="text-xs font-mono text-rose-400 hover:text-rose-300 underline underline-offset-4"
              >
                Clear Filters ({activeFiltersCount})
              </button>
            )}

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAdvancedFilters((prev) => !prev);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                  showAdvancedFilters || activeFiltersCount > 0
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-lg shadow-indigo-600/10'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Icon.Sliders className="w-4 h-4 text-indigo-400" />
                <span>Advance Filter</span>
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-mono text-[10px] flex items-center justify-center font-bold ml-1">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {showAdvancedFilters && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full right-0 mt-3 w-[calc(100vw-3rem)] max-w-lg sm:w-[520px] bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 shadow-2xl shadow-black/80 backdrop-blur-xl z-50 animate-fadeIn text-left space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Icon.Filter className="w-4 h-4 text-indigo-400" />
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider">Advanced Filter Rules</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={resetAllFilters}
                          className="text-[11px] font-mono text-rose-400 hover:text-rose-300 mr-2"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        onClick={() => setShowAdvancedFilters(false)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      >
                        <Icon.X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Category
                      </label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.icon} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Account Source
                      </label>
                      <select
                        value={accountFilter}
                        onChange={(e) => setAccountFilter(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="all">All Payment Sources</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.icon} {a.name} ({a.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Transaction Type
                      </label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="all">All Types</option>
                        <option value="expense">Expenses Only</option>
                        <option value="income">Income Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Sort Ledger By
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="date-desc">Date: Newest First</option>
                        <option value="date-asc">Date: Oldest First</option>
                        <option value="amount-desc">Amount: High to Low</option>
                        <option value="amount-asc">Amount: Low to High</option>
                        <option value="title-asc">Title: A - Z</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Min Amount ($)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Max Amount ($)
                      </label>
                      <input
                        type="number"
                        placeholder="10000.00"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setShowAdvancedFilters(false)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
                    >
                      Apply & Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md relative z-10">
        {processedTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Icon.Receipt className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-xs font-medium text-slate-400">No matching transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/50">
                  <th className="py-3.5 px-4">Title & Note</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Account Source</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {processedTransactions.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.categoryId);
                  const acc = accounts?.find((a) => a.id === tx.accountId);
                  const isIncome = tx.type === 'income';

                  return (
                    <tr 
                      key={tx.id} 
                      onClick={() => onSelectTransaction(tx)} 
                      className="hover:bg-indigo-500/5 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200 group-hover:text-indigo-400 flex items-center gap-1.5 transition-colors">
                          <span>{tx.title}</span>
                          <Icon.ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity" />
                        </div>
                        {tx.note && <div className="text-[11px] text-slate-500 truncate max-w-xs">{tx.note}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300 font-medium">
                          <span>{cat?.icon || '📁'}</span>
                          <span>{cat?.name || 'Uncategorized'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-[11px]">
                          <span>{acc?.icon || '💳'}</span>
                          <span>{acc?.name || 'Bank Account'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">{tx.date}</td>
                      <td className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${isIncome ? 'text-emerald-400' : 'text-slate-200'}`}>
                        {isIncome ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEdit(tx)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Edit Transaction"
                          >
                            <Icon.Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(tx.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete Transaction"
                          >
                            <Icon.Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoriesView({ categories, metrics, onAddCategory, onEditCategory }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-white">Budget Categories & Caps</h3>
          <p className="text-xs text-slate-400">Manage budget allocations and custom spending thresholds</p>
        </div>
        <button
          onClick={onAddCategory}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Icon.Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const spent = metrics.categorySpentMap[cat.id] || 0;
          const limit = cat.budgetLimit;
          const percent = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
          const isOver = limit > 0 && spent > limit;

          return (
            <div
              key={cat.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 backdrop-blur-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-slate-950 border border-slate-800">{cat.icon}</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">{cat.name}</h4>
                      <span className="text-[11px] text-slate-500 capitalize">{cat.type} Category</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onEditCategory(cat)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Icon.Edit className="w-4 h-4" />
                  </button>
                </div>

                {cat.type === 'expense' && (
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Spent: ${spent.toFixed(2)}</span>
                      <span className={isOver ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        Cap: {limit > 0 ? `$${limit}` : 'No Limit'}
                      </span>
                    </div>

                    {limit > 0 && (
                      <div>
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: isOver ? '#ef4444' : cat.color,
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
                          <span>{percent}% utilized</span>
                          {isOver && <span className="text-rose-400 font-bold">Over Budget!</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlansView({ plans, setPlans, showToast }) {
  const [editingPlan, setEditingPlan] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');

  const handleDeposit = (planId) => {
    const val = parseFloat(depositAmount);
    if (!val || val <= 0) return;

    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, current: p.current + val } : p))
    );
    showToast(`Added $${val} contribution to plan!`);
    setEditingPlan(null);
    setDepositAmount('');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-white">Savings Targets & Future Goals</h3>
          <p className="text-xs text-slate-400">Plan and track long-term financial commitments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const percent = Math.min(Math.round((p.current / p.target) * 100), 100);

          return (
            <div key={p.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-white text-base">{p.title}</h4>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {percent}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">Target Date: {p.deadline}</p>

                <div className="mt-5 space-y-2">
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono pt-1">
                    <span className="text-slate-300 font-bold">${p.current.toLocaleString()}</span>
                    <span className="text-slate-500">Goal: ${p.target.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                {editingPlan === p.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Amount $"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleDeposit(p.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingPlan(null)}
                      className="bg-slate-800 text-slate-400 px-2 py-1.5 rounded-xl text-xs"
                    >
                      <Icon.X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingPlan(p.id)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon.Plus className="w-4 h-4" />
                    <span>Deposit Savings</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavItem({ active, onClick, icon, label, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
        active
          ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 font-semibold'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge !== undefined && (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
          {badge}
        </span>
      )}
    </button>
  );
}

function TransactionFormModal({ isOpen, onClose, categories, accounts = [], initialData, onSave }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    amount: initialData?.amount || '',
    type: initialData?.type || 'expense',
    categoryId: initialData?.categoryId || categories[0]?.id || '',
    accountId: initialData?.accountId || accounts[0]?.id || 'acc-1',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    note: initialData?.note || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;
    onSave({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-scaleUp">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">{initialData?.id ? 'Edit Transaction' : 'Record Transaction'}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
            <Icon.X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Title / Description</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Starbucks Coffee"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Account Source</label>
              <select
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes / Invoice Tag</label>
            <textarea
              rows={2}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Optional notes or context..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              {initialData?.id ? 'Save Changes' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CategoryFormModal({ isOpen, onClose, initialData, onSave }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    icon: initialData?.icon || '📁',
    color: initialData?.color || '#6366f1',
    budgetLimit: initialData?.budgetLimit || '',
    type: initialData?.type || 'expense',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    onSave({
      ...formData,
      budgetLimit: parseFloat(formData.budgetLimit) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-scaleUp">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">{initialData ? 'Edit Category' : 'Create Category'}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg">
            <Icon.X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Category Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Subscriptions"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Emoji Icon</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="📦"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Budget Limit ($)</label>
              <input
                type="number"
                value={formData.budgetLimit}
                onChange={(e) => setFormData({ ...formData, budgetLimit: e.target.value })}
                placeholder="0 = Unlimited"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              {initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FinTrackApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authView, setAuthView] = useState('login');
  const [currentRoute, setCurrentRoute] = useState('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [selectedTxId, setSelectedTxId] = useState(null);
  const [previousRoute, setPreviousRoute] = useState('dashboard');

  const [user, setUser] = useState({ name: 'Alex Morgan', email: 'alex@fintrack.io', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' });

  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [plans, setPlans] = useState(INITIAL_PLANS);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectTransaction = (tx) => {
    setSelectedTxId(tx.id);
    setPreviousRoute(currentRoute);
    setCurrentRoute('transaction-detail');
  };

  const handleUpdateAccountBalance = (accId, newBal) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accId ? { ...acc, balance: parseFloat(newBal) || 0 } : acc))
    );
    showToast('Account balance adjusted');
  };

  const handleSelectAccountDetail = (accId) => {
    setSelectedAccountId(accId);
    setCurrentRoute('account-detail');
  };

  const selectedAccountObj = accounts.find((a) => a.id === selectedAccountId);
  const selectedTxObj = transactions.find((t) => t.id === selectedTxId);

  const metrics = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netSavings = totalIncome - totalExpense;

    const categorySpentMap = {};
    transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        categorySpentMap[tx.categoryId] = (categorySpentMap[tx.categoryId] || 0) + Number(tx.amount);
      }
    });

    return {
      totalIncome,
      totalExpense,
      netSavings,
      categorySpentMap,
    };
  }, [transactions]);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setIsAuthenticated(true);
    showToast(`Welcome back, ${user.name}!`);
  };

  const handleSaveTransaction = (txData) => {
    if (editingTx && editingTx.id) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === editingTx.id
            ? {
                ...t,
                ...txData,
                events: [
                  ...(t.events || []),
                  {
                    id: `e-${Date.now()}`,
                    type: 'UPDATED',
                    timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
                    user: user.name,
                    detail: `Updated details (Amount: $${txData.amount})`,
                  },
                ],
              }
            : t
        )
      );
      showToast('Transaction updated successfully');
    } else {
      const newTx = {
        id: `tx-${Date.now()}`,
        ...txData,
        status: 'completed',
        events: [
          {
            id: `e-${Date.now()}`,
            type: 'CREATED',
            timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
            user: user.name,
            detail: 'Created manual record entry',
          },
        ],
      };
      setTransactions([newTx, ...transactions]);
      showToast('New transaction recorded');
    }
    setIsTxModalOpen(false);
    setEditingTx(null);
  };

  const handleDeleteTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (selectedTxId === id) setSelectedTxId(null);
    showToast('Transaction removed');
  };

  const handleSaveCategory = (catData) => {
    if (editingCat) {
      setCategories((prev) => prev.map((c) => (c.id === editingCat.id ? { ...c, ...catData } : c)));
      showToast('Category updated');
    } else {
      const newCat = {
        id: `cat-${Date.now()}`,
        ...catData,
      };
      setCategories([...categories, newCat]);
      showToast('New category created');
    }
    setIsCatModalOpen(false);
    setEditingCat(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 transition-all duration-300">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Icon.DollarSign className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              FinTrack Engine
            </span>
          </div>

          <div className="flex rounded-xl bg-slate-800/60 p-1 mb-6 border border-slate-700/50">
            <button
              onClick={() => setAuthView('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                authView === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthView('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                authView === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authView === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  placeholder="Alex Morgan"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                placeholder="alex@fintrack.io"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                required
                defaultValue="secretpass"
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3.5 bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-600 hover:to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {authView === 'login' ? 'Access Portal' : 'Register Account'}
              <Icon.ArrowUpRight className="w-5 h-5" />
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            Protected by FinTrack 256-bit encryption & real-time sync engine
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row antialiased selection:bg-indigo-500 selection:text-white">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 border border-emerald-500/50 text-emerald-300 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Icon.Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <aside className="w-full md:w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between p-5 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Icon.DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-white leading-tight">FinTrack</h1>
              <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">App Router v15</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <NavItem
              active={currentRoute === 'dashboard'}
              onClick={() => setCurrentRoute('dashboard')}
              icon={<Icon.LayoutDashboard />}
              label="Dashboard"
            />
            <NavItem
              active={currentRoute === 'transactions'}
              onClick={() => setCurrentRoute('transactions')}
              icon={<Icon.Receipt />}
              label="Transactions"
              badge={transactions.length}
            />
            <NavItem
              active={currentRoute === 'categories'}
              onClick={() => setCurrentRoute('categories')}
              icon={<Icon.Grid />}
              label="Categories"
              badge={categories.length}
            />
            <NavItem
              active={currentRoute === 'plans'}
              onClick={() => setCurrentRoute('plans')}
              icon={<Icon.Target />}
              label="Savings Plans"
            />
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <div className="flex items-center gap-3">
              <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/50" />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-200 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Sign Out"
            >
              <Icon.LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-100 capitalize">
              {currentRoute === 'dashboard' && 'Financial Overview'}
              {currentRoute === 'account-detail' && `${selectedAccountObj?.name || 'Account'} Details`}
              {currentRoute === 'transaction-detail' && 'Transaction Details'}
              {currentRoute === 'transactions' && 'Ledger & Transactions'}
              {currentRoute === 'categories' && 'Budget Categories'}
              {currentRoute === 'plans' && 'Savings Goals & Planning'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingTx(null);
                setIsTxModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              <Icon.Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-7xl w-full mx-auto">
          {currentRoute === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              transactions={transactions}
              categories={categories}
              accounts={accounts}
              onUpdateAccount={handleUpdateAccountBalance}
              plans={plans}
              onSelectTransaction={handleSelectTransaction}
              onSelectAccount={handleSelectAccountDetail}
            />
          )}

          {currentRoute === 'account-detail' && selectedAccountObj && (
            <AccountDetailView
              account={selectedAccountObj}
              transactions={transactions}
              categories={categories}
              onBack={() => setCurrentRoute('dashboard')}
              onUpdateAccount={handleUpdateAccountBalance}
              onAddTransaction={(accId) => {
                setEditingTx({ accountId: accId });
                setIsTxModalOpen(true);
              }}
              onSelectTransaction={handleSelectTransaction}
              onEditTransaction={(tx) => {
                setEditingTx(tx);
                setIsTxModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {currentRoute === 'transaction-detail' && selectedTxObj && (
            <TransactionDetailView
              transaction={selectedTxObj}
              categories={categories}
              accounts={accounts}
              onBack={() => setCurrentRoute(previousRoute)}
              onEdit={(tx) => {
                setEditingTx(tx);
                setIsTxModalOpen(true);
              }}
              onDelete={handleDeleteTransaction}
            />
          )}

          {currentRoute === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              categories={categories}
              accounts={accounts}
              onEdit={(tx) => {
                setEditingTx(tx);
                setIsTxModalOpen(true);
              }}
              onDelete={handleDeleteTransaction}
              onSelectTransaction={handleSelectTransaction}
            />
          )}

          {currentRoute === 'categories' && (
            <CategoriesView
              categories={categories}
              metrics={metrics}
              onAddCategory={() => {
                setEditingCat(null);
                setIsCatModalOpen(true);
              }}
              onEditCategory={(cat) => {
                setEditingCat(cat);
                setIsCatModalOpen(true);
              }}
            />
          )}

          {currentRoute === 'plans' && (
            <PlansView
              plans={plans}
              setPlans={setPlans}
              showToast={showToast}
            />
          )}
        </div>
      </main>

      {isTxModalOpen && (
        <TransactionFormModal
          isOpen={isTxModalOpen}
          onClose={() => {
            setIsTxModalOpen(false);
            setEditingTx(null);
          }}
          categories={categories}
          accounts={accounts}
          initialData={editingTx}
          onSave={handleSaveTransaction}
        />
      )}

      {isCatModalOpen && (
        <CategoryFormModal
          isOpen={isCatModalOpen}
          onClose={() => {
            setIsCatModalOpen(false);
            setEditingCat(null);
          }}
          initialData={editingCat}
          onSave={handleSaveCategory}
        />
      )}
    </div>
  );
}