const multer = require('multer');
const AppError = require('../utils/AppError');

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new AppError(400, 'Only PNG, JPG, WEBP, or GIF images are allowed.'));
    }
    return cb(null, true);
  },
});

function single(fieldName) {
  const handleUpload = uploadImage.single(fieldName);

  return function (req, res, next) {
    handleUpload(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        return next(new AppError(400, error.message));
      }
      if (error) {
        return next(error);
      }
      return next();
    });
  };
}

function array(fieldName, maxCount) {
  const handleUpload = uploadImage.array(fieldName, maxCount);

  return function (req, res, next) {
    handleUpload(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new AppError(400, `You can upload up to ${maxCount} images.`));
        }
        return next(new AppError(400, error.message));
      }
      if (error) {
        return next(error);
      }
      return next();
    });
  };
}

module.exports = { single, array };
