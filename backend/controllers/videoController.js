const Video = require('../models/Video');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteFromCloudinary = async (url) => {
  if (!url) return;
  try {
    const parts = url.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${filename}`;
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  } catch (e) {
    console.error('Cloudinary delete error:', e.message);
  }
};

exports.getVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';

    const query = {};
    if (search) query.$text = { $search: search };
    if (category && category !== 'All') query.category = category;

    const total = await Video.countDocuments(query);
    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploader', 'username avatar');

    res.json({ videos, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id).populate(
      'uploader',
      'username avatar subscribers'
    );
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createVideo = async (req, res) => {
  try {
    const { title, description, category, tags, duration } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: 'Video file is required' });
    }
    const video = await Video.create({
      title,
      description,
      category,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      duration: Number(duration) || 0,
      videoUrl: req.file.path,
      thumbnailUrl: req.file.path.replace(/\.[^/.]+$/, '.jpg'),
      uploader: req.user._id,
      uploaderName: req.user.username,
      uploaderAvatar: req.user.avatar,
    });
    res.status(201).json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (video.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { title, description, category, tags } = req.body;
    video.title = title || video.title;
    video.description = description || video.description;
    video.category = category || video.category;
    if (tags) video.tags = tags.split(',').map((t) => t.trim());
    await video.save();
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    if (video.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await deleteFromCloudinary(video.videoUrl);
    await video.deleteOne();
    res.json({ message: 'Video deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.incrementView = async (req, res) => {
  try {
    await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    const userId = req.user._id;
    const liked = video.likes.includes(userId);
    if (liked) {
      video.likes = video.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      video.likes.push(userId);
      video.dislikes = video.dislikes.filter(
        (id) => id.toString() !== userId.toString()
      );
    }
    await video.save();
    res.json({ likes: video.likes.length, dislikes: video.dislikes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleDislike = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });
    const userId = req.user._id;
    const disliked = video.dislikes.includes(userId);
    if (disliked) {
      video.dislikes = video.dislikes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      video.dislikes.push(userId);
      video.likes = video.likes.filter((id) => id.toString() !== userId.toString());
    }
    await video.save();
    res.json({ likes: video.likes.length, dislikes: video.dislikes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getChannelVideos = async (req, res) => {
  try {
    const videos = await Video.find({ uploader: req.params.userId }).sort({
      createdAt: -1,
    });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
