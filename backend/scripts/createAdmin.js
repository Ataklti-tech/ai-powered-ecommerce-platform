/**
 * Run this script once to create the first admin user.
 *
 * Usage (from the backend/ directory):
 *   node scripts/createAdmin.js
 *
 * Edit the ADMIN_* variables below before running.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load env vars before anything else
dotenv.config({ path: path.join(__dirname, '../config.env') });

const mongoose = require('mongoose');
const User = require('../models/userModel');

// ── Edit these values ──────────────────────────────────────────────────────
const ADMIN_FIRST_NAME = 'Admin';
const ADMIN_LAST_NAME = 'User';
const ADMIN_EMAIL = 'admin@agelgil.com';
const ADMIN_PASSWORD = 'Admin12345678';   // min 8 characters
// ──────────────────────────────────────────────────────────────────────────

async function createAdmin() {
  const DB = process.env.DATABASE.replace(
    '<db_password>',
    process.env.DATABASE_PASSWORD
  );

  console.log('Connecting to MongoDB...');
  await mongoose.connect(DB, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });
  console.log('Connected.');

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`\nUser with email "${ADMIN_EMAIL}" already exists.`);
    console.log('Role:', existing.role);
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save({ validateBeforeSave: false });
      console.log('Role updated to admin.');
    } else {
      console.log('Already an admin — nothing to do.');
    }
    await mongoose.disconnect();
    return;
  }

  const admin = await User.create({
    firstName: ADMIN_FIRST_NAME,
    lastName: ADMIN_LAST_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    passwordConfirm: ADMIN_PASSWORD,
    role: 'admin',
  });

  console.log('\nAdmin user created successfully!');
  console.log('  Name :', admin.firstName, admin.lastName);
  console.log('  Email:', admin.email);
  console.log('  Role :', admin.role);
  console.log('\nYou can now log in at http://localhost:5173/login');
  console.log('Then navigate to http://localhost:5173/admin');

  await mongoose.disconnect();
}

createAdmin().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
