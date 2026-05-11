/**
 * Quick S3 connectivity test — uploads a tiny PNG to agelgil-image-bucket
 * and immediately deletes it.
 *
 * Usage (from the backend/ directory):
 *   node scripts/testS3Upload.js
 */

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../config.env') });

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_S3_BUCKET_NAME;
const KEY = `test/s3-test-${Date.now()}.png`;

// Minimal 1×1 red PNG (67 bytes)
const TINY_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108020000' +
  '0090wc3d00000000c4944415478016360f8cfc00000000200' +
  '01e221bc330000000049454e44ae426082',
  'hex'
);

async function run() {
  console.log(`Region : ${REGION}`);
  console.log(`Bucket : ${BUCKET}`);
  console.log(`Key    : ${KEY}\n`);

  const s3 = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  // ── Upload ──────────────────────────────────────────────────────────────────
  console.log('Uploading test object...');
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: KEY,
      Body: TINY_PNG,
      ContentType: 'image/png',
    })
  );

  const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${KEY}`;
  console.log(`✓ Upload succeeded!\n  URL: ${url}\n`);

  // ── Clean up ────────────────────────────────────────────────────────────────
  console.log('Deleting test object...');
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: KEY }));
  console.log('✓ Test object deleted.\n');

  console.log('S3 is configured correctly and working.');
}

run().catch((err) => {
  console.error('\n✗ S3 test failed:', err.message);
  if (err.Code) console.error('  AWS Error Code:', err.Code);
  process.exit(1);
});
