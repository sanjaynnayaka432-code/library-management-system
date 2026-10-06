import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CheckCircle,
  AlertTriangle,
  Clock,
  Info
} from 'lucide-react';
import { finesApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export const MyFines = () => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchFines = async () => {
    try {
      setLoading(true);
      const res = await finesApi.getAll();
      if (res.data?.success) {
        setFines(res.data.fines || []);
      }
    } catch {
      toast.error('Failed to load your fine history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const totalPending = fines
    .filter((f) => f.status === 'PENDING')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Overdue Fines & Penalties
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review overdue fees incurred from late book returns
        </p>
      </div>

      {/* Summary Box */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Outstanding Balance
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              ₹{totalPending.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
          Outstanding fines can be settled directly in person at the Circulation Desk via cash or university card.
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving fine statements..." className="py-20" />
      ) : fines.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Zero penalties on record!"
          description="Your library account has a clean slate. Keep returning your books on time!"
        />
      ) : (
        <Card bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Reason / Late Days</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Settled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {fines.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">
                      #FR-{f.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                      {f.book_title}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{f.reason}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        ₹{Number(f.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={f.status} size="xs" />
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {f.paid_at ? new Date(f.paid_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default MyFines;
