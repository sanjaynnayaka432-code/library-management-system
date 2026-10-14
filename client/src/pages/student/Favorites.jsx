import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Search, BookOpen, BookmarkCheck, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { favoritesApi, transactionsApi, reservationsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

export const Favorites = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchFavorites = async (page = 1) => {
    try {
      setLoading(true);
      const res = await favoritesApi.getAll({ page, limit: 12 });
      if (res.data?.success) {
        setFavorites(res.data.favorites || []);
        setPagination(res.data.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 });
      }
    } catch {
      toast.error('Failed to load your favorite books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites(1);
  }, []);

  const handleRemoveFavorite = async (bookId, title) => {
    try {
      await favoritesApi.remove(bookId);
      setFavorites(prev => prev.filter(b => b.id !== bookId));
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      toast.success(`Removed "${title}" from favorites`);
    } catch {
      toast.error('Failed to remove from favorites');
    }
  };

  const handleBorrow = async (book) => {
    try {
      setActionLoadingId(book.id);
      const res = await transactionsApi.borrow({ bookId: book.id });
      if (res.data?.success) {
        toast.success(res.data.message || `Successfully borrowed "${book.title}"!`);
        fetchFavorites(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to borrow book');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReserve = async (book) => {
    try {
      setActionLoadingId(book.id);
      const res = await reservationsApi.create({ bookId: book.id });
      if (res.data?.success) {
        toast.success(res.data.message || `Placed hold on "${book.title}"!`);
        fetchFavorites(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reserve book');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold mb-2">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Curated Reading List</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">
            My Favorite Books
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Titles you have bookmarked for research, leisure reading, or course study.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={Search}
          onClick={() => navigate('/catalog')}
        >
          Explore Full Catalog
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving your saved favorites..." className="py-24" />
      ) : favorites.length === 0 ? (
        <Card className="p-12 text-center">
          <EmptyState
            icon={Heart}
            title="No favorite books saved yet"
            description="Browse our extensive collection of 100+ titles and click the heart icon to curate your personal reading shelf."
            action={
              <Button
                variant="primary"
                icon={BookOpen}
                onClick={() => navigate('/catalog')}
                className="mt-4"
              >
                Browse Library Catalog
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Showing {favorites.length} of {pagination.total} saved titles</span>
          </div>

          {/* Book Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {favorites.map((book) => {
              const isAvailable = Number(book.available_copies) > 0;
              const isProcessing = actionLoadingId === book.id;

              return (
                <div
                  key={book.id}
                  className="group relative flex flex-col rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-500/40 transition-all duration-300"
                >
                  {/* Book Cover Container */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <Badge
                        variant={isAvailable ? 'success' : 'danger'}
                        size="sm"
                        className="shadow-md backdrop-blur-md"
                      >
                        {isAvailable ? `${book.available_copies} Available` : 'Checked Out'}
                      </Badge>

                      <button
                        onClick={() => handleRemoveFavorite(book.id, book.title)}
                        title="Remove from favorites"
                        className="w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-rose-500 hover:text-rose-600 flex items-center justify-center shadow-md backdrop-blur-md transition-transform hover:scale-110"
                      >
                        <Heart className="w-4 h-4 fill-rose-500" />
                      </button>
                    </div>

                    {/* Bottom Cover Info */}
                    <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md">
                        {book.category_name}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h3
                        onClick={() => navigate(`/books/${book.id}`)}
                        className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer transition-colors"
                      >
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        by <span className="font-semibold">{book.author}</span>
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="font-medium">{book.language || 'English'}</span>
                        <span>•</span>
                        <span>{book.book_format || 'Paperback'}</span>
                        <span>•</span>
                        <span>{book.publication_year}</span>
                      </div>

                      {book.shelf_location && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg">
                          <MapPin className="w-3 h-3 text-brand-500 shrink-0" />
                          <span className="truncate">{book.shelf_location}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => navigate(`/books/${book.id}`)}
                        className="flex-1"
                      >
                        Details
                      </Button>

                      {isAvailable ? (
                        <Button
                          variant="primary"
                          size="xs"
                          isLoading={isProcessing}
                          onClick={() => handleBorrow(book)}
                          className="flex-1 bg-brand-600 hover:bg-brand-700"
                        >
                          Borrow
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="xs"
                          isLoading={isProcessing}
                          onClick={() => handleReserve(book)}
                          className="flex-1 border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        >
                          Reserve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(p) => fetchFavorites(p)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Favorites;
