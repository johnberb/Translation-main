const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter-oauth2').Strategy;
const bcrypt = require('bcryptjs');

// Load User model
const User = require('../models/Users');

module.exports = function(passport) {
  // Local Strategy
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      // Match user
      User.findOne({
        email: email
      }).then(user => {
        if (!user) {
          return done(null, false, { message: 'That email is not registered' });
        }

        // Match password
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Password incorrect' });
          }
        });
      });
    })
  );

  // Google OAuth Strategy (only if credentials are configured)
  if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('placeholder')) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: '/users/auth/google/callback'
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await User.findOne({ googleId: profile.id });
            
            if (user) {
              return done(null, user);
            }

            // Check if user with same email exists
            user = await User.findOne({ email: profile.emails[0].value });
            
            if (user) {
              user.googleId = profile.id;
              await user.save();
              return done(null, user);
            }

            // Create new user
            const newUser = new User({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id
            });

            await newUser.save();
            done(null, newUser);
          } catch (err) {
            done(err, false);
          }
        }
      )
    );
  }

  // Facebook OAuth Strategy (only if credentials are configured)
  if (process.env.FACEBOOK_APP_ID && !process.env.FACEBOOK_APP_ID.includes('placeholder')) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: '/users/auth/facebook/callback',
          profileFields: ['id', 'displayName', 'emails']
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            let user = await User.findOne({ facebookId: profile.id });
            
            if (user) {
              return done(null, user);
            }

            // Check if user with same email exists
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            if (email) {
              user = await User.findOne({ email: email });
              if (user) {
                user.facebookId = profile.id;
                await user.save();
                return done(null, user);
              }
            }

            // Create new user
            const newUser = new User({
              name: profile.displayName,
              email: email,
              facebookId: profile.id
            });

            await newUser.save();
            done(null, newUser);
          } catch (err) {
            done(err, false);
          }
        }
      )
    );
  }

  // Twitter/X OAuth Strategy (only if credentials are configured)
  if (process.env.TWITTER_CONSUMER_KEY && !process.env.TWITTER_CONSUMER_KEY.includes('placeholder')) {
    passport.use(
      new TwitterStrategy(
        {
          consumerKey: process.env.TWITTER_CONSUMER_KEY,
          consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
          callbackURL: '/users/auth/twitter/callback',
          includeEmail: true
        },
        async (token, tokenSecret, profile, done) => {
          try {
            let user = await User.findOne({ twitterId: profile.id });
            
            if (user) {
              return done(null, user);
            }

            // Check if user with same email exists
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            if (email) {
              user = await User.findOne({ email: email });
              if (user) {
                user.twitterId = profile.id;
                await user.save();
                return done(null, user);
              }
            }

            // Create new user
            const newUser = new User({
              name: profile.displayName,
              email: email,
              twitterId: profile.id
            });

            await newUser.save();
            done(null, newUser);
          } catch (err) {
            done(err, false);
          }
        }
      )
    );
  }

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
};