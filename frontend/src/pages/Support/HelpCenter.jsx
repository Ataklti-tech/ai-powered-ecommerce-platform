import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: 'How do I create an account?',
    answer:
      'Click "Get Started Free" on the homepage or go to /register. Fill in your name, email, and password to sign up instantly.',
  },
  {
    question: 'How does the AI recommendation work?',
    answer:
      'Our AI tracks your browsing, wishlist, and purchase history to learn your preferences and suggest products most relevant to you.',
  },
  {
    question: 'Can I track my order?',
    answer:
      'Yes. Go to My Orders from your profile to view the status and tracking details of any order you have placed.',
  },
  {
    question: 'What payment methods are accepted?',
    answer:
      'We accept Credit/Debit Cards (via Stripe), PayPal, MTN Mobile Money, Airtel Money, and Cash on Delivery.',
  },
  {
    question: 'How do I apply a coupon code?',
    answer:
      'On the checkout page, enter your coupon code in the designated field before placing your order and the discount will be applied automatically.',
  },
  {
    question: 'How do I contact support?',
    answer:
      'Visit our Contact page or email us directly at support@agelgil.com. We typically respond within 24 hours.',
  },
];

export default function HelpCenter() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="min-h-screen bg-white pt-32 pb-24 px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-14 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-500">
            Find answers to the most common questions about Agelgil.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border-2 border-gray-100 rounded-2xl overflow-hidden hover:border-orange-200 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                {openIndex === idx ? (
                  <ChevronUp className="w-5 h-5 text-orange-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openIndex === idx && (
                <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
