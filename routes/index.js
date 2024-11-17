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

// Search for a file
router.get('/search', ensureAuthenticated, async (req, res) => {
  const searchQuery = req.query.search;
  if (typeof searchQuery === 'string' && searchQuery.trim().length > 0) {
    const files = await File.find({ user: req.user._id, originalName: { $regex: searchQuery, $options: 'i' } });
    res.render('dashboard', {
      user: req.user,
      files: files
    });
  } else {
    res.redirect('/dashboard');
  }
});

module.exports = router;