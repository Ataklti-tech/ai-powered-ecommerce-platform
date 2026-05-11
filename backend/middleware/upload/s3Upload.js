const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const AppError = require('../../utils/constants/appError');

// Allowed image mime types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400), false);
  }
};

const buildS3Key = (folder, file) => {
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1e9);
  return `${folder}/${timestamp}-${randomSuffix}${ext}`;
};

// ── Lazy factory ─────────────────────────────────────────────────────────────
// S3 client and multer instances are created on first request so that
// environment variables are guaranteed to be loaded (server.js loads dotenv
// before requiring app.js).

let _s3Client;
function getS3Client() {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return _s3Client;
}

function createUploader(folder, maxFiles, maxSizeMB) {
  return multer({
    storage: multerS3({
      s3: getS3Client(),
      bucket: (_req, _file, cb) => cb(null, process.env.AWS_S3_BUCKET_NAME),
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: (_req, file, cb) => cb(null, { fieldName: file.fieldname }),
      key: (_req, file, cb) => cb(null, buildS3Key(folder, file)),
    }),
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
}

// ── Lazy uploader singletons ──────────────────────────────────────────────────
let _productUpload;
let _profileUpload;
let _categoryUpload;

function productUpload() {
  if (!_productUpload) _productUpload = createUploader('products', 10, 5);
  return _productUpload;
}
function profileUpload() {
  if (!_profileUpload) _profileUpload = createUploader('profiles', 1, 2);
  return _profileUpload;
}
function categoryUpload() {
  if (!_categoryUpload) _categoryUpload = createUploader('categories', 1, 2);
  return _categoryUpload;
}

// ── Exported middleware ───────────────────────────────────────────────────────

exports.uploadProductImages = (req, res, next) =>
  productUpload().array('images', 10)(req, res, next);

exports.uploadProfileImage = (req, res, next) =>
  profileUpload().single('profileImage')(req, res, next);

exports.uploadCategoryImage = (req, res, next) =>
  categoryUpload().single('image')(req, res, next);

// Extract S3 file URLs from multer result into req.body
exports.processProductImages = (req, _res, next) => {
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map((f, i) => ({
      url: f.location,
      alt: f.originalname,
      isPrimary: i === 0,
    }));
  }
  next();
};

exports.processProfileImage = (req, _res, next) => {
  if (req.file) req.body.profileImage = req.file.location;
  next();
};

exports.processCategoryImage = (req, _res, next) => {
  if (req.file) req.body.image = req.file.location;
  next();
};
