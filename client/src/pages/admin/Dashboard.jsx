import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  CheckCircle,
  ArrowLeftRight,
  AlertOctagon,
  Receipt,
  CalendarClock,
  PlusCircle,
  TrendingUp,
  Clock,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  Layers
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { dashboardApi } from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b'];

export const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getStats();
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Aggregating library intelligence..." size="lg" className="min-h-[60vh]" />;
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center glass-panel rounded-3xl border border-rose-500/30">
        <p className="text-sm font-bold text-rose-500 mb-4">{error || 'Data unavailable'}</p>
        <Button onClick={fetchStats}>Retry</Button>
      </div>
    );
  }

  const { stats, charts, recentTransactions, overdueList } = data;

  const kpis = [
    {
      title: 'Total Books',
      value: stats.totalBooks,
      sub: `${stats.totalCopies} copies in holdings`,
      icon: BookOpen,
      iconColor: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
      glow: 'hover:shadow-glow-brand',
      link: '/admin/books'
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      sub: 'Active cardholders',
      icon: Users,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      glow: 'hover:shadow-glow-brand',
      link: '/admin/students'
    },
    {
      title: 'Available Books',
      value: stats.availableBooks,
      sub: `${Math.round((stats.availableBooks / (stats.totalCopies || 1)) * 100)}% on shelf`,
      icon: CheckCircle,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      glow: 'hover:shadow-glow-emerald',
      link: '/admin/books'
    },
    {
      title: 'Issued Books',
      value: stats.issuedBooks,
      sub: 'Currently on loan',
      icon: ArrowLeftRight,
      iconColor: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      glow: 'hover:shadow-glow-cyan',
      link: '/admin/circulation'
    },
    {
      title: 'Overdue Books',
      value: stats.overdueBooks,
      sub: 'Past return deadline',
      icon: AlertOctagon,
      iconColor: 'text-rose-500',
      bgColor: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      glow: 'hover:shadow-glow-rose',
      link: '/admin/circulation'
    },
    {
      title: 'Pending Fines',
      value: `₹${stats.pendingFines.toFixed(0)}`,
      sub: 'Unsettled dues',
      icon: Receipt,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      glow: 'hover:shadow-glow-brand',
      link: '/admin/fines'
    },
    {
      title: 'Active Holds',
      value: stats.reservations,
      sub: 'Queue backlogs',
      icon: CalendarClock,
      iconColor: 'text-violet-500',
      bgColor: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
      glow: 'hover:shadow-glow-brand',
      link: '/admin/reservations'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Command Center Glass Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-300 text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Live Operations Deck
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight">
            Institutional Circulation Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time telemetry on book flow, active borrowings, reservation waitlists, and revenue collection
          </p>
        </div>

        {/* Action Capsules */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            icon={PlusCircle}
            onClick={() => navigate('/admin/books?action=new')}
          >
            Add Book
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={Users}
            onClick={() => navigate('/admin/students?action=new')}
          >
            Add Student
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={ArrowLeftRight}
            onClick={() => navigate('/admin/circulation?tab=issue')}
          >
            Issue Book
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/admin/circulation?tab=return')}
          >
            Process Return
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(kpi.link)}
              className={`glass-card p-4 rounded-2xl cursor-pointer ${kpi.glow} flex flex-col justify-between group transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`p-2.5 rounded-xl border backdrop-blur-md ${kpi.bgColor}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  {kpi.title}
                </p>
                <p className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white mt-1 tracking-tight truncate">
                  {kpi.value}
                </p>
                <p className="text-[10px] text-slate-500 truncate mt-1">
                  {kpi.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circulation Volume Area Chart */}
        <Card
          title="Monthly Circulation Volume"
          subtitle="Aggregate book checkouts vs. returns over recent period"
          className="lg:col-span-2"
        >
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyTransactions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="issuesColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="returnsColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(16px)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '1rem',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="total_issues" name="Issued Books" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#issuesColor)" />
                <Area type="monotone" dataKey="total_returns" name="Returned Books" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#returnsColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Books by Category Distribution */}
        <Card
          title="Catalog by Classification"
          subtitle="Proportion of titles across academic disciplines"
        >
          <div className="h-64 sm:h-72 w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.booksByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="category"
                >
                  {charts.booksByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(16px)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '1rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full flex flex-wrap gap-2 justify-center px-2 text-[11px] text-slate-500">
              {charts.booksByCategory.slice(0, 4).map((c, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="truncate max-w-[90px]">{c.category}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Row: Most Borrowed Books & Overdue Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Borrowed Books Bar Chart */}
        <Card
          title="Most In-Demand Titles"
          subtitle="Highest historical circulation frequency"
          className="lg:col-span-2"
        >
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={charts.mostBorrowed}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="title"
                  type="category"
                  width={140}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => (val.length > 20 ? `${val.substring(0, 18)}...` : val)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(16px)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '1rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="borrow_count" name="Times Borrowed" fill="#6366f1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Overdue Books List */}
        <Card
          title="Overdue Returns Alert"
          subtitle={`${overdueList.length} loans past return deadline`}
          action={
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate('/admin/circulation?tab=return')}
            >
              Check-In Desk →
            </Button>
          }
        >
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {overdueList.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                🎉 Excellent! Zero overdue books currently on loan.
              </div>
            ) : (
              overdueList.map((item) => (
                <div
                  key={item.transaction_id}
                  className="p-3.5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 backdrop-blur-md flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {item.book_title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Borrower: <span className="font-semibold text-slate-700 dark:text-slate-200">{item.student_name}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">Due Date: {item.due_date?.split('T')[0]}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-0.5 text-[10px] font-black rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                      {item.days_late}d Late
                    </span>
                    <button
                      onClick={() => navigate(`/admin/circulation?tab=return&txId=${item.transaction_id}`)}
                      className="block text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline mt-1"
                    >
                      Return →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card
        title="Live Circulation Activity Stream"
        subtitle="Recent checkout and check-in audit log"
        action={
          <Button
            variant="outline"
            size="xs"
            onClick={() => navigate('/admin/circulation')}
          >
            Full Ledger
          </Button>
        }
      >
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 border-y border-slate-200/50 dark:border-white/5 font-semibold">
              <tr>
                <th className="py-3 px-6">Tx ID</th>
                <th className="py-3 px-6">Book Title</th>
                <th className="py-3 px-6">Student</th>
                <th className="py-3 px-6">Issued</th>
                <th className="py-3 px-6">Due</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Fine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-white/40 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-6 font-mono text-[11px] text-slate-400">#{tx.id}</td>
                  <td className="py-3 px-6 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                    {tx.book_title}
                  </td>
                  <td className="py-3 px-6 text-slate-600 dark:text-slate-300">{tx.student_name}</td>
                  <td className="py-3 px-6 text-slate-500">{tx.issue_date?.split('T')[0]}</td>
                  <td className="py-3 px-6 text-slate-500">{tx.due_date?.split('T')[0]}</td>
                  <td className="py-3 px-6">
                    <Badge status={tx.status} size="xs" />
                  </td>
                  <td className="py-3 px-6 text-right font-medium">
                    {Number(tx.fine_amount) > 0 ? (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        ₹{Number(tx.fine_amount).toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-slate-400">₹0.00</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
