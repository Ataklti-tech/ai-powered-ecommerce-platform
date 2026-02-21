import React from "react";
import { Package, Users, Target, Globe } from "lucide-react";

export default function Stats() {
  const stats = [
    { label: "Products", value: "100+", icon: Package, color: "orange" },
    { label: "Customers", value: "100+", icon: Users, color: "blue" },
    { label: "Match Rate", value: "90%", icon: Target, color: "green" },
    { label: "Countries", value: "2+", icon: Globe, color: "purple" },
  ];

  const colorClasses = {
    orange: "bg-gradient-to-br from-orange-400 to-orange-600",
    blue: "bg-gradient-to-br from-blue-400 to-blue-600",
    green: "bg-gradient-to-br from-green-400 to-emerald-600",
    purple: "bg-gradient-to-br from-purple-400 to-purple-600",
  };

  return (
    <section className="py-20 px-8 bg-white">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="group relative bg-white border-2 border-gray-100 rounded-3xl p-8 hover:border-orange-300 hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
              >
                <div
                  className={`w-14 h-14 ${colorClasses[stat.color]} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
