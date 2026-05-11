/**
 * Seed the database with sample products and categories.
 *
 * Usage (from the backend/ directory):
 *   node scripts/seedProducts.js
 *
 * Safe to re-run — skips products that already exist by name.
 */

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../config.env') });

const mongoose = require('mongoose');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

// Helper: wrap a URL in the images subdoc format the model expects
const img = (url, alt = 'Product image') => [
  { url, alt, isPrimary: true },
];

const PRODUCTS = [
  {
    name: 'Wireless Noise-Cancelling Headphones',
    description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio.',
    price: 149.99,
    stock: 45,
    brand: 'SoundWave',
    status: 'active',
    isFeatured: true,
    isBestseller: true,
    images: img('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 'Wireless Headphones'),
  },
  {
    name: 'Smart Fitness Tracker',
    description: 'Track your steps, heart rate, sleep, and workouts. Water-resistant with a 7-day battery.',
    price: 59.99,
    stock: 120,
    brand: 'FitTech',
    status: 'active',
    isFeatured: true,
    images: img('https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400', 'Fitness Tracker'),
  },
  {
    name: 'Portable Bluetooth Speaker',
    description: '360° surround sound, waterproof IPX7, 12-hour playtime. Perfect for outdoors.',
    price: 79.99,
    stock: 80,
    brand: 'SoundWave',
    status: 'active',
    images: img('https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', 'Bluetooth Speaker'),
  },
  {
    name: 'USB-C Fast Charging Cable (3-Pack)',
    description: '6ft braided nylon cables with 60W fast charging support for all USB-C devices.',
    price: 19.99,
    stock: 300,
    brand: 'ChargePro',
    status: 'active',
    images: img('https://images.unsplash.com/photo-1583863788434-e62bd7a8e9e1?w=400', 'USB-C Cables'),
  },
  {
    name: 'Mechanical Gaming Keyboard',
    description: 'TKL layout, Cherry MX Red switches, RGB backlighting, anti-ghosting.',
    price: 89.99,
    stock: 60,
    brand: 'GameGear',
    status: 'active',
    isFeatured: true,
    images: img('https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400', 'Gaming Keyboard'),
  },
  {
    name: 'Wireless Ergonomic Mouse',
    description: 'Contoured design reduces wrist strain. Silent clicks, 3-year battery life, multi-device pairing.',
    price: 45.99,
    stock: 90,
    brand: 'ErgoTech',
    status: 'active',
    images: img('https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400', 'Ergonomic Mouse'),
  },
  {
    name: '27" 4K Monitor',
    description: 'IPS panel, 144Hz refresh rate, HDR400, USB-C 65W charging. Ideal for work and gaming.',
    price: 399.99,
    stock: 25,
    brand: 'ViewMaster',
    status: 'active',
    isFeatured: true,
    images: img('https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400', '4K Monitor'),
  },
  {
    name: 'Phone Stand & Wireless Charger',
    description: '15W Qi wireless charging pad with adjustable angle stand. Compatible with all Qi devices.',
    price: 34.99,
    stock: 150,
    brand: 'ChargePro',
    status: 'active',
    images: img('https://images.unsplash.com/photo-1598327105026-2b2c4b68c04f?w=400', 'Wireless Charger'),
  },
  {
    name: 'Laptop Backpack 15.6"',
    description: 'Water-resistant, TSA-friendly, USB charging port, anti-theft hidden pockets.',
    price: 54.99,
    stock: 70,
    brand: 'TravelPro',
    status: 'active',
    isBestseller: true,
    images: img('https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 'Laptop Backpack'),
  },
  {
    name: 'Smart LED Desk Lamp',
    description: 'Touch dimmer, 5 color temperatures, USB-A charging port, memory function.',
    price: 39.99,
    stock: 110,
    brand: 'BrightHome',
    status: 'active',
    images: img('https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400', 'LED Desk Lamp'),
  },
];

async function seed() {
  const DB = process.env.DATABASE.replace(
    '<db_password>',
    process.env.DATABASE_PASSWORD
  );

  console.log('Connecting to MongoDB...');
  await mongoose.connect(DB, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });
  console.log('Connected.\n');

  // 1. Ensure an "Electronics" category exists
  let category = await Category.findOne({ name: 'Electronics' });
  if (!category) {
    category = await Category.create({
      name: 'Electronics',
      slug: 'electronics',
      description: 'Gadgets, accessories, and tech devices',
      isActive: true,
    });
    console.log('Created category: Electronics');
  } else {
    console.log('Category "Electronics" already exists, reusing it.');
  }

  // 2. Insert products that do not already exist
  let created = 0;
  let skipped = 0;

  for (const data of PRODUCTS) {
    const exists = await Product.findOne({ name: data.name });
    if (exists) {
      skipped++;
      continue;
    }
    try {
      await Product.create({ ...data, category: category._id });
      created++;
      console.log(`  + ${data.name}`);
    } catch (err) {
      console.error(`  ✗ ${data.name}: ${err.message}`);
    }
  }

  console.log(`\nDone! Created: ${created}, Skipped (already exist): ${skipped}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err.message);
  process.exit(1);
});
