import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CheckCircle,
  AlertTriangle,
  Search,
  DollarSign,
  Clock,
  Check,
  CreditCard
} from 'lucide-react';
import { finesApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export const Fines = () => {
  const [fines, setFines] = useState([]);
  const [stats, setStats] = useState({
    pendingAmount: 0,
    collectedAmount: 0,
    pendingCount: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedFine, setSelectedFine] = useState(null);
  const [paying, setPaying] = useState(false);

  const toast = useToast();

  const fetchFinesData = async () => {
    try {
      setLoading(true);
      const [finesRes, statsRes] = await Promise.all([
        finesApi.getAll({ status: statusFilter, search }),
        finesApi.getStats(),
      ]);

      if (finesRes.data?.success) {
        setFines(finesRes.data.fines || []);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data.stats);
      }
    } catch {
      toast.error('Failed to load fines data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinesData();
  }, [statusFilter, search]);

  const handlePayConfirm = async () => {
    if (!selectedFine) return;
    try {
      setPaying(true);
      const res = await finesApi.payFine(selectedFine.id);
      if (res.data?.success) {
        toast.success(`Fine #FR-${selectedFine.id} marked as PAID`);
        setSelectedFine(null);
        fetchFinesData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update fine');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Overdue Fine Ledger
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor late returns, assess penalties, and collect dues
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Pending Fines
            </p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              ₹{Number(stats.pendingAmount || 0).toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {stats.pendingCount || 0} uncollected invoices
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Collected Fines
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              ₹{Number(stats.collectedAmount || 0).toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Successfully settled</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Overdue Transactions
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.overdueCount || 0}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Currently past return date</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4" bodyClassName="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name or book title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Fine Statuses</option>
            <option value="PENDING">PENDING (Unpaid Only)</option>
            <option value="PAID">PAID (Settled Records)</option>
          </select>
        </div>
      </Card>

      {/* Fines Table */}
      <Card bodyClassName="p-0">
        {loading ? (
          <LoadingSpinner text="Retrieving fine records..." className="py-16" />
        ) : fines.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No fines recorded"
            description="All student accounts are currently in good standing."
            className="m-6"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Book</th>
                  <th className="py-3 px-4">Penalty Reason</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fines.map((fine) => (
                  <tr
                    key={fine.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">
                      #FR-{fine.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {fine.student_name}
                      </div>
                      <div className="text-[10px] text-slate-400">{fine.student_email}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {fine.book_title}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {fine.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                        ₹{Number(fine.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={fine.status} size="xs" />
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {fine.paid_at ? new Date(fine.paid_at).toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {fine.status === 'PENDING' ? (
                        <Button
                          size="xs"
                          variant="success"
                          icon={Check}
                          onClick={() => setSelectedFine(fine)}
                        >
                          Mark as Paid
                        </Button>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[11px] flex items-center justify-end gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Cleared
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Confirmation to mark fine as paid */}
      <ConfirmDialog
        isOpen={!!selectedFine}
        onClose={() => setSelectedFine(null)}
        onConfirm={handlePayConfirm}
        title="Confirm Payment Collection"
        message={`Collect and mark fine #FR-${selectedFine?.id} (₹${Number(selectedFine?.amount || 0).toFixed(2)}) for ${selectedFine?.student_name} as PAID?`}
        confirmText="Confirm Payment"
        type="success"
        isLoading={paying}
      />
    </div>
  );
};

export default Fines;
