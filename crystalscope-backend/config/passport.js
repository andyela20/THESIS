const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

function cleanUsername(value) {
  return String(value || "google_user")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 28) || "google_user";
}

async function makeUniqueUsername(baseName) {
  const base = cleanUsername(baseName);
  let candidate = base;
  let counter = 1;

  while (await User.findOne({ username: candidate })) {
    candidate = `${base}_${counter}`;
    counter += 1;
  }

  return candidate;
}

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value?.toLowerCase() || null;
    const avatar = profile.photos?.[0]?.value || null;
    const displayName = profile.displayName || email || "Google User";

    let user = await User.findOne({ googleId: profile.id });

    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (user) {
      user.googleId = user.googleId || profile.id;
      user.email = user.email || email;
      user.displayName = user.displayName || displayName;
      user.avatar = user.avatar || avatar;
      user.provider = user.provider || "google";
      await user.save();

      return done(null, user);
    }

    const usernameBase = email ? email.split("@")[0] : displayName;
    const username = await makeUniqueUsername(usernameBase);

    user = await User.create({
      username,
      password: null,
      email,
      googleId: profile.id,
      displayName,
      avatar,
      provider: "google"
    });

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
