import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  UserCheck,
  UserX,
  Edit2,
  Eye,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Receipt,
  Clock,
  CheckCircle,
  X
} from 'lucide-react';
import { studentsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

export const Students = () => {
  const location = useLocation();
  const toast = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals & Profile Drawer
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialForm = {
    name: '',
    email: '',
    phone: '',
    password: 'Student@123',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchStudents = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await studentsApi.getAll({
        search,
        status: statusFilter,
        page,
        limit: 10,
      });
      if (res.data?.success) {
        setStudents(res.data.students || []);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, toast]);

  useEffect(() => {
    fetchStudents(1);
  }, [fetchStudents]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      setIsAddModalOpen(true);
    }
  }, [location.search]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await studentsApi.create(formData);
      if (res.data?.success) {
        toast.success(`Student "${formData.name}" enrolled`);
        setIsAddModalOpen(false);
        setFormData(initialForm);
        fetchStudents(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll student');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      password: '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      setSubmitting(true);
      const res = await studentsApi.update(selectedStudent.id, {
        name: formData.name,
        phone: formData.phone,
      });
      if (res.data?.success) {
        toast.success('Student profile updated');
        setIsEditModalOpen(false);
        setSelectedStudent(null);
        fetchStudents(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (student) => {
    try {
      const res = await studentsApi.toggleStatus(student.id);
      if (res.data?.success) {
        toast.success(res.data.message);
        fetchStudents(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change student status');
    }
  };

  const openStudentDetails = async (student) => {
    setIsDetailsOpen(true);
    setDetailsLoading(true);
    try {
      const res = await studentsApi.getById(student.id);
      if (res.data?.success) {
        setStudentDetails(res.data);
      }
    } catch (err) {
      toast.error('Failed to load student complete history');
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Student & Member Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage student registrations, active circulation privileges, and history
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => {
            setFormData(initialForm);
            setIsAddModalOpen(true);
          }}
        >
          Add Student
        </Button>
      </div>

      {/* Search & Filter */}
      <Card className="p-4" bodyClassName="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, email, phone..."
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
            <option value="all">All Account Statuses</option>
            <option value="ACTIVE">Active Privileges Only</option>
            <option value="INACTIVE">Deactivated Accounts</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card bodyClassName="p-0">
        {loading ? (
          <LoadingSpinner text="Loading member roster..." className="py-16" />
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students found"
            description="Adjust your search criteria or register a new student."
            actionLabel="Enroll Student"
            onAction={() => setIsAddModalOpen(true)}
            className="m-6"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Member Info</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Enrolled On</th>
                  <th className="py-3 px-4">Active Loans</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center text-xs">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div
                            onClick={() => openStudentDetails(student)}
                            className="font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer"
                          >
                            {student.name}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ID: #{student.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{student.email}</span>
                      </div>
                      {student.phone && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {student.created_at?.split('T')[0]}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          student.active_loans_count > 0
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {student.active_loans_count || 0} books
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <Badge status={student.status} size="xs" />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openStudentDetails(student)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                          title="View Profile & Loan History"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(student)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                          title="Edit Student Info"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(student)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            student.status === 'ACTIVE'
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                          title={student.status === 'ACTIVE' ? 'Disable Account' : 'Enable Account'}
                        >
                          {student.status === 'ACTIVE' ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={(p) => fetchStudents(p)}
          />
        </div>
      </Card>

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enroll New Student Member"
        subtitle="Create student login credentials for library borrowing privileges"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Maya Lin"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="student@university.edu"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 555-0199"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Initial Password *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Min 6 characters"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Enroll Student
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Student Information"
        subtitle={`Update details for ${selectedStudent?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* Student Details Full Profile Drawer / Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Student Library Profile & Activity"
        subtitle="Complete record of active loans, historical circulation, and overdue fines"
        maxWidth="max-w-2xl"
      >
        {detailsLoading || !studentDetails ? (
          <LoadingSpinner text="Fetching student profile..." className="py-12" />
        ) : (
          <div className="space-y-6 text-xs">
            {/* Student Header */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                  {studentDetails.student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {studentDetails.student.name}
                  </h3>
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    <span>{studentDetails.student.email}</span>
                    <span>•</span>
                    <span>{studentDetails.student.phone || 'No phone'}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <Badge status={studentDetails.student.status} size="sm" />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Enrolled {studentDetails.student.created_at?.split('T')[0]}
                </span>
              </div>
            </div>

            {/* Currently Borrowed Books */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-brand-600" />
                Currently Borrowed Books ({studentDetails.currentLoans?.length || 0})
              </h4>
              {studentDetails.currentLoans?.length === 0 ? (
                <p className="text-slate-400 py-3 italic">No books currently on loan.</p>
              ) : (
                <div className="space-y-2">
                  {studentDetails.currentLoans.map((loan) => (
                    <div
                      key={loan.transaction_id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {loan.title}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          Issued: {loan.issue_date?.split('T')[0]} | Due: {loan.due_date?.split('T')[0]}
                        </div>
                      </div>
                      <Badge status={loan.status} size="xs" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Fines */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-rose-500" />
                Fines & Penalties ({studentDetails.fines?.length || 0})
              </h4>
              {studentDetails.fines?.length === 0 ? (
                <p className="text-slate-400 py-3 italic">No pending fines for this student.</p>
              ) : (
                <div className="space-y-2">
                  {studentDetails.fines.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl border border-rose-100 dark:border-rose-950 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {f.reason || 'Overdue return penalty'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Recorded on {f.created_at?.split('T')[0]}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-rose-600 text-sm">
                          ₹{Number(f.amount).toFixed(2)}
                        </span>
                        <div className="mt-0.5">
                          <Badge status={f.status} size="xs" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Borrowing History */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                Circulation History ({studentDetails.history?.length || 0})
              </h4>
              {studentDetails.history?.length === 0 ? (
                <p className="text-slate-400 py-3 italic">No past returns recorded yet.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {studentDetails.history.map((h) => (
                    <div
                      key={h.id}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-[11px]"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {h.title}
                      </span>
                      <span className="text-slate-400">
                        Returned: {h.return_date?.split('T')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Students;
