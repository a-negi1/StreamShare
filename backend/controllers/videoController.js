const Video = require('../models/Video');
const fs = require('fs');
const { transcodeToHLS } = require('../utils/hlsTranscoder');
const { uploadVideo: uploadToCloud, uploadImage } = require('../utils/cloudinaryStorage');

exports.getVideos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';

    const query = { status: 'ready' };
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
      'username avatar subscribers channelDescription'
    );
    if (!video) return res.status(404).json({ message: 'Video not found' });
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createVideo = async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Video file is required' });
    if (!title) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Title is required' });
    }

    const cloudUpload = await uploadToCloud(req.file.path);

    const video = await Video.create({
      title,
      description: description || '',
      category: category || 'Other',
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      videoUrl: cloudUpload.secure_url,
      uploader: req.user._id,
      uploaderName: req.user.username,
      uploaderAvatar: req.user.avatar,
      status: 'processing',
      qualities: [],
    });

    res.status(201).json(video);

    transcodeToHLS(req.file.path)
      .then(async (result) => {
        video.masterPlaylist = result.masterPlaylist;
        video.thumbnailUrl = result.thumbnail || '';
        video.duration = result.duration;
        video.status = 'ready';
        video.qualities = ['240p', '360p', '480p', '720p'];
        await video.save();
        console.log(`Transcode complete for video ${video._id}`);
      })
      .catch(async (err) => {
        console.error('Transcode failed:', err.message);
        video.status = 'failed';
        await video.save();
      })
      .finally(() => {
        try {
          if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        } catch (e) {}
      });
  } catch (err) {
    try {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } catch (e) {}
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
