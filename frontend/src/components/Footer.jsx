import React from 'react';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  const footerSections = [
    {
      title: 'Product',
      links: ['Features', 'How it Works', 'Pricing', 'AI Technology']
    },
    {
      title: 'Categories',
      links: ['Electronics', 'Fashion', 'Home', 'Sports']
    },
    {
      title: 'Support',
      links: ['Help Center', 'Shipping', 'Returns', 'Contact']
    }
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
              Pick<span className="text-orange-500">Perfect</span>
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
                {section.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-gray-600 hover:text-orange-500 transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            © 2026 PickPerfect. All rights reserved.
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
