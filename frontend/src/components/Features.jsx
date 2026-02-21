import React from 'react';
import { Zap, Target, Shield } from 'lucide-react';

export default function Features() {
  const features = [
    {
      title: 'Intelligent Matching',
      description: 'Advanced algorithms analyze your preferences to surface products you\'ll love with unprecedented accuracy.',
      icon: Target,
      color: 'from-blue-400 to-blue-600'
    },
    {
      title: 'Instant Results',
      description: 'Get personalized recommendations in milliseconds. No more endless browsing through irrelevant products.',
      icon: Zap,
      color: 'from-orange-400 to-orange-600'
    },
    {
      title: 'Privacy First',
      description: 'Your data is encrypted and secure. We never share your information with third parties.',
      icon: Shield,
      color: 'from-green-400 to-emerald-600'
    },
  ];

  return (
    <section className="py-24 px-8 bg-white">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">Why PickPerfect?</h2>
          <p className="text-xl text-gray-600">Experience shopping reimagined with AI</p>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group relative bg-white border-2 border-gray-100 rounded-3xl p-10 hover:border-orange-300 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
