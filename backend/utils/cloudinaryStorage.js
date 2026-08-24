const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadVideo(localPath, folder = 'streamshare/originals') {
  return cloudinary.uploader.upload(localPath, {
    resource_type: 'video',
    folder,
    chunk_size: 6000000,
    eager_async: true,
  });
}

async function uploadImage(localPath, folder = 'streamshare/images') {
  return cloudinary.uploader.upload(localPath, {
    resource_type: 'image',
    folder,
  });
}

async function uploadRaw(localPath, publicId) {
  return cloudinary.uploader.upload(localPath, {
    resource_type: 'raw',
    public_id: publicId,
  });
}

module.exports = { cloudinary, uploadVideo, uploadImage, uploadRaw };
