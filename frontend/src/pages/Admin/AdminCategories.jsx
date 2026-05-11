import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Upload, X, Tag } from 'lucide-react';
import { getCategories, createCategory, updateCategory } from '../../utils/adminApi';

const EMPTY = { name: '', description: '', isActive: true, displayOrder: 0 };

function CategoryModal({ category, onClose, onSave }) {
  const [form, setForm] = useState(category || EMPTY);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(category?.image || null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const isEdit = Boolean(category?._id);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Category name is required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description || '');
      fd.append('isActive', form.isActive);
      fd.append('displayOrder', form.displayOrder || 0);
      if (file) fd.append('image', file);

      if (isEdit) {
        await updateCategory(category._id, fd);
        toast.success('Category updated');
      } else {
        await createCategory(fd);
        toast.success('Category created');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-900">{isEdit ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                {preview ? (
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Tag className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <button
                  type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {preview ? 'Change image' : 'Upload image'}
                </button>
                {preview && file && (
                  <button
                    type="button" onClick={() => { setFile(null); setPreview(category?.image || null); }}
                    className="mt-1 flex items-center gap-1 text-xs text-red-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              name="name" value={form.name} onChange={handleChange} required
              placeholder="e.g. Electronics"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              rows={2} placeholder="Brief description…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                name="displayOrder" type="number" value={form.displayOrder} onChange={handleChange} min="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-60"
            >
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState(null); // null=closed, {}=new, category=edit
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCategories();
      setCategories(res.data.data || res.data || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setModalData(null); setShowModal(true); };
  const openEdit = (cat) => { setModalData(cat); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setModalData(null); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm">{categories.length} categories</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Tag className="w-10 h-10" />
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{cat.name}</h3>
                    {cat.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{cat.description}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${cat.isActive !== false ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    {cat.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">Order: {cat.displayOrder || 0}</span>
                  <button
                    onClick={() => openEdit(cat)}
                    className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No categories yet. Create your first one!</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <CategoryModal
          category={modalData}
          onClose={closeModal}
          onSave={load}
        />
      )}
    </div>
  );
}
