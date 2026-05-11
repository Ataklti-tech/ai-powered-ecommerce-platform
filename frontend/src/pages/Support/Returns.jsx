import React from 'react';
import { RefreshCw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const eligible = [
  'Item received in damaged or defective condition',
  'Wrong item delivered',
  'Item significantly different from the product description',
  'Item not received within the stated delivery window',
];

const notEligible = [
  'Items returned after 30 days of delivery',
  'Used, washed, or altered items',
  'Items without original packaging',
  'Perishable or consumable products',
  'Digital downloads or gift cards',
];

export default function Returns() {
  return (
    <div className="min-h-screen bg-white pt-32 pb-24 px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-14 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Returns Policy</h1>
          <p className="text-xl text-gray-500">
            We want you to be completely satisfied with your purchase.
          </p>
        </div>

        {/* Return window */}
        <div className="flex gap-5 p-6 bg-orange-50 border-2 border-orange-100 rounded-2xl mb-8">
          <RefreshCw className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">30-Day Return Window</h3>
            <p className="text-gray-600 leading-relaxed">
              You may request a return within 30 days of receiving your order. Once approved,
              refunds are processed within 5–7 business days back to your original payment method.
            </p>
          </div>
        </div>

        {/* How to return */}
        <div className="flex gap-5 p-6 border-2 border-gray-100 rounded-2xl mb-8">
          <AlertCircle className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">How to Request a Return</h3>
            <ol className="text-gray-600 leading-relaxed space-y-1 list-decimal list-inside">
              <li>Go to My Orders and select the order you want to return.</li>
              <li>Click "Request Return" and describe the issue.</li>
              <li>Our team will review and respond within 48 hours.</li>
              <li>Once approved, ship the item back using the provided instructions.</li>
            </ol>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Eligible */}
          <div className="p-6 border-2 border-gray-100 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-900">Eligible for Return</h3>
            </div>
            <ul className="space-y-2">
              {eligible.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-green-400 mt-0.5">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Not eligible */}
          <div className="p-6 border-2 border-gray-100 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-gray-900">Not Eligible</h3>
            </div>
            <ul className="space-y-2">
              {notEligible.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-red-400 mt-0.5">✗</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-sm text-gray-400 text-center mt-12">
          Questions about a return? Email us at{' '}
          <a href="mailto:support@agelgil.com" className="text-orange-500 hover:underline">
            support@agelgil.com
          </a>
        </p>
      </div>
    </div>
  );
}
