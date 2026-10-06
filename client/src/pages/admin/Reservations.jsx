import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  User,
  AlertCircle
} from 'lucide-react';
import { reservationsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);

  const toast = useToast();

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await reservationsApi.getAll({
        status: statusFilter,
        search,
      });
      if (res.data?.success) {
        setReservations(res.data.reservations || []);
      }
    } catch {
      toast.error('Failed to load reservations queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter, search]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      const res = await reservationsApi.updateStatus(id, newStatus);
      if (res.data?.success) {
        toast.success(`Reservation marked as ${newStatus}`);
        fetchReservations();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update reservation');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      setUpdatingId(cancelTarget.id);
      const res = await reservationsApi.updateStatus(cancelTarget.id, 'CANCELLED');
      if (res.data?.success) {
        toast.success('Reservation cancelled');
        setCancelTarget(null);
        fetchReservations();
      }
    } catch (err) {
      toast.error('Failed to cancel reservation');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Reservation Queue & Backlog
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor student waitlists for high-demand or checked-out books
        </p>
      </div>

      {/* Filters Toolbar */}
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
            <option value="all">All Reservation Statuses</option>
            <option value="WAITING">WAITING (In Queue)</option>
            <option value="FULFILLED">FULFILLED (Checked Out)</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </Card>

      {/* Reservations Table */}
      <Card bodyClassName="p-0">
        {loading ? (
          <LoadingSpinner text="Retrieving waitlists..." className="py-16" />
        ) : reservations.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No reservations found"
            description="There are currently no book holds or waitlist queues matching this query."
            className="m-6"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Queue ID</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Reserved Date</th>
                  <th className="py-3 px-4">Available Copies</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reservations.map((res) => (
                  <tr
                    key={res.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-500">
                      #{res.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white max-w-xs truncate">
                        {res.book_title}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ISBN: {res.isbn}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {res.student_name}
                      </div>
                      <div className="text-[10px] text-slate-400">{res.student_email}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {res.reservation_date ? new Date(res.reservation_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          res.available_copies > 0 ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        {res.available_copies} available
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={res.status} size="xs" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {res.status === 'WAITING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => handleStatusChange(res.id, 'FULFILLED')}
                            disabled={updatingId === res.id}
                          >
                            Fulfill
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => setCancelTarget(res)}
                            disabled={updatingId === res.id}
                            className="text-rose-600 hover:text-rose-700"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Archived</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel Book Reservation"
        message={`Cancel waitlist place for ${cancelTarget?.student_name} on "${cancelTarget?.book_title}"?`}
        confirmText="Cancel Reservation"
      />
    </div>
  );
};

export default Reservations;
