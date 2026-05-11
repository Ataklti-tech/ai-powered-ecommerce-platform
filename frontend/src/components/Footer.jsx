import React, { useEffect, useState } from 'react';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Footer() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/v1/categories')
      .then(({ data }) => {
        const list = data.data || [];
        setCategories(list.slice(0, 6));
      })
      .catch(() => {});
  }, []);

  const footerSections = [
    {
      title: 'Product',
      links: [
        { label: 'Features', path: '#' },
        { label: 'How it Works', path: '#' },
        { label: 'Pricing', path: '#' },
        { label: 'AI Technology', path: '#' },
      ],
    },
    {
      title: 'Categories',
      links: categories.map((cat) => ({
        label: cat.name,
        path: `/products?category=${encodeURIComponent(cat.name)}`,
      })),
    },
    {
      title: 'Support',
      links: [
        { label: 'Help Center', path: '/help' },
        { label: 'Shipping', path: '/shipping' },
        { label: 'Returns', path: '/returns' },
        { label: 'Contact', path: '/contact' },
      ],
    },
  ];

  const socialIcons = [
    { Icon: Facebook, href: '#' },
    { Icon: Instagram, href: '#' },
    { Icon: Twitter, href: '#' },
    { Icon: Linkedin, href: '#' },
  ];

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-100 py-20 px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-5 gap-12 mb-16">
          {/* Brand Section */}
          <div className="col-span-2">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Agel<span className="text-orange-500">gil</span>
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6 max-w-xs">
              AI-powered product recommendations for smarter, faster, and more personalized shopping experiences.
            </p>
            
            {/* Social Icons */}
            <div className="flex items-center space-x-3">
              {socialIcons.map(({ Icon, href }, idx) => (
                <a
                  key={idx}
                  href={href}
                  className="w-10 h-10 bg-gray-100 hover:bg-orange-500 rounded-full flex items-center justify-center transition-all hover:scale-110 group"
                >
                  <Icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {footerSections.map((section, idx) => (
            <div key={idx}>
              <h4 className="text-sm font-bold text-gray-900 mb-5 uppercase tracking-wide">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map(({ label, path }) => (
                  <li key={label}>
                    {path.startsWith('/') ? (
                      <Link to={path} className="text-gray-600 hover:text-orange-500 transition-colors">
                        {label}
                      </Link>
                    ) : (
                      <a href={path} className="text-gray-600 hover:text-orange-500 transition-colors">
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            © 2026 Agelgil. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Terms of Service</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
