import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  AlertTriangle,
  Receipt,
  Bookmark,
  Clock,
  ArrowRight,
  Search,
  Sparkles,
  BookMarked
} from 'lucide-react';
import { dashboardApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getStats();
      if (res.data?.success) {
        setData(res.data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Connecting to your student hub..." size="lg" className="min-h-[60vh]" />;
  }

  const stats = data?.stats || {
    currentlyBorrowed: 0,
    dueSoon: 0,
    overdue: 0,
    pendingFines: 0,
    reservations: 0,
  };
  const currentLoans = data?.currentLoans || [];
  const recommendedBooks = data?.recommendedBooks || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Student Glass Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-indigo-500/10 border border-white/20 bg-gradient-to-r from-brand-600/90 via-indigo-600/90 to-accent-cyan/85 backdrop-blur-2xl">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
            <span>LibXVerse Student Learning Lounge</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight leading-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-brand-100 mt-2 leading-relaxed">
            Monitor your loan countdowns, discover new academic titles, and reserve waitlisted books.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              icon={Search}
              onClick={() => navigate('/catalog')}
              className="bg-white/95 text-brand-700 hover:bg-white border-none font-bold shadow-lg"
            >
              Browse Catalog
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={BookMarked}
              onClick={() => navigate('/student/my-books')}
              className="border-white/30 text-white hover:bg-white/10"
            >
              My Borrowed Books
            </Button>
          </div>
        </div>

        {/* Ambient blurred glow orbs */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-white/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-24 bottom-0 -mb-12 w-48 h-48 bg-accent-cyan/20 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => navigate('/student/my-books')}
          className="glass-card p-4 rounded-2xl cursor-pointer hover:shadow-glow-brand flex flex-col justify-between"
        >
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 w-fit mb-2">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Currently Borrowed
            </p>
            <p className="text-2xl font-display font-black text-slate-900 dark:text-white mt-0.5">
              {stats.currentlyBorrowed}
            </p>
          </div>
        </div>

        <div
          onClick={() => navigate('/student/my-books')}
          className="glass-card p-4 rounded-2xl cursor-pointer hover:shadow-glow-brand flex flex-col justify-between"
        >
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 w-fit mb-2">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Due Soon (3 Days)
            </p>
            <p className="text-2xl font-display font-black text-amber-500 mt-0.5">
              {stats.dueSoon}
            </p>
          </div>
        </div>

        <div
          onClick={() => navigate('/student/my-books')}
          className="glass-card p-4 rounded-2xl cursor-pointer hover:shadow-glow-rose flex flex-col justify-between"
        >
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 w-fit mb-2">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Overdue Books
            </p>
            <p className="text-2xl font-display font-black text-rose-500 mt-0.5">
              {stats.overdue}
            </p>
          </div>
        </div>

        <div
          onClick={() => navigate('/student/my-fines')}
          className="glass-card p-4 rounded-2xl cursor-pointer hover:shadow-glow-rose flex flex-col justify-between"
        >
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 w-fit mb-2">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pending Fines
            </p>
            <p className="text-2xl font-display font-black text-slate-900 dark:text-white mt-0.5">
              ₹{Number(stats.pendingFines || 0).toFixed(0)}
            </p>
          </div>
        </div>

        <div
          onClick={() => navigate('/student/my-reservations')}
          className="glass-card p-4 rounded-2xl cursor-pointer hover:shadow-glow-brand flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 w-fit mb-2">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Holds
            </p>
            <p className="text-2xl font-display font-black text-slate-900 dark:text-white mt-0.5">
              {stats.reservations}
            </p>
          </div>
        </div>
      </div>

      {/* Row: Active Loans Due Dates & Recommended Books */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="My Active Loans"
          subtitle="Keep track of return countdowns to avoid daily fines"
          className="lg:col-span-2"
          action={
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate('/student/my-books')}
            >
              All Loans →
            </Button>
          }
        >
          <div className="space-y-3">
            {currentLoans.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                You have no books currently on loan. Browse the catalog to borrow titles!
              </div>
            ) : (
              currentLoans.map((item) => {
                const isLate = item.days_remaining < 0;
                const isDueSoon = item.days_remaining >= 0 && item.days_remaining <= 3;
                return (
                  <div
                    key={item.transaction_id}
                    className={`p-4 rounded-2xl border backdrop-blur-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isLate
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : isDueSoon
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'glass-panel'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={item.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=120'}
                        alt={item.title}
                        className="w-11 h-15 object-cover rounded-xl shadow-md border border-white/20 shrink-0"
                      />
                      <div>
                        <h4
                          onClick={() => navigate(`/books/${item.book_id}`)}
                          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-brand-500 cursor-pointer line-clamp-1 transition-colors"
                        >
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">by {item.author}</p>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span>Issued: {item.issue_date?.split('T')[0]}</span>
                          <span>•</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            Due: {item.due_date?.split('T')[0]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col items-end justify-between sm:justify-center gap-1.5 shrink-0">
                      {isLate ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                          {Math.abs(item.days_remaining)}d Overdue!
                        </span>
                      ) : isDueSoon ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          Due in {item.days_remaining} day(s)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                          {item.days_remaining} days left
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Popular Recommended Books Preview */}
        <Card
          title="Recommended For You"
          subtitle="Popular titles available right now"
          action={
            <Button
              variant="ghost"
              size="xs"
              onClick={() => navigate('/catalog')}
            >
              Explore Catalog →
            </Button>
          }
        >
          <div className="space-y-3">
            {recommendedBooks.map((book) => (
              <div
                key={book.id}
                onClick={() => navigate(`/books/${book.id}`)}
                className="group cursor-pointer p-2.5 rounded-2xl hover:bg-white/60 dark:hover:bg-white/5 transition-all flex items-center gap-3"
              >
                <img
                  src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=120'}
                  alt={book.title}
                  className="w-10 h-13 object-cover rounded-lg shadow-sm border border-white/20 shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors line-clamp-1">
                    {book.title}
                  </h5>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{book.author}</p>
                  <span className="inline-block mt-0.5 text-[10px] text-brand-500 font-bold">
                    {book.category_name}
                  </span>
                </div>
                <Badge
                  status={book.available_copies > 0 ? 'AVAILABLE' : 'WAITING'}
                  size="xs"
                  text={book.available_copies > 0 ? 'In Stock' : 'Reserved'}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
