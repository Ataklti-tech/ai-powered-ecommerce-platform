import React from 'react';
import { Truck, Clock, MapPin, Package } from 'lucide-react';

const policies = [
  {
    icon: Truck,
    title: 'Domestic Shipping (Uganda)',
    content:
      'Orders within Uganda are delivered within 2–5 business days. Shipping costs are calculated at checkout based on your location and order weight. Free shipping is available on orders above a set threshold.',
  },
  {
    icon: MapPin,
    title: 'International Shipping',
    content:
      'We currently ship to select countries in East Africa. International orders typically arrive within 7–14 business days depending on the destination country and customs processing.',
  },
  {
    icon: Clock,
    title: 'Processing Time',
    content:
      'All orders are processed within 1–2 business days after payment is confirmed. Orders placed on weekends or public holidays are processed on the next working day.',
  },
  {
    icon: Package,
    title: 'Order Tracking',
    content:
      'Once your order is shipped, you will receive a tracking number via email. You can use this number to monitor your delivery status from your Orders page.',
  },
];

export default function Shipping() {
  return (
    <div className="min-h-screen bg-white pt-32 pb-24 px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-14 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Shipping Policy</h1>
          <p className="text-xl text-gray-500">
            Everything you need to know about how we deliver your orders.
          </p>
        </div>

        <div className="space-y-6">
          {policies.map(({ icon: Icon, title, content }, idx) => (
            <div
              key={idx}
              className="flex gap-6 p-6 border-2 border-gray-100 rounded-2xl hover:border-orange-200 transition-colors"
            >
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{content}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-400 text-center mt-12">
          For shipping inquiries, contact us at{' '}
          <a href="mailto:support@agelgil.com" className="text-orange-500 hover:underline">
            support@agelgil.com
          </a>
        </p>
      </div>
    </div>
  );
}
