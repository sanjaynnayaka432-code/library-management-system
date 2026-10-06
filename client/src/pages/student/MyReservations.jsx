import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  BookOpen,
  ArrowRight,
  Info
} from 'lucide-react';
import { reservationsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export const MyReservations = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await reservationsApi.getAll();
      if (res.data?.success) {
        setReservations(res.data.reservations || []);
      }
    } catch {
      toast.error('Failed to load your reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    try {
      setCancelling(true);
      const res = await reservationsApi.updateStatus(cancelTarget.id, 'CANCELLED');
      if (res.data?.success) {
        toast.success('Reservation cancelled');
        setCancelTarget(null);
        fetchReservations();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          My Reserved Books & Waitlists
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          When another member returns a reserved book, you'll be automatically notified for priority pickup
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200/60 dark:border-brand-800/40 text-xs text-brand-800 dark:text-brand-300 flex items-start gap-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Queue Mechanics:</strong> Waitlists are allocated on a strictly first-come, first-served basis. As soon as a returned book is scanned by library staff, you will receive an in-app notice to collect your copy.
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Checking waitlist positions..." className="py-20" />
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No reservations placed"
          description="Browse the catalog to place holds on high-demand or checked-out books."
          actionLabel="Explore Catalog"
          onAction={() => navigate('/catalog')}
        />
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div
              key={r.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shrink-0">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      onClick={() => navigate(`/books/${r.book_id}`)}
                      className="text-sm font-bold text-slate-900 dark:text-white hover:text-brand-600 cursor-pointer"
                    >
                      {r.book_title}
                    </h3>
                    <Badge status={r.status} size="xs" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    ISBN: <span className="font-mono text-slate-700 dark:text-slate-300">{r.isbn}</span> • Reserved On:{' '}
                    {r.reservation_date ? new Date(r.reservation_date).toLocaleDateString() : '—'}
                  </p>

                  <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-2">
                    <span>
                      Copies currently on shelf:{' '}
                      <strong className={r.available_copies > 0 ? 'text-emerald-600' : 'text-slate-500'}>
                        {r.available_copies} available
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => navigate(`/books/${r.book_id}`)}
                >
                  View Book
                </Button>
                {r.status === 'WAITING' && (
                  <Button
                    size="xs"
                    variant="danger"
                    onClick={() => setCancelTarget(r)}
                  >
                    Cancel Hold
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Book Hold"
        message={`Are you sure you want to surrender your waitlist spot for "${cancelTarget?.book_title}"?`}
        confirmText="Yes, Cancel Hold"
        isLoading={cancelling}
      />
    </div>
  );
};

export default MyReservations;
