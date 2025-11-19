const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
// Load User model
const User = require('../models/Users');
const { forwardAuthenticated } = require('../config/auth');

// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', forwardAuthenticated, (req, res) => res.render('register'));

// Register
router.post('/register', (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      name,
      email,
      password,
      password2
    });
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2
        });
      } else {
        const newUser = new User({
          name,
          email,
          password
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  'You are now registered and can log in'
                );
                res.redirect('/users/login');
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Google OAuth Routes
const isGoogleConfigured = process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('placeholder');
if (isGoogleConfigured) {
  router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/users/login' }),
    (req, res) => {
      res.redirect('/dashboard');
    }
  );
} else {
  router.get('/auth/google', (req, res) => {
    req.flash('error_msg', 'Google OAuth is not configured. Please add your credentials to .env file.');
    res.redirect('/users/login');
  });
}

// Facebook OAuth Routes
const isFacebookConfigured = process.env.FACEBOOK_APP_ID && !process.env.FACEBOOK_APP_ID.includes('placeholder');
if (isFacebookConfigured) {
  router.get('/auth/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
  );

  router.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/users/login' }),
    (req, res) => {
      res.redirect('/dashboard');
    }
  );
} else {
  router.get('/auth/facebook', (req, res) => {
    req.flash('error_msg', 'Facebook OAuth is not configured. Please add your credentials to .env file.');
    res.redirect('/users/login');
  });
}

// Twitter/X OAuth Routes
const isTwitterConfigured = process.env.TWITTER_CONSUMER_KEY && !process.env.TWITTER_CONSUMER_KEY.includes('placeholder');
if (isTwitterConfigured) {
  router.get('/auth/twitter',
    passport.authenticate('twitter')
  );

  router.get('/auth/twitter/callback',
    passport.authenticate('twitter', { failureRedirect: '/users/login' }),
    (req, res) => {
      res.redirect('/dashboard');
    }
  );
} else {
  router.get('/auth/twitter', (req, res) => {
    req.flash('error_msg', 'X (Twitter) OAuth is not configured. Please add your credentials to .env file.');
    res.redirect('/users/login');
  });
}

// Logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/');
  });
});

module.exports = router;
