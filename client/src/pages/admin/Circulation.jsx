import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ArrowLeftRight,
  BookOpen,
  User,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Search,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import {
  transactionsApi,
  booksApi,
  studentsApi,
  settingsApi
} from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const Circulation = () => {
  const location = useLocation();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('issue');

  // ISSUE STATE
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [settings, setSettings] = useState({ borrowing_period_days: 14, fine_rate_per_day: 5 });
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [customDueDate, setCustomDueDate] = useState('');
  const [issuing, setIssuing] = useState(false);

  // RETURN STATE
  const [returnSearch, setReturnSearch] = useState('');
  const [activeLoans, setActiveLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [selectedTxForReturn, setSelectedTxForReturn] = useState(null);
  const [returning, setReturning] = useState(false);
  const [customReturnDate, setCustomReturnDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [returnSummary, setReturnSummary] = useState(null);

  // HISTORY STATE
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [studRes, bookRes, setRes] = await Promise.all([
          studentsApi.getAll({ limit: 100 }),
          booksApi.getAll({ limit: 100 }),
          settingsApi.getSettings(),
        ]);

        if (studRes.data?.success) setStudents(studRes.data.students || []);
        if (bookRes.data?.success) setBooks(bookRes.data.books || []);
        if (setRes.data?.success) {
          const s = setRes.data.settings;
          setSettings({
            borrowing_period_days: parseInt(s.borrowing_period_days, 10) || 14,
            fine_rate_per_day: parseFloat(s.fine_rate_per_day) || 5,
          });
        }
      } catch {}
    };
    init();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'return' || tabParam === 'issue' || tabParam === 'history') {
      setActiveTab(tabParam);
    }
    const bookParam = params.get('bookId');
    if (bookParam) {
      setSelectedBookId(bookParam);
    }
    const txParam = params.get('txId');
    if (txParam) {
      setReturnSearch(txParam);
    }
  }, [location.search]);

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + (settings.borrowing_period_days || 14));
    setCustomDueDate(d.toISOString().split('T')[0]);
  }, [settings.borrowing_period_days]);

  const fetchActiveLoans = async () => {
    try {
      setLoadingLoans(true);
      const res = await transactionsApi.getAll({
        status: 'ISSUED',
        search: returnSearch,
        limit: 50,
      });
      if (res.data?.success) {
        setActiveLoans(res.data.transactions || []);
      }
    } catch {
      toast.error('Failed to load active loans');
    } finally {
      setLoadingLoans(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await transactionsApi.getAll({ limit: 50 });
      if (res.data?.success) {
        setHistoryList(res.data.transactions || []);
      }
    } catch {
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'return') {
      fetchActiveLoans();
    } else if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, returnSearch]);

  const currentStudent = students.find((s) => s.id === parseInt(selectedStudentId, 10));
  const currentBook = books.find((b) => b.id === parseInt(selectedBookId, 10));

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedBookId) {
      toast.warning('Please select both a student and a book');
      return;
    }

    try {
      setIssuing(true);
      const res = await transactionsApi.issue({
        userId: selectedStudentId,
        bookId: selectedBookId,
        customDueDate,
      });

      if (res.data?.success) {
        toast.success(res.data.message);
        const [studRes, bookRes] = await Promise.all([
          studentsApi.getAll({ limit: 100 }),
          booksApi.getAll({ limit: 100 }),
        ]);
        if (studRes.data?.success) setStudents(studRes.data.students || []);
        if (bookRes.data?.success) setBooks(bookRes.data.books || []);

        setSelectedBookId('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue book');
    } finally {
      setIssuing(false);
    }
  };

  const calculateLiveFine = (dueDateStr, returnDateStr) => {
    const due = new Date(dueDateStr);
    const ret = new Date(returnDateStr);
    due.setHours(0, 0, 0, 0);
    ret.setHours(0, 0, 0, 0);

    const diffTime = ret.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const lateDays = Math.max(0, diffDays);
    const fineAmount = lateDays * settings.fine_rate_per_day;

    return {
      lateDays,
      fineAmount,
      isOverdue: lateDays > 0,
    };
  };

  const handleProcessReturn = async (tx) => {
    try {
      setReturning(true);
      const res = await transactionsApi.returnBook({
        transactionId: tx.id,
        returnDate: customReturnDate,
      });

      if (res.data?.success) {
        toast.success(res.data.message);
        setReturnSummary({
          bookTitle: tx.book_title,
          studentName: tx.student_name,
          fine: res.data.fine,
          reservationNotified: res.data.reservationNotified,
        });
        setSelectedTxForReturn(null);
        fetchActiveLoans();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process return');
    } finally {
      setReturning(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Segmented Glass Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight">
            Circulation Operations Desk
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rapid checkout, return processing, dynamic overdue penalty calculation, and queue fulfillment
          </p>
        </div>

        {/* Glass Switcher */}
        <div className="flex items-center gap-1.5 p-1.5 glass-panel rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('issue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'issue'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Issue Book
          </button>
          <button
            onClick={() => setActiveTab('return')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'return'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Return Desk
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Circulation History
          </button>
        </div>
      </div>

      {/* TAB 1: ISSUE BOOK */}
      {activeTab === 'issue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card
            title="Book Checkout Protocol"
            subtitle="Verify student credentials and physical copy before finalizing loan"
            className="lg:col-span-2"
          >
            <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Student Member *
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Select Student Member --</option>
                  {students.map((s) => (
                    <option
                      key={s.id}
                      value={s.id}
                      disabled={s.status !== 'ACTIVE'}
                    >
                      {s.name} ({s.email}) — Status: {s.status} — Active Loans: {s.active_loans_count || 0}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Book Title *
                </label>
                <select
                  required
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Select Book from Catalog --</option>
                  {books.map((b) => (
                    <option
                      key={b.id}
                      value={b.id}
                      disabled={b.available_copies <= 0}
                    >
                      {b.title} [ISBN: {b.isbn}] — Available: {b.available_copies}/{b.total_copies} ({b.shelf_location || 'Stacks'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Checkout Timestamp
                  </label>
                  <input
                    type="text"
                    disabled
                    value={new Date().toISOString().split('T')[0]}
                    className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-400 cursor-not-allowed opacity-70"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Scheduled Due Date * ({settings.borrowing_period_days} Days Standard)
                  </label>
                  <input
                    type="date"
                    required
                    value={customDueDate}
                    onChange={(e) => setCustomDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-800 dark:text-brand-300 flex items-start gap-3 backdrop-blur-md">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-brand-500" />
                <div className="leading-relaxed">
                  <strong>Circulation Rule:</strong> Borrowing period is set to {settings.borrowing_period_days} days. Late returns automatically incur penalties at ₹{settings.fine_rate_per_day}/day.
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={issuing}
                  className="w-full"
                  disabled={!selectedStudentId || !selectedBookId}
                >
                  Confirm & Issue Book
                </Button>
              </div>
            </form>
          </Card>

          {/* Verification Glass Sidebar */}
          <div className="space-y-4">
            <Card title="Pre-Loan Verification" subtitle="Live checks">
              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-2xl glass-panel">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">
                    Member Identity
                  </span>
                  {currentStudent ? (
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {currentStudent.name}
                      </div>
                      <div className="text-slate-500 text-[11px]">{currentStudent.email}</div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge status={currentStudent.status} size="xs" />
                        <span className="text-[11px] text-slate-400">
                          {currentStudent.active_loans_count || 0} active loans
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No student selected</span>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl glass-panel">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">
                    Physical Stock Status
                  </span>
                  {currentBook ? (
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {currentBook.title}
                      </div>
                      <div className="text-slate-500 text-[11px]">ISBN: {currentBook.isbn}</div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge
                          status={currentBook.available_copies > 0 ? 'AVAILABLE' : 'UNAVAILABLE'}
                          size="xs"
                          text={`${currentBook.available_copies} copies left`}
                        />
                        <span className="text-[11px] text-slate-400">
                          Shelf: {currentBook.shelf_location || 'General'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No book selected</span>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: RETURN BOOK */}
      {activeTab === 'return' && (
        <div className="space-y-6">
          {returnSummary && (
            <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-xs backdrop-blur-xl flex items-start justify-between gap-4 animate-fade-in">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300">
                    Return Completed for "{returnSummary.bookTitle}"
                  </h4>
                  <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Returned by {returnSummary.studentName}.{' '}
                    {returnSummary.fine?.amount > 0 ? (
                      <span className="font-bold text-rose-500">
                        Overdue: {returnSummary.fine.lateDays} days late. Fine of ₹{returnSummary.fine.amount.toFixed(2)} recorded.
                      </span>
                    ) : (
                      'Returned on time. Zero fines applied.'
                    )}
                  </p>
                  {returnSummary.reservationNotified && (
                    <p className="text-brand-600 dark:text-brand-300 font-bold mt-1">
                      🔔 Next queued student ({returnSummary.reservationNotified.studentName}) has been notified that this title is ready for pickup!
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setReturnSummary(null)}
                className="text-emerald-600 hover:text-emerald-800 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          <Card className="p-4" bodyClassName="p-0">
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by student, book, or transaction ID..."
                  value={returnSearch}
                  onChange={(e) => setReturnSearch(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Simulate Return Date:</span>
                <input
                  type="date"
                  value={customReturnDate}
                  onChange={(e) => setCustomReturnDate(e.target.value)}
                  className="glass-input px-3 py-1.5 rounded-xl text-xs"
                />
              </div>
            </div>
          </Card>

          <Card
            title="Active Books on Loan"
            subtitle={`${activeLoans.length} active transactions ready to be checked back in`}
            bodyClassName="p-0"
          >
            {loadingLoans ? (
              <LoadingSpinner text="Searching active circulation records..." className="py-16" />
            ) : activeLoans.length === 0 ? (
              <div className="py-14 text-center text-xs text-slate-400">
                No active loans matching your search query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 border-b border-slate-200/50 dark:border-white/5 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Tx ID</th>
                      <th className="py-3 px-4">Book Title</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Issued</th>
                      <th className="py-3 px-4">Due</th>
                      <th className="py-3 px-4">Fine Preview</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {activeLoans.map((tx) => {
                      const fineEst = calculateLiveFine(tx.due_date, customReturnDate);
                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-white/40 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">
                            #{tx.id}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                            {tx.book_title}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {tx.student_name}
                            </div>
                            <div className="text-[10px] text-slate-400">{tx.student_email}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {tx.issue_date?.split('T')[0]}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {tx.due_date?.split('T')[0]}
                          </td>
                          <td className="py-3 px-4">
                            {fineEst.isOverdue ? (
                              <span className="inline-flex items-center gap-1 font-bold text-rose-500">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {fineEst.lateDays}d Late (₹{fineEst.fineAmount.toFixed(2)})
                              </span>
                            ) : (
                              <span className="text-emerald-500 font-semibold">
                                ✓ On Time (₹0)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="xs"
                              variant={fineEst.isOverdue ? 'danger' : 'primary'}
                              isLoading={returning && selectedTxForReturn?.id === tx.id}
                              onClick={() => {
                                setSelectedTxForReturn(tx);
                                handleProcessReturn(tx);
                              }}
                            >
                              Process Return
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: CIRCULATION HISTORY */}
      {activeTab === 'history' && (
        <Card title="Circulation Ledger History" subtitle="Chronological transactions audit" bodyClassName="p-0">
          {loadingHistory ? (
            <LoadingSpinner text="Retrieving transaction records..." className="py-16" />
          ) : historyList.length === 0 ? (
            <div className="py-14 text-center text-xs text-slate-400">
              No transactions recorded in database yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 border-b border-slate-200/50 dark:border-white/5 font-semibold">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Book</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Issued</th>
                    <th className="py-3 px-4">Due</th>
                    <th className="py-3 px-4">Returned</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Fine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {historyList.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/40 dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-mono text-slate-400">#{tx.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {tx.book_title}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{tx.student_name}</td>
                      <td className="py-3 px-4 text-slate-500">{tx.issue_date?.split('T')[0]}</td>
                      <td className="py-3 px-4 text-slate-500">{tx.due_date?.split('T')[0]}</td>
                      <td className="py-3 px-4 text-slate-500">{tx.return_date?.split('T')[0] || '—'}</td>
                      <td className="py-3 px-4"><Badge status={tx.status} size="xs" /></td>
                      <td className="py-3 px-4 text-right font-medium">
                        {Number(tx.fine_amount) > 0 ? (
                          <span className="text-rose-500 font-bold">₹{Number(tx.fine_amount).toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400">₹0.00</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default Circulation;
