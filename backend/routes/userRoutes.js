const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const {
  register,
  login,
  getMe,
  updateProfile,
} = require('../controllers/userController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, uploadImage.single('avatar'), updateProfile);

module.exports = router;
