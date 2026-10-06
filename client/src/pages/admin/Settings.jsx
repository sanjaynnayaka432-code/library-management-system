import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Clock,
  Receipt,
  BookOpen,
  Mail,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { settingsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const Settings = () => {
  const [formData, setFormData] = useState({
    borrowing_period_days: '14',
    fine_rate_per_day: '5',
    max_books_per_student: '5',
    library_name: 'LibraX Smart Library System',
    contact_email: 'librarian@librax.edu',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const toast = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsApi.getSettings();
      if (res.data?.success) {
        setFormData(res.data.settings);
      }
    } catch {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await settingsApi.updateSettings(formData);
      if (res.data?.success) {
        toast.success('Library circulation configuration saved successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading system parameters..." size="lg" className="min-h-[60vh]" />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          System Administration & Rules
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure circulation policies, overdue rates, borrowing thresholds, and institutional profile
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Circulation Policies */}
        <Card
          title="Circulation & Lending Parameters"
          subtitle="Configure default loan periods and student allocation quotas"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
                Borrowing Period (Days) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="90"
                name="borrowing_period_days"
                value={formData.borrowing_period_days}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Standard days allowed before book is overdue
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-rose-500" />
                Fine Rate per Day (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.5"
                name="fine_rate_per_day"
                value={formData.fine_rate_per_day}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Daily penalty assessed after due date
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                Max Books per Student *
              </label>
              <input
                type="number"
                required
                min="1"
                max="20"
                name="max_books_per_student"
                value={formData.max_books_per_student}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Maximum active loans concurrent per member
              </span>
            </div>
          </div>
        </Card>

        {/* Institution Info */}
        <Card
          title="Library Identity"
          subtitle="Display metadata used on receipts and notification headers"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Library Name
              </label>
              <input
                type="text"
                required
                name="library_name"
                value={formData.library_name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Helpdesk Email
              </label>
              <input
                type="email"
                required
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </Card>

        {/* Security & Access */}
        <Card
          title="Database & Environment Status"
          subtitle="Persistent storage configuration"
        >
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  MySQL 8.x Production Engine
                </p>
                <p className="text-[11px] text-slate-500">
                  Database: <span className="font-mono font-semibold">library_management</span> (Host: localhost:3306)
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[11px]">
              ONLINE & HEALTHY
            </span>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={Save}
            isLoading={saving}
          >
            Save Configuration Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
