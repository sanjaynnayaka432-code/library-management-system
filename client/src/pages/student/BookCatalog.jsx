import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  BookmarkPlus,
  Layers,
  Sparkles,
  QrCode
} from 'lucide-react';
import { booksApi, categoriesApi, reservationsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import QrModal from '../../components/common/QrModal';

export const BookCatalog = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // QR Modal & Reservation
  const [qrBook, setQrBook] = useState(null);
  const [reservingId, setReservingId] = useState(null);

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.getAll();
      if (res.data?.success) setCategories(res.data.categories || []);
    } catch {}
  };

  const fetchBooks = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await booksApi.getAll({
        search,
        category: categoryFilter,
        availability: availabilityFilter,
        sortBy,
        page,
        limit: 12,
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
  }, [search, categoryFilter, availabilityFilter, sortBy, toast]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks(1);
  }, [fetchBooks]);

  const handleReserve = async (book, e) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setReservingId(book.id);
      const res = await reservationsApi.create({ bookId: book.id });
      if (res.data?.success) {
        toast.success(`Reserved "${book.title}". You will receive a notification when available!`);
        fetchBooks(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place reservation');
    } finally {
      setReservingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-white tracking-tight">
          Library Catalog & Discovery
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Explore research volumes, computer science classics, textbooks, and contemporary literature
        </p>
      </div>

      {/* Glass Filter Toolbar */}
      <Card className="p-4" bodyClassName="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="glass-input w-full px-3 py-2.5 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="glass-input w-full px-3 py-2.5 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">All Copies</option>
            <option value="available">Available on Shelf</option>
            <option value="unavailable">Checked Out (0)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="glass-input w-full px-3 py-2.5 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="newest">Sort: Recently Added</option>
            <option value="title_asc">Title: A to Z</option>
            <option value="title_desc">Title: Z to A</option>
            <option value="most_borrowed">Most Popular</option>
            <option value="year_desc">Year: Newest to Oldest</option>
          </select>
        </div>
      </Card>

      {/* Grid of Books */}
      {loading ? (
        <LoadingSpinner text="Searching catalog holdings..." className="py-20" />
      ) : books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No books matched your criteria"
          description="Try broadening your search term or select another category."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setCategoryFilter('');
            setAvailabilityFilter('all');
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {books.map((book) => {
              const isAvailable = book.available_copies > 0;
              return (
                <div
                  key={book.id}
                  onClick={() => navigate(`/books/${book.id}`)}
                  className="group cursor-pointer glass-card rounded-3xl flex flex-col justify-between overflow-hidden hover:shadow-glow-brand"
                >
                  <div>
                    {/* Cover Frame */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900/10">
                      <img
                        src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge
                          status={isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                          size="xs"
                        />
                      </div>
                      <div className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full bg-slate-900/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
                        {book.category_name}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4.5">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors line-clamp-2 leading-snug">
                        {book.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        by {book.author}
                      </p>

                      <div className="mt-3.5 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-200/50 dark:border-white/5">
                        <span>Shelf: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{book.shelf_location || 'Stacks'}</strong></span>
                        <span className="font-bold">{book.available_copies} / {book.total_copies} left</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4.5 pb-4.5 pt-1 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="xs"
                      icon={QrCode}
                      onClick={(e) => {
                        e.stopPropagation();
                        setQrBook(book);
                      }}
                      className="px-2.5"
                      title="View QR Code"
                    />

                    {isAvailable ? (
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={Eye}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/books/${book.id}`);
                        }}
                        className="flex-1"
                      >
                        Details
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="xs"
                        icon={BookmarkPlus}
                        isLoading={reservingId === book.id}
                        onClick={(e) => handleReserve(book, e)}
                        className="flex-1"
                      >
                        Reserve
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="p-4 glass-card rounded-2xl">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={(p) => fetchBooks(p)}
            />
          </div>
        </>
      )}

      <QrModal
        isOpen={!!qrBook}
        onClose={() => setQrBook(null)}
        book={qrBook}
      />
    </div>
  );
};

export default BookCatalog;
