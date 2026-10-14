import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Heart,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Star,
  MapPin,
  ChevronLeft,
  ChevronRight,
  BookMarked,
  Languages,
  Calendar,
  Layers,
  ArrowUpDown,
  Compass,
  LayoutGrid,
  BookmarkPlus,
  Flame,
  GraduationCap,
  Cpu,
  Bot,
  TrendingUp,
  Brain,
  Microscope,
  Trophy
} from 'lucide-react';
import { booksApi, categoriesApi, reservationsApi, transactionsApi, favoritesApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export const BookCatalog = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  // Tab mode: 'catalog' (full searchable grid) or 'discovery' (curated shelves)
  const [activeTab, setActiveTab] = useState('catalog');

  // Main Catalog State
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ languages: [], formats: [] });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [publisherFilter, setPublisherFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  // Discovery Sections State
  const [discoverySections, setDiscoverySections] = useState([]);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);

  // Action loaders
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Load URL query params if any
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('search')) setSearch(params.get('search'));
    if (params.get('category')) setCategoryFilter(params.get('category'));
    if (params.get('author')) setAuthorFilter(params.get('author'));
    if (params.get('language')) setLanguageFilter(params.get('language'));
    if (params.get('format')) setFormatFilter(params.get('format'));
    if (params.get('availability')) setAvailabilityFilter(params.get('availability'));
    if (params.get('sort')) setSortBy(params.get('sort'));
  }, [location.search]);

  // Fetch Categories & Filters
  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.getAll();
      if (res.data?.success) setCategories(res.data.categories || []);
    } catch {}
  };

  // Fetch Books with pagination & multi-filter
  const fetchBooks = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await booksApi.getAll({
        search: debouncedSearch,
        category: categoryFilter,
        author: authorFilter,
        publisher: publisherFilter,
        language: languageFilter,
        book_format: formatFilter,
        year: yearFilter,
        availability: availabilityFilter,
        sortBy,
        page,
        limit: 20
      });

      if (res.data?.success) {
        setBooks(res.data.books || []);
        setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
        if (res.data.filterOptions) {
          setFilterOptions(res.data.filterOptions);
        }
      }
    } catch {
      toast.error('Failed to load library catalog');
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    categoryFilter,
    authorFilter,
    publisherFilter,
    languageFilter,
    formatFilter,
    yearFilter,
    availabilityFilter,
    sortBy,
    toast
  ]);

  // Fetch Discovery Sections
  const fetchDiscovery = async () => {
    try {
      setLoadingDiscovery(true);
      const res = await booksApi.getDiscovery();
      if (res.data?.success) {
        setDiscoverySections(res.data.sections || []);
      }
    } catch {
      toast.error('Failed to load discovery collections');
    } finally {
      setLoadingDiscovery(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks(1);
  }, [fetchBooks]);

  useEffect(() => {
    if (activeTab === 'discovery' && discoverySections.length === 0) {
      fetchDiscovery();
    }
  }, [activeTab]);

  // Reset Filters
  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategoryFilter('');
    setAuthorFilter('');
    setPublisherFilter('');
    setLanguageFilter('');
    setFormatFilter('');
    setYearFilter('');
    setAvailabilityFilter('all');
    setSortBy('recent');
  };

  const hasActiveFilters =
    debouncedSearch ||
    categoryFilter ||
    authorFilter ||
    publisherFilter ||
    languageFilter ||
    formatFilter ||
    yearFilter ||
    availabilityFilter !== 'all' ||
    sortBy !== 'recent';

  // Toggle Favorite
  const handleToggleFavorite = async (book, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please sign in to save favorite books');
      navigate('/login');
      return;
    }

    try {
      const res = await favoritesApi.toggle(book.id);
      if (res.data?.success) {
        const isFav = res.data.isFavorite;
        // Update local state in books
        setBooks((prev) =>
          prev.map((b) => (b.id === book.id ? { ...b, is_favorite: isFav ? 1 : 0 } : b))
        );
        // Also update discovery if loaded
        setDiscoverySections((prev) =>
          prev.map((sec) => ({
            ...sec,
            books: sec.books.map((b) => (b.id === book.id ? { ...b, is_favorite: isFav ? 1 : 0 } : b))
          }))
        );
        toast.success(isFav ? `Added "${book.title}" to favorites ❤️` : `Removed "${book.title}" from favorites`);
      }
    } catch {
      toast.error('Failed to update favorites');
    }
  };

  // Student Borrow Book
  const handleBorrow = async (book, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please sign in to borrow books');
      navigate('/login');
      return;
    }

    try {
      setActionLoadingId(book.id);
      const res = await transactionsApi.borrow({ bookId: book.id });
      if (res.data?.success) {
        toast.success(res.data.message || `Successfully borrowed "${book.title}"!`);
        fetchBooks(pagination.page);
        if (activeTab === 'discovery') fetchDiscovery();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to borrow book');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Student Reserve Book
  const handleReserve = async (book, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please sign in to place reservations');
      navigate('/login');
      return;
    }

    try {
      setActionLoadingId(book.id);
      const res = await reservationsApi.create({ bookId: book.id });
      if (res.data?.success) {
        toast.success(res.data.message || `Reservation confirmed for "${book.title}"!`);
        fetchBooks(pagination.page);
        if (activeTab === 'discovery') fetchDiscovery();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place reservation');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Horizontal scroll helper for discovery sliders
  const scrollContainer = (id, direction) => {
    const el = document.getElementById(`carousel-${id}`);
    if (el) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-white shadow-2xl border border-white/15 bg-gradient-to-r from-slate-900 via-brand-900 to-indigo-950 backdrop-blur-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/25 border border-brand-400/30 text-accent-cyan text-xs font-bold mb-3 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
            <span>LibXVerse Comprehensive Institutional Catalog</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-tight leading-tight">
            Library Catalog
          </h1>

          <p className="text-sm sm:text-base text-slate-300 mt-2.5 font-normal leading-relaxed">
            Explore thousands of books across technology, science, engineering, literature, business and more.
          </p>

          {/* Quick Metrics Badges */}
          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand-400" />
              120+ Curated Titles
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 font-semibold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              65 Academic Disciplines
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 font-semibold flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              English, Kannada, Hindi & Regional
            </span>
          </div>
        </div>

        {/* Ambient Blur Accents */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 -mb-16 w-64 h-64 bg-accent-cyan/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Primary Navigation Tabs: Catalog Search vs Curated Discovery */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Search Catalog ({pagination.total})</span>
          </button>

          <button
            onClick={() => setActiveTab('discovery')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'discovery'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Discovery Shelves (12 Collections)</span>
          </button>
        </div>

        {activeTab === 'catalog' && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Showing {books.length} of {pagination.total} results</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          TAB 1: CATALOG SEARCH, MULTI-FILTER & RESPONSIVE GRID
      ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Main Search & Quick Filters Toolbar */}
          <Card className="p-4 sm:p-5" bodyClassName="p-0">
            <div className="space-y-4">
              {/* Row 1: Search Bar + Category + Sort + Advanced Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Search Input */}
                <div className="sm:col-span-5 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by Title, Author, ISBN, Publisher, Keyword..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Category Dropdown */}
                <div className="sm:col-span-3">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">All Categories ({categories.length})</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Dropdown */}
                <div className="sm:col-span-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="title_asc">Title A-Z</option>
                    <option value="title_desc">Title Z-A</option>
                    <option value="author_asc">Author A-Z</option>
                    <option value="year_desc">Publication Year (Newest)</option>
                    <option value="year_asc">Publication Year (Oldest)</option>
                    <option value="most_borrowed">Most Borrowed</option>
                    <option value="most_available">Most Available</option>
                    <option value="highest_rated">Highest Rated ⭐</option>
                  </select>
                </div>

                {/* Advanced Filter Button */}
                <div className="sm:col-span-2 flex items-center gap-2">
                  <Button
                    variant={isAdvancedFilterOpen ? 'primary' : 'outline'}
                    size="sm"
                    icon={SlidersHorizontal}
                    onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
                    className="w-full justify-center"
                  >
                    Filters
                  </Button>
                </div>
              </div>

              {/* Row 2: Advanced Search / Filter Drawer */}
              {isAdvancedFilterOpen && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-fade-in text-xs">
                  {/* Author Search */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Author
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Robert, Cormen, Premchand..."
                      value={authorFilter}
                      onChange={(e) => setAuthorFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Language Filter */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Language
                    </label>
                    <select
                      value={languageFilter}
                      onChange={(e) => setLanguageFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">All Languages</option>
                      <option value="English">English</option>
                      <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="Telugu">Telugu (తెలుగు)</option>
                      <option value="Tamil">Tamil (தமிழ்)</option>
                      <option value="Malayalam">Malayalam (മലയാളം)</option>
                      <option value="Marathi">Marathi (मराठी)</option>
                      <option value="Bengali">Bengali (বাংলা)</option>
                    </select>
                  </div>

                  {/* Format Filter */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Book Format
                    </label>
                    <select
                      value={formatFilter}
                      onChange={(e) => setFormatFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">All Formats</option>
                      <option value="Paperback">Paperback</option>
                      <option value="Hardcover">Hardcover</option>
                      <option value="Textbook">Textbook</option>
                      <option value="Reference">Reference Desk</option>
                      <option value="Magazine">Magazine</option>
                      <option value="Journal">Journal Collection</option>
                    </select>
                  </div>

                  {/* Publication Year */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Publication Era
                    </label>
                    <select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">Any Year</option>
                      <option value="2024+">2024 - 2026 (Latest Editions)</option>
                      <option value="2020+">2020 & Newer</option>
                      <option value="2015">2015 - 2019</option>
                      <option value="2000">2000 - 2014</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Row 3: Availability quick pills + Clear filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">Availability:</span>
                  {[
                    { id: 'all', label: 'All Books' },
                    { id: 'available', label: 'In Stock Only' },
                    { id: 'unavailable', label: 'Checked Out' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setAvailabilityFilter(tab.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                        availabilityFilter === tab.id
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={RotateCcw}
                    onClick={handleClearFilters}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Applied:</span>
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold">
                  Query: "{debouncedSearch}"
                  <button onClick={() => setSearch('')} className="ml-1 hover:text-brand-800">×</button>
                </span>
              )}
              {categoryFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold">
                  Category: {categories.find((c) => String(c.id) === String(categoryFilter))?.name || categoryFilter}
                  <button onClick={() => setCategoryFilter('')} className="ml-1 hover:text-brand-800">×</button>
                </span>
              )}
              {languageFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold">
                  Lang: {languageFilter}
                  <button onClick={() => setLanguageFilter('')} className="ml-1">×</button>
                </span>
              )}
              {formatFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                  Format: {formatFilter}
                  <button onClick={() => setFormatFilter('')} className="ml-1">×</button>
                </span>
              )}
              {availabilityFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                  Status: {availabilityFilter === 'available' ? 'Available' : 'Unavailable'}
                  <button onClick={() => setAvailabilityFilter('all')} className="ml-1">×</button>
                </span>
              )}
            </div>
          )}

          {/* Book Catalog Grid: 4 per row on Desktop, 2 on Tablet, 1 on Mobile */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl bg-slate-100 dark:bg-slate-800/40 p-4 h-[420px] animate-pulse flex flex-col justify-between"
                >
                  <div className="w-full aspect-[3/4] bg-slate-200 dark:bg-slate-700/60 rounded-2xl" />
                  <div className="space-y-2 mt-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700/60 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700/60 rounded w-1/2" />
                  </div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-700/60 rounded-xl mt-4" />
                </div>
              ))}
            </div>
          ) : books.length === 0 ? (
            <Card className="p-12 text-center">
              <EmptyState
                icon={BookOpen}
                title="No books match your criteria"
                description="We couldn't find any catalog entries matching your query or selected filters. Try broadening your search or resetting filters."
                action={
                  <Button variant="primary" onClick={handleClearFilters} className="mt-4">
                    Reset Catalog Filters
                  </Button>
                }
              />
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {books.map((book) => {
                  const isAvailable = Number(book.available_copies) > 0;
                  const isFav = Boolean(book.is_favorite);
                  const isProcessing = actionLoadingId === book.id;

                  return (
                    <div
                      key={book.id}
                      className="group relative flex flex-col rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-500/40 transition-all duration-300"
                    >
                      {/* Book Cover */}
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={book.cover_image}
                          alt={book.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Scrim Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-black/20 pointer-events-none" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                          <Badge
                            variant={isAvailable ? 'success' : 'danger'}
                            size="sm"
                            className="shadow-md backdrop-blur-md font-bold"
                          >
                            {isAvailable ? `${book.available_copies} Available` : 'Checked Out'}
                          </Badge>

                          {/* 1-Click Favorite Toggle */}
                          <button
                            onClick={(e) => handleToggleFavorite(book, e)}
                            title={isFav ? 'Remove favorite' : 'Add to favorites'}
                            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md backdrop-blur-md transition-transform hover:scale-110 ${
                              isFav
                                ? 'bg-rose-500 text-white'
                                : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-rose-500'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Bottom Cover Metadata */}
                        <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md">
                              {book.category_name}
                            </span>
                            {book.rating_avg > 0 && (
                              <span className="flex items-center gap-1 text-amber-300 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-md">
                                <Star className="w-3 h-3 fill-current" />
                                {Number(book.rating_avg).toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <h3
                            onClick={() => navigate(`/books/${book.id}`)}
                            className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer transition-colors"
                          >
                            {book.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                            by <span className="font-semibold text-slate-700 dark:text-slate-300">{book.author}</span>
                          </p>

                          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{book.language || 'English'}</span>
                            <span>•</span>
                            <span>{book.book_format || 'Paperback'}</span>
                            <span>•</span>
                            <span>{book.publication_year}</span>
                          </div>

                          {/* Physical Shelf Location */}
                          {book.shelf_location && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-lg">
                              <MapPin className="w-3 h-3 text-brand-500 shrink-0" />
                              <span className="truncate">{book.shelf_location}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons: View Details, Borrow (if available), Reserve Book (if unavailable) */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="xs"
                            icon={Eye}
                            onClick={() => navigate(`/books/${book.id}`)}
                            className="flex-1 text-[11px]"
                          >
                            Details
                          </Button>

                          {isAvailable ? (
                            <Button
                              variant="primary"
                              size="xs"
                              isLoading={isProcessing}
                              onClick={(e) => handleBorrow(book, e)}
                              className="flex-1 text-[11px] bg-brand-600 hover:bg-brand-700"
                            >
                              Borrow
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="xs"
                              isLoading={isProcessing}
                              onClick={(e) => handleReserve(book, e)}
                              className="flex-1 text-[11px] border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
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

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs text-slate-500">
                    Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} books
                  </span>

                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={(p) => {
                      fetchBooks(p);
                      window.scrollTo({ top: 350, behavior: 'smooth' });
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: CURATED DISCOVERY SECTIONS (12 Horizontally Scrollable Shelves)
      ========================================================================= */}
      {activeTab === 'discovery' && (
        <div className="space-y-10 animate-fade-in">
          {loadingDiscovery ? (
            <LoadingSpinner text="Assembling curated library discovery shelves..." className="py-24" />
          ) : discoverySections.length === 0 ? (
            <Card className="p-12 text-center">
              <EmptyState
                icon={Compass}
                title="Discovery collections unavailable"
                description="Unable to load curated library collections. Please try switching back to the search catalog."
              />
            </Card>
          ) : (
            discoverySections.map((section) => (
              <div key={section.id} className="space-y-4">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <span>{section.title}</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Handpicked collection of top academic & reading selections
                    </p>
                  </div>

                  {/* Horizontal Scroll Arrows */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => scrollContainer(section.id, 'left')}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollContainer(section.id, 'right')}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Horizontal Scroll Container */}
                <div
                  id={`carousel-${section.id}`}
                  className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700"
                >
                  {section.books.map((book) => {
                    const isAvailable = Number(book.available_copies) > 0;
                    const isFav = Boolean(book.is_favorite);

                    return (
                      <div
                        key={book.id}
                        onClick={() => navigate(`/books/${book.id}`)}
                        className="group shrink-0 w-64 sm:w-72 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm hover:shadow-xl hover:border-brand-500/40 cursor-pointer snap-start transition-all duration-300 flex flex-col justify-between"
                      >
                        {/* Cover */}
                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <img
                            src={book.cover_image}
                            alt={book.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />

                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                            <Badge variant={isAvailable ? 'success' : 'danger'} size="xs" className="font-bold">
                              {isAvailable ? `${book.available_copies} Left` : 'Checked Out'}
                            </Badge>

                            <button
                              onClick={(e) => handleToggleFavorite(book, e)}
                              className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md ${
                                isFav ? 'bg-rose-500 text-white' : 'bg-white/80 dark:bg-slate-900/80 text-slate-600'
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                            </button>
                          </div>

                          <div className="absolute bottom-2.5 left-3 right-3 text-white">
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md">
                              {book.category_name}
                            </span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-3.5 flex flex-col justify-between flex-1">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                              {book.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                              {book.author}
                            </p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">{book.publication_year}</span>
                            <span className="font-bold text-brand-600 dark:text-brand-400 group-hover:underline">
                              View Book →
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BookCatalog;
