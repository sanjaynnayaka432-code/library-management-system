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
  Sparkles
} from 'lucide-react';
import { booksApi, reservationsApi } from '../services/api';
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
  const { user, isAdmin, isStudent } = useAuth();
  const toast = useToast();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const res = await booksApi.getById(id);
      if (res.data?.success) {
        setBook(res.data.book);
      }
    } catch {
      toast.error('Book not found or failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBook();
    }
  }, [id]);

  const handleReserve = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setReserving(true);
      const res = await reservationsApi.create({ bookId: book.id });
      if (res.data?.success) {
        toast.success(`Reserved "${book.title}". You will be notified once returned!`);
        fetchBook();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place reservation');
    } finally {
      setReserving(false);
    }
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Book link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <LoadingSpinner text="Loading catalog record..." size="lg" className="min-h-[60vh]" />;
  }

  if (!book) {
    return (
      <div className="text-center py-20 glass-card rounded-3xl p-8">
        <h2 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100 mb-2">
          Book Record Not Found
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          The requested identifier #{id} does not exist in our catalog.
        </p>
        <Button onClick={() => navigate(-1)} icon={ArrowLeft}>
          Return to Catalog
        </Button>
      </div>
    );
  }

  const isAvailable = book.available_copies > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Top Glass Navigation Bar */}
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
            variant="secondary"
            size="sm"
            icon={QrCode}
            onClick={() => setIsQrOpen(true)}
          >
            QR Tag
          </Button>
        </div>
      </div>

      {/* Main Glass Overview Container */}
      <div className="glass-card rounded-3xl overflow-hidden p-6 sm:p-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Book Cover Art & Specular Ambient Reflection */}
          <div className="flex flex-col items-center md:items-start space-y-5">
            <div className="relative group w-52 sm:w-60 aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/20 border border-white/40 dark:border-white/10 bg-slate-900/20 backdrop-blur-md">
              <img
                src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3.5 right-3.5">
                <Badge
                  status={isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                  size="sm"
                />
              </div>
            </div>

            {/* Copies overview pill */}
            <div className="w-full max-w-[240px] p-4 rounded-2xl glass-panel text-center">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                Shelf Inventory
              </div>
              <div className="text-2xl font-display font-black text-slate-900 dark:text-white mt-1">
                <span className={isAvailable ? 'text-emerald-500' : 'text-rose-500'}>
                  {book.available_copies}
                </span>{' '}
                <span className="text-slate-400 text-base font-normal">/ {book.total_copies}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {book.active_borrowed_count || (book.total_copies - book.available_copies)} copies out on loan
              </div>
            </div>

            {/* Physical Shelf Tag */}
            <div className="w-full max-w-[240px] flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs backdrop-blur-md">
              <MapPin className="w-5 h-5 text-indigo-500 shrink-0" />
              <div>
                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider">
                  Physical Stacks
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {book.shelf_location || 'General Stacks'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Book Details & Interactivity */}
          <div className="md:col-span-2 flex flex-col justify-between space-y-6">
            <div>
              {/* Category chip & Year */}
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20 font-bold text-xs backdrop-blur-md">
                  {book.category_name}
                </span>
                {book.publication_year && (
                  <span className="text-xs text-slate-400 font-medium">
                    Published in {book.publication_year}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                {book.title}
              </h1>

              {/* Author */}
              <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 mt-2">
                Written by <span className="font-bold text-slate-900 dark:text-white">{book.author}</span>
              </p>

              {/* Metadata Capsule Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-slate-200/50 dark:border-white/5">
                <div className="p-3 rounded-2xl glass-panel flex items-center gap-2.5">
                  <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">ISBN</span>
                    <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 truncate block">
                      {book.isbn}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl glass-panel flex items-center gap-2.5">
                  <Building className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Publisher</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate block">
                      {book.publisher || 'Academic Press'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl glass-panel flex items-center gap-2.5 col-span-2 sm:col-span-1">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Hold Queue</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                      {book.waiting_reservations_count || 0} student(s) waiting
                    </span>
                  </div>
                </div>
              </div>

              {/* Synopsis */}
              <div className="mt-6">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                  Abstract & Overview
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {book.description ||
                    'Comprehensive academic treatise cataloged within the institutional library system.'}
                </p>
              </div>
            </div>

            {/* Interaction Box */}
            <div className="pt-6 border-t border-slate-200/50 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs">
                {isAvailable ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Copies available immediately for checkout</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                    <Clock className="w-4 h-4" />
                    <span>All copies in circulation. Reserve now for priority queue.</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {isAdmin && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate(`/admin/circulation?tab=issue&bookId=${book.id}`)}
                    className="w-full sm:w-auto"
                  >
                    Issue at Desk
                  </Button>
                )}

                {isStudent && (
                  isAvailable ? (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => toast.info('Present your student ID badge at the Circulation Desk with this book to complete checkout.')}
                      className="w-full sm:w-auto"
                    >
                      Borrow in Library
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      icon={BookmarkPlus}
                      isLoading={reserving}
                      onClick={handleReserve}
                      className="w-full sm:w-auto"
                    >
                      Reserve Book
                    </Button>
                  )
                )}

                {!user && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate('/login')}
                  >
                    Sign In to Borrow
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <QrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        book={book}
      />
    </div>
  );
};

export default BookDetails;
