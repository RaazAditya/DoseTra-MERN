import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyGoogleToken } from "../services/googleAuthService.js";
import {
  buildOtpEmailHtml,
  generateOtp,
  getOtpExpiry,
  isOtpExpired,
} from "../services/otpService.js";
import { sendEmail } from "../utils/emailService.js";
import { isValidTimezone, resolveTimezone } from "../utils/timezone.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });

const toAuthUser = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  timezone: user.timezone,
  picture: user.picture || "",
  provider: user.provider,
  isVerified: user.isVerified !== false,
  settings: user.settings,
  googleCalendar: {
    connected: user.googleCalendar?.connected || false,
    autoSync: user.googleCalendar?.autoSync !== false,
    lastSyncedAt: user.googleCalendar?.lastSyncedAt || null,
  },
});

const sendVerificationOtp = async (user) => {
  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiry = getOtpExpiry();
  await user.save();

  await sendEmail(
    user.email,
    "Your DoseTra verification code",
    buildOtpEmailHtml(user.name, otp)
  );
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, timezone } = req.body;

  if (!name || !email || !password || !timezone) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }
  if (!isValidTimezone(timezone)) {
    return res.status(400).json({ message: "Invalid timezone" });
  }

  const normalizedEmail = email.toLowerCase();
  const exist = await User.findOne({ email: normalizedEmail }).select("+otp +otpExpiry");
  if (exist) {
    if (exist.isVerified === false) {
      await sendVerificationOtp(exist);
      return res.status(200).json({
        message: "Account exists but is not verified. A new OTP has been sent.",
        requiresVerification: true,
        email: exist.email,
      });
    }
    return res.status(400).json({ message: "User already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: hashed,
    timezone: resolveTimezone(timezone),
    provider: "local",
    isVerified: false,
  });

  if (!user) return res.status(500).json({ message: "Error creating user" });

  try {
    await sendVerificationOtp(user);
  } catch {
    await User.findByIdAndDelete(user._id);
    return res.status(503).json({
      message: "Could not send verification email. Please try again later.",
    });
  }

  return res.status(201).json({
    message: "Registration successful. Please verify your email with the OTP sent.",
    requiresVerification: true,
    email: user.email,
  });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+otp +otpExpiry");
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.isVerified !== false) {
    const token = signToken(user._id);
    return res.status(200).json({
      message: "Email already verified",
      token,
      user: toAuthUser(user),
    });
  }

  if (!user.otp || user.otp !== String(otp).trim()) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (isOtpExpired(user.otpExpiry)) {
    return res.status(400).json({ message: "OTP has expired. Please request a new one." });
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  const token = signToken(user._id);
  return res.status(200).json({
    message: "Email verified successfully",
    token,
    user: toAuthUser(user),
  });
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+otp +otpExpiry");
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.isVerified !== false) {
    return res.status(400).json({ message: "Email is already verified" });
  }

  try {
    await sendVerificationOtp(user);
  } catch {
    return res.status(503).json({
      message: "Could not send verification email. Please try again later.",
    });
  }

  return res.status(200).json({ message: "A new OTP has been sent to your email." });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(400).json({ message: "Email id doesn't exist" });

  if (!user.passwordHash) {
    return res.status(400).json({
      message: "This account uses Google Sign-In. Please continue with Google.",
    });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  if (user.isVerified === false) {
    return res.status(403).json({
      message: "Please verify your email before logging in.",
      code: "EMAIL_NOT_VERIFIED",
      email: user.email,
    });
  }

  const token = signToken(user._id);
  return res.status(200).json({ token, user: toAuthUser(user) });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: "Google credential is required" });
  }

  let payload;
  try {
    payload = await verifyGoogleToken(credential);
  } catch {
    return res.status(401).json({ message: "Invalid Google token" });
  }

  if (!payload.email_verified) {
    return res.status(401).json({ message: "Google email is not verified" });
  }

  const googleId = payload.sub;
  const email = payload.email.toLowerCase();
  const name = (payload.name || email.split("@")[0]).trim();
  const picture = payload.picture || "";

  let user = await User.findOne({ googleId });

  if (!user) {
    user = await User.findOne({ email });

    if (user) {
      if (user.googleId && user.googleId !== googleId) {
        return res.status(409).json({
          message: "This email is linked to a different Google account.",
        });
      }
      user.googleId = googleId;
      user.picture = picture;
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        picture,
        provider: "google",
        isVerified: true,
      });
    }
  } else {
    user.picture = picture;
    user.isVerified = true;
    await user.save();
  }

  const token = signToken(user._id);
  return res.status(200).json({ token, user: toAuthUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.status(200).json({ user: toAuthUser(user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, timezone, settings } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (name && typeof name === "string" && name.trim().length >= 2) {
    user.name = name.trim();
  }

  if (timezone) {
    if (!isValidTimezone(timezone)) {
      return res.status(400).json({ message: "Invalid timezone" });
    }
    user.timezone = timezone;
  }

  if (settings && typeof settings === "object") {
    user.settings = { ...user.settings, ...settings };
  }

  const updatedUser = await user.save();

  const { passwordHash, ...safeUser } = updatedUser.toObject();

  return res.status(200).json({
    message: "Profile updated successfully",
    user: toAuthUser(updatedUser),
  });
});

export const deleteProfile = asyncHandler(async (req, res) => {
  const deletedUser = await User.findByIdAndDelete(req.user.id);
  if (!deletedUser) return res.status(404).json({ message: "User not found" });
  return res.status(200).json({ message: "User deleted successfully" });
});
