const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'mern-stream/videos',
    resource_type: 'video',
    public_id: `video_${Date.now()}`,
    format: 'mp4',
    eager: [{ width: 1280, height: 720, crop: 'fill', format: 'jpg' }],
  }),
});

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'mern-stream/avatars',
    transformation: [{ width: 200, height: 200, crop: 'fill' }],
  },
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files allowed'));
  },
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

module.exports = { uploadVideo, uploadImage };
