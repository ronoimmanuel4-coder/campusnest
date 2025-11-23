const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Configure Cloudinary only if credentials are available
let cloudinary = null;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Multer configuration for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Multer upload middleware
exports.upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit
  },
  fileFilter: fileFilter
});

// Upload to Cloudinary
exports.uploadToCloudinary = (file, folder = 'campusnest') => {
  return new Promise((resolve, reject) => {
    if (!cloudinary) {
      // Return mock data if Cloudinary is not configured
      resolve({
        public_id: 'mock-public-id',
        secure_url: `https://picsum.photos/seed/${Date.now()}/800/600.jpg`,
        url: `https://picsum.photos/seed/${Date.now()}/800/600.jpg`,
        width: 800,
        height: 600,
        format: 'jpg',
        size: file.size
      });
      return;
    }
    
    // Generate unique filename
    const uniqueName = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    
    // Create upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: uniqueName,
        folder: folder,
        resource_type: 'auto',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto:best' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            url: result.url,
            width: result.width,
            height: result.height,
            format: result.format,
            size: result.bytes
          });
        }
      }
    );
    
    // Write buffer to stream
    uploadStream.end(file.buffer);
  });
};

// Delete from Cloudinary
exports.deleteFromCloudinary = async (publicId) => {
  try {
    if (!cloudinary) {
      return { result: 'ok' };
    }
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

// Upload multiple files
exports.uploadMultipleToCloudinary = async (files, folder = 'campusnest') => {
  try {
    const uploadPromises = files.map(file => exports.uploadToCloudinary(file, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw error;
  }
};

// Generate optimized URL
exports.getOptimizedUrl = (publicId, options = {}) => {
  if (!cloudinary) {
    return `https://picsum.photos/seed/${publicId}/800/600.jpg`;
  }
  
  const defaultOptions = {
    width: options.width || 800,
    height: options.height || 600,
    crop: options.crop || 'fill',
    quality: options.quality || 'auto:good',
    fetch_format: 'auto'
  };
  
  return cloudinary.url(publicId, defaultOptions);
};

// Generate thumbnail URL
exports.getThumbnailUrl = (publicId, size = 200) => {
  if (!cloudinary) {
    return `https://picsum.photos/seed/${publicId}/${size}/${size}.jpg`;
  }
  
  return cloudinary.url(publicId, {
    width: size,
    height: size,
    crop: 'thumb',
    gravity: 'center',
    quality: 'auto:good',
    fetch_format: 'auto'
  });
};

// Local file storage (for development)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Local upload middleware
exports.uploadLocal = multer({
  storage: localStorage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit
  },
  fileFilter: fileFilter
});

// Process and optimize image
exports.processImage = async (file, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload_stream(
      {
        transformation: [
          {
            width: options.width || 1200,
            height: options.height || 800,
            crop: options.crop || 'limit'
          },
          {
            quality: options.quality || 'auto:best',
            fetch_format: 'auto'
          },
          options.watermark && {
            overlay: 'campusnest_logo',
            gravity: 'south_east',
            x: 10,
            y: 10,
            opacity: 50
          }
        ].filter(Boolean)
      }
    );
    
    return result;
  } catch (error) {
    console.error('Image processing error:', error);
    throw error;
  }
};

// Validate file size and type
exports.validateFile = (file, maxSize = 15 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
  const errors = [];
  
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
  }
  
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} is not allowed`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
