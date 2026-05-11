/**
 * Upload a tiny test image then fetch it via HTTP to confirm
 * the bucket policy allows public reads.
 *
 * Usage (from backend/ directory):
 *   node scripts/testS3Public.js
 */

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../config.env') });

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const https = require('https');

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_S3_BUCKET_NAME;
const KEY = `test/public-test-${Date.now()}.txt`;

// Minimal payload — just a text file so we don't need a real image
const BODY = Buffer.from('Agelgil S3 public read test');

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function run() {
  console.log(`Bucket : ${BUCKET}`);
  console.log(`Region : ${REGION}\n`);

  // 1. Upload
  console.log('1. Uploading test file...');
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: KEY,
    Body: BODY,
    ContentType: 'text/plain',
  }));
  const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${KEY}`;
  console.log(`   Uploaded: ${url}\n`);

  // 2. Fetch publicly (no AWS credentials)
  console.log('2. Fetching via plain HTTPS (simulates browser)...');
  await new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        console.log(`   ✓ Status ${res.statusCode} — images are publicly accessible!\n`);
        resolve();
      } else {
        reject(new Error(`HTTP ${res.statusCode} — bucket is still private. Complete the AWS Console steps.`));
      }
    }).on('error', reject);
  });

  // 3. Clean up
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: KEY }));
  console.log('3. Test file deleted.\n');
  console.log('✓ S3 public access is working. Product images will now load in the browser.');
}

run().catch((err) => {
  console.error('\n✗', err.message);
  process.exit(1);
});
