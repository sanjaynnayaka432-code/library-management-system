import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Printer,
  BookOpen,
  Users,
  CheckCircle,
  Receipt,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import {
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
import { reportsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const toast = useToast();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportsApi.getReports({ startDate, endDate });
      if (res.data?.success) {
        setData(res.data);
      }
    } catch {
      toast.error('Failed to load statistical reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const handleExportCSV = () => {
    if (!data) return;
    const { summary } = data;
    const rows = [
      ['Metric', 'Value'],
      ['Total Books', summary.total_books],
      ['Total Copies', summary.total_copies],
      ['Available Copies', summary.available_copies],
      ['Total Students', summary.total_students],
      ['Total Issued Books', summary.total_issued],
      ['Total Returned Books', summary.total_returned],
      ['Overdue Books', summary.overdue_books],
      ['Total Fines Assessed (INR)', summary.total_fines],
      ['Paid Fines Collected (INR)', summary.paid_fines],
      ['Pending Fines (INR)', summary.pending_fines],
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `librax-circulation-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report CSV exported');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSpinner text="Generating executive analytics report..." size="lg" className="min-h-[60vh]" />;
  }

  if (!data) return null;

  const { summary, booksByCategory, mostBorrowed, mostActiveStudents } = data;

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Institutional Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Circulation performance, inventory utilization, and student engagement audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={FileSpreadsheet}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
          >
            Print Audit
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card className="p-4 print:hidden" bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 p-4 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-brand-600" />
            Filter Period:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
            >
              Reset Filter
            </Button>
          )}
        </div>
      </Card>

      {/* Summary KPI Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Total Books</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {summary.total_books}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">{summary.total_copies} total volume</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Total Students</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {summary.total_students}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Enrolled</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Total Issued</p>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {summary.total_issued}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Loans granted</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Returned On Time</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {summary.total_returned}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Returned</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Collected Fines</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{Number(summary.paid_fines || 0).toFixed(0)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Settled dues</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Pending Fines</p>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
            ₹{Number(summary.pending_fines || 0).toFixed(0)}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Outstanding</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Most In-Demand Titles"
          subtitle="Top titles by aggregate circulation events"
        >
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mostBorrowed} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="title" tick={{ fontSize: 10 }} tickFormatter={(t) => (t.length > 12 ? `${t.substring(0, 10)}...` : t)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="borrow_count" name="Circulation Count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          title="Holdings by Category"
          subtitle="Title inventory distribution by academic discipline"
        >
          <div className="h-64 w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={booksByCategory}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="category"
                >
                  {booksByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-2 text-[11px] text-slate-500">
              {booksByCategory.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span>{c.category} ({c.count})</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Most Active Students Table */}
      <Card
        title="Top Student Readers Leaderboard"
        subtitle="Students with highest borrowing frequencies and timely returns"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-6">Rank</th>
                <th className="py-3 px-6">Student Member</th>
                <th className="py-3 px-6">Email Address</th>
                <th className="py-3 px-6 text-right">Total Books Borrowed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {mostActiveStudents.map((st, idx) => (
                <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-6 font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-3 px-6 font-bold text-slate-900 dark:text-white">
                    {st.name}
                  </td>
                  <td className="py-3 px-6 text-slate-500">{st.email}</td>
                  <td className="py-3 px-6 text-right font-black text-brand-600 dark:text-brand-400">
                    {st.borrow_count} titles
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

export default Reports;
