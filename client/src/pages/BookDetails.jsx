import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ArrowLeft,
  Calendar,
  Layers,
  MapPin,
  CheckCircle2,
  XCircle,
  QrCode,
  BookmarkPlus,
  Clock,
  Building,
  Hash,
  Share2,
  Check,
  Sparkles,
  Heart,
  Star,
  Languages,
  BookMarked,
  MessageSquare,
  Trash2,
  Send,
  AlertCircle
} from 'lucide-react';
import { booksApi, reservationsApi, transactionsApi, favoritesApi, reviewsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import QrModal from '../components/common/QrModal';

export const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isAuthenticated } = useAuth();
  const toast = useToast();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFav, setIsFav] = useState(false);

  // Action states
  const [borrowing, setBorrowing] = useState(false);
  const [reserving, setReserving] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const res = await booksApi.getById(id);
      if (res.data?.success) {
        setBook(res.data.book);
        setIsFav(Boolean(res.data.book.is_favorite));
        setReviews(res.data.book.reviews || []);
      }
    } catch {
      toast.error('Book not found or failed to load');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await reviewsApi.getByBook(id);
      if (res.data?.success) {
        setReviews(res.data.reviews || []);
      }
    } catch {}
  };

  useEffect(() => {
    if (id) {
      fetchBook();
    }
  }, [id]);

  // Handle Borrow
  const handleBorrow = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to borrow books');
      navigate('/login');
      return;
    }

    try {
      setBorrowing(true);
      const res = await transactionsApi.borrow({ bookId: book.id });
      if (res.data?.success) {
        toast.success(res.data.message || `Successfully borrowed "${book.title}"!`);
        fetchBook();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to borrow book');
    } finally {
      setBorrowing(false);
    }
  };

  // Handle Reserve
  const handleReserve = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to reserve books');
      navigate('/login');
      return;
    }

    try {
      setReserving(true);
      const res = await reservationsApi.create({ bookId: book.id });
      if (res.data?.success) {
        toast.success(res.data.message || `Reserved "${book.title}". You will be notified once returned!`);
        fetchBook();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place reservation');
    } finally {
      setReserving(false);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to save favorites');
      navigate('/login');
      return;
    }

    try {
      const res = await favoritesApi.toggle(book.id);
      if (res.data?.success) {
        setIsFav(res.data.isFavorite);
        toast.success(res.data.isFavorite ? 'Saved to favorites ❤️' : 'Removed from favorites');
      }
    } catch {
      toast.error('Failed to update favorites');
    }
  };

  // Copy share URL
  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Book link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please sign in to leave a review');
      navigate('/login');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await reviewsApi.add(book.id, {
        rating: reviewRating,
        review_text: reviewText
      });
      if (res.data?.success) {
        toast.success('Your review and rating have been posted!');
        setReviewText('');
        fetchReviews();
        fetchBook();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Delete Review
  const handleDeleteReview = async (reviewId) => {
    try {
      const res = await reviewsApi.delete(reviewId);
      if (res.data?.success) {
        toast.success('Review removed');
        fetchReviews();
        fetchBook();
      }
    } catch {
      toast.error('Failed to delete review');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving library volume details..." size="lg" className="min-h-[60vh]" />;
  }

  if (!book) {
    return (
      <div className="text-center py-20 glass-card rounded-3xl p-8 max-w-lg mx-auto">
        <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100 mb-2">
          Book Record Not Found
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          The requested identifier #{id} does not exist in our catalog.
        </p>
        <Button onClick={() => navigate('/catalog')} icon={ArrowLeft}>
          Return to Catalog
        </Button>
      </div>
    );
  }

  const isAvailable = Number(book.available_copies) > 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Top Navigation & Action Toolbar */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={copied ? Check : Share2}
            onClick={handleCopyShare}
          >
            {copied ? 'Copied' : 'Share'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={QrCode}
            onClick={() => setIsQrOpen(true)}
          >
            Tag & QR
          </Button>

          <Button
            variant={isFav ? 'primary' : 'outline'}
            size="sm"
            icon={Heart}
            onClick={handleToggleFavorite}
            className={isFav ? 'bg-rose-500 hover:bg-rose-600 text-white border-transparent' : 'text-rose-500'}
          >
            {isFav ? 'Favorited' : 'Favorite'}
          </Button>
        </div>
      </div>

      {/* Main Book Profile Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 sm:p-10">
          {/* Left Column: Book Cover & Quick Status */}
          <div className="md:col-span-4 flex flex-col items-center">
            <div className="relative aspect-[3/4] w-full max-w-[280px] rounded-2xl overflow-hidden shadow-2xl border border-slate-200/60 dark:border-slate-800 group">
              <img
                src={book.cover_image}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              <div className="absolute top-3 left-3">
                <Badge
                  variant={isAvailable ? 'success' : 'danger'}
                  size="sm"
                  className="shadow-md backdrop-blur-md font-bold"
                >
                  {isAvailable ? `${book.available_copies} of ${book.total_copies} Available` : 'Currently Checked Out'}
                </Badge>
              </div>
            </div>

            {/* Shelf Location Pin Callout */}
            {book.shelf_location && (
              <div className="w-full max-w-[280px] mt-4 p-3.5 rounded-2xl bg-brand-500/10 dark:bg-brand-500/5 border border-brand-500/20 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400">
                  <MapPin className="w-4 h-4 text-brand-500" />
                  <span>Physical Shelf Location</span>
                </div>
                <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {book.shelf_location}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Detailed Book Metadata */}
          <div className="md:col-span-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                  {book.category_name}
                </span>
                <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight mt-1">
                  {book.title}
                </h1>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
                  by <span className="text-slate-900 dark:text-white font-bold">{book.author}</span>
                </p>
              </div>

              {/* Rating & Stats Strip */}
              <div className="flex flex-wrap items-center gap-4 py-2 border-y border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-slate-900 dark:text-white">{Number(book.rating_avg || 4.5).toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">({book.rating_count || reviews.length} reviews)</span>
                </div>

                <span className="text-slate-300 dark:text-slate-700">•</span>

                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <BookMarked className="w-4 h-4 text-indigo-500" />
                  <span>Borrowed <strong className="text-slate-900 dark:text-white">{book.borrow_count || 0}</strong> times</span>
                </div>

                {Number(book.waiting_reservations_count) > 0 && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Clock className="w-4 h-4" />
                      <span>{book.waiting_reservations_count} student(s) in waitlist</span>
                    </div>
                  </>
                )}
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">ISBN</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{book.isbn}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Language</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{book.language || 'English'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Format</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{book.book_format || 'Paperback'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Published</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{book.publication_year || 'N/A'}</p>
                </div>
              </div>

              {/* Description */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1.5">
                  About this Work
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {book.description || 'No detailed abstract provided for this library catalog item.'}
                </p>
              </div>

              {book.publisher && (
                <p className="text-xs text-slate-400">
                  Publisher: <span className="font-semibold text-slate-600 dark:text-slate-300">{book.publisher}</span>
                </p>
              )}
            </div>

            {/* Action Bar */}
            <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
              {isAvailable ? (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    icon={BookOpen}
                    isLoading={borrowing}
                    onClick={handleBorrow}
                    className="flex-1 sm:flex-none sm:min-w-[180px] bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/20"
                  >
                    Borrow Book
                  </Button>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Ready for immediate checkout (Due in 14 days)
                  </span>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    icon={Clock}
                    isLoading={reserving}
                    onClick={handleReserve}
                    className="flex-1 sm:flex-none sm:min-w-[180px] bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Reserve this Book
                  </Button>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-rose-500">Currently unavailable.</span> Join the queue to receive an instant hold notice when returned.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews & Ratings Section (Section 9) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <h2 className="text-xl font-bold font-display text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-600" />
              <span>Student Reviews & Ratings</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified feedback from readers and academic researchers
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            <div>
              <p className="text-base font-black text-slate-900 dark:text-white leading-none">
                {Number(book.rating_avg || 4.5).toFixed(1)} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{reviews.length} Reader Ratings</p>
            </div>
          </div>
        </div>

        {/* Submit Review Form */}
        <form onSubmit={handleSubmitReview} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Leave your rating & review:
            </span>

            {/* Interactive 5-Star Selector */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onMouseEnter={() => setReviewHoverRating(star)}
                  onMouseLeave={() => setReviewHoverRating(0)}
                  onClick={() => setReviewRating(star)}
                  className="p-1 text-slate-300 hover:text-amber-400 transition-colors"
                >
                  <Star
                    className={`w-5 h-5 ${
                      (reviewHoverRating || reviewRating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-amber-500 ml-2">
                {reviewRating} of 5 Stars
              </span>
            </div>
          </div>

          <textarea
            required
            rows={3}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your thoughts on this volume: clarity of arguments, practical examples, or study relevance..."
            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Send}
              isLoading={submittingReview}
            >
              Post Review
            </Button>
          </div>
        </form>

        {/* Existing Reviews List */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Reader Experiences ({reviews.length})
          </h3>

          {reviews.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 italic">
              No reviews posted yet for this title. Be the first student to review!
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {reviews.map((rev) => {
                const canDelete = isAdmin || (user && user.id === rev.user_id);

                return (
                  <div key={rev.id} className="py-4 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 font-bold text-xs flex items-center justify-center">
                          {rev.user_name ? rev.user_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {rev.user_name || 'Student Member'}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-2">
                            {new Date(rev.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200 dark:text-slate-700'
                              }`}
                            />
                          ))}
                        </div>

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            title="Delete review"
                            className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-9">
                      {rev.review_text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {isQrOpen && (
        <QrModal
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
          book={book}
          qrCodeUrl={book.qrCodeUrl}
        />
      )}
    </div>
  );
};

export default BookDetails;
