import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Upload, X, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { createProduct, updateProduct, getCategories } from '../../utils/adminApi';

function authHeaders() {
  try {
    const { token } = JSON.parse(localStorage.getItem('auth') || '{}');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch { return {}; }
}

const EMPTY_FORM = {
  name: '', description: '', price: '', discount: '0', stock: '',
  category: '', status: 'active',
  isFeatured: false, isNewArrival: false, isBestseller: false, isOnSale: false,
};

export default function AdminProductForm() {
  const { id } = useParams(); // present when editing
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // current S3 URLs
  const [newFiles, setNewFiles] = useState([]); // File objects to upload
  const [previews, setPreviews] = useState([]); // object-URL previews for new files
  const [specifications, setSpecifications] = useState([]); // [{key:'',value:''}]
  const [saving, setSaving] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);
  const fileInputRef = useRef(null);

  // Load categories
  useEffect(() => {
    getCategories()
      .then((r) => setCategories(r.data.data || r.data || []))
      .catch(() => {});
  }, []);

  // Load existing product when editing
  useEffect(() => {
    if (!isEdit) return;
    axios
      .get(`http://localhost:5000/api/v1/products/${id}`, { headers: authHeaders() })
      .then((r) => {
        const p = r.data.data || r.data;
        setForm({
          name: p.name || '',
          description: p.description || '',
          price: String(p.price || ''),
          discount: String(p.discount || 0),
          stock: String(p.stock || ''),
          category: p.category?._id || p.category || '',
          status: p.status || 'active',
          isFeatured: p.isFeatured || false,
          isNewArrival: p.isNewArrival || false,
          isBestseller: p.isBestseller || false,
          isOnSale: p.isOnSale || false,
        });
        setExistingImages(p.images || []);
        if (p.specifications?.length) {
          setSpecifications(p.specifications.map((s) => ({ key: s.name || s.key || '', value: s.value || '' })));
        }
      })
      .catch(() => toast.error('Failed to load product'))
      .finally(() => setLoadingProduct(false));
  }, [id, isEdit]);

  // Build previews for new file picks
  useEffect(() => {
    const urls = newFiles.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [newFiles]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files);
    setNewFiles((prev) => [...prev, ...picked].slice(0, 10));
    e.target.value = '';
  };

  const removeNewFile = (i) => setNewFiles((prev) => prev.filter((_, idx) => idx !== i));
  const removeExisting = (url) => setExistingImages((prev) => prev.filter((img) => (img?.url ?? img) !== url));

  const addSpec = () => setSpecifications((p) => [...p, { key: '', value: '' }]);
  const removeSpec = (i) => setSpecifications((p) => p.filter((_, idx) => idx !== i));
  const updateSpec = (i, field, value) =>
    setSpecifications((p) => p.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.price || !form.stock || !form.category) {
      toast.error('Name, description, price, stock and category are required');
      return;
    }

    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));

    // Serialize existing image subdocs so the backend can preserve url/alt/isPrimary
    existingImages.forEach((img) => fd.append('keepImages', JSON.stringify(img)));

    // Append new file uploads
    newFiles.forEach((f) => fd.append('images', f));

    // Specifications as JSON string
    if (specifications.length > 0) {
      fd.append(
        'specifications',
        JSON.stringify(specifications.filter((s) => s.key).map((s) => ({ name: s.key, value: s.value })))
      );
    }

    try {
      if (isEdit) {
        await updateProduct(id, fd);
        toast.success('Product updated');
      } else {
        await createProduct(fd);
        toast.success('Product created');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/products" className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'New Product'}</h1>
          <p className="text-sm text-gray-400">{isEdit ? `Editing ID: ${id}` : 'Fill in the details below'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              name="name" value={form.name} onChange={handleChange} required
              placeholder="e.g. Nike Air Max 270"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              rows={4} placeholder="Product description…" required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD) * <span className="text-gray-400 font-normal text-xs">— shown as UGX on storefront</span></label>
              <input
                name="price" value={form.price} onChange={handleChange} type="number" min="0" step="0.01" required
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
              <input
                name="discount" value={form.discount} onChange={handleChange} type="number" min="0" max="100"
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
              <input
                name="stock" value={form.stock} onChange={handleChange} type="number" min="0" required
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                name="category" value={form.category} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status" value={form.status} onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Images</h2>
            <span className="text-xs text-gray-400">{existingImages.length + newFiles.length}/10 images</span>
          </div>

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Current images</p>
              <div className="flex flex-wrap gap-3">
                {existingImages.map((img) => {
                  const src = img?.url ?? img;
                  return (
                    <div key={src} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                      <img src={src} alt={img?.alt || ''} className="w-full h-full object-cover" />
                      <button
                        type="button" onClick={() => removeExisting(src)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New file previews */}
          {previews.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">New uploads (will be saved to S3)</p>
              <div className="flex flex-wrap gap-3">
                {previews.map((url, i) => (
                  <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border-2 border-orange-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button" onClick={() => removeNewFile(i)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload drop area */}
          {existingImages.length + newFiles.length < 10 && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Click to upload images</p>
              <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · max 5 MB each</p>
              <input
                ref={fileInputRef} type="file" multiple accept="image/*"
                onChange={handleFiles} className="hidden"
              />
            </div>
          )}
        </div>

        {/* Labels / badges */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Product Labels</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'isFeatured', label: 'Featured' },
              { name: 'isNewArrival', label: 'New Arrival' },
              { name: 'isBestseller', label: 'Bestseller' },
              { name: 'isOnSale', label: 'On Sale' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox" name={name} checked={form[name]} onChange={handleChange}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Specifications</h2>
            <button
              type="button" onClick={addSpec}
              className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {specifications.length === 0 && (
            <p className="text-sm text-gray-400">No specifications added.</p>
          )}
          {specifications.map((s, i) => (
            <div key={i} className="flex gap-3 items-center">
              <input
                value={s.key} onChange={(e) => updateSpec(i, 'key', e.target.value)}
                placeholder="Name (e.g. Material)"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <input
                value={s.value} onChange={(e) => updateSpec(i, 'value', e.target.value)}
                placeholder="Value (e.g. Cotton)"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <button type="button" onClick={() => removeSpec(i)} className="p-1.5 text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-8">
          <Link
            to="/admin/products"
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-center hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit" disabled={saving}
            className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving…' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
