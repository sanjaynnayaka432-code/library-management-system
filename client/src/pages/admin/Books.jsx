import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  QrCode,
  Eye,
  Copy,
  BarChart3,
  Upload,
  TrendingUp,
  Library,
  BookMarked,
  Tag,
  Star,
  CheckCircle2,
  XCircle,
  Layers,
  Globe,
  X
} from 'lucide-react';

const LANGUAGES = ['English', 'Kannada', 'Hindi', 'Telugu', 'Tamil', 'Malayalam', 'Marathi', 'Bengali', 'Other'];
const FORMATS = ['Paperback', 'Hardcover', 'Textbook', 'Reference', 'Magazine', 'Journal'];

// Simple inline bar chart
const BarChart = ({ data, maxItems = 8 }) => {
  if (!data || data.length === 0) return null;
  const top = data.slice(0, maxItems);
  const max = Math.max(...top.map(d => d.count || d.borrow_count || 0), 1);
  return (
    <div className="space-y-2 mt-2">
      {top.map((item, i) => {
        const val = item.count || item.borrow_count || 0;
        const pct = Math.round((val / max) * 100);
        return (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-32 text-right text-slate-500 dark:text-slate-400 truncate shrink-0">{item.name || item.title}</span>
            <div className="flex-1 bg-slate-100 dark:bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-6 text-slate-700 dark:text-slate-300 font-bold">{val}</span>
          </div>
        );
      })}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className={`rounded-2xl p-4 border ${color} flex items-start gap-3`}>
    <div className="p-2 rounded-xl bg-white/60 dark:bg-white/10 shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <div className="text-xl font-black tracking-tight">{value?.toLocaleString() ?? '—'}</div>
      <div className="text-xs font-semibold opacity-80">{label}</div>
      {sub && <div className="text-[11px] opacity-60 mt-0.5">{sub}</div>}
    </div>
  </div>
);
import { booksApi, categoriesApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import QrModal from '../../components/common/QrModal';

export const Books = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('books');
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrBook, setQrBook] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkJson, setBulkJson] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialForm = {
    title: '',
    isbn: '',
    author: '',
    publisher: '',
    publication_year: new Date().getFullYear(),
    category_id: '',
    description: '',
    cover_image: '',
    total_copies: 3,
    shelf_location: '',
    language: 'English',
    book_format: 'Paperback',
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.getAll();
      if (res.data?.success) {
        setCategories(res.data.categories || []);
      }
    } catch {}
  };

  const fetchBooks = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await booksApi.getAll({
        search,
        category: categoryFilter,
        availability: availabilityFilter,
        language: languageFilter,
        format: formatFilter,
        sortBy,
        page,
        limit: 10,
      });

      if (res.data?.success) {
        setBooks(res.data.books || []);
        setPagination(res.data.pagination);
      }
    } catch {
      toast.error('Failed to load books catalog');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, availabilityFilter, languageFilter, formatFilter, sortBy, toast]);

  const fetchStats = async () => {
    if (stats) return;
    try {
      setStatsLoading(true);
      const res = await booksApi.getCatalogStats();
      if (res.data?.success) setStats(res.data);
    } catch {
      toast.error('Failed to load catalog statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchBooks(1); }, [fetchBooks]);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') setIsAddModalOpen(true);
  }, [location.search]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'stats') fetchStats();
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setAvailabilityFilter('all');
    setLanguageFilter('');
    setFormatFilter('');
    setSortBy('newest');
  };

  const hasActiveFilters = search || categoryFilter || availabilityFilter !== 'all' || languageFilter || formatFilter;

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    let parsed;
    try {
      parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error();
    } catch {
      toast.error('Invalid JSON. Must be an array of book objects.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await booksApi.bulkCreate({ books: parsed });
      if (res.data?.success) {
        toast.success(`${res.data.inserted || parsed.length} books imported successfully`);
        setIsBulkModalOpen(false);
        setBulkJson('');
        setStats(null);
        fetchBooks(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk import failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category_id) { toast.warning('Please select a category'); return; }
    try {
      setSubmitting(true);
      const res = await booksApi.create(formData);
      if (res.data?.success) {
        toast.success(`"${formData.title}" added to library inventory`);
        setIsAddModalOpen(false);
        setFormData(initialForm);
        setStats(null);
        fetchBooks(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add book');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (book) => {
    setSelectedBook(book);
    setFormData({
      title: book.title,
      isbn: book.isbn,
      author: book.author,
      publisher: book.publisher || '',
      publication_year: book.publication_year || '',
      category_id: book.category_id,
      description: book.description || '',
      cover_image: book.cover_image || '',
      total_copies: book.total_copies,
      shelf_location: book.shelf_location || '',
      language: book.language || 'English',
      book_format: book.book_format || 'Paperback',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBook) return;
    try {
      setSubmitting(true);
      const res = await booksApi.update(selectedBook.id, formData);
      if (res.data?.success) {
        toast.success('Book details updated successfully');
        setIsEditModalOpen(false);
        setSelectedBook(null);
        setStats(null);
        fetchBooks(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update book');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (book) => {
    setBookToDelete(book);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bookToDelete) return;
    try {
      setSubmitting(true);
      const res = await booksApi.delete(bookToDelete.id);
      if (res.data?.success) {
        toast.success(`"${bookToDelete.title}" removed from catalog`);
        setIsDeleteDialogOpen(false);
        setBookToDelete(null);
        setStats(null);
        fetchBooks(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete book with active loans');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight">
            Book Inventory & Catalog
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage titles, copy counts, shelf locations, and catalog analytics
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" icon={Upload} onClick={() => setIsBulkModalOpen(true)}>
            Bulk Import
          </Button>
          <Button variant="primary" icon={Plus} onClick={() => { setFormData(initialForm); setIsAddModalOpen(true); }}>
            Add New Book
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100/70 dark:bg-white/5 rounded-2xl w-fit">
        {[
          { id: 'books', label: 'Book List', icon: BookOpen },
          { id: 'stats', label: 'Catalog Statistics', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-brand-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ======= BOOKS TAB ======= */}
      {activeTab === 'books' && (
        <>
          {/* Filter Strip */}
          <Card className="p-4" bodyClassName="p-0">
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                <div className="relative xl:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search title, author, ISBN..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="glass-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none">
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={languageFilter} onChange={e => setLanguageFilter(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none">
                  <option value="">All Languages</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select value={formatFilter} onChange={e => setFormatFilter(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none">
                  <option value="">All Formats</option>
                  {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select value={availabilityFilter} onChange={e => setAvailabilityFilter(e.target.value)}
                  className="glass-input w-full px-3 py-2.5 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none">
                  <option value="all">All Copies</option>
                  <option value="available">Available (&gt; 0)</option>
                  <option value="unavailable">Checked Out (0)</option>
                </select>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  className="glass-input px-3 py-2 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none">
                  <option value="newest">Sort: Newest First</option>
                  <option value="title_asc">Title: A → Z</option>
                  <option value="title_desc">Title: Z → A</option>
                  <option value="most_borrowed">Most Popular</option>
                  <option value="year_desc">Year: Newest</option>
                  <option value="rating_desc">Highest Rated</option>
                </select>
                {hasActiveFilters && (
                  <button onClick={clearFilters}
                    className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-semibold px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                    <X className="w-3 h-3" /> Clear Filters
                  </button>
                )}
                <span className="text-xs text-slate-400 ml-auto">{pagination.total} books found</span>
              </div>
            </div>
          </Card>

          {/* Books Table */}
          <Card bodyClassName="p-0">
            {loading ? (
              <LoadingSpinner text="Retrieving book records..." className="py-16" />
            ) : books.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No matching books found"
                description="Try modifying search keywords or filters."
                actionLabel="Reset Filters"
                onAction={clearFilters}
                className="m-6"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 border-b border-slate-200/50 dark:border-white/5 font-semibold">
                    <tr>
                      <th className="py-3 px-4 w-12">Cover</th>
                      <th className="py-3 px-4">Title & Author</th>
                      <th className="py-3 px-4">ISBN</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Lang / Format</th>
                      <th className="py-3 px-4">Copies</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4 text-center">QR</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {books.map(book => {
                      const isAvailable = book.available_copies > 0;
                      return (
                        <tr key={book.id} className="hover:bg-white/40 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4">
                            <img
                              src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=120'}
                              alt={book.title}
                              className="w-9 h-12 object-cover rounded-lg shadow-md border border-white/20 shrink-0"
                            />
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div onClick={() => navigate(`/books/${book.id}`)}
                              className="font-bold text-slate-900 dark:text-white hover:text-brand-500 cursor-pointer line-clamp-1 transition-colors">
                              {book.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              by {book.author} ({book.publication_year || 'N/A'})
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{book.isbn}</td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20 font-semibold text-[11px]">
                              {book.category_name || 'General'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-[11px] text-slate-600 dark:text-slate-300">{book.language || '—'}</div>
                            <div className="text-[10px] text-slate-400">{book.book_format || '—'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-black ${isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {book.available_copies}
                              </span>
                              <span className="text-slate-400">/</span>
                              <span className="text-slate-600 dark:text-slate-300">{book.total_copies}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{isAvailable ? 'In Stock' : 'Checked Out'}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                            {book.shelf_location || 'General Stacks'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button onClick={() => { setQrBook(book); setIsQrModalOpen(true); }}
                              className="p-2 text-slate-500 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-white/60 dark:hover:bg-white/5 rounded-xl transition-all"
                              title="Generate QR Tag">
                              <QrCode className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => navigate(`/books/${book.id}`)}
                                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-white/5 rounded-xl transition-all"
                                title="View Book Details">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => openEditModal(book)}
                                className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 rounded-xl transition-all"
                                title="Edit Book Details">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => { setBookToDelete(book); setIsDeleteDialogOpen(true); }}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all"
                                title="Remove Book">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-4 border-t border-slate-200/50 dark:border-white/5">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={p => fetchBooks(p)}
              />
            </div>
          </Card>
        </>
      )}

      {/* ======= STATS TAB ======= */}
      {activeTab === 'stats' && (
        <div className="space-y-6 animate-fade-in">
          {statsLoading ? (
            <LoadingSpinner text="Loading catalog analytics..." className="py-20" />
          ) : stats ? (() => {
            const { stats: s, charts } = stats;
            const availPct = s.totalCopies > 0 ? Math.round((s.availableCopies / s.totalCopies) * 100) : 0;
            return (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <StatCard icon={Library} label="Total Books" value={s.totalBooks} color="bg-brand-500/10 border-brand-500/20 text-brand-600 dark:text-brand-300" />
                  <StatCard icon={Copy} label="Total Copies" value={s.totalCopies} color="bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-300" />
                  <StatCard icon={CheckCircle2} label="Available" value={s.availableCopies} color="bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300" sub={`${availPct}% of total`} />
                  <StatCard icon={XCircle} label="Issued" value={s.issuedCopies} color="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300" />
                  <StatCard icon={Tag} label="Categories" value={s.categoriesCount} color="bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-300" />
                </div>
                {/* Most active highlight cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {s.mostBorrowedBook && (
                    <Card className="p-4" bodyClassName="p-0">
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 mb-3">
                          <TrendingUp className="w-3.5 h-3.5" /> Most Borrowed Book
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-8 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 shrink-0" />
                          <div>
                            <div className="font-black text-sm text-slate-900 dark:text-white line-clamp-1">{s.mostBorrowedBook.title}</div>
                            <div className="text-xs text-slate-500">{s.mostBorrowedBook.author} · {s.mostBorrowedBook.borrow_count} borrows</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                  {s.mostActiveCategory && (
                    <Card className="p-4" bodyClassName="p-0">
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 mb-3">
                          <Star className="w-3.5 h-3.5" /> Most Active Category
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-8 rounded-full bg-gradient-to-b from-brand-400 to-brand-600 shrink-0" />
                          <div>
                            <div className="font-black text-sm text-slate-900 dark:text-white">{s.mostActiveCategory.name}</div>
                            <div className="text-xs text-slate-500">{s.mostActiveCategory.book_count} books · {s.mostActiveCategory.borrow_count} borrows</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
                {/* Availability bar */}
                <Card bodyClassName="p-0">
                  <div className="p-5">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-brand-500" /> Copy Availability Breakdown
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 bg-slate-100 dark:bg-white/5 rounded-full h-3 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: `${availPct}%` }} />
                      </div>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{availPct}%</span>
                    </div>
                    <div className="flex gap-4 text-xs flex-wrap">
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Available ({s.availableCopies})</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Issued ({s.issuedCopies})</span>
                      <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" /> Reserved ({s.reservedBooks})</span>
                    </div>
                  </div>
                </Card>
                {/* Category Distribution */}
                {charts?.categoryDistribution?.length > 0 && (
                  <Card bodyClassName="p-0">
                    <div className="p-5">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                        <BookMarked className="w-4 h-4 text-brand-500" /> Books by Category (Top 10)
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3">Number of titles per category</p>
                      <BarChart data={charts.categoryDistribution} maxItems={10} />
                    </div>
                  </Card>
                )}
                {/* Top Borrowed */}
                {charts?.topBorrowed?.length > 0 && (
                  <Card bodyClassName="p-0">
                    <div className="p-5">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-amber-500" /> Most Borrowed Books
                      </div>
                      <p className="text-[11px] text-slate-400 mb-3">Times borrowed</p>
                      <BarChart data={charts.topBorrowed} maxItems={8} />
                    </div>
                  </Card>
                )}
                {/* Language Distribution */}
                {charts?.languageDistribution?.length > 0 && (
                  <Card bodyClassName="p-0">
                    <div className="p-5">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-sky-500" /> Books by Language
                      </div>
                      <BarChart data={charts.languageDistribution} maxItems={10} />
                    </div>
                  </Card>
                )}
              </>
            );
          })() : null}
        </div>
      )}

      {/* Add / Edit Book Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
        title={isEditModalOpen ? 'Edit Book Record' : 'Register New Library Title'}
        subtitle={isEditModalOpen ? 'Update metadata, copy counts or location' : 'Available copies will auto-sync to total copies'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Book Title *</label>
              <input type="text" required name="title" value={formData.title} onChange={handleFormChange}
                placeholder="e.g. Designing Data-Intensive Applications"
                className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Author(s) *</label>
              <input type="text" required name="author" value={formData.author} onChange={handleFormChange}
                placeholder="e.g. Martin Kleppmann"
                className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">ISBN Code *</label>
              <input type="text" required name="isbn" value={formData.isbn} onChange={handleFormChange}
                placeholder="e.g. 9781449373320"
                className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-900 dark:text-white font-mono focus:outline-none" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
              <select required name="category_id" value={formData.category_id} onChange={handleFormChange}
                className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none">
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Publisher</label>
              <input type="text" name="publisher" value={formData.publisher} onChange={handleFormChange}
                placeholder="e.g. O'Reilly Media"
                className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Publication Year</label>
              <input type="number" name="publication_year" value={formData.publication_year} onChange={handleFormChange}
                min="1800" max="2100"
                className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Language</label>
              <select name="language" value={formData.language} onChange={handleFormChange}
                className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none">
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Book Format</label>
              <select name="book_format" value={formData.book_format} onChange={handleFormChange}
                className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none">
                {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Total Copies *</label>
              <input type="number" required name="total_copies" value={formData.total_copies} onChange={handleFormChange}
                min="1"
                className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none" />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Shelf Location</label>
              <input type="text" name="shelf_location" value={formData.shelf_location} onChange={handleFormChange}
                placeholder="e.g. Block A, Aisle 2, Shelf A2"
                className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cover Image URL</label>
              <input type="url" name="cover_image" value={formData.cover_image} onChange={handleFormChange}
                placeholder="https://images.unsplash.com/..."
                className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none" />
              {formData.cover_image && (
                <img src={formData.cover_image} alt="preview" className="mt-2 h-16 w-12 object-cover rounded-lg border border-white/20 shadow" />
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description / Abstract</label>
              <textarea rows="3" name="description" value={formData.description} onChange={handleFormChange}
                placeholder="Summary of topics, algorithms, or concepts..."
                className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-900 dark:text-white focus:outline-none" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200/50 dark:border-white/5">
            <Button variant="secondary" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {isEditModalOpen ? 'Save Changes' : 'Register Book'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Bulk Import Books"
        subtitle="Paste a JSON array of book objects to import multiple titles at once"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleBulkSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px]">
            <strong>Format:</strong> Array of objects with: title, author, isbn, category_id, publisher, publication_year, total_copies, shelf_location, language, book_format, description, cover_image
          </div>
          <textarea
            rows="12" value={bulkJson} onChange={e => setBulkJson(e.target.value)}
            placeholder={`[\n  {\n    "title": "Example Book",\n    "author": "Author Name",\n    "isbn": "9781234567890",\n    "category_id": 1,\n    "total_copies": 3,\n    "language": "English",\n    "book_format": "Paperback"\n  }\n]`}
            className="glass-input w-full px-3 py-2.5 rounded-2xl text-slate-900 dark:text-white font-mono text-[11px] focus:outline-none"
          />
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-white/5">
            <Button variant="secondary" onClick={() => setIsBulkModalOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="primary" icon={Upload} isLoading={submitting}>Import Books</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Book"
        message={`Delete "${bookToDelete?.title}" from circulation inventory? This action is blocked if active loans exist.`}
        confirmText="Confirm Delete"
        isLoading={submitting}
      />

      <QrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        book={qrBook}
      />
    </div>
  );
};

export default Books;
