import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { isAdminEmail, normalizeEmail } from "../utils/admins.js";

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const makeUsername = (email, fallback = "admin") => {
  const local = String(email || "").split("@")[0] || fallback;
  return local.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 32) || fallback;
};

const serializeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email || "",
  role: user.role,
  authProvider: user.authProvider
});

const resolveRole = (email) => (isAdminEmail(email) ? "admin" : "user");

export const register = async (req, res) => {
  const { username, email, password } = req.body;
  const cleanEmail = normalizeEmail(email);

  if (!cleanEmail || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const existingUser = await User.findOne({
    $or: [{ email: cleanEmail }, { username: username || makeUsername(cleanEmail) }]
  });
  if (existingUser) {
    return res.status(409).json({ message: "Account already exists." });
  }

  const finalUsername = username?.trim() || makeUsername(cleanEmail);

  const user = await User.create({
    username: finalUsername,
    email: cleanEmail,
    password,
    authProvider: "local",
    displayName: finalUsername,
    role: resolveRole(cleanEmail)
  });
  const token = signToken(user._id);

  return res.status(201).json({
    token,
    user: serializeUser(user)
  });
};

export const login = async (req, res) => {
  const { email, password, username } = req.body;
  const cleanEmail = normalizeEmail(email);

  if ((!cleanEmail && !username) || !password) {
    return res.status(400).json({ message: "Email/username and password are required." });
  }

  const user = await User.findOne(
    cleanEmail ? { email: cleanEmail } : { username }
  );
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  if (user.authProvider === "google" && !user.password) {
    return res.status(400).json({ message: "Use Google sign-in for this account." });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  if (user.email) {
    const role = resolveRole(user.email);
    if (user.role !== role) {
      user.role = role;
      await user.save();
    }
  }

  const token = signToken(user._id);

  return res.json({
    token,
    user: serializeUser(user)
  });
};

export const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: "Google credential is required." });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ message: "GOOGLE_CLIENT_ID is not configured on the server." });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    const email = normalizeEmail(payload?.email);
    if (!email || !payload?.email_verified) {
      return res.status(401).json({ message: "Google account email is not verified." });
    }

    let user = await User.findOne({ email });
    const role = resolveRole(email);

    if (!user) {
      const baseUsername = makeUsername(email, "google-admin");
      const existingWithUsername = await User.findOne({ username: baseUsername });
      const resolvedUsername = existingWithUsername
        ? `${baseUsername}-${String(Date.now()).slice(-4)}`
        : baseUsername;

      user = await User.create({
        username: resolvedUsername,
        email,
        authProvider: "google",
        googleId: payload?.sub || undefined,
        displayName: payload?.name || resolvedUsername,
        role
      });
    } else {
      user.googleId = payload?.sub || user.googleId;
      user.authProvider = user.authProvider || "google";
      user.role = role;
      if (payload?.name) user.displayName = payload.name;
      await user.save();
    }

    const token = signToken(user._id);

    return res.json({
      token,
      user: serializeUser(user)
    });
  } catch (_error) {
    return res.status(401).json({ message: "Invalid Google token." });
  }
};
