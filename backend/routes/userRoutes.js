const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const {
  register,
  login,
  getMe,
  updateProfile,
  getUserById,
} = require('../controllers/userController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/:id', getUserById);
router.put('/profile', protect, uploadImage.single('avatar'), updateProfile);

module.exports = router;
