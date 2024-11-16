const express = require('express');
const router = express.Router();
const File = require('../models/File')
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));

// Dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  const files = await File.find({ user: req.user._id });
  res.render('dashboard', {
    user: req.user,
    files: files
  });
});

module.exports = router;