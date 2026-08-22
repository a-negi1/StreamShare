const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadVideo, uploadImage } = require('../middleware/upload');
const {
  getVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  incrementView,
  toggleLike,
  toggleDislike,
  getChannelVideos,
} = require('../controllers/videoController');
const {
  createComment,
  getVideoComments,
  deleteComment,
} = require('../controllers/commentController');

router.get('/', getVideos);
router.get('/channel/:userId', getChannelVideos);
router.get('/:id', getVideoById);
router.get('/:id/comments', getVideoComments);

router.post('/', protect, uploadVideo.single('video'), createVideo);
router.put('/:id', protect, updateVideo);
router.delete('/:id', protect, deleteVideo);
router.post('/:id/view', incrementView);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/dislike', protect, toggleDislike);

router.post('/:videoId/comments', protect, createComment);
router.delete('/:videoId/comments/:commentId', protect, deleteComment);

module.exports = router;
