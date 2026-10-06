import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  Layers,
  ArrowRight
} from 'lucide-react';
import { categoriesApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialForm = { name: '', description: '' };
  const [formData, setFormData] = useState(initialForm);

  const toast = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoriesApi.getAll({ search });
      if (res.data?.success) {
        setCategories(res.data.categories || []);
      }
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [search]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      const res = await categoriesApi.create(formData);
      if (res.data?.success) {
        toast.success(`Category "${formData.name}" created`);
        setIsAddModalOpen(false);
        setFormData(initialForm);
        fetchCategories();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (cat) => {
    setSelectedCat(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCat || !formData.name.trim()) return;

    try {
      setSubmitting(true);
      const res = await categoriesApi.update(selectedCat.id, formData);
      if (res.data?.success) {
        toast.success('Category updated successfully');
        setIsEditModalOpen(false);
        setSelectedCat(null);
        fetchCategories();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update category');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (cat) => {
    setCatToDelete(cat);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!catToDelete) return;

    try {
      setSubmitting(true);
      const res = await categoriesApi.delete(catToDelete.id);
      if (res.data?.success) {
        toast.success(`Category "${catToDelete.name}" deleted`);
        setIsDeleteDialogOpen(false);
        setCatToDelete(null);
        fetchCategories();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Cannot delete category with associated books. Please reassign the books first.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Classification & Categories
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize catalog disciplines, department collections, and genres
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
          Add Category
        </Button>
      </div>

      {/* Search Input */}
      <Card className="p-4" bodyClassName="p-0">
        <div className="relative p-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-7 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-md pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </Card>

      {/* Grid of Categories */}
      {loading ? (
        <LoadingSpinner text="Loading classification categories..." className="py-16" />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories found"
          description="Create your first academic or subject category to organize books."
          actionLabel="Add Category"
          onAction={() => {
            setFormData(initialForm);
            setIsAddModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              hoverEffect={true}
              className="flex flex-col justify-between"
              bodyClassName="p-5 flex flex-col justify-between h-full"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                    <FolderTree className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(cat)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {cat.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    <strong className="text-slate-900 dark:text-white font-bold">{cat.book_count || 0}</strong> titles cataloged
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isEditModalOpen ? 'Edit Category' : 'Create Library Category'}
        subtitle="Manage classification labels used to index and discover books"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={isEditModalOpen ? handleEditSubmit : handleAddSubmit}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Distributed Computing"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief overview of books falling under this classification..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {isEditModalOpen ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${catToDelete?.name}"? If there are books assigned to this category, deletion will be rejected.`}
        confirmText="Delete Category"
        isLoading={submitting}
      />
    </div>
  );
};

export default Categories;
