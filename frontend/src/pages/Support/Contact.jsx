import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white pt-32 pb-24 px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-14 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-500">
            Have a question or need help? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12">
          {/* Contact info */}
          <div className="space-y-6">
            <div className="flex gap-4 p-5 border-2 border-gray-100 rounded-2xl hover:border-orange-200 transition-colors">
              <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Email</p>
                <a href="mailto:support@agelgil.com" className="text-gray-500 hover:text-orange-500 transition-colors text-sm">
                  support@agelgil.com
                </a>
              </div>
            </div>

            <div className="flex gap-4 p-5 border-2 border-gray-100 rounded-2xl hover:border-orange-200 transition-colors">
              <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Phone</p>
                <p className="text-gray-500 text-sm">+256 700 000 000</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 border-2 border-gray-100 rounded-2xl hover:border-orange-200 transition-colors">
              <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Location</p>
                <p className="text-gray-500 text-sm">Kampala, Uganda</p>
              </div>
            </div>
          </div>

          {/* Contact form */}
          {submitted ? (
            <div className="flex flex-col items-center justify-center text-center border-2 border-green-100 bg-green-50 rounded-2xl p-10">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Send className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
              <p className="text-gray-500 text-sm">
                Thank you for reaching out. We'll get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-orange-300 transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-orange-300 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-orange-300 transition-colors"
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-orange-300 transition-colors resize-none"
                  placeholder="Write your message..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-orange-500 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
