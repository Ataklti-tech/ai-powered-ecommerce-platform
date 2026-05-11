import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Stats() {
  const [productCount, setProductCount] = useState(null);
  const [userCount, setUserCount] = useState(null);

  useEffect(() => {
    axios
      .get('http://localhost:5000/api/v1/stats')
      .then(({ data }) => {
        setProductCount(data.data.productCount);
        setUserCount(data.data.userCount);
      })
      .catch(() => {});
  }, []);

  const stats = [
    {
      label: 'PRODUCTS',
      value: productCount !== null ? productCount.toLocaleString() : '—',
      accent: 'border-orange-400',
    },
    {
      label: 'CUSTOMERS',
      value: userCount !== null ? userCount.toLocaleString() : '—',
      accent: 'border-blue-400',
    },
    {
      label: 'MATCH RATE',
      value: '90%',
      accent: 'border-green-400',
    },
    {
      label: 'COUNTRIES',
      value: '2+',
      accent: 'border-purple-400',
    },
  ];

  return (
    <section className="py-20 px-8 bg-white">
      <div className="max-w-350 mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-gray-100">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`group px-10 py-8 border-b-4 ${stat.accent} hover:bg-gray-50 transition-colors duration-300`}
            >
              <div className="text-5xl font-bold text-gray-900 mb-3 tabular-nums">
                {stat.value}
              </div>
              <div className="text-xs font-semibold tracking-widest text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
