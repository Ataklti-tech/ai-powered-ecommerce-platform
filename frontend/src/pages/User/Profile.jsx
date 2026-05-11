import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { User, MapPin, Plus, Trash2, Star, Pencil, X, Check } from 'lucide-react';
import { updateUserAddress } from '../../features/auth/authSlice';

const API = 'http://localhost:5000/api/v1';

const EMPTY_ADDRESS = {
  label: 'home',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'Uganda',
  isDefault: false,
};

const CURRENCY_MAP = {
  uganda: 'UGX',
  kenya: 'KES',
  'united kingdom': 'GBP',
  uk: 'GBP',
  germany: 'EUR',
  france: 'EUR',
  spain: 'EUR',
  italy: 'EUR',
};

const CURRENCY_SYMBOLS = { USD: '$', UGX: 'USh', KES: 'KSh', EUR: '€', GBP: '£' };

function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);

  const authHeader = { Authorization: `Bearer ${token}` };

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [addresses, setAddresses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS);
  const [editingId, setEditingId] = useState(null);
  const [editAddress, setEditAddress] = useState(EMPTY_ADDRESS);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const currency =
    CURRENCY_MAP[
      (
        (addresses.find((a) => a.isDefault) || addresses[0])?.country || ''
      ).toLowerCase()
    ] || 'UGX';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [isAuthenticated, navigate]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, addrRes] = await Promise.all([
        axios.get(`${API}/auth/me`, { headers: authHeader, withCredentials: true }),
        axios.get(`${API}/users/addresses`, { headers: authHeader, withCredentials: true }),
      ]);

      const userData = profileRes.data.data || profileRes.data;
      setProfileData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
      });

      const addrs = addrRes.data.data || [];
      setAddresses(addrs);
      dispatch(updateUserAddress(addrs));
    } catch (err) {
      // Fallback to Redux state
      if (user) {
        setProfileData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
        });
        setAddresses(user.addresses || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await axios.patch(
        `${API}/auth/me`,
        { firstName: profileData.firstName, lastName: profileData.lastName, phone: profileData.phone },
        { headers: authHeader, withCredentials: true }
      );
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const res = await axios.post(
        `${API}/users/addresses`,
        newAddress,
        { headers: authHeader, withCredentials: true }
      );
      const updatedAddresses = res.data.data || [];
      setAddresses(updatedAddresses);
      dispatch(updateUserAddress(updatedAddresses));
      setNewAddress(EMPTY_ADDRESS);
      setShowAddForm(false);
      toast.success('Address added successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const res = await axios.delete(
        `${API}/users/addresses/${addressId}`,
        { headers: authHeader, withCredentials: true }
      );
      const updatedAddresses = res.data.data || addresses.filter((a) => a._id !== addressId);
      setAddresses(updatedAddresses);
      dispatch(updateUserAddress(updatedAddresses));
      toast.success('Address removed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove address');
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const target = addresses.find((a) => a._id === addressId);
      if (!target) return;
      const res = await axios.put(
        `${API}/users/addresses/${addressId}`,
        { ...target, isDefault: true },
        { headers: authHeader, withCredentials: true }
      );
      // Refetch all to get updated isDefault on siblings
      const addrRes = await axios.get(`${API}/users/addresses`, { headers: authHeader, withCredentials: true });
      const updatedAddresses = addrRes.data.data || [];
      setAddresses(updatedAddresses);
      dispatch(updateUserAddress(updatedAddresses));
      toast.success('Default address updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update default address');
    }
  };

  const startEdit = (addr) => {
    setEditingId(addr._id);
    setEditAddress({ ...addr });
  };

  const handleEditAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const res = await axios.put(
        `${API}/users/addresses/${editingId}`,
        editAddress,
        { headers: authHeader, withCredentials: true }
      );
      // Refetch to get the full updated list
      const addrRes = await axios.get(`${API}/users/addresses`, { headers: authHeader, withCredentials: true });
      const updatedAddresses = addrRes.data.data || [];
      setAddresses(updatedAddresses);
      dispatch(updateUserAddress(updatedAddresses));
      setEditingId(null);
      toast.success('Address updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update address');
    } finally {
      setSavingAddress(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-24 px-8 min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  const initials = (profileData.firstName?.charAt(0) || 'U').toUpperCase();

  return (
    <div className="pt-32 pb-24 px-8 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Profile</h1>

        <div className="grid grid-cols-3 gap-8">
          {/* ── Main column ─────────────────────────────────────────────── */}
          <div className="col-span-2 space-y-8">

            {/* Personal Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5" /> Personal Information
              </h2>
              <form onSubmit={handleUpdateProfile}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+256 700 000000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* Addresses */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" /> My Addresses
                </h2>
                <button
                  onClick={() => setShowAddForm((v) => !v)}
                  className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {showAddForm ? 'Cancel' : 'Add Address'}
                </button>
              </div>

              {/* Existing addresses */}
              {addresses.length === 0 && !showAddForm && (
                <p className="text-gray-400 text-sm">No addresses saved yet.</p>
              )}

              {addresses.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {addresses.map((addr) =>
                    editingId === addr._id ? (
                      /* ── Inline edit form ── */
                      <form
                        key={addr._id}
                        onSubmit={handleEditAddress}
                        className="col-span-2 border-2 border-orange-300 rounded-xl p-4 space-y-3"
                      >
                        <h4 className="font-semibold text-gray-800 mb-2">Edit Address</h4>
                        <AddressFields data={editAddress} setData={setEditAddress} />
                        <div className="flex gap-2 pt-1">
                          <button
                            type="submit"
                            disabled={savingAddress}
                            className="flex items-center gap-1 px-4 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" /> {savingAddress ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1 px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                          >
                            <X className="w-4 h-4" /> Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* ── Address card ── */
                      <div
                        key={addr._id}
                        className={`p-4 border-2 rounded-xl ${
                          addr.isDefault ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-gray-900 capitalize">{addr.label || 'Address'}</span>
                          {addr.isDefault && (
                            <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">Default</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{addr.street}</p>
                        <p className="text-sm text-gray-600">
                          {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zipCode}
                        </p>
                        <p className="text-sm text-gray-600">{addr.country}</p>

                        <div className="flex gap-3 mt-3">
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefaultAddress(addr._id)}
                              className="flex items-center gap-1 text-xs text-orange-500 hover:underline"
                            >
                              <Star className="w-3 h-3" /> Set Default
                            </button>
                          )}
                          <button
                            onClick={() => startEdit(addr)}
                            className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr._id)}
                            className="flex items-center gap-1 text-xs text-red-500 hover:underline"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Add new address form */}
              {showAddForm && (
                <form onSubmit={handleAddAddress} className="border-t pt-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">New Address</h3>
                  <AddressFields data={newAddress} setData={setNewAddress} />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="newDefault"
                      checked={newAddress.isDefault}
                      onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                      className="w-4 h-4 accent-orange-500"
                    />
                    <label htmlFor="newDefault" className="text-sm text-gray-700">Set as default address</label>
                  </div>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="px-6 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {savingAddress ? 'Adding…' : 'Add Address'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Avatar + name */}
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {profileData.firstName} {profileData.lastName}
              </h3>
              <p className="text-gray-500 text-sm mt-1">{profileData.email}</p>
              {profileData.phone && (
                <p className="text-gray-500 text-sm">{profileData.phone}</p>
              )}
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                {[
                  { to: '/orders', label: 'My Orders' },
                  { to: '/wishlist', label: 'My Wishlist' },
                  { to: '/cart', label: 'Shopping Cart' },
                ].map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className="block py-2 px-4 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors text-sm"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Currency */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">Currency</h3>
              <p className="text-gray-600 text-sm">
                Prices shown in{' '}
                <span className="font-semibold text-orange-500">
                  {currency} ({CURRENCY_SYMBOLS[currency]})
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-1">Based on your default address</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Shared address fields component ─────────────────────────────────────── */
function AddressFields({ data, setData }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
        <select
          value={data.label}
          onChange={(e) => setData({ ...data, label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
        >
          <option value="home">Home</option>
          <option value="work">Work</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
        <select
          value={data.country}
          onChange={(e) => setData({ ...data, country: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
        >
          {['Uganda','Kenya','Tanzania','Rwanda','United States','United Kingdom','Germany','France'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">Street</label>
        <input
          type="text"
          value={data.street}
          onChange={(e) => setData({ ...data, street: e.target.value })}
          required
          placeholder="123 Main St"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
        <input
          type="text"
          value={data.city}
          onChange={(e) => setData({ ...data, city: e.target.value })}
          required
          placeholder="Kampala"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">State / Region</label>
        <input
          type="text"
          value={data.state}
          onChange={(e) => setData({ ...data, state: e.target.value })}
          required
          placeholder="Central"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
        <input
          type="text"
          value={data.zipCode}
          onChange={(e) => setData({ ...data, zipCode: e.target.value })}
          placeholder="00256"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
        />
      </div>
    </div>
  );
}

export default Profile;
