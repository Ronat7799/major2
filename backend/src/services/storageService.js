const { randomUUID } = require('crypto');
const supabase = require('../config/supabase');
const AppError = require('../utils/AppError');

const VENDOR_IMAGES_BUCKET = 'vendor-images';

function extensionFor(mimetype) {
  const map = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return map[mimetype] || 'jpg';
}

async function uploadUserImage(folder, userId, file) {
  const path = `${folder}/${userId}.${extensionFor(file.mimetype)}`;

  const { error } = await supabase.storage
    .from(VENDOR_IMAGES_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    throw new AppError(500, error.message || 'Unable to upload image.');
  }

  const { data } = supabase.storage.from(VENDOR_IMAGES_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

async function uploadServiceImage(vendorId, serviceId, file) {
  const path = `service-images/${vendorId}/${serviceId}/${randomUUID()}.${extensionFor(file.mimetype)}`;

  const { error } = await supabase.storage
    .from(VENDOR_IMAGES_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    throw new AppError(500, error.message || 'Unable to upload image.');
  }

  const { data } = supabase.storage.from(VENDOR_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function uploadQuotationRequestImage(customerId, requestId, file) {
  const path = `quotation-request-images/${customerId}/${requestId}/${randomUUID()}.${extensionFor(file.mimetype)}`;

  const { error } = await supabase.storage
    .from(VENDOR_IMAGES_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) {
    throw new AppError(500, error.message || 'Unable to upload image.');
  }

  const { data } = supabase.storage.from(VENDOR_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function pathFromPublicUrl(url) {
  const marker = `/${VENDOR_IMAGES_BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}

async function removeServiceImages(imageUrls) {
  const paths = imageUrls.map(pathFromPublicUrl).filter(Boolean);
  if (!paths.length) {
    return;
  }

  const { error } = await supabase.storage.from(VENDOR_IMAGES_BUCKET).remove(paths);

  if (error) {
    throw new AppError(500, error.message || 'Unable to remove service images.');
  }
}

module.exports = {
  uploadUserImage,
  uploadServiceImage,
  uploadQuotationRequestImage,
  removeServiceImages,
};
