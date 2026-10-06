import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookMarked,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Receipt,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { transactionsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export const MyBooks = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('current'); // 'current' | 'history'
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await transactionsApi.getAll({ limit: 100 });
      if (res.data?.success) {
        setLoans(res.data.transactions || []);
      }
    } catch {
      toast.error('Failed to load your borrowing records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const currentLoans = loans.filter((l) => l.status === 'ISSUED' || l.status === 'OVERDUE');
  const pastLoans = loans.filter((l) => l.status === 'RETURNED');

  const calculateDaysRemaining = (dueDateStr) => {
    const due = new Date(dueDateStr);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            My Borrowed Books & Circulation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track active copies on loan, check renewal dates, and view completed returns
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'current'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Currently Borrowed ({currentLoans.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Borrowing History ({pastLoans.length})
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving loan records..." className="py-20" />
      ) : activeTab === 'current' ? (
        currentLoans.length === 0 ? (
          <EmptyState
            icon={BookMarked}
            title="No active loans"
            description="You don't have any books currently borrowed from the library."
            actionLabel="Discover Books in Catalog"
            onAction={() => navigate('/catalog')}
          />
        ) : (
          <div className="space-y-4">
            {currentLoans.map((loan) => {
              const daysLeft = calculateDaysRemaining(loan.due_date);
              const isOverdue = daysLeft < 0;
              const isDueSoon = daysLeft >= 0 && daysLeft <= 3;

              return (
                <div
                  key={loan.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isOverdue
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 shadow-sm shadow-rose-500/5'
                      : isDueSoon
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shrink-0">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            onClick={() => navigate(`/books/${loan.book_id}`)}
                            className="text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-brand-600 cursor-pointer"
                          >
                            {loan.book_title}
                          </h3>
                          <Badge status={loan.status} size="xs" />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Transaction ID: <span className="font-mono">#{loan.id}</span> • Shelf:{' '}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {loan.shelf_location || 'General Stacks'}
                          </span>
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Issued: {loan.issue_date?.split('T')[0]}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Due Date: {loan.due_date?.split('T')[0]}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                      {isOverdue ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {Math.abs(daysLeft)} Day(s) Overdue
                          </span>
                          <span className="text-[11px] text-rose-600 dark:text-rose-400 block mt-1 font-semibold">
                            Penalty: ₹5 / day late fee applies
                          </span>
                        </div>
                      ) : isDueSoon ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                            <Clock className="w-3.5 h-3.5" />
                            Due in {daysLeft} Day(s)
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">
                            Return soon to avoid late charges
                          </span>
                        </div>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          {daysLeft} days remaining
                        </span>
                      )}

                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => navigate(`/books/${loan.book_id}`)}
                      >
                        View Book Page
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : pastLoans.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No completed returns yet"
          description="Books that you borrow and successfully return will appear here in your reading ledger."
        />
      ) : (
        <Card bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Tx ID</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Return Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Fine Incurred</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pastLoans.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-slate-400">#{l.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                      {l.book_title}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{l.issue_date?.split('T')[0]}</td>
                    <td className="py-3 px-4 text-slate-500">{l.due_date?.split('T')[0]}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {l.return_date?.split('T')[0]}
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={l.status} size="xs" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {Number(l.fine_amount) > 0 ? (
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          ₹{Number(l.fine_amount).toFixed(2)}
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
      )}
    </div>
  );
};

export default MyBooks;
