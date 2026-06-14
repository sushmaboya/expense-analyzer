const express = require('express');
const { getProfile, updateProfile, getAnalytics } = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getProfile);
router.put('/', updateProfile);
router.get('/analytics', getAnalytics);

module.exports = router;
