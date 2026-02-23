import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-32 px-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

      <div className="max-w-[1400px] mx-auto text-center relative z-10">
        <div className="inline-flex items-center space-x-2 mb-8 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-semibold text-white">
            Start Your Journey
          </span>
        </div>

        <h2 className="text-6xl font-bold text-white mb-6 leading-tight">
          Ready to find your
          <br />
          <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            perfect products?
          </span>
        </h2>

        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Join thousands of happy shoppers and experience AI-powered shopping
          today
        </p>

        <div className="flex items-center justify-center space-x-4">
          <button className="px-10 py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-lg font-semibold rounded-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center space-x-2">
            <span>Get Started Free</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button className="px-10 py-5 bg-white/10 backdrop-blur-sm text-white text-lg font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
}
